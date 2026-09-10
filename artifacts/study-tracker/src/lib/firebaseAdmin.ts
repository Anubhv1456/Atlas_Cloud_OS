import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

let adminApp: App | undefined;
let adminDb: Firestore | undefined;
let adminAuth: Auth | undefined;

export function initFirebaseAdmin(): { db: Firestore; auth: Auth } {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'atlas-cloud-6f1c6';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@atlas-cloud-6f1c6.iam.gserviceaccount.com';
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
    const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, '\n') : undefined;

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
  if (!adminAuth) {
    adminAuth = getAuth(adminApp);
  }

  return { db: adminDb, auth: adminAuth };
}
