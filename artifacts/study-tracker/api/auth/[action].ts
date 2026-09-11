import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth, setCorsHeaders, parseRequestBody, type VercelRequest, type VercelResponse } from '../_lib/auth.js';
import { initFirebaseAdmin } from '../_lib/firebaseAdmin.js';

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const OFFLINE_LEASE_DURATION_MS = 72 * 60 * 60 * 1000; // 72 Hours

function getAction(req: VercelRequest): string {
  const queryAction = req.query?.action;
  if (typeof queryAction === 'string') return queryAction.toLowerCase();
  if (Array.isArray(queryAction) && queryAction[0]) return queryAction[0].toLowerCase();
  const urlPath = (req.url || '').split('?')[0];
  const segments = urlPath.split('/').filter(Boolean);
  return (segments[segments.length - 1] || '').toLowerCase();
}

async function handleActivateTrial(req: VercelRequest, res: VercelResponse) {
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
    console.error('[API auth/activate-trial] Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to evaluate or activate trial.',
    });
  }
}

async function handleIssueLease(req: VercelRequest, res: VercelResponse) {
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

    // 1. Evaluate Paid Status
    const isPaid = 
      userData.hasPaidAccess === true || 
      userData.paymentStatus === 'succeeded';

    // 2. Evaluate Beta / Trial Status
    let betaExpiry: number | null = null;
    if (userData.betaAccessExpiresAt) {
      if (typeof userData.betaAccessExpiresAt === 'number') {
        betaExpiry = userData.betaAccessExpiresAt;
      } else if (typeof userData.betaAccessExpiresAt?.toMillis === 'function') {
        betaExpiry = userData.betaAccessExpiresAt.toMillis();
      } else if (typeof userData.betaAccessExpiresAt === 'string') {
        betaExpiry = new Date(userData.betaAccessExpiresAt).getTime();
      }
    }

    let trialExpiry: number | null = null;
    if (userData.trialExpiresAt) {
      if (typeof userData.trialExpiresAt === 'number') {
        trialExpiry = userData.trialExpiresAt;
      } else if (typeof userData.trialExpiresAt?.toMillis === 'function') {
        trialExpiry = userData.trialExpiresAt.toMillis();
      } else if (typeof userData.trialExpiresAt === 'string') {
        trialExpiry = new Date(userData.trialExpiresAt).getTime();
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

    // Cryptographic HMAC-SHA256 signature
    const tier = (isPaid || isBetaActive) ? 'paid' : 'trial';
    const secret = process.env.LEASE_SIGNING_SECRET || process.env.OFFLINE_LEASE_SECRET || 'atlas_production_offline_lease_secret_default_key';
    
    const payload = {
      uid: user.uid,
      grantedAt: now,
      expiresAt,
      tier,
      lastOnlineSync: now,
    };

    const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    const signedLease = {
      ...payload,
      signature: `hmac_${signature}`,
    };

    return res.status(200).json({
      success: true,
      lease: signedLease,
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let body: any = null;
  if (req.method === 'POST') {
    try {
      body = await parseRequestBody(req);
      req.body = body;
    } catch {}
  }

  let action = getAction(req);
  if ((action === 'action' || !action) && body?.action) {
    action = String(body.action).toLowerCase();
  }

  if (action === 'activate-trial') {
    return handleActivateTrial(req, res);
  }

  if (action === 'issue-lease') {
    return handleIssueLease(req, res);
  }

  if (req.method === 'GET' && (!action || action === 'auth')) {
    return res.status(200).json({
      status: 'ok',
      service: 'auth-action-boundary',
      supportedActions: ['activate-trial', 'issue-lease'],
    });
  }

  return res.status(404).json({
    error: 'Not Found',
    message: `Unknown auth action: '${action}'. Expected 'activate-trial' or 'issue-lease'.`,
  });
}
