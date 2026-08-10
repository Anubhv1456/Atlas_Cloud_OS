const fs = require('fs');
const file = './artifacts/study-tracker/src/features/timeline/timelineUtils.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /curriculum_set_revision: 'revisionSystem',/g,
    `curriculum_set_revision: 'revisionSystem',
    curriculum_set_content: 'contentCompleted',
    curriculum_set_qbank: 'qbankDone',`
);

content = content.replace(
    /if \(h\.taskKey === 'curriculum_set_revision'\) entityName = h\.taskLabel;/g,
    `if (h.taskKey === 'curriculum_set_revision' || h.taskKey === 'curriculum_set_content' || h.taskKey === 'curriculum_set_qbank') entityName = h.taskLabel;`
);

fs.writeFileSync(file, content);
console.log('patched utils 2');
