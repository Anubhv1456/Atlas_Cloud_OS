import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth, setCorsHeaders, parseRequestBody, type VercelRequest, type VercelResponse } from '../auth.js';
import { initFirebaseAdmin } from '../firebaseAdmin.js';
import type { GrowthSourceParam } from '../../../src/types/growth.js';

export async function handleClaim(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  // 1. Authentication: Verify caller's Firebase Auth ID token
  const user = await requireAuth(req, res);
  if (!user) return; // 401 sent by requireAuth

  const body = await parseRequestBody(req);
  const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';
  const rawSource = typeof body?.sourceParam === 'string' ? body.sourceParam.toLowerCase() : 'ref';
  const sourceParam: GrowthSourceParam = (['ref', 'via', 'affiliate'].includes(rawSource) ? rawSource : 'ref') as GrowthSourceParam;

  if (!code) {
    return res.status(400).json({ success: false, message: 'Referral code is required.' });
  }

  try {
    const { db } = initFirebaseAdmin();

    const result = await db.runTransaction(async (transaction) => {
      // 2. Read Global Config with safe fallbacks
      let config = {
        enabled: true,
        refereeTrialDays: 15,
        referrerBonusDays: 14,
        maxPassesPerUser: 3,
        minStudyMinutesToQualify: 10,
      };

      // Query canonical /config/referral_settings as the single source of truth
      const settingsRef = db.collection('config').doc('referral_settings');
      const settingsSnap = await transaction.get(settingsRef);
      if (settingsSnap.exists) {
        config = { ...config, ...(settingsSnap.data() as any) };
      }

      if (config.enabled === false) {
        return { success: false, status: 400, message: 'The referral and study pass program is currently paused.' };
      }

      // 3. Read Referee Profile & Run Anti-Abuse Guards
      const refereeRef = db.collection('users').doc(user.uid);
      const refereeSnap = await transaction.get(refereeRef);
      const refereeData = refereeSnap.exists ? refereeSnap.data() || {} : {};

      // Rate Limiting / Brute-force check (>= 5 failed attempts in the last 60m)
      const failedAttempts = refereeData.failedReferralAttempts || 0;
      const lastFailed = refereeData.lastFailedReferralAttempt?.toMillis?.() ||
        (refereeData.lastFailedReferralAttempt ? new Date(refereeData.lastFailedReferralAttempt).getTime() : 0);
      const oneHour = 60 * 60 * 1000;

      if (failedAttempts >= 5 && Date.now() - lastFailed < oneHour) {
        return {
          success: false,
          status: 429,
          message: 'Too many failed referral attempts. Please try again in 1 hour.',
        };
      }

      // Duplicate Claim check
      if (refereeData.attribution?.code || refereeData.referredByCode) {
        return {
          success: false,
          status: 400,
          message: 'An invitation or partner pass has already been claimed on this account.',
        };
      }

      // 4. Code Resolution: Query Canonical /referral_codes, fallback to /referralCodes
      const canonicalCodeRef = db.collection('referral_codes').doc(code);
      const canonicalCodeSnap = await transaction.get(canonicalCodeRef);

      let isCanonical = false;
      let codeData: any = null;
      let legacyCodeRef = db.collection('referralCodes').doc(code);

      if (canonicalCodeSnap.exists) {
        isCanonical = true;
        codeData = canonicalCodeSnap.data();
      } else {
        const legacyCodeSnap = await transaction.get(legacyCodeRef);
        if (legacyCodeSnap.exists) {
          codeData = legacyCodeSnap.data();
        }
      }

      if (!codeData) {
        // Increment failed attempts
        transaction.set(
          refereeRef,
          {
            failedReferralAttempts: FieldValue.increment(1),
            lastFailedReferralAttempt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        return { success: false, status: 400, message: 'Invalid or expired invite pass.' };
      }

      const ownerUid = codeData.ownerUid;
      const codeType = codeData.type || 'batchmate';
      const statusCode = codeData.status || 'active';

      // Self-attribution check
      if (ownerUid === user.uid) {
        transaction.set(
          refereeRef,
          {
            failedReferralAttempts: FieldValue.increment(1),
            lastFailedReferralAttempt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        return { success: false, status: 400, message: 'Self-referral is prohibited: Cannot claim your own invite pass.' };
      }

      if (statusCode !== 'active') {
        return { success: false, status: 400, message: 'This study pass is no longer active.' };
      }

      // Max Claims check
      const totalClaims = codeData.stats?.totalClaims ?? codeData.totalClaimed ?? 0;
      const maxClaims = codeData.config?.maxClaims !== undefined
        ? codeData.config.maxClaims
        : (codeType === 'batchmate' ? (config.maxPassesPerUser || 3) : null);

      if (maxClaims !== null && totalClaims >= maxClaims) {
        return {
          success: false,
          status: 400,
          message: 'This referral pass has reached its maximum peer activation limit.',
        };
      }

      // 5. Entitlement Calculation
      const refereeTrialDays = codeData.config?.refereeTrialDays ||
        (codeType === 'affiliate' ? 7 : (config.refereeTrialDays || 15));
      const referrerBonusDays = codeData.config?.referrerBonusDays || (config.referrerBonusDays || 14);
      const trialMillis = refereeTrialDays * 24 * 60 * 60 * 1000;
      const expiryTimestamp = Date.now() + trialMillis;

      // 6. Atomic Transaction Commit
      // (a) Update referral code stats
      if (isCanonical) {
        transaction.update(canonicalCodeRef, {
          'stats.totalClaims': FieldValue.increment(1),
          'stats.activeSeats': FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        transaction.update(legacyCodeRef, {
          totalClaimed: FieldValue.increment(1),
          lastClaimedAt: FieldValue.serverTimestamp(),
        });
        // Also replicate into canonical path for unified future tracking
        transaction.set(canonicalCodeRef, {
          code,
          type: codeType,
          ownerUid,
          ownerEmail: codeData.ownerEmail || '',
          ownerDisplayName: codeData.ownerDisplayName || 'Doctor',
          status: 'active',
          stats: {
            totalClaims: totalClaims + 1,
            totalQualified: codeData.totalQualified || 0,
            totalConversions: 0,
            activeSeats: totalClaims + 1,
          },
          config: {
            maxClaims,
            refereeTrialDays,
            referrerBonusDays,
          },
          createdAt: codeData.createdAt || FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      // (b) Create /referrals/{referrerUid_refereeUid}
      const referralRecordId = `${ownerUid}_${user.uid}`;
      const referralRecordRef = db.collection('referrals').doc(referralRecordId);
      transaction.set(referralRecordRef, {
        id: referralRecordId,
        referrerUid: ownerUid,
        refereeUid: user.uid,
        refereeEmail: user.email || refereeData.email || '',
        refereeName: refereeData.displayName || 'Doctor',
        code,
        type: codeType,
        status: 'claimed',
        bonusDaysAwarded: referrerBonusDays,
        claimedAt: FieldValue.serverTimestamp(),
        qualifiedAt: null,
        convertedAt: null,
        sourceParam,
      });

      // (c) Update /users/{refereeUid} with canonical attribution & mirrored legacy fields
      transaction.set(
        refereeRef,
        {
          attribution: {
            code,
            referrerUid: ownerUid,
            type: codeType,
            status: 'claimed',
            claimedAt: FieldValue.serverTimestamp(),
            qualifiedAt: null,
            convertedAt: null,
            sourceParam,
            ownedCode: refereeData.attribution?.ownedCode || null,
            isPartner: refereeData.attribution?.isPartner || false,
            partnerType: refereeData.attribution?.partnerType || null,
          },
          betaAccess: true,
          betaAccessExpiresAt: expiryTimestamp,
          isTrial: true,
          onboardingCompleted: true,
          failedReferralAttempts: 0,
          lastFailedReferralAttempt: null,
          // Legacy mirrors
          referredByCode: code,
          referredByUid: ownerUid,
          referralStatus: 'claimed',
          referredBy: code,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        success: true,
        status: 200,
        message: `Activated ${refereeTrialDays}-Day Study Pass!`,
        trialDaysAwarded: refereeTrialDays,
        expiryTimestamp,
      };
    });

    if (!result.success) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[API referral/claim] Internal error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process referral pass due to an internal error.',
    });
  }
}

export default handleClaim;
