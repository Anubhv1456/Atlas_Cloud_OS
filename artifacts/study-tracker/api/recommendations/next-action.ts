import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../_lib/auth.js';
import { computeNextActionsServerSide } from '../_lib/sdsr.js';

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

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed', message: 'Use POST for recommendation queries.' });
    return;
  }

  // 1. Verify Firebase Auth Token
  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    // 2. Parse User Input (curriculumSets, systems, subjects, sessionBudget, etc.)
    const {
      curriculumSets = [],
      systems = [],
      subjects = [],
      topicProgresses = [],
      daysSinceLastStudy = 0,
      skipIds = [],
      sessionBudget = 'quick',
      targetExam = 'NEET PG',
      subjectFilterId,
    } = req.body || {};

    // 3. Compute Recommendations via SDSR & Triage Logic on the Server
    const recommendations = computeNextActionsServerSide({
      curriculumSets,
      systems,
      subjects,
      topicProgresses,
      daysSinceLastStudy,
      skipIds,
      sessionBudget,
      targetExam,
      subjectFilterId,
    });

    // 4. Return Output (Formula, constants & weight matrices stay 100% on server)
    res.status(200).json({
      success: true,
      authenticatedUserId: user.uid,
      recommendations,
    });
  } catch (error) {
    console.error('[Recommendations API] Error computing next action:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to compute recommendations server-side.',
    });
  }
}
