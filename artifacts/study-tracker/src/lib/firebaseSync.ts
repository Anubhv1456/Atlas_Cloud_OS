import { db as dexieDb } from '@/db/schema';
import { doc, getDoc, setDoc, getDocFromServer } from 'firebase/firestore';
import { firestoreDb as db, auth } from '@/lib/firebase';
import { toast } from 'sonner';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

export async function exportLocalData() {
  const data: any = {};
  await dexieDb.transaction('r', dexieDb.subjects, dexieDb.systems, dexieDb.history, dexieDb.pyqYears, dexieDb.scoreLogs, dexieDb.uiPreferences, async () => {
    data.subjects = await dexieDb.subjects.toArray();
    data.systems = await dexieDb.systems.toArray();
    data.history = await dexieDb.history.toArray();
    data.pyqYears = await dexieDb.pyqYears.toArray();
    data.scoreLogs = await dexieDb.scoreLogs.toArray();
    data.uiPreferences = await dexieDb.uiPreferences.toArray();
  });
  return JSON.stringify(data);
}

export async function importLocalData(jsonString: string) {
  const data = JSON.parse(jsonString);
  await dexieDb.transaction('rw', dexieDb.subjects, dexieDb.systems, dexieDb.history, dexieDb.pyqYears, dexieDb.scoreLogs, dexieDb.uiPreferences, async () => {
    if (data.subjects) await dexieDb.subjects.bulkPut(data.subjects);
    if (data.systems) await dexieDb.systems.bulkPut(data.systems);
    if (data.history) await dexieDb.history.bulkPut(data.history);
    if (data.pyqYears) await dexieDb.pyqYears.bulkPut(data.pyqYears);
    if (data.scoreLogs) await dexieDb.scoreLogs.bulkPut(data.scoreLogs);
    if (data.uiPreferences) await dexieDb.uiPreferences.bulkPut(data.uiPreferences);
  });
}

export async function syncToFirebase() {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  const path = `users/${userId}`;
  try {
    const jsonString = await exportLocalData();
    await setDoc(doc(db, 'users', userId), {
      userId,
      email: auth.currentUser.email,
      displayName: auth.currentUser.displayName,
      lastSyncedAt: Date.now(),
      data: jsonString
    }, { merge: true });
    localStorage.setItem('lastCloudSync', Date.now().toString());
  } catch (error) {
    console.error('Firebase sync failed', error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncFromFirebase() {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  const path = `users/${userId}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (docSnap.exists()) {
      const fbData = docSnap.data();
      if (fbData && fbData.data) {
        await importLocalData(fbData.data);
        localStorage.setItem('lastCloudSync', fbData.lastSyncedAt.toString());
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Firebase fetch failed', error);
    handleFirestoreError(error, OperationType.GET, path);
  }
}

