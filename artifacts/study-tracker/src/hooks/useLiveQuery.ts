import { useState, useEffect } from 'react';
import { dbEvents } from '@/db/schema';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function useLiveQuery<T>(queryFn: () => Promise<T> | T, deps: any[] = []): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    
    const run = async () => {
      try {
        if (!auth.currentUser) return;
        const result = await queryFn();
        if (isMounted) setData(result as T);
      } catch (e) {
        console.error(e);
      }
    };

    const unsubAuth = onAuthStateChanged(auth, (user) => {
        if (user) run();
    });

    const handler = () => run();
    dbEvents.on('change', handler);
    
    // Initial run
    run();

    return () => {
      isMounted = false;
      dbEvents.off('change', handler);
      unsubAuth();
    };
  }, deps);

  return data;
}
