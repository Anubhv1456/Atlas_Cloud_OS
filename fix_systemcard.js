const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/features/subjects/SystemCard.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/Rename System/g, 'Rename Waypoint');
content = content.replace(/Delete System/g, 'Delete Waypoint');
fs.writeFileSync(file, content);
