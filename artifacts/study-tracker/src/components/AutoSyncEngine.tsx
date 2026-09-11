import { useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { syncEngine } from '@/db/syncEngine';

const SYNC_COOLDOWN_MS = 20 * 60 * 1000; // 20 minutes
const STORAGE_LAST_SYNC_KEY = 'atlas_last_cloud_sync_timestamp';

export function AutoSyncEngine() {
  useEffect(() => {
    // 1. Monitor auth state and initialize cold boot when logged in or resolve for guest
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('[AutoSyncEngine] Authenticated, starting cold-boot checks...');
        syncEngine.initializeColdBoot();
      } else {
        console.log('[AutoSyncEngine] No user authenticated, resolving cold-boot state immediately...');
        syncEngine.resolveDirectly();
      }
    });

    // 2. Listen to document visibility change for background upload (throttled with 20m cooldown)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && auth.currentUser) {
        const lastSyncRaw = localStorage.getItem(STORAGE_LAST_SYNC_KEY);
        const lastSyncTime = lastSyncRaw ? parseInt(lastSyncRaw, 10) : 0;
        const now = Date.now();

        if (now - lastSyncTime < SYNC_COOLDOWN_MS) {
          console.log(`[AutoSyncEngine] Sync throttled. Last cloud sync was ${Math.round((now - lastSyncTime) / 1000)}s ago (cooldown: 20m).`);
          return;
        }

        console.log('[AutoSyncEngine] Visibility state hidden and 20m cooldown elapsed: pushing cloud backup...');
        localStorage.setItem(STORAGE_LAST_SYNC_KEY, String(now));
        syncEngine.pushLocalBackupToFirestore(auth.currentUser.uid);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubAuth();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}
