import { db as dexieDb } from '@/db/schema';
import { doc, getDoc, setDoc, getDocFromServer, collection, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { firestoreDb as db, auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { generateHLC, updateHLC } from '@/lib/hlc';

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
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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

const COLLECTIONS = [
  'subjects', 'systems', 'history', 'pyqYears', 'scoreLogs', 'uiPreferences', 'topicProgress',
  'curriculumSets', 'revisionSets'
];

export async function syncToFirebase() {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  const lastSyncHlc = localStorage.getItem('lastCloudSyncHlc') || '';
  
  try {
    let currentHlc = generateHLC();
    let writes = 0;
    
    const recordsToSync: any[] = [];
    
    await dexieDb.transaction('r', COLLECTIONS.map(c => dexieDb.table(c)), async () => {
      for (const colName of COLLECTIONS) {
        const table = dexieDb.table(colName);
        let updatedRecords;
        if (lastSyncHlc) {
            updatedRecords = await table.filter(r => r.hlc && r.hlc > lastSyncHlc).toArray();
        } else {
            updatedRecords = await table.toArray();
        }
        for (const record of updatedRecords) {
           recordsToSync.push({ colName, record });
        }
      }
    });

    let batch = writeBatch(db);
    let batchCount = 0;
    
    for (const { colName, record } of recordsToSync) {
      // Identify primary key
      const docId = String(record.topicId || record.id || record.entityId || generateHLC());
      const docRef = doc(db, `users/${userId}/${colName}`, docId);
      batch.set(docRef, record, { merge: true });
      batchCount++;
      writes++;
      
      if (batchCount === 450) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
      }
    }
    
    if (batchCount > 0) {
        await batch.commit();
    }

    if (writes > 0) {
      await setDoc(doc(db, 'users', userId), { 
         lastSyncedAt: Date.now(), 
         lastSyncHlc: currentHlc,
        email: auth.currentUser.email
      }, { merge: true });
    }
    
    localStorage.setItem('lastCloudSyncHlc', currentHlc);
  } catch (error) {
    console.error('Firebase sync To failed', error);
  }
}
export async function syncFromFirebase() {
  if (!auth.currentUser) return false;
  const userId = auth.currentUser.uid;
  const lastSyncHlc = localStorage.getItem('lastCloudSyncHlc') || '';
  
  try {
    const userDocSnap = await getDoc(doc(db, 'users', userId));
    if (!userDocSnap.exists()) return false;
    
    let hasUpdates = false;
    let maxHlc = lastSyncHlc;

    for (const colName of COLLECTIONS) {
      let q = collection(db, `users/${userId}/${colName}`);
      let colQuery = lastSyncHlc ? query(q, where('hlc', '>', lastSyncHlc)) : q;
      
      const snap = await getDocs(colQuery);
      if (!snap.empty) {
        hasUpdates = true;
        const records = snap.docs.map(d => {
          const data = d.data();
          // Convert Firestore Timestamps to Dates
          for (const key in data) {
            if (data[key] && typeof data[key] === 'object' && 'toDate' in data[key]) {
              data[key] = data[key].toDate();
            }
          }
          return data;
        });
        await dexieDb.table(colName).bulkPut(records);
        
        for (const r of records) {
          if (r.hlc && r.hlc > maxHlc) {
            maxHlc = r.hlc;
            updateHLC(r.hlc);
          }
        }
      }
    }
    
    if (hasUpdates) {
      localStorage.setItem('lastCloudSyncHlc', maxHlc);
    }
    return hasUpdates;
  } catch (error) {
    console.error('Firebase sync From failed', error);
    return false;
  }
}

export async function exportLocalData() {
    return "{}"; // Legacy compatibility
}
export async function importLocalData(json: string) {
    // Legacy compatibility
}
