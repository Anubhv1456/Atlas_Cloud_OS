const fs = require('fs');
const file = 'artifacts/study-tracker/src/db/mutations.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /p = {\n\s+topicId,\n\s+contentStatus: 'completed',\n\s+qbankStatus: 'completed',\n\s+updatedAt: now,\n\s+};/,
  "p = { topicId, contentStatus: 'completed', qbankStatus: 'completed', updatedAt: now } as any;"
);
content = content.replace(
  /await db\.topicProgress\.put\(p\);/g,
  "await db.topicProgress.put(p as any);"
);
content = content.replace(
  /await db\.scoreLogs\.add\(\{/g,
  "await db.scoreLogs.add({ title: 'Revision', total: 100, percentage: score, "
);

fs.writeFileSync(file, content);
console.log('Fixed mutations.ts TS errors');
