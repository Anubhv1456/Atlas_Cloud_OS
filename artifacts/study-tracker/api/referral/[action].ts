import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth, setCorsHeaders, parseRequestBody, type VercelRequest, type VercelResponse } from '../_lib/auth.js';
import { initFirebaseAdmin } from '../_lib/firebaseAdmin.js';

function getAction(req: VercelRequest): string {
  const queryAction = req.query.action;
  if (typeof queryAction === 'string') return queryAction;
  if (Array.isArray(queryAction) && queryAction[0]) return queryAction[0];
  const urlPath = (req.url || '').split('?')[0];
  const segments = urlPath.split('/').filter(Boolean);
  return segments[segments.length - 1] || '';
}

async function handleClaim(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const user = await requireAuth(req, res);
  if (!user) return; // 401 sent

  const body = await parseRequestBody(req);
  const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';

  if (!code) {
    return res.status(400).json({ success: false, message: 'Referral code is required.' });
  }

  try {
    const { db } = initFirebaseAdmin();

    const result = await db.runTransaction(async (transaction) => {
      // 1. Read Global Config
      const configRef = db.collection('referral_config').doc('global');
      const configSnap = await transaction.get(configRef);
      const config = configSnap.exists
        ? configSnap.data() || {}
        : { enabled: true, maxPassesPerUser: 10, refereeTrialDays: 15, referrerBonusDays: 14 };

      if (config.enabled === false) {
        return { success: false, message: 'Referral program is currently paused', status: 400 };
      }

      // 2. Read Referee (Target User)
      const refereeRef = db.collection('users').doc(user.uid);
      const refereeSnap = await transaction.get(refereeRef);
      const refereeData = refereeSnap.exists ? refereeSnap.data() || {} : {};

      if (refereeData.referredByCode) {
        return { success: false, message: 'Invite pass already claimed on this account', status: 400 };
      }

      // 3. Brute Force Throttling Check
      const failedAttempts = refereeData.failedReferralAttempts || 0;
      const lastFailedAttempt = refereeData.lastFailedReferralAttempt?.toMillis?.() || 0;
      const oneHour = 60 * 60 * 1000;

      if (failedAttempts >= 5 && Date.now() - lastFailedAttempt < oneHour) {
        return { success: false, message: 'Too many failed attempts. Please try again later.', status: 429 };
      }

      // 4. Validate Code Integrity
      const codeRef = db.collection('referralCodes').doc(code);
      const codeSnap = await transaction.get(codeRef);
      
      if (!codeSnap.exists) {
        transaction.set(refereeRef, {
          failedReferralAttempts: FieldValue.increment(1),
          lastFailedReferralAttempt: FieldValue.serverTimestamp()
        }, { merge: true });
        return { success: false, message: 'Invalid or expired invite pass', status: 400 };
      }

      const codeData = codeSnap.data() || {};
      
      // Self-Referral Prevention
      if (codeData.ownerUid === user.uid) {
        transaction.set(refereeRef, {
          failedReferralAttempts: FieldValue.increment(1),
          lastFailedReferralAttempt: FieldValue.serverTimestamp()
        }, { merge: true });
        return { success: false, message: 'Cannot claim your own invite pass', status: 400 };
      }

      const maxPasses = config.maxPassesPerUser || 10;
      if ((codeData.totalClaimed || 0) >= maxPasses) {
        return { success: false, message: 'This batchmate has reached their study pass limit', status: 400 };
      }

      // 5. Calculate Execution Timestamps
      const trialDays = config.refereeTrialDays || 15;
      const expiryTimestamp = Date.now() + trialDays * 24 * 60 * 60 * 1000;
      const referralRecordId = `${codeData.ownerUid}_${user.uid}`;
      const referralRecordRef = db.collection('referrals').doc(referralRecordId);

      // 6. Commit Atomic State
      transaction.set(referralRecordRef, {
        id: referralRecordId,
        referrerUid: codeData.ownerUid,
        refereeUid: user.uid,
        refereeEmail: user.email || '',
        refereeName: refereeData.displayName || 'Doctor',
        code,
        status: 'claimed',
        bonusDaysAwarded: config.referrerBonusDays || 14,
        claimedAt: FieldValue.serverTimestamp(),
      });

      transaction.update(codeRef, {
        totalClaimed: FieldValue.increment(1),
      });

      transaction.set(
        refereeRef,
        {
          betaAccess: true,
          betaAccessExpiresAt: expiryTimestamp,
          isTrial: true,
          referredByCode: code,
          referredByUid: codeData.ownerUid,
          referralStatus: 'claimed',
          onboardingCompleted: true,
          failedReferralAttempts: 0, // Reset counter on success
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        success: true,
        message: `Activated ${trialDays}-Day Study Pass!`,
        trialDaysAwarded: trialDays,
        expiryTimestamp,
        status: 200
      };
    });

    // Bubble up explicit HTTP status codes
    if (!result.success) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[API referral/claim] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to apply referral pass due to an internal error.',
    });
  }
}

