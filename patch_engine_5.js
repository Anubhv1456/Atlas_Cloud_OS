const fs = require('fs');
const file = './artifacts/study-tracker/src/lib/recommendations/nextActionEngine.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /daysOverdue\?: number;/,
  "daysOverdue?: number;\n  isAgingPin?: boolean;\n  wasPinned?: boolean;"
);

fs.writeFileSync(file, code);
