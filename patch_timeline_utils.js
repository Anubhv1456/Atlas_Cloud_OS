const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/timeline/timelineUtils.ts', 'utf8');

code = code.replace(
  "revision:        'revisionSystem',",
  "revision:        'revisionSystem',\n    topicMastered:   'topicMastered',\n    topicWeak:       'topicWeak',"
);

// We need to fix the entityName. If h.taskKey starts with topic, we can just use h.taskLabel
const entityNameLogic = `
  let entityName = \`\${h.systemName} \${h.taskLabel}\`;
  if (h.taskKey === 'pyqsDone') entityName = h.taskLabel;
  if (h.taskKey === 'topicMastered' || h.taskKey === 'topicWeak') entityName = h.taskLabel;
`;

code = code.replace(
  "  const entityName = h.taskKey === 'pyqsDone'\n    ? h.taskLabel\n    : `${h.systemName} ${h.taskLabel}`;",
  entityNameLogic
);

fs.writeFileSync('artifacts/study-tracker/src/features/timeline/timelineUtils.ts', code);
console.log('timelineUtils.ts patched');
