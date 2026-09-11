import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth, setCorsHeaders, parseRequestBody, type VercelRequest, type VercelResponse } from '../_lib/auth.js';
import { initFirebaseAdmin } from '../_lib/firebaseAdmin.js';

function getAction(req: VercelRequest): string {
  const queryAction = req.query?.action;
  if (typeof queryAction === 'string') return queryAction;
  if (Array.isArray(queryAction) && queryAction[0]) return queryAction[0];
  const urlPath = (req.url || '').split('?')[0];
  const segments = urlPath.split('/').filter(Boolean);
  return segments[segments.length - 1] || '';
}

/**
 * Serverless Admin Authorization Guard.
 * Strictly verifies that the authenticated user possesses verified administrator status via:
 * 1. Existence in /admins/{uid} collection, OR
 * 2. Explicit role === 'admin' / isAdmin === true flag on /users/{uid} document.
 */
async function requireAdminAuth(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res);
  if (!user) {
    return null; // 401 response handled by requireAuth
  }

  try {
    const { db } = initFirebaseAdmin();

    // Check 1: Dedicated admin document in /admins/{uid}
    const adminDoc = await db.collection('admins').doc(user.uid).get();
    if (adminDoc.exists) {
      return { user, db };
    }

    // Check 2: Role flag on user record in /users/{uid}
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists) {
      const data = userDoc.data() || {};
      if (data.role === 'admin' || data.isAdmin === true) {
        return { user, db };
      }
    }

    // Fallback: Bootstrap admin email if set in environment
    const bootstrapAdmin = process.env.ADMIN_BOOTSTRAP_EMAIL;
    if (bootstrapAdmin && user.email && user.email.toLowerCase() === bootstrapAdmin.toLowerCase() && user.emailVerified) {
      return { user, db };
    }

    res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied: verified administrator privileges required.',
    });
    return null;
  } catch (error: any) {
    console.error('[API admin] Admin authorization check error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify administrative authorization boundary.',
    });
    return null;
  }
}

/**
 * Helper to record administrative audit log in Firestore.
 */
