const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/components/TargetExamModal.tsx', 'utf8');

// Replace the entire block for Daily Qbank target
const regex = /<div className="space-y-1\.5">\s*<div className="flex items-center justify-between">\s*<Label htmlFor="dailyGoal"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;

code = code.replace(regex, '</div>');
fs.writeFileSync('artifacts/study-tracker/src/components/TargetExamModal.tsx', code);
