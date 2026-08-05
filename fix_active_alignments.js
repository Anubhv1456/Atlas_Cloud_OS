const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/features/dashboard/ActiveRevisions.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/Subject: \$\{customPrimarySubject/g, 'Territory: ${customPrimarySubject');
content = content.replace(/Subject: \$\{customSecondarySubject/g, 'Territory: ${customSecondarySubject');
content = content.replace(/Active Multi-Day Revision/g, 'Active Multi-Day Alignment');
content = content.replace(/suspended due to revision/g, 'suspended due to alignment');

fs.writeFileSync(file, content);
