import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;
let adminDb: Firestore | undefined;

function formatPrivateKey(key?: string): string | undefined {
  if (!key) return undefined;
  // Remove wrapping quotes if present
  let formatted = key.trim();
  if ((formatted.startsWith('"') && formatted.endsWith('"')) || (formatted.startsWith("'") && formatted.endsWith("'"))) {
    formatted = formatted.slice(1, -1);
  }
  // Replace literal \n with real newlines
  formatted = formatted.replace(/\\n/g, '\n');
  return formatted;
}

export function initFirebaseAdmin(): { db: Firestore } {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'atlas-cloud-6f1c6';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@atlas-cloud-6f1c6.iam.gserviceaccount.com';
    const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'Missing Firebase Admin credentials in environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).'
      );
    }

    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    adminApp = getApps()[0];
  }

  if (!adminDb) {
    adminDb = getFirestore(adminApp);
  }

  return { db: adminDb };
}
