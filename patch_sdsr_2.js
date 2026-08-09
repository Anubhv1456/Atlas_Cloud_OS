const fs = require('fs');
const file = 'artifacts/study-tracker/src/lib/sdsr-engine.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /nextRevisionDate: nextDate,/g,
  "nextRevisionDate: nextDate.toISOString(),"
);
content = content.replace(
  /lastRevisionDate: new Date\(\),/g,
  "lastRevisionDate: new Date().toISOString(),"
);

fs.writeFileSync(file, content);