async function handleQualify(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) {
    return; // 401 sent
  }

  const body = await parseRequestBody(req);
  const sessionDurationMinutes = Number(body?.sessionDurationMinutes || 0);

  try {
    const { db } = initFirebaseAdmin();

    const result = await db.runTransaction(async (transaction) => {
      // 1. Read Referral Config
      const configRef = db.collection('referral_config').doc('global');
      const configSnap = await transaction.get(configRef);
      const config = configSnap.exists
        ? configSnap.data() || {}
        : { enabled: true, minStudyMinutesToQualify: 10, referrerBonusDays: 14 };

      if (config.enabled === false) {
        return { qualified: false, message: 'Referral program paused.' };
      }

      const minMinutes = config.minStudyMinutesToQualify || 10;
      if (sessionDurationMinutes < minMinutes) {
        return { qualified: false, message: `Session duration below threshold (${minMinutes}m required).` };
      }

      // 2. Read Referee
      const refereeRef = db.collection('users').doc(user.uid);
      const refereeSnap = await transaction.get(refereeRef);
      const refereeData = refereeSnap.exists ? refereeSnap.data() || {} : {};

      const referrerUid = refereeData.referredByUid;
      const refCode = refereeData.referredByCode;

      if (!referrerUid || refereeData.referralStatus === 'qualified') {
        return { qualified: false, message: 'Already qualified or not referred.' };
      }

      // 3. Read Referral Record
      const recordId = `${referrerUid}_${user.uid}`;
      const recordRef = db.collection('referrals').doc(recordId);
      const recordSnap = await transaction.get(recordRef);
      if (!recordSnap.exists) {
        return { qualified: false, message: 'Referral relationship not found.' };
      }

      // 4. Read Referrer
      const referrerRef = db.collection('users').doc(referrerUid);
      const referrerSnap = await transaction.get(referrerRef);
      if (!referrerSnap.exists) {
        return { qualified: false, message: 'Referrer profile not found.' };
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

      // 5. Execute Atomic Updates
      transaction.update(recordRef, {
        status: 'qualified',
        qualifiedAt: FieldValue.serverTimestamp(),
      });

      transaction.update(refereeRef, {
        referralStatus: 'qualified',
        updatedAt: FieldValue.serverTimestamp(),
      });

      if (refCode) {
        const codeRef = db.collection('referralCodes').doc(refCode);
        transaction.update(codeRef, {
          totalQualified: FieldValue.increment(1),
        });
      }

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

      return {
        success: true,
        qualified: true,
        bonusDaysAwarded: bonusDays,
      };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[API referral/qualify] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to qualify referral milestone.',
    });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = getAction(req);

  if (action === 'claim') {
    return handleClaim(req, res);
  }

  if (action === 'qualify') {
    return handleQualify(req, res);
  }

  return res.status(404).json({
    error: 'Not Found',
    message: `Unknown referral action: '${action}'. Expected 'claim' or 'qualify'.`,
  });
}
