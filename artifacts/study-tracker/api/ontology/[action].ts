import { requireAuth, type VercelRequest, type VercelResponse } from '../_lib/auth.js';
import { getSubjectSummaries, searchSanitizedTopics, getSanitizedSubject } from '../_lib/ontology.js';

function getAction(req: VercelRequest): string {
  const queryAction = req.query.action;
  if (typeof queryAction === 'string') return queryAction;
  if (Array.isArray(queryAction) && queryAction[0]) return queryAction[0];
  const urlPath = (req.url || '').split('?')[0];
  const segments = urlPath.split('/').filter(Boolean);
  return segments[segments.length - 1] || '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  // 1. Specific Subject Query: /api/ontology/subject?id=...
  if (action === 'subject') {
    const subjectQuery = (req.query.id as string) || (req.query.name as string) || (req.body && req.body.subjectId);

    if (!subjectQuery) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Missing subject identifier parameter (e.g. ?id=SUB_01 or ?id=pharmacology).',
      });
      return;
    }

    const subject = getSanitizedSubject(String(subjectQuery));

    if (!subject) {
      res.status(404).json({
        error: 'Not Found',
        message: `No subject found matching parameter: ${subjectQuery}`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      authenticatedUserId: user.uid,
      subject,
    });
    return;
  }

  // 2. Search Topics or List Subject Summaries: /api/ontology or /api/ontology/index
  const searchQuery = req.query.q as string | undefined;

  if (searchQuery) {
    const results = searchSanitizedTopics(searchQuery);
    res.status(200).json({
      success: true,
      query: searchQuery,
      count: results.length,
      topics: results,
    });
    return;
  }

  const subjects = getSubjectSummaries();
  res.status(200).json({
    success: true,
    count: subjects.length,
    subjects,
  });
}
