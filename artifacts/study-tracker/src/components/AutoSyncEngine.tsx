import { useEffect } from 'react';
import { syncToFirebase } from '@/lib/firebaseSync';
import { useAuth } from '@/hooks/useAuth';

export function AutoSyncEngine() {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;

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
