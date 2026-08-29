import { useState, useEffect } from 'react';
import { dbEvents } from './schema';

export function useLiveQuery<T>(queryFn: () => Promise<T>, deps: any[] = []): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
       try {
         const result = await queryFn();
         if (isMounted) setData(result);
       } catch(e) { console.error(e); }
    };
    
    // Initial fetch
    run();

    // Re-fetch on any db change
    const handleChange = () => {
      run();
    };

    dbEvents.on('change', handleChange);

    return () => { 
      isMounted = false; 
      dbEvents.off('change', handleChange); 
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return data;
}
