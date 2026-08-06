import { useEffect } from 'react';
import { syncToFirebase, syncFromFirebase } from '@/lib/firebaseSync';
import { useAuth } from '@/hooks/useAuth';

export function AutoSyncEngine() {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;

    // Automatically load data from cloud on login / session start
    syncFromFirebase().catch((err) => {
      console.warn('Auto cloud load on login skipped or failed:', err);
    });

    // Background interval sync (every 2 minutes)
    const interval = setInterval(() => {
      syncToFirebase().catch(() => {});
    }, 2 * 60 * 1000);

    // Sync on app backgrounding (visibility hidden)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        syncToFirebase().catch(() => {});
      }
    };
    
    // Sync on online event
    const handleOnline = () => {
      syncFromFirebase().catch(() => {});
      syncToFirebase().catch(() => {});
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [user]);

  return null;
}
