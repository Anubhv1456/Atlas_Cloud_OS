import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../_lib/auth.js';
import { getSubjectSummaries, searchSanitizedTopics } from '../_lib/ontology.js';

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
