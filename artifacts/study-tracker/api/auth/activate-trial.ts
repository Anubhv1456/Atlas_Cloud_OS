import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth, setCorsHeaders, type VercelRequest, type VercelResponse } from '../_lib/auth.js';
import { initFirebaseAdmin } from '../_lib/firebaseAdmin.js';

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

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
    return; // 401 handled by requireAuth
  }

  try {
    const { db } = initFirebaseAdmin();
    const userDocRef = db.collection('users').doc(user.uid);
    const userSnap = await userDocRef.get();
    const userData = userSnap.exists ? (userSnap.data() || {}) : {};

    // If user has paid access, trial is superseded
    if (userData.hasPaidAccess === true || userData.paymentStatus === 'succeeded') {
      return res.status(200).json({
        success: true,
        isTrialActive: false,
        isPaid: true,
        trialDaysRemaining: 0,
        message: 'Account has permanent paid entitlement.',
      });
    }

    const now = Date.now();

    // Check if trial was already anchored on the server
    if (userData.trialExpiresAt) {
      let expiryMs = 0;
      if (typeof userData.trialExpiresAt === 'number') {
        expiryMs = userData.trialExpiresAt;
      } else if (typeof userData.trialExpiresAt === 'string') {
        expiryMs = new Date(userData.trialExpiresAt).getTime();
      } else if (typeof userData.trialExpiresAt?.toMillis === 'function') {
        expiryMs = userData.trialExpiresAt.toMillis();
      }

      const diffMs = expiryMs - now;
      const isTrialActive = diffMs > 0;
      const trialDaysRemaining = isTrialActive ? Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24))) : 0;

      return res.status(200).json({
        success: true,
        isTrialActive,
        trialStartedAt: userData.trialStartedAt || null,
        trialExpiresAt: userData.trialExpiresAt,
        trialDaysRemaining,
        firstActivation: false,
      });
    }

    // Initialize 14-Day trial anchored to server clock
    const trialExpiresAt = new Date(now + FOURTEEN_DAYS_MS).toISOString();

    await userDocRef.set(
      {
        trialStartedAt: FieldValue.serverTimestamp(),
        trialExpiresAt,
        isTrial: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return res.status(200).json({
      success: true,
      isTrialActive: true,
      trialStartedAt: new Date(now).toISOString(),
      trialExpiresAt,
      trialDaysRemaining: 14,
      firstActivation: true,
    });
  } catch (error: any) {
    console.error('[API activate-trial] Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to evaluate or activate trial.',
    });
  }
}
