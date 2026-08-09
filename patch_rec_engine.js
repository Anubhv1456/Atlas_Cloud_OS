const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/lib/recommendation-engine.ts', 'utf8');

code = code.replace(
  "      } else if (!sys.contentCompleted) {\n        score += 25;\n      }",
  "      } else {\n        const sysTopics = ALL_SYSTEMS[sys.subjectId]?.find(s => s.id === sys.id)?.topics || [];\n        const sysTopicIds = sysTopics.map(t => t.id);\n        const sysTopicProgresses = topicProgresses.filter(tp => sysTopicIds.includes(tp.topicId));\n        const progress = sysTopics.length > 0 ? (sysTopicProgresses.reduce((acc, tp) => acc + (tp.contentStatus === 'completed' ? 0.5 : 0) + (tp.qbankStatus === 'completed' ? 0.5 : 0), 0) / sysTopics.length) * 100 : 0;\n        if (progress < 100) {\n          score += 25;\n        }\n      }"
);

fs.writeFileSync('artifacts/study-tracker/src/lib/recommendation-engine.ts', code);
console.log('recommendation-engine.ts patched');
