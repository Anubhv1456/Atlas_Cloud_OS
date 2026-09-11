import crypto from 'crypto';
import { requireAuth, setCorsHeaders, parseRequestBody, type VercelRequest, type VercelResponse } from '../_lib/auth.js';

function getAction(req: VercelRequest): string {
  const queryAction = req.query.action;
  if (typeof queryAction === 'string') return queryAction;
  if (Array.isArray(queryAction) && queryAction[0]) return queryAction[0];
  const urlPath = (req.url || '').split('?')[0];
  const segments = urlPath.split('/').filter(Boolean);
  return segments[segments.length - 1] || '';
}

async function handleSignBackup(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authenticatedUser = await requireAuth(req, res);
  if (!authenticatedUser) {
    return; // 401 response handled by requireAuth
  }

  try {
    const body = await parseRequestBody(req);
    const { originUid, originEmail, exportTimestamp, metrics } = body || {};

    if (!originUid || !exportTimestamp || !metrics) {
      return res.status(400).json({ error: 'Invalid backup signing request: missing metadata or metrics.' });
    }

    if (authenticatedUser.uid !== originUid) {
      return res.status(403).json({ error: 'Forbidden: caller UID does not match origin UID.' });
    }

    const secret = process.env.VAULT_SIGNING_SECRET;
    if (!secret) {
      throw new Error('Server configuration error: VAULT_SIGNING_SECRET is not set.');
    }

    const historyCount = typeof metrics.historyCount === 'number' ? metrics.historyCount : 0;
    const signatureSeed = `${originUid}:${originEmail || ''}:${exportTimestamp}:${metrics.totalStudyMinutes}:${metrics.completedTopics}:${metrics.scoreLogsCount}:${historyCount}`;

    const signature = crypto.createHmac('sha256', secret).update(signatureSeed).digest('hex');

    return res.status(200).json({
      success: true,
      provenanceHash: `hmac_${signature}`,
      signatureType: 'server_hmac_sha256',
      signedAt: Date.now(),
    });
  } catch (error: any) {
    console.error('[API vault/sign-backup] Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate vault signature.' });
  }
}

async function handleVerifyBackup(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authenticatedUser = await requireAuth(req, res);
  if (!authenticatedUser) {
    return; // 401 response handled by requireAuth
  }

  try {
    const body = await parseRequestBody(req);
    const { originUid, originEmail, exportTimestamp, metrics, provenanceHash } = body || {};

    if (!originUid || !exportTimestamp || !metrics || !provenanceHash) {
      return res.status(400).json({ error: 'Invalid verification request: missing envelope fields.' });
    }

    const secret = process.env.VAULT_SIGNING_SECRET;
    if (!secret) {
      throw new Error('Server configuration error: VAULT_SIGNING_SECRET is not set.');
    }

    // 1. Check Server HMAC-SHA256
    const historyCount = typeof metrics.historyCount === 'number' ? metrics.historyCount : 0;
    const signatureSeed = `${originUid}:${originEmail || ''}:${exportTimestamp}:${metrics.totalStudyMinutes}:${metrics.completedTopics}:${metrics.scoreLogsCount}:${historyCount}`;
    const expectedHmac = `hmac_${crypto.createHmac('sha256', secret).update(signatureSeed).digest('hex')}`;

    if (provenanceHash === expectedHmac) {
      return res.status(200).json({
        valid: true,
        signedByServer: true,
        tampered: false,
      });
    }

    // 2. Legacy Checksum Verification for Backward Compatibility with client exports
    const legacySeed = `${originUid}:${originEmail || ''}:${exportTimestamp}:${metrics.totalStudyMinutes}:${metrics.completedTopics}:${metrics.scoreLogsCount}`;
    const legacyHash = crypto.createHash('sha256').update(legacySeed).digest('hex');

    if (provenanceHash === legacyHash) {
      return res.status(200).json({
        valid: true,
        signedByServer: false,
        legacy: true,
        tampered: false,
      });
    }

    // Tampered or invalid hash
    return res.status(200).json({
      valid: false,
      signedByServer: false,
      tampered: true,
    });
  } catch (error: any) {
    console.error('[API vault/verify-backup] Error:', error);
    return res.status(500).json({ error: error.message || 'Verification error' });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = getAction(req);

  if (action === 'sign-backup') {
    return handleSignBackup(req, res);
  }

  if (action === 'verify-backup') {
    return handleVerifyBackup(req, res);
  }

  return res.status(404).json({
    error: 'Not Found',
    message: `Unknown vault action: '${action}'. Expected 'sign-backup' or 'verify-backup'.`,
  });
}
