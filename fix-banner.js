const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { AudioPermissionBanner } from '@/components/AudioPermissionBanner';", "");
content = content.replace("<AudioPermissionBanner />", "");

fs.writeFileSync(file, content);
console.log("Done");
