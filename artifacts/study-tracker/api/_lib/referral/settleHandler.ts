import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth, setCorsHeaders, parseRequestBody, verifyAuthToken, type VercelRequest, type VercelResponse } from '../auth.js';
import { initFirebaseAdmin } from '../firebaseAdmin.js';

export async function handleSettle(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const body = await parseRequestBody(req);
  const trigger = body?.trigger || (body?.sessionDurationMinutes !== undefined ? 'study_milestone' : '');

  if (!trigger) {
    return res.status(400).json({
      success: false,
      message: "Missing 'trigger' parameter. Expected 'study_milestone' or 'paid_checkout'.",
    });
  }

  const { db } = initFirebaseAdmin();

  // ===========================================================================
  // Branch A: Study Milestone Settlement (Client Referee Authenticated)
  // ===========================================================================
  if (trigger === 'study_milestone') {
    const user = await requireAuth(req, res);
    if (!user) return; // 401 sent

    const sessionDurationMinutes = Number(body?.sessionDurationMinutes || 0);

    try {
      const result = await db.runTransaction(async (transaction) => {
        // 1. Read Global Config
        let config = {
          enabled: true,
          minStudyMinutesToQualify: 10,
          referrerBonusDays: 14,
        };

        const settingsRef = db.collection('config').doc('referral_settings');
        const settingsSnap = await transaction.get(settingsRef);
        if (settingsSnap.exists) {
          config = { ...config, ...(settingsSnap.data() as any) };
        }

        if (config.enabled === false) {
          return { success: false, status: 400, message: 'Referral program is currently paused.' };
        }

        const minMinutes = config.minStudyMinutesToQualify || 10;
        if (sessionDurationMinutes < minMinutes) {
          return {
            success: false,
            status: 400,
            message: `Session duration (${sessionDurationMinutes}m) is below the qualification threshold (${minMinutes}m).`,
          };
        }

        // 2. Read Referee Profile
        const refereeRef = db.collection('users').doc(user.uid);
        const refereeSnap = await transaction.get(refereeRef);
        if (!refereeSnap.exists) {
          return { success: false, status: 404, message: 'Referee profile not found.' };
        }

        const refereeData = refereeSnap.data() || {};
        const currentStatus = refereeData.attribution?.status || refereeData.referralStatus;

        // Idempotency check: Already qualified or converted
        if (currentStatus === 'qualified' || currentStatus === 'converted') {
          return {
            success: true,
            status: 200,
            qualified: true,
            alreadySettled: true,
            message: 'Milestone has already been qualified.',
          };
        }

        const referrerUid = refereeData.attribution?.referrerUid || refereeData.referredByUid;
        const refCode = refereeData.attribution?.code || refereeData.referredByCode;

        if (!referrerUid) {
          return {
            success: false,
            status: 400,
            message: 'No referral attribution found for this candidate.',
          };
        }

        // 3. Read Referral Ledger Record
        const recordId = `${referrerUid}_${user.uid}`;
        const recordRef = db.collection('referrals').doc(recordId);
        const recordSnap = await transaction.get(recordRef);

        // 4. Read Referrer Account
        const referrerRef = db.collection('users').doc(referrerUid);
        const referrerSnap = await transaction.get(referrerRef);
        if (!referrerSnap.exists) {
          return { success: false, status: 404, message: 'Referrer profile not found.' };
        }

        const referrerData = referrerSnap.data() || {};
        const bonusDays = config.referrerBonusDays || 14;
        const bonusMillis = bonusDays * 24 * 60 * 60 * 1000;

        const currentExpiry = referrerData.betaAccessExpiresAt?.toMillis
          ? referrerData.betaAccessExpiresAt.toMillis()
          : typeof referrerData.betaAccessExpiresAt === 'number'
          ? referrerData.betaAccessExpiresAt
          : Date.now();

        const newExpiry = Math.max(Date.now(), currentExpiry) + bonusMillis;

        // 5. Commit Atomic Settlement Mutations
        // (a) Referrer bonus & recognition
        transaction.update(referrerRef, {
          betaAccess: true,
          betaAccessExpiresAt: newExpiry,
          pendingReferralRewardToast: {
            colleagueName: refereeData.displayName || 'Your batchmate',
            bonusDays,
            grantedAt: Date.now(),
          },
          updatedAt: FieldValue.serverTimestamp(),
        });

        // (b) Referral ledger
        if (recordSnap.exists) {
          transaction.update(recordRef, {
            status: 'qualified',
            qualifiedAt: FieldValue.serverTimestamp(),
          });
        } else {
          transaction.set(recordRef, {
            id: recordId,
            referrerUid,
            refereeUid: user.uid,
            refereeEmail: user.email || refereeData.email || '',
            refereeName: refereeData.displayName || 'Doctor',
            code: refCode || '',
            status: 'qualified',
            bonusDaysAwarded: bonusDays,
            claimedAt: refereeData.attribution?.claimedAt || FieldValue.serverTimestamp(),
            qualifiedAt: FieldValue.serverTimestamp(),
          });
        }

        // (c) Referee attribution & legacy mirror
        transaction.update(refereeRef, {
          'attribution.status': 'qualified',
          'attribution.qualifiedAt': FieldValue.serverTimestamp(),
          referralStatus: 'qualified',
          updatedAt: FieldValue.serverTimestamp(),
        });

        // (d) Canonical and legacy code counters
        if (refCode) {
          const canonicalCodeRef = db.collection('referral_codes').doc(refCode);
          const canonicalSnap = await transaction.get(canonicalCodeRef);
          if (canonicalSnap.exists) {
            transaction.update(canonicalCodeRef, {
              'stats.totalQualified': FieldValue.increment(1),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }

          const legacyCodeRef = db.collection('referralCodes').doc(refCode);
          const legacySnap = await transaction.get(legacyCodeRef);
          if (legacySnap.exists) {
            transaction.update(legacyCodeRef, {
              totalQualified: FieldValue.increment(1),
            });
          }
        }

        return {
          success: true,
          status: 200,
          qualified: true,
          bonusDaysAwarded: bonusDays,
          message: `Study milestone achieved! ${bonusDays} bonus days awarded to your inviter.`,
        };
      });

      if (!result.success) {
        return res.status(result.status || 400).json({ success: false, message: result.message });
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('[API referral/settle - study_milestone] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to settle study milestone due to an internal error.',
      });
    }
  }

  // ===========================================================================
  // Branch B: Paid Checkout Conversion Settlement (Server / Webhook Call)
  // ===========================================================================
  if (trigger === 'paid_checkout') {
    // Validate authorization: Either service secret or admin user token
    const authHeader = (req.headers?.authorization || req.headers?.Authorization || '') as string;
    const serviceSecretHeader = (req.headers?.['x-service-secret'] || '') as string;
    const configuredSecret = process.env.INTERNAL_SERVICE_KEY || process.env.DODO_WEBHOOK_SECRET;

    let isAuthorized = false;

    if (configuredSecret && (serviceSecretHeader === configuredSecret || authHeader.endsWith(configuredSecret))) {
      isAuthorized = true;
    } else {
      // Check if caller is authenticated admin user
      const authUser = await verifyAuthToken(req);
      if (authUser) {
        const adminDoc = await db.collection('admins').doc(authUser.uid).get();
        if (adminDoc.exists) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Valid service secret or administrator credentials required for checkout settlement.',
      });
    }

    const refereeUid = typeof body?.refereeUid === 'string' ? body.refereeUid.trim() : '';
    const paymentId = typeof body?.paymentId === 'string' ? body.paymentId : undefined;
    const amount = typeof body?.amount === 'number' ? body.amount : undefined;

    if (!refereeUid) {
      return res.status(400).json({
        success: false,
        message: "Missing 'refereeUid' for paid checkout settlement.",
      });
    }

    try {
      const result = await db.runTransaction(async (transaction) => {
        const refereeRef = db.collection('users').doc(refereeUid);
        const refereeSnap = await transaction.get(refereeRef);

        if (!refereeSnap.exists) {
          return { success: false, status: 404, message: 'Referee account not found.' };
        }

        const refereeData = refereeSnap.data() || {};
        const code = refereeData.attribution?.code || refereeData.referredByCode || refereeData.referredBy;
        const referrerUid = refereeData.attribution?.referrerUid || refereeData.referredByUid;

        // Idempotency check: Already converted
        if (refereeData.attribution?.status === 'converted' && refereeData.paymentStatus === 'succeeded') {
          return {
            success: true,
            status: 200,
            converted: true,
            alreadySettled: true,
            message: 'Paid checkout conversion already settled.',
          };
        }

        // 1. Update Referee Profile with Conversion Status
        transaction.set(
          refereeRef,
          {
            attribution: {
              ...(refereeData.attribution || {}),
              status: 'converted',
              convertedAt: FieldValue.serverTimestamp(),
            },
            paymentStatus: 'succeeded',
            hasPaidAccess: true,
            ...(paymentId ? { dodoPaymentId: paymentId } : {}),
            ...(amount ? { dodoAmount: amount } : {}),
            paidAt: new Date().toISOString(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        // 2. Update Referral Ledger Record
        if (referrerUid) {
          const recordId = `${referrerUid}_${refereeUid}`;
          const recordRef = db.collection('referrals').doc(recordId);
          transaction.set(
            recordRef,
            {
              status: 'converted',
              convertedAt: FieldValue.serverTimestamp(),
              ...(paymentId ? { paymentId } : {}),
              ...(amount ? { amount } : {}),
            },
            { merge: true }
          );
        }

        // 3. Increment Canonical Code Conversion Counters
        if (code) {
          const canonicalCodeRef = db.collection('referral_codes').doc(code);
          const canonicalSnap = await transaction.get(canonicalCodeRef);
          if (canonicalSnap.exists) {
            transaction.update(canonicalCodeRef, {
              'stats.totalConversions': FieldValue.increment(1),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }

        return {
          success: true,
          status: 200,
          converted: true,
          message: 'Paid checkout conversion settled successfully.',
        };
      });

      if (!result.success) {
        return res.status(result.status || 400).json({ success: false, message: result.message });
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('[API referral/settle - paid_checkout] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to settle paid checkout conversion due to an internal error.',
      });
    }
  }

  return res.status(400).json({
    success: false,
    message: `Unsupported trigger '${trigger}'. Supported triggers: 'study_milestone', 'paid_checkout'.`,
  });
}

export default handleSettle;
