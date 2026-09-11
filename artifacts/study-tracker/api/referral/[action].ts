import { setCorsHeaders, type VercelRequest, type VercelResponse } from '../_lib/auth.js';
import { handleClaim } from '../_lib/referral/claimHandler.js';
import { handleSettle } from '../_lib/referral/settleHandler.js';
import { handleRoster } from '../_lib/referral/rosterHandler.js';

function getAction(req: VercelRequest): string {
  const queryAction = req.query?.action;
  if (typeof queryAction === 'string') return queryAction.toLowerCase();
  if (Array.isArray(queryAction) && queryAction[0]) return queryAction[0].toLowerCase();
  const urlPath = (req.url || '').split('?')[0];
  const segments = urlPath.split('/').filter(Boolean);
  return (segments[segments.length - 1] || '').toLowerCase();
}

/**
 * Unified Dynamic Action Router for /api/referral/[action]
 * Supports:
 *   - /api/referral/claim
 *   - /api/referral/settle
 *   - /api/referral/qualify (Legacy alias to settle with trigger: 'study_milestone')
 *   - /api/referral/roster (Secure masked partner candidate roster)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let action = getAction(req);
  if ((action === 'action' || !action) && (req.body as any)?.action) {
    action = String((req.body as any).action).toLowerCase();
  }

  if (action === 'claim') {
    return handleClaim(req, res);
  }

  if (action === 'settle' || action === 'qualify') {
    return handleSettle(req, res);
  }

  if (action === 'roster') {
    return handleRoster(req, res);
  }

  return res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Unknown referral action: '${action}'. Expected 'claim', 'settle', or 'roster'.`,
  });
}
