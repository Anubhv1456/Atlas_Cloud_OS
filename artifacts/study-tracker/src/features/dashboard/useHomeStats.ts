import { useState, useEffect } from 'react';
import { db } from '@/db';

export function useHomeStats() {
  const [stats, setStats] = useState({
    completedTasks: 0,
    strongSystems: 0,
    dueRevisionsCount: 0,
    weakTopicsCount: 0,
    learningTopicsCount: 0,
    sum: 0,
    topicOverallProgress: 0
  });

  useEffect(() => {
    let isCancelled = false;

    const calculateStats = async () => {
      let completedTasks = 0;
      let strongSystems = 0;
      let dueRevisionsCount = 0;
      let weakTopicsCount = 0;
      let learningTopicsCount = 0;
      let sum = 0;
      
      const now = new Date();
      
      // Pull all to array - fast on V8, avoids IPC overhead of .each() per record
      const tpArray = await db.topicProgress.toArray();
      for (const tp of tpArray) {
        if (tp.isWeak) weakTopicsCount++;
      }

      const setsArray = await (db.curriculumSets || db.revisionSets).toArray();
      for (const set of setsArray) {
        if (set.contentCompleted && set.qbankCompleted) completedTasks++;
        if (set.averageScore && set.averageScore >= 80) strongSystems++;
        if (set.nextRevisionDate && new Date(set.nextRevisionDate) <= now) dueRevisionsCount++;
        
        if (set.contentCompleted || set.qbankCompleted) {
          if (!(set.contentCompleted && set.qbankCompleted)) {
            learningTopicsCount++;
          }
        }
        
        const v1 = set.contentCompleted ? 50 : 0;
        const v2 = set.qbankCompleted ? 50 : 0;
        sum += (v1 + v2);
      }
      
      if (!isCancelled) {
        setStats({
          completedTasks,
          strongSystems,
          dueRevisionsCount,
          weakTopicsCount,
          learningTopicsCount,
          sum,
          topicOverallProgress: 0
        });
      }
    };

    // Initial calc
    calculateStats();
    
    // Subscribe to DB changes with debouncing (300ms) to avoid stutter
    let timeout: ReturnType<typeof setTimeout>;
    
    const dbListener = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        calculateStats();
      }, 500);
    };
    
    // @ts-ignore
    db.on('changes', dbListener as any);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
      // @ts-ignore
      db.on('changes').unsubscribe(dbListener as any);
    };
  }, []);

  return stats;
}
