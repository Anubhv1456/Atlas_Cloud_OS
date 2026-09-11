import crypto from 'crypto';
import { requireAuth, setCorsHeaders, type VercelRequest, type VercelResponse } from '../_lib/auth.js';
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
    const userDocRef = db.collection('users').doc(user.uid);
    const userDoc = await userDocRef.get();
    const userData = userDoc.exists ? (userDoc.data() || {}) : {};

    const now = Date.now();

    // 1. Evaluate access privileges
    const hasPaidAccess = userData.hasPaidAccess === true || userData.paymentStatus === 'succeeded';
    const hasBetaAccess = userData.betaAccess === true;

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
    const isTrialValid = Boolean(trialExpiry && trialExpiry > now);

    if (!hasPaidAccess && !hasBetaAccess && !isTrialValid) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'No active subscription, grant, or trial found for this account.',
      });
    }

    // 2. Determine expiration boundary (capped by trial/beta expiry if applicable)
    let expiresAt = now + OFFLINE_LEASE_DURATION_MS;
    const caps = [];
    
    if (userData.betaAccessExpiresAt) {
      let betaExpiry = null;
      if (typeof userData.betaAccessExpiresAt === 'number') {
        betaExpiry = userData.betaAccessExpiresAt;
      } else if (typeof userData.betaAccessExpiresAt?.toMillis === 'function') {
        betaExpiry = userData.betaAccessExpiresAt.toMillis();
      } else if (typeof userData.betaAccessExpiresAt === 'string') {
        betaExpiry = new Date(userData.betaAccessExpiresAt).getTime();
      }
      if (betaExpiry && betaExpiry > now) {
        caps.push(betaExpiry);
      }
    }

    if (trialExpiry && trialExpiry > now) {
      caps.push(trialExpiry);
    }

    if (!hasPaidAccess && caps.length > 0) {
      expiresAt = Math.min(expiresAt, ...caps);
    }

    // 3. Construct Lease Payload
    const tier = (hasPaidAccess || hasBetaAccess) ? 'paid' : 'trial';
    const payload = {
      uid: user.uid,
      grantedAt: now,
      expiresAt,
      tier,
    };

    // 4. Cryptographic Sign using HMAC-SHA256 with server environment key
    const secret = process.env.LEASE_SIGNING_SECRET || process.env.OFFLINE_LEASE_SECRET;
    if (!secret) {
      console.error('LEASE_SIGNING_SECRET is not configured on server');
      return res.status(500).json({ error: 'Server key configuration error' });
    }

    const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

    return res.status(200).json({
      success: true,
      lease: payload,
      signature: `hmac_${signature}`,
    });

  } catch (error: any) {
    console.error('[API auth/issue-lease] Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate cryptographically signed offline lease.',
    });
  }
}
