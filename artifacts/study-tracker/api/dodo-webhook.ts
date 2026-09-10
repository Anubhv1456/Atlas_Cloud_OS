import type { IncomingMessage, ServerResponse } from 'http';
import { Webhook } from 'svix';
import { FieldValue } from 'firebase-admin/firestore';
import { initFirebaseAdmin } from '../src/lib/firebaseAdmin';

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
  const headers = req.headers as Record<string, string>;
  const wh = new Webhook(webhookSecret);
  let event: any;

  try {
    event = wh.verify(rawBody, {
      'webhook-id': headers['webhook-id'] || '',
      'webhook-timestamp': headers['webhook-timestamp'] || '',
      'webhook-signature': headers['webhook-signature'] || '',
    });
  } catch (err: any) {
    console.warn('Unauthorized Dodo Webhook rejected. Signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  // 3. Process Entitlement Grant on 'payment.succeeded' or 'checkout.session.completed'
  const eventType = event.type || event.event;

  if (eventType === 'payment.succeeded' || eventType === 'checkout.session.completed') {
    const paymentData = event.data || {};
    const metadata = paymentData.metadata || {};

    let userId = metadata.user_id || metadata.userId;
    const userEmail = metadata.user_email || metadata.userEmail || paymentData.customer?.email;
    const affiliateId = metadata.affiliate_id || metadata.affiliateId || paymentData.client_reference_id || null;
    const paymentId = paymentData.payment_id || paymentData.id || `dodo_${Date.now()}`;
    const amount = paymentData.total_amount ?? paymentData.amount ?? 4900;
    const currency = paymentData.currency || 'USD';

    const { db } = initFirebaseAdmin();

    // Fallback: If metadata is missing userId, look up user by verified email
    if (!userId && userEmail) {
      const userQuery = await db.collection('users').where('email', '==', userEmail).limit(1).get();
      if (!userQuery.empty) {
        userId = userQuery.docs[0].id;
      }
    }

    if (!userId) {
      console.error('Unable to map successful payment to a user ID. Payment payload:', paymentData);
      return res.status(200).json({ received: true, warning: 'No matching user ID resolved' });
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

    console.log(`[Dodo Webhook] Authoritative license granted for user: ${userId} (Payment: ${paymentId})`);
    return res.status(200).json({ received: true, userId, status: 'granted' });
  }

  // Acknowledge other event types idempotently
  return res.status(200).json({ received: true, eventType });
}
