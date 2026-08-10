const fs = require('fs');
const file = './artifacts/study-tracker/src/features/mistakes/MistakeRecoveryQueue.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('export function MistakeRecoveryQueue() {', 'export default function MistakeRecoveryQueue() {');
fs.writeFileSync(file, content);
