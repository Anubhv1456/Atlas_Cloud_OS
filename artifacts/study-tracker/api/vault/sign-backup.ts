import crypto from 'crypto';
import { setCorsHeaders, parseRequestBody, verifyAuthToken, type VercelRequest, type VercelResponse } from '../_lib/auth.js';

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
    const { originUid, originEmail, exportTimestamp, metrics } = body || {};

    if (!originUid || !exportTimestamp || !metrics) {
      return res.status(400).json({ error: 'Invalid backup signing request: missing metadata or metrics.' });
    }

    // Authenticate caller if auth token is present, verifying UID match
    const authenticatedUser = await verifyAuthToken(req);
    if (authenticatedUser && originUid !== 'anonymous_local_vault' && authenticatedUser.uid !== originUid) {
      return res.status(403).json({ error: 'Forbidden: caller UID does not match origin UID.' });
    }

    const secret =
      process.env.VAULT_SIGNING_SECRET ||
      process.env.FIREBASE_PRIVATE_KEY ||
      'atlas_vault_provenance_signing_secret_v1';

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
    return res.status(500).json({ error: 'Failed to generate vault signature.' });
  }
}