async function logAdminAction(
  db: FirebaseFirestore.Firestore,
  adminUser: { uid: string; email?: string },
  action: string,
  targetId: string,
  details?: Record<string, any>
) {
  try {
    await db.collection('adminAuditLogs').add({
      adminId: adminUser.uid,
      adminEmail: adminUser.email || 'unknown',
      action,
      targetId,
      details: details || {},
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.warn('[Admin Audit] Failed to record log entry:', err);
  }
}

/**
 * Handler: Update single user beta/trial access
 */
async function handleUpdateAccess(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const authCtx = await requireAdminAuth(req, res);
  if (!authCtx) return;

  const { user: adminUser, db } = authCtx;
  const body = await parseRequestBody(req);
  const { targetUserId, betaAccess, durationDays, isTrial } = body || {};

  if (!targetUserId || typeof targetUserId !== 'string') {
    return res.status(400).json({ error: 'Bad Request', message: 'targetUserId is required.' });
  }

  try {
    const userRef = db.collection('users').doc(targetUserId);
    const now = Date.now();

    if (betaAccess) {
      const betaAccessExpiresAt = durationDays ? now + durationDays * 24 * 60 * 60 * 1000 : null;
      await userRef.set(
        {
          betaAccess: true,
          betaAccessExpiresAt,
          betaGrantedAt: FieldValue.serverTimestamp(),
          isTrial: isTrial ?? (durationDays !== null && durationDays !== undefined && durationDays <= 15),
          onboardingCompleted: true,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      await logAdminAction(db, adminUser, 'update_beta_access_grant', targetUserId, {
        betaAccess: true,
        durationDays,
        betaAccessExpiresAt,
        isTrial,
      });

      return res.status(200).json({
        success: true,
        message: 'Beta access granted successfully.',
        targetUserId,
        betaAccess: true,
        betaAccessExpiresAt,
      });
    } else {
      await userRef.set(
        {
          betaAccess: false,
          betaAccessExpiresAt: null,
          isTrial: false,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      await logAdminAction(db, adminUser, 'update_beta_access_revoke', targetUserId, {
        betaAccess: false,
      });

      return res.status(200).json({
        success: true,
        message: 'Beta access revoked successfully.',
        targetUserId,
        betaAccess: false,
      });
    }
  } catch (error: any) {
    console.error('[API admin/update-access] Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message || 'Failed to update access.' });
  }
}

/**
 * Handler: Bulk update beta access
 */
async function handleBulkUpdateAccess(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const authCtx = await requireAdminAuth(req, res);
  if (!authCtx) return;

  const { user: adminUser, db } = authCtx;
  const body = await parseRequestBody(req);
  const { targetUserIds, betaAccess, durationDays, isTrial, referredBy } = body || {};

  if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) {
    return res.status(400).json({ error: 'Bad Request', message: 'targetUserIds array is required.' });
  }

  if (targetUserIds.length > 250) {
    return res.status(400).json({ error: 'Bad Request', message: 'Maximum 250 user IDs allowed per bulk request.' });
  }

  try {
    const now = Date.now();
    const betaAccessExpiresAt = betaAccess && durationDays ? now + durationDays * 24 * 60 * 60 * 1000 : null;

    const batch = db.batch();
    for (const userId of targetUserIds) {
      if (!userId || typeof userId !== 'string') continue;
      const userRef = db.collection('users').doc(userId);

      if (betaAccess) {
        batch.set(
          userRef,
          {
            betaAccess: true,
            betaAccessExpiresAt,
            betaGrantedAt: FieldValue.serverTimestamp(),
            isTrial: isTrial ?? (durationDays !== null && durationDays !== undefined && durationDays <= 15),
            onboardingCompleted: true,
            ...(referredBy ? { referredBy } : {}),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        batch.set(
          userRef,
          {
            betaAccess: false,
            betaAccessExpiresAt: null,
            isTrial: false,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

    await batch.commit();

    await logAdminAction(db, adminUser, 'bulk_update_beta_access', `count_${targetUserIds.length}`, {
      count: targetUserIds.length,
      betaAccess: Boolean(betaAccess),
      durationDays,
    });

    return res.status(200).json({
      success: true,
      message: `Bulk access update applied to ${targetUserIds.length} users.`,
      updatedCount: targetUserIds.length,
    });
  } catch (error: any) {
    console.error('[API admin/bulk-update-access] Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message || 'Failed bulk update.' });
  }
}

/**
 * Handler: Update user affiliate status
 */
async function handleUpdateAffiliate(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const authCtx = await requireAdminAuth(req, res);
  if (!authCtx) return;

  const { user: adminUser, db } = authCtx;
  const body = await parseRequestBody(req);
  const { targetUserId, isAffiliate, customCode } = body || {};

  if (!targetUserId || typeof targetUserId !== 'string') {
    return res.status(400).json({ error: 'Bad Request', message: 'targetUserId is required.' });
  }

  try {
    const userRef = db.collection('users').doc(targetUserId);
    const updateData: Record<string, any> = {
      isAffiliate: Boolean(isAffiliate),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isAffiliate) {
      updateData.affiliateCode = customCode || `affiliate_${targetUserId.slice(0, 6)}`;
    }

    await userRef.set(updateData, { merge: true });

    await logAdminAction(db, adminUser, 'update_affiliate_status', targetUserId, {
      isAffiliate: Boolean(isAffiliate),
      affiliateCode: updateData.affiliateCode,
    });

    return res.status(200).json({
      success: true,
      targetUserId,
      isAffiliate: Boolean(isAffiliate),
      affiliateCode: updateData.affiliateCode || null,
    });
  } catch (error: any) {
    console.error('[API admin/update-affiliate] Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message || 'Failed to update affiliate.' });
  }
}

/**
 * Handler: Delete user record
 */
async function handleDeleteUser(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const authCtx = await requireAdminAuth(req, res);
  if (!authCtx) return;

  const { user: adminUser, db } = authCtx;
  const body = await parseRequestBody(req);
  const { targetUserId } = body || {};

  if (!targetUserId || typeof targetUserId !== 'string') {
    return res.status(400).json({ error: 'Bad Request', message: 'targetUserId is required.' });
  }

  if (targetUserId === adminUser.uid) {
    return res.status(400).json({ error: 'Bad Request', message: 'Admin self-deletion is forbidden.' });
  }

  try {
    const userRef = db.collection('users').doc(targetUserId);
    await userRef.delete();

    await logAdminAction(db, adminUser, 'delete_user', targetUserId, {
      deletedAt: Date.now(),
    });

    return res.status(200).json({
      success: true,
      message: `User ${targetUserId} deleted successfully.`,
      deletedUserId: targetUserId,
    });
  } catch (error: any) {
    console.error('[API admin/delete-user] Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message || 'Failed to delete user.' });
  }
}

/**
 * Handler: Review payment submission (approve or reject)
 */
async function handleReviewPayment(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const authCtx = await requireAdminAuth(req, res);
  if (!authCtx) return;

  const { user: adminUser, db } = authCtx;
  const body = await parseRequestBody(req);
  const { paymentId, targetUserId, status, durationDays, rejectionNote } = body || {};

  if (!paymentId || !targetUserId || !status) {
    return res.status(400).json({ error: 'Bad Request', message: 'paymentId, targetUserId, and status are required.' });
  }

  if (status !== 'approved' && status !== 'rejected') {
    return res.status(400).json({ error: 'Bad Request', message: "status must be 'approved' or 'rejected'." });
  }

  try {
    const paymentRef = db.collection('payments').doc(paymentId);
    const userRef = db.collection('users').doc(targetUserId);

    if (status === 'approved') {
      const days = typeof durationDays === 'number' && durationDays > 0 ? durationDays : 90;
      const betaAccessExpiresAt = Date.now() + days * 24 * 60 * 60 * 1000;

      const batch = db.batch();
      batch.update(paymentRef, {
        status: 'approved',
        reviewedAt: FieldValue.serverTimestamp(),
        reviewedBy: adminUser.email || adminUser.uid,
      });

      batch.set(
        userRef,
        {
          paymentStatus: 'approved',
          betaAccess: true,
          betaAccessExpiresAt,
          betaGrantedAt: FieldValue.serverTimestamp(),
          isTrial: false,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();

      await logAdminAction(db, adminUser, 'payment_approved', paymentId, {
        targetUserId,
        durationDays: days,
      });

      return res.status(200).json({
        success: true,
        message: 'Payment approved and beta access granted.',
        paymentId,
        targetUserId,
        status: 'approved',
      });
    } else {
      const note = rejectionNote || 'Verification unsuccessful.';

      const batch = db.batch();
      batch.update(paymentRef, {
        status: 'rejected',
        rejectionNote: note,
        reviewedAt: FieldValue.serverTimestamp(),
        reviewedBy: adminUser.email || adminUser.uid,
      });

      batch.set(
        userRef,
        {
          paymentStatus: 'rejected',
          paymentRejectionNote: note,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();

      await logAdminAction(db, adminUser, 'payment_rejected', paymentId, {
        targetUserId,
        rejectionNote: note,
      });

      return res.status(200).json({
        success: true,
        message: 'Payment rejected.',
        paymentId,
        targetUserId,
        status: 'rejected',
      });
    }
  } catch (error: any) {
    console.error('[API admin/review-payment] Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message || 'Failed to review payment.' });
  }
}

/**
 * Handler: Serverless Vault Inspection
 * Replaces broken client-side impersonation. Allows verified administrators to securely inspect
 * candidate cloud profile data, progress, and study statistics directly from the server without
 * client auth collisions or local IndexedDB contamination.
 */
async function handleInspectVault(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authCtx = await requireAdminAuth(req, res);
  if (!authCtx) return;

  const { user: adminUser, db } = authCtx;
  const body = req.method === 'POST' ? await parseRequestBody(req) : {};
  const targetUserId = body?.targetUserId || req.query?.targetUserId || (Array.isArray(req.query?.userId) ? req.query?.userId[0] : req.query?.userId);

  if (!targetUserId || typeof targetUserId !== 'string') {
    return res.status(400).json({ error: 'Bad Request', message: 'targetUserId is required for vault inspection.' });
  }

  try {
    const userDoc = await db.collection('users').doc(targetUserId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Not Found', message: 'Candidate record does not exist in vault.' });
    }

    const userData = userDoc.data() || {};

    // Audit log this inspection to ensure non-repudiation
    await logAdminAction(db, adminUser, 'serverless_vault_inspection', targetUserId, {
      candidateEmail: userData.email,
    });

    return res.status(200).json({
      success: true,
      targetUserId,
      candidate: {
        id: userDoc.id,
        email: userData.email,
        displayName: userData.displayName,
        betaAccess: userData.betaAccess,
        betaAccessExpiresAt: userData.betaAccessExpiresAt,
        isTrial: userData.isTrial,
        referredBy: userData.referredBy,
        paymentStatus: userData.paymentStatus,
        createdAt: userData.createdAt,
        lastLoginAt: userData.lastLoginAt,
        isAffiliate: userData.isAffiliate,
        affiliateCode: userData.affiliateCode,
        totalStudyMinutes: userData.totalStudyMinutes || 0,
        completedTopics: userData.completedTopics || 0,
      },
      inspectedAt: Date.now(),
    });
  } catch (error: any) {
    console.error('[API admin/inspect-vault] Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message || 'Failed to inspect candidate vault.' });
  }
}

/**
 * Handler: Approve ambassador application and grant platform access & canonical code
 */
async function handleApproveAmbassador(req: VercelRequest, res: VercelResponse, parsedBody?: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const authCtx = await requireAdminAuth(req, res);
  if (!authCtx) return;

  const { user: adminUser, db } = authCtx;
  const body = parsedBody || (await parseRequestBody(req));
  const { applicationId, targetUserId } = body || {};

  if (!applicationId || !targetUserId) {
    return res.status(400).json({ error: 'Bad Request', message: 'applicationId and targetUserId are required.' });
  }

  try {
    const userRef = db.collection('users').doc(targetUserId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: 'Not Found', message: `User ${targetUserId} does not exist.` });
    }
    const userData = userSnap.data() || {};

    const appRef = db.collection('ambassador_applications').doc(applicationId);
    const appSnap = await appRef.get();
    if (!appSnap.exists) {
      return res.status(404).json({ error: 'Not Found', message: `Application ${applicationId} does not exist.` });
    }

    const ambassadorCode = `ambassador_${targetUserId.slice(0, 6)}`;
    const cleanCode = ambassadorCode.toUpperCase();

    // 1. Update Application status
    await appRef.set(
      {
        status: 'approved',
        reviewedAt: FieldValue.serverTimestamp(),
        reviewedBy: adminUser.uid,
        codeGranted: cleanCode,
      },
      { merge: true }
    );

    // 2. Create or ensure canonical partner record in /referral_codes/{cleanCode}
    const codeDocRef = db.collection('referral_codes').doc(cleanCode);
    const codeSnap = await codeDocRef.get();
    if (!codeSnap.exists) {
      await codeDocRef.set({
        code: cleanCode,
        type: 'ambassador',
        ownerUid: targetUserId,
        ownerEmail: userData.email || null,
        ownerDisplayName: userData.displayName || null,
        status: 'active',
        config: {
          refereeTrialDays: 15,
          referrerBonusDays: 0,
          maxClaims: null,
          allowDownstreamInvites: false,
        },
        stats: {
          totalClaims: 0,
          totalQualified: 0,
          totalConversions: 0,
          activeSeats: 0,
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      await codeDocRef.set(
        {
          status: 'active',
          type: 'ambassador',
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    // 3. Update user profile to grant full legitimate platform access
    await userRef.set(
      {
        isAffiliate: true,
        affiliateCode: ambassadorCode,
        betaAccess: true, // Fulfill promised platform access
        isTrial: false,   // Convert from temporary trial to full access
        betaAccessExpiresAt: null, // Full lifetime platform access
        paymentStatus: 'ambassador_grant',
        'attribution.isPartner': true,
        'attribution.partnerType': 'ambassador',
        'attribution.ownedCode': ambassadorCode,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 4. Log admin audit entry
    await logAdminAction(db, adminUser, 'approve_ambassador', targetUserId, {
      applicationId,
      ambassadorCode,
      userEmail: userData.email || null,
    });

    return res.status(200).json({
      success: true,
      message: `Ambassador approved successfully. Access granted with code ${ambassadorCode}.`,
      applicationId,
      targetUserId,
      ambassadorCode,
    });
  } catch (error: any) {
    console.error('[API admin/approve-ambassador] Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message || 'Failed to approve ambassador.' });
  }
}

/**
 * Handler: Reject ambassador application
 */
async function handleRejectAmbassador(req: VercelRequest, res: VercelResponse, parsedBody?: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const authCtx = await requireAdminAuth(req, res);
  if (!authCtx) return;

  const { user: adminUser, db } = authCtx;
  const body = parsedBody || (await parseRequestBody(req));
  const { applicationId } = body || {};

  if (!applicationId) {
    return res.status(400).json({ error: 'Bad Request', message: 'applicationId is required.' });
  }

  try {
    const appRef = db.collection('ambassador_applications').doc(applicationId);
    await appRef.set(
      {
        status: 'rejected',
        reviewedAt: FieldValue.serverTimestamp(),
        reviewedBy: adminUser.uid,
      },
      { merge: true }
    );

    await logAdminAction(db, adminUser, 'reject_ambassador', applicationId, {
      applicationId,
    });

    return res.status(200).json({
      success: true,
      message: 'Ambassador application rejected.',
      applicationId,
    });
  } catch (error: any) {
    console.error('[API admin/reject-ambassador] Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message || 'Failed to reject ambassador.' });
  }
}

/**
 * Main Vercel Serverless Function Router for /api/admin/*
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let body: any = null;
  if (req.method === 'POST') {
    body = await parseRequestBody(req);
    req.body = body;
  }

  let action = getAction(req);
  if ((action === 'action' || !action) && body?.action) {
    action = body.action;
  }

  switch (action) {
    case 'approve-ambassador':
      return handleApproveAmbassador(req, res, body);

    case 'reject-ambassador':
      return handleRejectAmbassador(req, res, body);

    case 'update-access':
      return handleUpdateAccess(req, res);

    case 'bulk-update-access':
      return handleBulkUpdateAccess(req, res);

    case 'update-affiliate':
      return handleUpdateAffiliate(req, res);

    case 'delete-user':
      return handleDeleteUser(req, res);

    case 'review-payment':
      return handleReviewPayment(req, res);

    case 'inspect-vault':
      return handleInspectVault(req, res);

    case 'health':
    case 'status':
    case '':
    case 'index':
    case 'root':
    case 'admin':
      if (req.method === 'GET') {
        return res.status(200).json({
          status: 'ok',
          service: 'admin-action-boundary',
          timestamp: Date.now(),
          supportedActions: [
            'approve-ambassador',
            'reject-ambassador',
            'update-access',
            'bulk-update-access',
            'update-affiliate',
            'delete-user',
            'review-payment',
            'inspect-vault',
            'health',
          ],
        });
      }
      return res.status(400).json({
        error: 'Bad Request',
        message: "Missing 'action' parameter. Specify the action in the URL path (/api/admin/[action]) or in the POST body.",
      });

    default:
      return res.status(404).json({
        error: 'Not Found',
        message: `Unknown admin action: '${action}'. Supported actions: approve-ambassador, reject-ambassador, update-access, bulk-update-access, update-affiliate, delete-user, review-payment, inspect-vault, health.`,
      });
  }
}
