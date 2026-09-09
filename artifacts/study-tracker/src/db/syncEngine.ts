import { collection, doc, getDocs, setDoc, writeBatch, onSnapshot, arrayUnion } from 'firebase/firestore';
import { auth, firestoreDb } from '@/lib/firebase';
import { localDb } from './localDb';

class SyncEngine {
  private activeListeners: Record<string, () => void> = {};

  async initializeColdBoot() {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    // Check if we've done the initial load
    const meta = await localDb.sync_meta.get('initial_load_done');
    if (!meta) {
      console.log('Initiating Cold Boot Mega-Document Hydration...');
      
      const bucketCollections = [
        'history_buckets', 'scoreLogs_buckets', 'mistakeLogs_buckets'
      ];

      for (const collName of bucketCollections) {
        const querySnapshot = await getDocs(collection(firestoreDb, `users/${uid}/${collName}`));
        const allItems: any[] = [];
        
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.entries && Array.isArray(data.entries)) {
            allItems.push(...data.entries);
          }
        });

        // Insert into local Dexie
        const targetTable = collName.split('_')[0]; // e.g., 'history'
        if ((localDb as any)[targetTable] && allItems.length > 0) {
          await (localDb as any)[targetTable].bulkPut(allItems);
        }
      }

      await localDb.sync_meta.put({ id: 'initial_load_done', lastSyncTimestamp: Date.now() });
      console.log('Cold Boot Hydration Complete.');
    }

    this.startCurrentMonthListeners(uid);
    this.startMutationQueueWorker();
  }

  private startCurrentMonthListeners(uid: string) {
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const bucketCollections = [
      'history_buckets', 'scoreLogs_buckets', 'mistakeLogs_buckets'
    ];

    for (const collName of bucketCollections) {
      if (this.activeListeners[collName]) {
        this.activeListeners[collName](); // unsubscribe existing
      }

      const docRef = doc(firestoreDb, `users/${uid}/${collName}`, currentMonth);
      this.activeListeners[collName] = onSnapshot(docRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const targetTable = collName.split('_')[0];
          if (data.entries && Array.isArray(data.entries)) {
             await (localDb as any)[targetTable].bulkPut(data.entries);
          }
        }
      });
    }
  }

  private startMutationQueueWorker() {
    setInterval(async () => {
      if (!auth.currentUser || !navigator.onLine) return;
      const uid = auth.currentUser.uid;

      const pendingMutations = await localDb.mutation_queue.toArray();
      if (pendingMutations.length === 0) return;

      const batch = writeBatch(firestoreDb);
      const bucketsToUpdate: Record<string, any[]> = {};

      for (const mut of pendingMutations) {
        const bucketPath = `users/${uid}/${mut.collectionName}_buckets/${mut.bucketMonth}`;
        if (!bucketsToUpdate[bucketPath]) {
          bucketsToUpdate[bucketPath] = [];
        }
        bucketsToUpdate[bucketPath].push(mut.payload);
      }

      for (const [path, items] of Object.entries(bucketsToUpdate)) {
        const docRef = doc(firestoreDb, ...path.split('/') as [any, any, any, any]);
        batch.set(docRef, { 
          month: path.split('/').pop(),
          entries: arrayUnion(...items),
          updatedAt: Date.now()
        }, { merge: true });
      }

      try {
        await batch.commit();
        const idsToDelete = pendingMutations.map(m => m.id!);
        await localDb.mutation_queue.bulkDelete(idsToDelete);
        console.log(`Synced ${pendingMutations.length} queued actions.`);
      } catch (err) {
        console.error('Failed to sync mutations:', err);
      }
    }, 10000); // Check every 10 seconds
  }
}

export const syncEngine = new SyncEngine();
