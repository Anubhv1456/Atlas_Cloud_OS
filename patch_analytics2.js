const fs = require('fs');
const file = './artifacts/study-tracker/src/features/analytics/Analytics.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /log\.type === 'revision'\n                              \? 'border-blue-500\/30 text-blue-500 bg-blue-500\/5'\n                              : 'border-purple-500\/30 text-purple-500 bg-purple-500\/5'/g,
  "log.type === 'revision' ? 'border-blue-500/30 text-blue-500 bg-blue-500/5' : log.type === 'set' ? 'border-amber-500/30 text-amber-500 bg-amber-500/5' : 'border-purple-500/30 text-purple-500 bg-purple-500/5'"
);

fs.writeFileSync(file, code);
