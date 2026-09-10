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

    // 2. Fallback Path: Query Dodo Payments directly to prevent waiting on webhook
    const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!dodoApiKey) {
      return res.status(200).json({
        verified: false,
        hasAccess: false,
        message: 'Payment gateway configuration unavailable for direct lookup',
      });
    }

    const dodoMode = process.env.DODO_PAYMENTS_MODE === 'live' ? 'live_mode' : 'test_mode';
    const dodo = new DodoPayments({
      bearerToken: dodoApiKey,
      environment: dodoMode,
    });

    let verifiedPayment: any = null;

    // Check by paymentId if provided in request body or query
    const paymentId = (req.body?.paymentId || req.query?.paymentId) as string | undefined;
    if (paymentId && typeof paymentId === 'string') {
      try {
        const payment = await dodo.payments.retrieve(paymentId);
        if (payment && payment.status === 'succeeded') {
          // Strict IDOR ownership validation: Verify payment belongs to authenticated caller
          const matchesUid = payment.metadata?.user_id === user.uid || payment.metadata?.userId === user.uid;
          const matchesEmail = Boolean(user.email && payment.customer?.email?.toLowerCase() === user.email.toLowerCase());

          if (matchesUid || matchesEmail) {
            verifiedPayment = payment;
          } else {
            console.warn(`[Verify Payment] Payment ${paymentId} does not match caller UID (${user.uid}) or email (${user.email})`);
          }
        }
      } catch (e) {
        console.warn('[Verify Payment] Could not retrieve payment by ID:', paymentId, e);
      }
    }

    // If not found by paymentId, search recent payments list
    if (!verifiedPayment && user.email) {
      try {
        const paymentsList = await dodo.payments.list({
          status: 'succeeded',
          page_size: 15,
        });

        if (paymentsList && paymentsList.items && paymentsList.items.length > 0) {
          // Find payment matching user's UID in metadata or customer email
          const match = paymentsList.items.find((item: any) => {
            const matchesUid = item.metadata?.user_id === user.uid || item.metadata?.userId === user.uid;
            const matchesEmail = user.email && item.customer?.email?.toLowerCase() === user.email.toLowerCase();
            return matchesUid || matchesEmail;
          });

          if (match) {
            verifiedPayment = match;
          }
        }
      } catch (e) {
        console.warn('[Verify Payment] Could not search payments list:', e);
      }
    }

    // 3. Grant access immediately if verified
    if (verifiedPayment && verifiedPayment.status === 'succeeded') {
      await userDocRef.set(
        {
          betaAccess: true,
          paymentStatus: 'succeeded',
          paymentMethod: 'dodo_payments',
          dodoPaymentId: verifiedPayment.payment_id || verifiedPayment.id || `verified_${Date.now()}`,
          dodoAmount: verifiedPayment.total_amount ?? verifiedPayment.amount ?? 4900,
          currency: verifiedPayment.currency || 'USD',
          paidAt: new Date().toISOString(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.log(`[Verify Payment] Direct verification succeeded for user ${user.uid} (${user.email})`);

      return res.status(200).json({
        verified: true,
        hasAccess: true,
        paymentStatus: 'succeeded',
        source: 'dodo_direct',
      });
    }

    // 4. Return current unverified state
    return res.status(200).json({
      verified: false,
      hasAccess: false,
      message: 'No completed payment record found yet. Please allow a few moments if transaction is processing.',
    });
  } catch (error: any) {
    console.error('[Verify Payment Error]:', error);
    return res.status(500).json({
      error: 'Failed to verify payment status',
      message: error?.message,
    });
  }
}
