import { useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { syncEngine } from '@/db/syncEngine';

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

    // 2. Listen to document visibility change for background upload
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && auth.currentUser) {
        console.log('[AutoSyncEngine] Visibility state hidden: pushing asynchronous upstream sync...');
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
