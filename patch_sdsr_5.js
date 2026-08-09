const fs = require('fs');
const file = 'artifacts/study-tracker/src/lib/sdsr-engine.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /newHistory\.push\(\{([\s\S]*?)\}\s*as\s*any\);/,
  "newHistory.push({$1, date: now.toISOString()} as any);"
);

fs.writeFileSync(file, content);
