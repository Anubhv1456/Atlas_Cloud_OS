const fs = require('fs');
const file = './artifacts/study-tracker/src/lib/recommendations/nextActionEngine.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /daysOverdue: isOverdue \? daysOverdue : 0,\n      revisionCount,\n      statusText\n    \}\);/,
  "daysOverdue: isOverdue ? daysOverdue : 0,\n      revisionCount,\n      statusText,\n      isAgingPin,\n      wasPinned\n    });"
);

fs.writeFileSync(file, code);
