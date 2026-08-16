import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestoreDb } from '@/lib/firebase';
import { FeatureFlags } from '@/lib/admin';

const defaultFlags: FeatureFlags = {
  communityMarkers: true,
  markerSubmission: true,
  markerVisibility: true,
  payments: false,
  aiInsights: true
};

const FeatureFlagsContext = createContext<{ flags: FeatureFlags; loading: boolean }>({ flags: defaultFlags, loading: true });

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestoreDb) {
      setLoading(false);
      return;
    }

    // Fallback timer for offline mounting (unblocks UI in 250ms)
    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 250);

    const docRef = doc(firestoreDb, 'config', 'featureFlags');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      clearTimeout(fallbackTimer);
      if (snapshot.exists()) {
        setFlags({ ...defaultFlags, ...(snapshot.data() as FeatureFlags) });
      } else {
        setFlags(defaultFlags);
      }
      setLoading(false);
    }, (error) => {
      clearTimeout(fallbackTimer);
      console.warn("Feature flags snapshot deferred (offline):", error);
      setLoading(false);
    });

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}
