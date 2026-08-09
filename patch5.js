const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/subjects/SystemCard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
/\{ret\}%\s*Recall\s*•\s*\{health\.label\}/,
`{health.label}`
);

fs.writeFileSync(file, content);
console.log("Patched successfully");
