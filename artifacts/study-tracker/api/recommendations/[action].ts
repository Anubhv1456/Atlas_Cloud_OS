import { requireAuth, type VercelRequest, type VercelResponse } from '../_lib/auth.js';
import { computeNextActionsServerSide } from '../_lib/sdsr.js';

function getAction(req: VercelRequest): string {
  const queryAction = req.query.action;
  if (typeof queryAction === 'string') return queryAction;
  if (Array.isArray(queryAction) && queryAction[0]) return queryAction[0];
  const urlPath = (req.url || '').split('?')[0];
  const segments = urlPath.split('/').filter(Boolean);
  return segments[segments.length - 1] || '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  const action = getAction(req);

  // 1. Next-Action Calculation: /api/recommendations/next-action
  if (action === 'next-action') {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed', message: 'Use POST for recommendation queries.' });
      return;
    }

    try {
      const {
        curriculumSets = [],
        systems = [],
        subjects = [],
        topicProgresses = [],
        mistakeLogs = [],
        daysSinceLastStudy = 0,
        skipIds = [],
        sessionBudget = 'quick',
        targetExam = 'NEET PG',
        subjectFilterId,
      } = req.body || {};

      const recommendations = computeNextActionsServerSide({
        curriculumSets,
        systems,
        subjects,
        topicProgresses,
        mistakeLogs,
        daysSinceLastStudy,
        skipIds,
        sessionBudget,
        targetExam,
        subjectFilterId,
      });

      res.status(200).json({
        success: true,
        authenticatedUserId: user.uid,
        recommendations,
      });
      return;
    } catch (error) {
      console.error('[Recommendations API] Error computing next action:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to compute recommendations server-side.',
      });
      return;
    }
  }

  // 2. Health / Root Status: /api/recommendations or /api/recommendations/index
  res.status(200).json({
    status: 'online',
    service: 'Atlas Recommendation Engine Endpoint',
    authenticatedUser: user.uid,
  });
}
