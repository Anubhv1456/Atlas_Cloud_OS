import { useState, useEffect } from 'react';
import { getNextActionWithFallback } from '@/lib/api/recommendations';
import { NextActionEngineResult, EngineOptions } from '@/lib/recommendations/nextActionEngine';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';

export function useNextActionEngine(options?: EngineOptions) {
  const [result, setResult] = useState<NextActionEngineResult | null>(null);
  const [loading, setLoading] = useState(true);
  const optionsStr = JSON.stringify(options);

  // Trigger engine update whenever underlying relevant DB tables change
  // (using a fast query just to trigger dependency re-run)
  const historyTrigger = useLiveQuery(() => db.history.count()) || 0;
  const progressTrigger = useLiveQuery(() => db.topicProgress.count()) || 0;
  const curriculumTrigger = useLiveQuery(() => (db.curriculumSets || db.revisionSets).count()) || 0;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getNextActionWithFallback(options).then(res => {
      if (mounted) {
        setResult(res);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [historyTrigger, progressTrigger, curriculumTrigger, optionsStr]);

  return { result, loading };
}
