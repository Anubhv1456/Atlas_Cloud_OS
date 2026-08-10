const fs = require('fs');
const file = './artifacts/study-tracker/src/features/subjects/SystemCard.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = "system.nextRevisionDate ? (revisionOverdue ? 'Overdue' : revisionDue ? 'Due Soon' : 'Healthy') : '—'";
const replacementStr = "system.nextRevisionDate ? new Date(system.nextRevisionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'";

content = content.replaceAll(targetStr, replacementStr);

const targetStr2 = "system.nextRevisionDate ? (revisionOverdue ? 'Overdue' : revisionDue ? 'Due Soon' : 'Healthy') : 'Pending'";
const replacementStr2 = "system.nextRevisionDate ? new Date(system.nextRevisionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'";

content = content.replaceAll(targetStr2, replacementStr2);

fs.writeFileSync(file, content);
