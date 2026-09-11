import { compressSync, decompressSync, strToU8, strFromU8 } from 'fflate';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestoreDb } from '@/lib/firebase';
import { localDb } from './localDb';
import { db } from './schema';

class SyncEngine {
  public isSyncing = false;
  public isColdBootComplete = false;
  private resolveColdBoot!: () => void;
  public coldBootPromise: Promise<void>;

  constructor() {
    this.coldBootPromise = new Promise<void>((resolve) => {
      this.resolveColdBoot = () => {
        this.isColdBootComplete = true;
        resolve();
      };
    });
  }

  /**
   * Captures a local snapshot of all active tables and stores it inside the rolling 4-slot database
   */
  async captureLocalSnapshot() {
    try {
      const tablesToCapture = [
        'subjects', 'systems', 'history', 'pyqYears', 'scoreLogs',
        'uiPreferences', 'topicProgress', 'curriculumSets', 'revisionSets',
        'mistakeLogs', 'recommendationSkips', 'operationalModes'
      ];

      const snapshotPayload: Record<string, any[]> = {};
      for (const tableName of tablesToCapture) {
        const localTable = (localDb as any)[tableName];
        if (localTable) {
          snapshotPayload[tableName] = await localTable.toArray();
        }
      }

      const serialized = JSON.stringify(snapshotPayload);
      const timestamp = Date.now();

      // Query existing snapshots
      const snapshots = await localDb.local_snapshots.toArray();
      if (snapshots.length < 4) {
        await localDb.local_snapshots.add({
          timestamp,
          version: 1,
          payload: serialized
        });
      } else {
        // Find oldest snapshot
        const oldest = snapshots.reduce((oldestAcc, current) => {
          return current.timestamp < oldestAcc.timestamp ? current : oldestAcc;
        }, snapshots[0]);

        if (oldest.id !== undefined) {
          await localDb.local_snapshots.update(oldest.id, {
            timestamp,
            payload: serialized
          });
        }
      }

      await localDb.sync_meta.put({
        id: 'last_snapshot_timestamp',
        lastSyncTimestamp: timestamp
      });

      console.log('Rolling 6-hourly snapshot captured successfully.');
    } catch (err) {
      console.error('Failed to capture local snapshot:', err);
    }
  }

  /**
   * Run background non-blocking check for 6-hourly snapshot
   */
  async checkAndTriggerSnapshot() {
    const meta = await localDb.sync_meta.get('last_snapshot_timestamp');
    const lastTimestamp = meta ? meta.lastSyncTimestamp : 0;
    const now = Date.now();
    const sixHoursMs = 21600000; // 6 hours

    if (now - lastTimestamp >= sixHoursMs) {
      await this.captureLocalSnapshot();
    }
  }

