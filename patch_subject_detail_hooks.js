const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/subjects/SubjectDetail.hooks.ts', 'utf8');

code = code.replace(
  "  const totalTasks     = systems.length * 2;\n  const completedTasks = systems.reduce((acc, sys) => {\n    let done = 0;\n    if (sys.contentCompleted) done++;\n    if (sys.qbankDone) done++;\n    return acc + done;\n  }, 0);",
  "  const totalTasks     = allTopicIds.length * 2;\n  const completedTasks = topicProgresses.reduce((acc, tp) => {\n    let done = 0;\n    if (tp.contentStatus === 'completed') done++;\n    if (tp.qbankStatus === 'completed') done++;\n    return acc + done;\n  }, 0);"
);

fs.writeFileSync('artifacts/study-tracker/src/features/subjects/SubjectDetail.hooks.ts', code);
console.log('SubjectDetail.hooks.ts patched');
