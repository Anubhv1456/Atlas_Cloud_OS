const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/features/analytics/ScoreLogModal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/Select a Subject/g, 'Select a Territory');
content = content.replace(/All Systems \/ Overall Subject Revision/g, 'All Waypoints / Overall Territory Alignment');
content = content.replace(/Overall Subject Revision/g, 'Overall Territory Alignment');
content = content.replace(/General Subject PYQ/g, 'General Territory PYQ');

fs.writeFileSync(file, content);