  /**
   * Serializes active clinical tables into a single JSON payload and writes to Firestore.
   */
  async pushLocalBackupToFirestore(uid: string) {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      const tablesToBackup = [
        'subjects', 'systems', 'history', 'pyqYears', 'scoreLogs',
        'uiPreferences', 'topicProgress', 'curriculumSets', 'revisionSets',
        'mistakeLogs', 'recommendationSkips', 'operationalModes'
      ];

      const backupPayload: Record<string, any[]> = {};
      let totalRecords = 0;
      for (const tableName of tablesToBackup) {
        const localTable = (localDb as any)[tableName];
        if (localTable) {
          const list = await localTable.toArray();
          backupPayload[tableName] = list;
          totalRecords += list.length;
        }
      }

      const serialized = JSON.stringify(backupPayload);
      
      const uint8 = strToU8(serialized);
      const compressedUint8 = compressSync(uint8, { level: 6 });
      let binaryString = '';
      for (let i = 0; i < compressedUint8.length; i++) {
        binaryString += String.fromCharCode(compressedUint8[i]);
      }
      const base64Data = btoa(binaryString);

      // Write entire backup to a single document location in Firestore
      const docRef = doc(firestoreDb, `users/${uid}/vaultBackup`, 'latest');
      await setDoc(docRef, {
        version: 2,
        compressed: true,
        encoding: 'base64',
        data: base64Data,
        updatedAt: serverTimestamp(),
        itemCount: totalRecords
      });

      const now = Date.now();
      await localDb.sync_meta.put({
        id: 'last_cloud_sync_timestamp',
        lastSyncTimestamp: now
      });

      console.log(`Successfully backed up ${totalRecords} items in a single-blob.`);
    } catch (err) {
      console.error('Failed to push single-blob local backup to Firestore:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Restores tables from the single-blob remote backup into local Dexie.
   */
  async pullRemoteBackupFromFirestore(uid: string) {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      const docRef = doc(firestoreDb, `users/${uid}/vaultBackup`, 'latest');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const docData = docSnap.data();
        if (docData && docData.data) {
          let parsed;
          if (docData.compressed && docData.encoding === 'base64') {
            const binaryString = atob(docData.data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const decompressedUint8 = decompressSync(bytes);
            const jsonStr = strFromU8(decompressedUint8);
            parsed = JSON.parse(jsonStr);
          } else {
            parsed = JSON.parse(docData.data);
          }
          
          // Fast bulkPut inside IndexedDB
          for (const tableName of Object.keys(parsed)) {
            const localTable = (localDb as any)[tableName];
            if (localTable && Array.isArray(parsed[tableName])) {
              await localTable.clear();
              await localTable.bulkPut(parsed[tableName]);
            }
          }

          // Force memory-cache reload across all active tables
          const tables = [
            db.subjects, db.systems, db.history, db.pyqYears, db.scoreLogs,
            db.uiPreferences, db.topicProgress, db.curriculumSets, db.revisionSets,
            db.mistakeLogs, db.recommendationSkips, db.operationalModes
          ];
          for (const t of tables) {
            await t.startListener(uid);
          }

          const now = Date.now();
          await localDb.sync_meta.put({
            id: 'last_cloud_sync_timestamp',
            lastSyncTimestamp: now
          });

          console.log('Successfully hydrated and synced local database from Firestore single-blob.');
        }
      }
    } catch (err) {
      console.error('Failed to pull single-blob backup from Firestore:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Force direct immediate resolution of cold boot (e.g. for guest users or bypasses)
   */
  resolveDirectly() {
    this.resolveColdBoot();
  }

  /**
   * Performs the initial cold-boot hydration or metadata comparison.
   */
  async initializeColdBoot() {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      this.resolveColdBoot();
      return;
    }

    // Set up a 3.5 second max safety timeout to never hang the screen
    const safetyTimeout = setTimeout(() => {
      console.warn('[SyncEngine] Safety timeout triggered during cold boot. Releasing UI.');
      this.resolveColdBoot();
    }, 3500);

    try {
      // Opt-in optimization: If local database already has subjects, resolve boot immediately to make UI interactive,
      // then continue background sync.
      const localCount = await localDb.subjects.count();
      if (localCount > 0) {
        console.log('[SyncEngine] Local data exists. Releasing UI lock immediately for instant response.');
        this.resolveColdBoot();
      }

      const localMeta = await localDb.sync_meta.get('last_cloud_sync_timestamp');
      const localLastSync = localMeta ? localMeta.lastSyncTimestamp : 0;

      const docRef = doc(firestoreDb, `users/${uid}/vaultBackup`, 'latest');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const docData = docSnap.data();
        const remoteUpdatedAt = docData.updatedAt?.seconds 
          ? docData.updatedAt.seconds * 1000 
          : (typeof docData.updatedAt === 'number' ? docData.updatedAt : 0);

        if (remoteUpdatedAt > localLastSync || localLastSync === 0) {
          console.log('Remote snapshot is newer or local is empty, triggering full hydration...');
          await this.pullRemoteBackupFromFirestore(uid);
        } else {
          console.log('Local database is already synchronized with remote snapshot.');
        }
      } else {
        // If there is no remote backup, but we have local subjects, push them up.
        if (localCount > 0) {
          console.log('No remote backup found. Creating initial cloud backup from local state...');
          await this.pushLocalBackupToFirestore(uid);
        }
      }
    } catch (err) {
      console.warn('Cold boot sync offline/cache mode or not found:', err);
    } finally {
      clearTimeout(safetyTimeout);
      this.resolveColdBoot();
    }

    // Capture initial snapshot on mount if required, and check periodically
    await this.checkAndTriggerSnapshot();

    // Start 15-minute background checking timer
    setInterval(async () => {
      await this.checkAndTriggerSnapshot();
    }, 900000); // 15 minutes
  }
}

export const syncEngine = new SyncEngine();
