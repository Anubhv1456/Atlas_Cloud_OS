const fs = require('fs');
const file = 'artifacts/study-tracker/src/lib/sdsr-engine.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const revisionEvent = \{/g,
  "const revisionEvent = { date: now.toISOString(), "
);

fs.writeFileSync(file, content);
