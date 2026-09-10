import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth, setCorsHeaders, parseRequestBody, type VercelRequest, type VercelResponse } from '../_lib/auth.js';
import { initFirebaseAdmin } from '../_lib/firebaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) {
    return; // 401 sent
  }

  const body = await parseRequestBody(req);
  const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';

  if (!code) {
    return res.status(400).json({ success: false, message: 'Referral code is required.' });
  }

  try {
    const { db } = initFirebaseAdmin();

    const result = await db.runTransaction(async (transaction) => {
      // 1. Read Referral Config
      const configRef = db.collection('referral_config').doc('global');
      const configSnap = await transaction.get(configRef);
      const config = configSnap.exists
        ? configSnap.data() || {}
        : { enabled: true, maxPassesPerUser: 10, refereeTrialDays: 15, referrerBonusDays: 14 };

      if (config.enabled === false) {
        throw new Error('Referral program is currently paused');
      }

      // 2. Read Referee Document
      const refereeRef = db.collection('users').doc(user.uid);
      const refereeSnap = await transaction.get(refereeRef);
      const refereeData = refereeSnap.exists ? refereeSnap.data() || {} : {};

      if (refereeData.referredByCode) {
        throw new Error('Invite pass already claimed on this account');
      }

      // 3. Read Referral Code
      const codeRef = db.collection('referralCodes').doc(code);
      const codeSnap = await transaction.get(codeRef);
      if (!codeSnap.exists) {
        throw new Error('Invalid or expired invite pass');
      }

      const codeData = codeSnap.data() || {};
      if (codeData.ownerUid === user.uid) {
        throw new Error('Cannot claim your own invite pass');
      }

      const maxPasses = config.maxPassesPerUser || 10;
      if ((codeData.totalClaimed || 0) >= maxPasses) {
        throw new Error('This batchmate has reached their study pass limit');
      }

      // 4. Calculate Timestamps
      const trialDays = config.refereeTrialDays || 15;
      const now = Date.now();
      const expiryTimestamp = now + trialDays * 24 * 60 * 60 * 1000;
      const referralRecordId = `${codeData.ownerUid}_${user.uid}`;
      const referralRecordRef = db.collection('referrals').doc(referralRecordId);

      // 5. Atomic State Commits
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
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        success: true,
        message: `Activated ${trialDays}-Day Study Pass!`,
        trialDaysAwarded: trialDays,
        expiryTimestamp,
      };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[API referral/claim] Error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to apply referral pass.',
    });
  }
}
