import type { VercelRequest, VercelResponse } from '@vercel/node';
import firebaseConfig from '../../src/firebase-applet-config.json' with { type: 'json' };

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
}

/**
 * Extracts and verifies the Firebase Auth ID Token from the Authorization header.
 * Uses Firebase Identity Toolkit REST API for lightweight, zero-dependency token validation.
 */
export async function verifyAuthToken(req: VercelRequest): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  const idToken = parts[1].trim();
  if (!idToken) {
    return null;
  }

  const apiKey = process.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey;
  if (!apiKey) {
    console.error('[Auth Middleware] Firebase API Key is missing');
    return null;
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn('[Auth Middleware] Token validation failed:', errData);
      return null;
    }

    const data = await res.json();
    if (!data.users || data.users.length === 0) {
      return null;
    }

    const user = data.users[0];
    return {
      uid: user.localId,
      email: user.email,
      emailVerified: user.emailVerified,
    };
  } catch (error) {
    console.error('[Auth Middleware] Error verifying token:', error);
    return null;
  }
}

/**
 * Standard HTTP helper to require auth on Vercel API routes
 */
export async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<AuthenticatedUser | null> {
  const user = await verifyAuthToken(req);
  if (!user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'A valid Firebase Authorization Bearer token is required to access this endpoint.',
    });
    return null;
  }
  return user;
}
