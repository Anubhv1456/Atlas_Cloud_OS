import { getDocFromCache, getDocFromServer, type DocumentReference, type DocumentSnapshot } from 'firebase/firestore';

/**
 * Cache-First Firestore Document Reader
 * 
 * Attempts to retrieve the document from the IndexedDB offline cache first (0 billable reads).
 * Falls back cleanly to getDocFromServer if the document is not yet present in cache or client is initial load.
 */
export async function getCachedDoc(docRef: DocumentReference): Promise<DocumentSnapshot> {
  try {
    const snap = await getDocFromCache(docRef);
    if (snap.exists()) {
      return snap;
    }
  } catch {
    // Cache miss or offline cache not ready - fall through to server fetch
  }

  return await getDocFromServer(docRef);
}
