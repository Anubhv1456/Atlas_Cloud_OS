const fs = require('fs');
const file = './artifacts/study-tracker/src/lib/recommendations/nextActionEngine.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /const isLengthy = set.topicIds.length > 5;/,
  "const isLengthy = yieldWeight >= 85; // Medicine / High Yield blocks default to Deep Work"
);

fs.writeFileSync(file, code);
