import crypto from 'crypto';
import { setCorsHeaders, parseRequestBody, type VercelRequest, type VercelResponse } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = await parseRequestBody(req);
    const { originUid, originEmail, exportTimestamp, metrics, provenanceHash } = body || {};

    if (!originUid || !exportTimestamp || !metrics || !provenanceHash) {
      return res.status(400).json({ error: 'Invalid verification request: missing envelope fields.' });
    }

    const secret =
      process.env.VAULT_SIGNING_SECRET ||
      process.env.FIREBASE_PRIVATE_KEY ||
      'atlas_vault_provenance_signing_secret_v1';

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
    return res.status(500).json({ error: 'Verification error' });
  }
}
