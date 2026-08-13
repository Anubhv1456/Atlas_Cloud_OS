import { useState, useEffect } from 'react';
import { auth, firestoreDb as firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, getDocs } from 'firebase/firestore';

export function useLiveQuery<T>(queryFn: () => Promise<T>, deps: any[] = []): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined);

  useEffect(() => {
    let unsubscribe = () => {};
    let isMounted = true;

    if (!auth.currentUser) {
       // if not logged in, we can't listen to user-specific collections easily unless queryFn works offline?
       // but wait, the queryFn just fetches from the "db" object.
    }

    const run = async () => {
       try {
         const result = await queryFn();
         if (isMounted) setData(result);
       } catch(e) { console.error(e); }
    };
    run();
    return () => { isMounted = false; unsubscribe(); };
  }, deps);

  return data;
}
