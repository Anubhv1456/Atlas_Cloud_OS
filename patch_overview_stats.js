const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/dashboard/Home.tsx', 'utf8');

// Replace OverviewStats calculation in Home.tsx
const statsRegex = /<OverviewStats[\s\S]*?\/>/;
const newStats = `<OverviewStats 
              streak={streak}
              overallProgress={topicOverallProgress}
              completedTasks={topicProgresses.filter(tp => tp.contentStatus === 'completed' && tp.qbankStatus === 'completed').length}
              totalTasks={allTopicIds.length}
              strongSystems={topicProgresses.filter(tp => tp.confidence === 'high').length}
              totalSystems={allTopicIds.length}
              dueRevisionsCount={topicProgresses.filter(tp => tp.nextRevisionDate && new Date(tp.nextRevisionDate) <= new Date()).length}
              weakTopicsCount={topicProgresses.filter(tp => tp.confidence === 'low').length}
              learningTopicsCount={topicProgresses.filter(tp => tp.contentStatus === 'in_progress' || tp.qbankStatus === 'in_progress' || (tp.contentStatus === 'completed' && tp.qbankStatus !== 'completed') || (tp.contentStatus !== 'completed' && tp.qbankStatus === 'completed')).length}
            />`;

code = code.replace(statsRegex, newStats);

fs.writeFileSync('artifacts/study-tracker/src/features/dashboard/Home.tsx', code);
console.log('Home.tsx updated with new stats');
