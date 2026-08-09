const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/dashboard/Home.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove Target Exam Button
content = content.replace(/\{isConfigured \? \([\s\S]*?Set Target Exam\s*<\/button>\s*\)\}/, '');
// Remove Search button
content = content.replace(/\{\/\* Quick Search trigger opening CommandPalette \*\/\}[\s\S]*?<\/button>/, '');

fs.writeFileSync(file, content);
console.log("Patched successfully");
