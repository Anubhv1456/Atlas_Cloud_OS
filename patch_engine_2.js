const fs = require('fs');
const file = './artifacts/study-tracker/src/lib/recommendations/nextActionEngine.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /type: 'curriculumSet' \| 'system' \| 'topicGap' \| 'systemGap';/,
  "type: 'curriculumSet' | 'system';"
);

fs.writeFileSync(file, code);
