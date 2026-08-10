const fs = require('fs');
const file = './artifacts/study-tracker/src/features/dashboard/AtlasSkyModal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\\`/g, '`');

fs.writeFileSync(file, content);
