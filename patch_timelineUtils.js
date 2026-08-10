const fs = require('fs');
const file = './artifacts/study-tracker/src/features/timeline/timelineUtils.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /revision:\s*'revisionSystem',/g,
    `revision:        'revisionSystem',
    curriculum_set_revision: 'revisionSystem',`
);

content = content.replace(
    /if \(h\.taskKey === 'topicMastered' \|\| h\.taskKey === 'topicWeak'\) entityName = h\.taskLabel;/g,
    `if (h.taskKey === 'topicMastered' || h.taskKey === 'topicWeak') entityName = h.taskLabel;
  if (h.taskKey === 'curriculum_set_revision') entityName = h.taskLabel;`
);

fs.writeFileSync(file, content);
console.log('patched timelineUtils');
