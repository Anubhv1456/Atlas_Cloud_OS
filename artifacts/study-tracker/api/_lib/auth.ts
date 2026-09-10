export interface AuthenticatedUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
}

const DEFAULT_FIREBASE_API_KEY = 'AIzaSyB23xBbSVe1eehDAiyUSz_HOvKyPdfxytM';

/**
 * Extracts and verifies the Firebase Auth ID Token from the Authorization header.
 * Uses Firebase Identity Toolkit REST API for lightweight, zero-dependency token validation.
 * Compatible with standard Node.js IncomingMessage, Express, and VercelRequest.
 */
export async function verifyAuthToken(req: { headers: Record<string, string | string[] | undefined> }): Promise<AuthenticatedUser | null> {
  const rawAuth = req.headers?.authorization || req.headers?.Authorization;
  const authHeader = Array.isArray(rawAuth) ? rawAuth[0] : rawAuth;

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

  const apiKey =
    process.env.VITE_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    DEFAULT_FIREBASE_API_KEY;

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

    const data = (await res.json()) as {
      users?: Array<{
        localId: string;
        email?: string;
        emailVerified?: boolean;
      }>;
    };
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

export interface VercelRequest {
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: any;
  method?: string;
}

export interface VercelResponse {
  status: (statusCode: number) => VercelResponse;
  json: (body: any) => any;
  setHeader: (name: string, value: string) => any;
  end: () => any;
}

export type ApiRequest = VercelRequest;
export type ApiResponse = VercelResponse;

/**
 * Standard HTTP helper to require auth on Vercel API routes
 */
export async function requireAuth(req: ApiRequest, res: ApiResponse): Promise<AuthenticatedUser | null> {
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

export function setCorsHeaders(res: ApiResponse): void {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}

export async function parseRequestBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  try {
    let rawBody = '';
    for await (const chunk of req) {
      rawBody += chunk;
    }
    return rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return {};
  }
}
