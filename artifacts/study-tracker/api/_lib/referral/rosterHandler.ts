import { requireAuth, setCorsHeaders, type VercelRequest, type VercelResponse } from '../auth.js';
import { initFirebaseAdmin } from '../firebaseAdmin.js';

function maskEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return 'Anonymous Scholar';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

function maskName(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `Dr. ${parts[0]} ${parts[1][0]}.`;
    }
    return `Dr. ${parts[0]}`;
  }
  if (email) {
    return `Scholar ${email.slice(0, 3).toUpperCase()}`;
  }
  return 'Candidate';
}

export async function handleRoster(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Authenticate caller
  const user = await requireAuth(req, res);
  if (!user) return; // 401 sent by requireAuth

  try {
    const { db } = initFirebaseAdmin();

    // 2. Resolve requested code or user's owned code
    let requestedCode = typeof req.query?.code === 'string' ? req.query.code.trim().toUpperCase() : '';

    const userDocSnap = await db.collection('users').doc(user.uid).get();
    const userData = userDocSnap.exists ? userDocSnap.data() || {} : {};

    if (!requestedCode) {
      requestedCode = userData.affiliateCode || userData.attribution?.ownedCode || '';
    }

    // 3. Authorization Check
    let codeData: any = null;
    if (requestedCode) {
      const codeSnap = await db.collection('referral_codes').doc(requestedCode).get();
      if (codeSnap.exists) {
        codeData = codeSnap.data();
        if (codeData.ownerUid !== user.uid) {
          // Check if admin
          const adminDoc = await db.collection('admins').doc(user.uid).get();
          if (!adminDoc.exists && userData.role !== 'admin' && !userData.isAdmin) {
            return res.status(403).json({
              success: false,
              error: 'Forbidden: You do not have permission to view this roster.',
            });
          }
        }
      }
    }

    // 4. Query referrals ledger using Admin SDK (bypassing client-side rules safely)
    let referralsQuery = db.collection('referrals').where('referrerUid', '==', user.uid);
    if (requestedCode) {
      referralsQuery = db.collection('referrals').where('code', '==', requestedCode);
    }

    const referralsSnap = await referralsQuery.get();

    const candidates = referralsSnap.docs.map((d) => {
      const rec = d.data();
      let joinedDate: Date | null = null;
      if (rec.claimedAt) {
        joinedDate = rec.claimedAt.toDate ? rec.claimedAt.toDate() : new Date(rec.claimedAt);
      }

      return {
        id: d.id,
        displayName: maskName(rec.refereeName, rec.refereeEmail),
        emailMasked: maskEmail(rec.refereeEmail),
        joinedAt: joinedDate,
        status: rec.status === 'converted' ? 'active' : (rec.status === 'claimed' ? 'trial' : 'expired'),
      };
    });

    // Sort newest first
    candidates.sort((a, b) => {
      const timeA = a.joinedAt ? a.joinedAt.getTime() : 0;
      const timeB = b.joinedAt ? b.joinedAt.getTime() : 0;
      return timeB - timeA;
    });

    const stats = codeData?.stats || {
      totalClaims: candidates.length,
      totalQualified: candidates.filter(c => c.status === 'active' || c.status === 'trial').length,
      totalConversions: candidates.filter(c => c.status === 'active').length,
      activeSeats: candidates.filter(c => c.status === 'active').length,
    };

    return res.status(200).json({
      success: true,
      code: requestedCode,
      stats,
      candidates,
    });
  } catch (error: any) {
    console.error('[API referral/roster] Error fetching partner roster:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve referral roster.',
    });
  }
}

export default handleRoster;
