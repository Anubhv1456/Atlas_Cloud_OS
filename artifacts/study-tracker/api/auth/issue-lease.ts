import crypto from 'crypto';
import { requireAuth, setCorsHeaders, parseRequestBody, type VercelRequest, type VercelResponse } from '../_lib/auth.js';
import { initFirebaseAdmin } from '../_lib/firebaseAdmin.js';

const OFFLINE_LEASE_DURATION_MS = 72 * 60 * 60 * 1000; // 72 Hours

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
    return; // 401 response handled by requireAuth
  }

  try {
    const { db } = initFirebaseAdmin();
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.exists ? (userDoc.data() || {}) : {};

    const now = Date.now();

    // 1. Evaluate Paid Status
    const isPaid = 
      userData.hasPaidAccess === true || 
      userData.paymentStatus === 'succeeded';

    // 2. Evaluate Beta / Trial Status
    let betaExpiry = null;
    if (userData.betaAccessExpiresAt) {
      if (typeof userData.betaAccessExpiresAt === 'number') {
        betaExpiry = userData.betaAccessExpiresAt;
      } else if (typeof userData.betaAccessExpiresAt?.toMillis === 'function') {
        betaExpiry = userData.betaAccessExpiresAt.toMillis();
      } else if (typeof userData.betaAccessExpiresAt === 'string') {
        betaExpiry = new Date(userData.betaAccessExpiresAt).getTime();
      }
    }

    let trialExpiry = null;
    if (userData.trialExpiresAt) {
      if (typeof userData.trialExpiresAt === 'number') {
        trialExpiry = userData.trialExpiresAt;
      } else if (typeof userData.trialExpiresAt === 'string') {
        trialExpiry = new Date(userData.trialExpiresAt).getTime();
      } else if (typeof userData.trialExpiresAt?.toMillis === 'function') {
        trialExpiry = userData.trialExpiresAt.toMillis();
      }
    }

    const isBetaActive = userData.betaAccess === true && (!betaExpiry || betaExpiry > now);
    const isTrialActive = Boolean(trialExpiry && trialExpiry > now);

    const isEntitled = isPaid || isBetaActive || isTrialActive;

    if (!isEntitled) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'No active subscription, grant, or trial found for this account.',
      });
    }

    // Determine lease expiration boundary (capped by trial/beta expiry if applicable)
    let expiresAt = now + OFFLINE_LEASE_DURATION_MS;
    const caps = [betaExpiry, trialExpiry].filter((exp): exp is number => typeof exp === 'number' && exp > now);
    if (!isPaid && caps.length > 0) {
      expiresAt = Math.min(expiresAt, ...caps);
    }

    // Server-side HMAC signing
    const secret =
      process.env.OFFLINE_LEASE_SECRET ||
      process.env.FIREBASE_PRIVATE_KEY ||
      'atlas_med_vault_offline_lease_secret_v1';

    const signingPayload = `${user.uid}#${now}#${expiresAt}`;
    const signature = crypto.createHmac('sha256', secret).update(signingPayload).digest('hex');

    const lease = {
      uid: user.uid,
      grantedAt: now,
      expiresAt,
      lastOnlineSync: now,
      signature: `hmac_${signature}`,
    };

    return res.status(200).json({
      success: true,
      lease,
    });
  } catch (error: any) {
    console.error('[API issue-lease] Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate offline entitlement lease.',
    });
  }
}
