import { useState, useEffect } from 'react';
import { dbEvents } from '@/db/schema';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function useLiveQuery<T>(queryFn: () => Promise<T> | T, deps: any[] = []): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    const run = async () => {
      try {
        const isImpersonating = typeof window !== 'undefined' && sessionStorage.getItem('atlas_impersonated_target');
        if (isImpersonating) {
          if (isMounted) setData([] as any);
          return;
        }
        const result = await queryFn();
        if (isMounted) setData(result as T);
      } catch (e) {
        console.error(e);
      }
    };

    run();
  }, [...deps, tick]); // Re-run when dependencies or tick changes

  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    dbEvents.on('change', handler);
    
    const unsubAuth = onAuthStateChanged(auth, () => {
      setTick(t => t + 1);
    });
    
    return () => {
      dbEvents.off('change', handler);
      unsubAuth();
    };
  }, []);

  return data;
}
