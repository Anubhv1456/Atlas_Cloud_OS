const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/analytics/Analytics.hooks.tsx', 'utf8');

const importStatement = `import { format } from 'date-fns';\nimport { ALL_SYSTEMS } from '@/data/ontology';`;
code = code.replace("import { format } from 'date-fns';", importStatement);

const statsCalculation = `
  const topicProgresses = useLiveQuery(() => db.topicProgress.toArray()) || [];
  
  // Calculate summary stats
  const stats = useMemo(() => {
    const baseStats = calculateAnalyticsStats(filteredLogs);
    
    // topics metrics
    const totalTopics = ALL_SYSTEMS.flatMap(s => s.topics).length;
    const mastered = topicProgresses.filter(tp => tp.confidence === 'high').length;
    const weak = topicProgresses.filter(tp => tp.confidence === 'low').length;
    const qbankDone = topicProgresses.filter(tp => tp.qbankStatus === 'completed').length;
    const qbankCoverage = totalTopics > 0 ? Math.round((qbankDone / totalTopics) * 100) : 0;

    return {
      ...baseStats,
      topicsMastered: mastered,
      topicsWeak: weak,
      qbankCoverage,
      totalTopics
    };
  }, [filteredLogs, topicProgresses]);
`;

code = code.replace(
  /\/\/ Calculate summary stats[\s\S]*?\}, \[filteredLogs\]\);/,
  statsCalculation
);

fs.writeFileSync('artifacts/study-tracker/src/features/analytics/Analytics.hooks.tsx', code);
console.log('Analytics.hooks updated');
