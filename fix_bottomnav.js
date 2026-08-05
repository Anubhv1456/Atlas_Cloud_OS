const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/components/BottomNav.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/label: 'Timeline'/g, "label: 'Timeline'");
content = content.replace(/label: 'Navigation'/g, "label: 'Atlas'");
content = content.replace(/label: 'Home'/g, "label: 'Compass'");
fs.writeFileSync(file, content);
