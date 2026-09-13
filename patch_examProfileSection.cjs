const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/settings/ExamProfileSection.tsx', 'utf8');

code = code.replace(/sublabel=\{\`\$\{profile\.currentYear \|\| 'Medical Degree'\} • \$\{profile\.dailyQuestionGoal \|\| 40\} Qs\/day\`\}/, "sublabel={profile.currentYear || 'Medical Degree'}");

fs.writeFileSync('artifacts/study-tracker/src/features/settings/ExamProfileSection.tsx', code);
