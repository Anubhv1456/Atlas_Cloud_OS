import type { IncomingMessage, ServerResponse } from 'http';
import { Webhook } from 'svix';
import { FieldValue } from 'firebase-admin/firestore';
import { initFirebaseAdmin } from './_lib/firebaseAdmin.js';

interface VercelRequest extends IncomingMessage {
  body?: any;
  query?: Record<string, string | string[]>;
  cookies?: Record<string, string>;
}

interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse;
  json: (body: any) => VercelResponse;
  send: (body: any) => VercelResponse;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: VercelRequest): Promise<string> {
  if (req.body) {
    if (typeof req.body === 'string') return req.body;
    if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
    if (typeof req.body === 'object') return JSON.stringify(req.body);
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('DODO_WEBHOOK_SECRET is not configured on server');
    return res.status(500).json({ error: 'Server webhook configuration error' });
  }

  // 1. Read Raw Body
  let rawBody: string;
  try {
    rawBody = await getRawBody(req);
  } catch (err) {
    console.error('Failed to read raw request body:', err);
    return res.status(400).json({ error: 'Failed to read request body' });
  }

  // 2. Cryptographic Signature Verification using Svix/Standard Webhook Spec
  const headers = (req.headers || {}) as Record<string, string>;
  const wh = new Webhook(webhookSecret);
  
  const webhookId = (headers['webhook-id'] || headers['svix-id'] || '') as string;
  const webhookTimestamp = (headers['webhook-timestamp'] || headers['svix-timestamp'] || '') as string;
  const webhookSignature = (headers['webhook-signature'] || headers['svix-signature'] || '') as string;

  try {
    wh.verify(rawBody, {
      'webhook-id': webhookId,
      'webhook-timestamp': webhookTimestamp,
      'webhook-signature': webhookSignature,
    });
  } catch (err: any) {
    console.warn('Unauthorized Dodo Webhook rejected. Signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  // Explicitly parse verified payload (Svix returns void)
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    console.error('Failed to parse webhook JSON payload:', err);
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  try {
    const eventType = event.type || event.event;
    const { db } = initFirebaseAdmin();

    // ============================================
    // 1. Grants: Handle Payment Successful States
    // ============================================
    if (eventType === 'payment.succeeded' || eventType === 'checkout.session.completed') {
      const paymentData = event.data || {};
      const metadata = paymentData.metadata || {};

      let userId = metadata.user_id || metadata.userId;
      const userEmail = metadata.user_email || metadata.userEmail || paymentData.customer?.email;
      const affiliateId = metadata.affiliate_id || metadata.affiliateId || paymentData.client_reference_id || null;
      const paymentId = paymentData.payment_id || paymentData.id || `dodo_${Date.now()}`;
      const amount = paymentData.total_amount ?? paymentData.amount ?? 4900;
      const currency = paymentData.currency || 'USD';

      // Idempotency check: Skip mutation if payment was already fulfilled
      const existingPayment = await db.collection('processed_payments').doc(paymentId).get();
      if (existingPayment.exists) {
        console.log(`[Dodo Webhook] Payment ${paymentId} already processed. Acknowledging event idempotently.`);
        return res.status(200).json({ received: true, status: 'already_processed' });
      }

      // Fallback: If metadata is missing userId, look up user by verified email
      if (!userId && userEmail) {
        const userQuery = await db.collection('users').where('email', '==', userEmail).limit(1).get();
        if (!userQuery.empty) {
          userId = userQuery.docs[0].id;
        }
      }

      if (!userId) {
        console.error('Unable to map successful payment to a user ID. Payment payload:', paymentData);
        // Record in unmatched_payments so funds are never unaccounted for
        await db.collection('unmatched_payments').doc(paymentId).set({
          paymentId,
          amount,
          currency,
          customerEmail: userEmail || null,
          metadata,
          rawPayload: paymentData,
          createdAt: FieldValue.serverTimestamp(),
          status: 'pending_manual_resolution',
        }, { merge: true });

        return res.status(200).json({ received: true, warning: 'No matching user ID resolved; logged to unmatched_payments' });
      }

      // 4. Atomic Authoritative Firestore Mutation
      await db.collection('users').doc(userId).set(
        {
          betaAccess: true,
          paymentStatus: 'succeeded',
          paymentMethod: 'dodo_payments',
          dodoPaymentId: paymentId,
          dodoAmount: amount,
          currency,
          referredBy: affiliateId,
          paidAt: new Date().toISOString(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Also record in processed_payments for audit & idempotency
      await db.collection('processed_payments').doc(paymentId).set(
        {
          paymentId,
          userId,
          amount,
          currency,
          eventType,
          processedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.log(`[Dodo Webhook] Authoritative license granted for user: ${userId} (Payment: ${paymentId})`);
      return res.status(200).json({ received: true, userId, status: 'granted' });
    }

    // ============================================
    // 2. Revocations: Handle Refunds and Disputes
    // ============================================
    if (eventType === 'payment.refunded' || eventType === 'payment.disputed' || eventType === 'subscription.cancelled') {
      const paymentData = event.data || {};
      const metadata = paymentData.metadata || {};

      let userId = metadata.user_id || metadata.userId;
      const userEmail = metadata.user_email || metadata.userEmail || paymentData.customer?.email;
      const paymentId = paymentData.payment_id || paymentData.id || `dodo_revoke_${Date.now()}`;
      
      if (!userId && userEmail) {
        const userQuery = await db.collection('users').where('email', '==', userEmail).limit(1).get();
        if (!userQuery.empty) userId = userQuery.docs[0].id;
      }

      if (userId) {
        await db.collection('users').doc(userId).set({
          betaAccess: false,
          hasPaidAccess: false,
          licenseRevoked: true,
          revokedAt: FieldValue.serverTimestamp(),
          paymentStatus: eventType === 'payment.refunded' ? 'refunded' : (eventType === 'payment.disputed' ? 'disputed' : 'cancelled'),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        
        await db.collection('processed_payments').doc(paymentId).set(
           { paymentId, userId, eventType, processedAt: FieldValue.serverTimestamp() }, 
           { merge: true }
        );

        console.log(`[Dodo Webhook] Revoked license for user: ${userId} due to ${eventType}`);
        return res.status(200).json({ received: true, userId, status: 'revoked' });
      }
    }

    // Acknowledge other event types idempotently
    return res.status(200).json({ received: true, eventType });
  } catch (err: any) {
    console.error('[Dodo Webhook Error] Failed to process webhook event:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
