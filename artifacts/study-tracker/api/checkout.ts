import type { IncomingMessage, ServerResponse } from 'http';
import DodoPayments from 'dodopayments';
import { initFirebaseAdmin } from '../src/lib/firebaseAdmin.js';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Authenticate Request via Firebase Bearer ID Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or malformed Authorization header' });
    }

    const idToken = authHeader.split('Bearer ')[1].trim();
    const { auth } = initFirebaseAdmin();

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (authError: any) {
      console.error('Firebase ID token verification failed:', authError.message);
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }

    const userId = decodedToken.uid;
    const userEmail = decodedToken.email || '';
    
    // Parse body if stream (for local Vite dev) or if pre-parsed (Vercel)
    let body = req.body;
    if (!body) {
      let rawBody = '';
      for await (const chunk of req) {
        rawBody += chunk;
      }
      try {
        body = JSON.parse(rawBody);
      } catch (e) {
        body = {};
      }
    } else if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    const affiliateId = typeof body?.affiliateId === 'string' ? body.affiliateId : '';

    // 2. Read Environment Config
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    const productId = process.env.DODO_PRODUCT_ID || 'pdt_0NnHQoRe1CBPJFbKEmD0t';
    const rawEnv = process.env.DODO_PAYMENTS_ENVIRONMENT;
    const environment: 'test_mode' | 'live_mode' = rawEnv === 'live_mode' ? 'live_mode' : 'test_mode';
    const appUrl = process.env.APP_URL || 'https://atlasmedic.vercel.app';

    if (!apiKey) {
      console.error('Dodo Payments API Key is missing in environment variables');
      return res.status(500).json({ error: 'Payment gateway configuration error' });
    }

    // 3. Initialize Dodo Payments Client
    const dodo = new DodoPayments({
      bearerToken: apiKey,
      environment,
    });

    // 4. Create Server-Authoritative Dodo Checkout Session
    const session = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      customer: {
        email: userEmail,
      },
      metadata: {
        user_id: userId,
        user_email: userEmail,
        affiliate_id: affiliateId,
        platform: 'atlas_web',
      },
      return_url: `${appUrl}/?payment=success`,
      cancel_url: `${appUrl}/?payment=cancelled`,
    });

    if (!session.checkout_url) {
      throw new Error('Dodo Payments API did not return a valid checkout_url');
    }

    return res.status(200).json({
      checkout_url: session.checkout_url,
      session_id: session.session_id,
    });
  } catch (error: any) {
    console.error('Failed to create Dodo Checkout Session:', error);
    return res.status(500).json({
      error: 'Failed to initiate checkout session',
      message: error?.message || 'Internal Server Error',
    });
  }
}
