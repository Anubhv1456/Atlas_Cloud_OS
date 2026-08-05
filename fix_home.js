const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/features/dashboard/Home.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/Rename Subject/g, 'Rename Territory');
content = content.replace(/Delete Subject/g, 'Delete Territory');
fs.writeFileSync(file, content);
