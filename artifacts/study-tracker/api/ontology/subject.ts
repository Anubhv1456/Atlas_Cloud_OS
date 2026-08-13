import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../_lib/auth.js';
import { getSanitizedSubject } from '../_lib/ontology.js';

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
}
