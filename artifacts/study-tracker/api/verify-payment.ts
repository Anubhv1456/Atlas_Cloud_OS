import DodoPayments from 'dodopayments';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth, type VercelRequest, type VercelResponse } from './_lib/auth.js';
import { initFirebaseAdmin } from './_lib/firebaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) {
    return; // 401 response already sent by requireAuth
  }

  try {
    const { db } = initFirebaseAdmin();
    const userDocRef = db.collection('users').doc(user.uid);
    const userDocSnap = await userDocRef.get();

    // 1. Fast Path: User is already marked as having access in Firestore
    if (userDocSnap.exists) {
      const userData = userDocSnap.data() || {};
      if (userData.betaAccess === true) {
        return res.status(200).json({
          verified: true,
          hasAccess: true,
          paymentStatus: userData.paymentStatus || 'succeeded',
          source: 'firestore',
        });
      }
    }

    // Extract paymentId from request body or query
    const paymentId = (req.body?.paymentId || req.query?.paymentId) as string | undefined;
    if (!paymentId || typeof paymentId !== 'string') {
      return res.status(400).json({
        verified: false,
        hasAccess: false,
        error: 'Bad Request',
        message: 'paymentId is required for payment verification',
      });
    }

    // 2. Query Dodo Payments directly
    const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!dodoApiKey) {
      return res.status(500).json({
        verified: false,
        hasAccess: false,
        error: 'Configuration Error',
        message: 'Payment gateway configuration unavailable for direct lookup',
      });
    }

    const dodoMode = process.env.DODO_PAYMENTS_MODE === 'live' ? 'live_mode' : 'test_mode';
    const dodo = new DodoPayments({
      bearerToken: dodoApiKey,
      environment: dodoMode,
    });

    let payment: any = null;
    try {
      payment = await dodo.payments.retrieve(paymentId);
    } catch (e: any) {
      console.warn('[Verify Payment] Could not retrieve payment by ID:', paymentId, e);
      return res.status(404).json({
        verified: false,
        hasAccess: false,
        error: 'Payment Not Found',
        message: `Could not retrieve payment details for paymentId: ${paymentId}`,
      });
    }

    if (!payment || payment.status !== 'succeeded') {
      return res.status(400).json({
        verified: false,
        hasAccess: false,
        error: 'Payment Not Completed',
        message: 'The transaction is not in a completed/succeeded state',
      });
    }

    // Strict IDOR ownership validation: Verify payment belongs to authenticated caller via metadata
    const matchesUid = payment.metadata?.user_id === user.uid || payment.metadata?.userId === user.uid;
    if (!matchesUid) {
      console.warn(`[Verify Payment] Payment IDOR detected: Payment ${paymentId} does not match caller UID (${user.uid})`);
      return res.status(403).json({
        verified: false,
        hasAccess: false,
        error: 'Forbidden',
        message: 'Payment verification failed. This transaction does not belong to your account metadata.',
      });
    }

    // 3. Document-Level Idempotency Guard (Transaction)
    const processedPaymentRef = db.collection('processed_payments').doc(paymentId);

    const result = await db.runTransaction(async (transaction) => {
      const processedSnap = await transaction.get(processedPaymentRef);
      if (processedSnap.exists) {
        const existingData = processedSnap.data() || {};
        if (existingData.userId !== user.uid) {
          throw {
            status: 409,
            message: 'This transaction has already been claimed by another account.',
          };
        }
        // Already claimed by this user - return early
        return {
          verified: true,
          hasAccess: true,
          paymentStatus: 'succeeded',
          source: 'dodo_direct_idempotent',
        };
      }

      const amount = payment.total_amount ?? payment.amount ?? 4900;
      const currency = payment.currency || 'USD';

      // Atomic State Commits
      transaction.set(userDocRef, {
        betaAccess: true,
        paymentStatus: 'succeeded',
        paymentMethod: 'dodo_payments',
        dodoPaymentId: paymentId,
        dodoAmount: amount,
        currency,
        paidAt: new Date().toISOString(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      transaction.set(processedPaymentRef, {
        paymentId,
        userId: user.uid,
        amount,
        currency,
        source: 'verify_payment_direct',
        customerEmail: payment.customer?.email || user.email || null,
        claimedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      return {
        verified: true,
        hasAccess: true,
        paymentStatus: 'succeeded',
        source: 'dodo_direct',
      };
    });

    return res.status(200).json(result);

  } catch (error: any) {
    console.error('[Verify Payment Error]:', error);
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      error: error.message || 'Failed to verify payment status',
    });
  }
}
