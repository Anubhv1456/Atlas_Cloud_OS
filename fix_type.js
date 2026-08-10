const fs = require('fs');
const file = './artifacts/study-tracker/src/lib/recommendations/nextActionEngine.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /variant: 'default',/g,
  `variant: 'amber',`
);

fs.writeFileSync(file, content);
