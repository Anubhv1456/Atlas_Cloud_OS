import fs from 'fs';

let content = fs.readFileSync('./artifacts/study-tracker/src/features/dashboard/Home.tsx', 'utf8');

// Add import
content = content.replace(
  "import { useHomeLogic } from './Home.hooks';",
  "import { useHomeLogic } from './Home.hooks';\nimport { useHomeStats } from './useHomeStats';"
);

// Replace stats calculation
const oldStatsBlock = `  const stats = useLiveQuery(async () => {
    let completedTasks = 0;
    let strongSystems = 0;
    let dueRevisionsCount = 0;
    let weakTopicsCount = 0;
    let learningTopicsCount = 0;
    let sum = 0;
    
    const now = new Date();
    await db.topicProgress.each(tp => {
      if (tp.isWeak) weakTopicsCount++;
    });

    await (db.curriculumSets || db.revisionSets).each(set => {
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
    });
    
    return { completedTasks, strongSystems, dueRevisionsCount, weakTopicsCount, learningTopicsCount, sum };
  }, []) || { completedTasks: 0, strongSystems: 0, dueRevisionsCount: 0, weakTopicsCount: 0, learningTopicsCount: 0, sum: 0 };`;

content = content.replace(oldStatsBlock, `  const stats = useHomeStats();`);

fs.writeFileSync('./artifacts/study-tracker/src/features/dashboard/Home.tsx', content);
