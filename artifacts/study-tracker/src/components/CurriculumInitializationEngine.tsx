import React, { useEffect, useState, useRef } from 'react';
import { db } from '@/db';
import { useExamProfile } from '@/hooks/useExamProfile';
import { AtlasLoadingScreen } from '@/components/AtlasLoadingScreen';
import { useLiveQuery } from '@/hooks/useLiveQuery';

export const ATLAS_CURRICULUM_VERSION = 'v2026.09.usmle_blueprint_v10_organ_systems';

export function CurriculumInitializationEngine({ children }: { children: React.ReactNode }) {
  const { profile, loading: profileLoading } = useExamProfile();
  const targetExam = profile.targetExam || 'NEET PG';
  const isCustom = targetExam.toLowerCase().includes('custom') || targetExam.toLowerCase().includes('other');
  
  // Track DB count for current workspace. This automatically re-evaluates when workspace suffix changes.
  const subjectCount = useLiveQuery(() => db.subjects.count(), [targetExam]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initLabel, setInitLabel] = useState('Verifying curriculum...');
  const initializationInProgressRef = useRef(false);

  // If subjects already exist in DB, immediately unblock loading screen
  useEffect(() => {
    if (subjectCount !== undefined && subjectCount > 0 && isInitializing) {
      setIsInitializing(false);
    }
  }, [subjectCount, isInitializing]);

  useEffect(() => {
    // If the query is still loading, profile is loading, or it's a custom exam, skip
    if (subjectCount === undefined || profileLoading || isCustom) return;
    
    // Safety watchdog: under no circumstance should any initial loader block for more than 4 seconds
    const safetyTimeout = setTimeout(() => {
      setIsInitializing(false);
    }, 4000);

    const checkAndLoad = async () => {
      if (initializationInProgressRef.current) return;

      const examKey = targetExam.replace(/\s+/g, '_').toLowerCase();
      const initializedKey = `atlas_initialized_${examKey}`;
      const versionKey = `atlas_curriculum_version_${examKey}`;
      const hasInitialized = localStorage.getItem(initializedKey) === 'true';
      const currentVersion = localStorage.getItem(versionKey);

      // Check current DB subjects count directly
      const currentCount = await db.subjects.count().catch(() => 0);

      // Need initialization if DB has 0 subjects or version upgraded
      const needsInitialSeed = currentCount === 0 && !hasInitialized;
      const needsVersionReconcile = currentVersion !== ATLAS_CURRICULUM_VERSION;

      if (!needsInitialSeed && !needsVersionReconcile) {
        setIsInitializing(false);
        return;
      }

      initializationInProgressRef.current = true;
      if (needsInitialSeed) {
        setIsInitializing(true);
      }

      try {
        const { loadUniversalOntology } = await import('@/lib/exam-presets');
        await loadUniversalOntology({
          targetExam,
          force: false,
          showToast: false,
          onProgress: (_pct, msg) => {
            setInitLabel(msg);
          }
        });
        localStorage.setItem(versionKey, ATLAS_CURRICULUM_VERSION);
        localStorage.setItem(initializedKey, 'true');
      } catch (err) {
        console.error('Curriculum initialization error:', err);
      } finally {
        initializationInProgressRef.current = false;
        setIsInitializing(false);
        clearTimeout(safetyTimeout);
      }
    };

    checkAndLoad();

    return () => {
      clearTimeout(safetyTimeout);
    };
  }, [subjectCount, targetExam, isCustom, profileLoading]);

  if (isInitializing) {
    return <AtlasLoadingScreen fullScreen message={initLabel} />;
  }

  return <>{children}</>;
}
