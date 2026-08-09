const fs = require('fs');
const file = 'artifacts/study-tracker/src/lib/sdsr-engine.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /newHistory\.push\(\{([^}]*?)reviewedAt: now\.toISOString\(\)([^}]*?)\}\s*as\s*any\);/g,
  "newHistory.push({$1reviewedAt: now.toISOString(), date: now.toISOString()$2} as any);"
);

fs.writeFileSync(file, content);
