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
