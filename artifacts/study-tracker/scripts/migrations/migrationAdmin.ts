import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { firestoreDb } from '@/lib/firebase';

export async function migrateUserToBuckets(uid: string) {
  console.log(`Starting migration for ${uid}...`);
  const collectionsToMigrate = ['history', 'scoreLogs', 'mistakeLogs', 'pyqYears', 'topicProgress'];

  for (const collName of collectionsToMigrate) {
    const flatRef = collection(firestoreDb, `users/${uid}/${collName}`);
    const snapshot = await getDocs(flatRef);
    
    if (snapshot.empty) continue;

    const buckets: Record<string, any[]> = {};

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      // Determine the bucket month (YYYY-MM)
      let dateField = data.completedAt || data.timestamp || data.createdAt || data.lastStudiedAt || data.updatedAt;
      let monthKey = 'unknown';
      if (dateField) {
        let d = dateField.toDate ? dateField.toDate() : new Date(dateField);
        if (isNaN(d.getTime())) d = new Date();
        monthKey = d.toISOString().substring(0, 7);
      } else {
        monthKey = new Date().toISOString().substring(0, 7);
      }

      if (!buckets[monthKey]) buckets[monthKey] = [];
      buckets[monthKey].push({ ...data, id: isNaN(Number(docSnap.id)) ? docSnap.id : Number(docSnap.id) });
    });

    for (const [month, entries] of Object.entries(buckets)) {
      const bucketRef = doc(firestoreDb, `users/${uid}/${collName}_buckets`, month);
      await setDoc(bucketRef, {
        month,
        entries,
        updatedAt: Date.now(),
        entryCount: entries.length
      }, { merge: true });
    }
    console.log(`Migrated ${snapshot.size} items in ${collName} into ${Object.keys(buckets).length} buckets.`);
  }
  
  console.log(`Migration complete for ${uid}.`);
}
