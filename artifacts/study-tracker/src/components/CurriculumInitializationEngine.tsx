import React, { useEffect, useState } from 'react';
import { db } from '@/db';
import { useExamProfile } from '@/hooks/useExamProfile';
import { loadUniversalOntology } from '@/lib/exam-presets';
import { AtlasLoadingScreen } from '@/components/AtlasLoadingScreen';
import { useLiveQuery } from '@/hooks/useLiveQuery';

export function CurriculumInitializationEngine({ children }: { children: React.ReactNode }) {
  const { profile, loading: profileLoading } = useExamProfile();
  const targetExam = profile.targetExam || 'NEET PG';
  const isCustom = targetExam.toLowerCase().includes('custom') || targetExam.toLowerCase().includes('other');
  
  // Track DB count for current workspace. This automatically re-evaluates when workspace suffix changes.
  const subjectCount = useLiveQuery(() => db.subjects.count(), [targetExam]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initLabel, setInitLabel] = useState('Verifying curriculum...');
  
  useEffect(() => {
    // If the query is still loading, profile is loading, or it's a custom exam, skip
    if (subjectCount === undefined || profileLoading || isCustom) return;
    
    let isMounted = true;
    
    const checkAndLoad = async () => {
      // Check local storage to see if we already initialized this specific exam manually or automatically
      const initializedKey = `atlas_initialized_${targetExam.replace(/\s+/g, '_').toLowerCase()}`;
      const hasInitialized = localStorage.getItem(initializedKey) === 'true';

      if (subjectCount === 0 && !hasInitialized) {
        setIsInitializing(true);
        // Small buffer to let cloud sync push initial data if it's arriving from a new device login
        await new Promise(r => setTimeout(r, 1500));
        
        // Re-check count directly from DB in case AutoSyncEngine populated it during the buffer
        const currentCount = await db.subjects.count();
        if (currentCount === 0 && isMounted) {
          try {
            await loadUniversalOntology({
              targetExam,
              force: false,
              showToast: false,
              onProgress: (pct, msg) => {
                if (isMounted) setInitLabel(msg);
              }
            });
            localStorage.setItem(initializedKey, 'true');
          } catch (err) {
            console.error('Auto-load failed:', err);
          }
        } else if (currentCount > 0) {
            // It synced from cloud!
            localStorage.setItem(initializedKey, 'true');
        }
        if (isMounted) setIsInitializing(false);
      } else if (subjectCount > 0 && !hasInitialized) {
         // Mark as initialized if they already have data (e.g. legacy users or cloud rehydrated)
         localStorage.setItem(initializedKey, 'true');
      }
    };
    
    checkAndLoad();
    
    return () => { isMounted = false; };
  }, [subjectCount, targetExam, isCustom, profileLoading]);
  
  if (isInitializing) {
    return <AtlasLoadingScreen fullScreen message={initLabel} />;
  }
  
  return <>{children}</>;
}
