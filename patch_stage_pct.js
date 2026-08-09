const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/subjects/SubjectDetail.hooks.ts', 'utf8');

code = code.replace(
  /const stagePct = \(key: StageKey\) => \{[\s\S]*?\};/,
  `const stagePct = (key: StageKey) => {
    if (allTopicIds.length === 0) return 0;
    
    // Instead of system level, we count topic level
    let done = 0;
    for (const tp of topicProgresses) {
      if (key === 'contentCompleted' && tp.contentStatus === 'completed') done++;
      if (key === 'qbankDone' && tp.qbankStatus === 'completed') done++;
    }
    return Math.round((done / allTopicIds.length) * 100);
  };`
);

code = code.replace(
  /const pyqUnlocked = systems.length > 0 && systems.every\(s => s.contentCompleted && s.qbankDone\);/,
  `const pyqUnlocked = allTopicIds.length > 0 && allTopicIds.length === topicProgresses.filter(tp => tp.contentStatus === 'completed' && tp.qbankStatus === 'completed').length;`
);

fs.writeFileSync('artifacts/study-tracker/src/features/subjects/SubjectDetail.hooks.ts', code);
console.log('stagePct patched');
