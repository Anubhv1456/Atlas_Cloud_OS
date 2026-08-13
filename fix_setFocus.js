const fs = require('fs');
const path = '/app/applet/artifacts/study-tracker/src/features/analytics/Analytics.hooks.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("await setFocus({ type: 'system', id: system.id! });", "await setFocus(system.id!, 'primary');");

fs.writeFileSync(path, content);
