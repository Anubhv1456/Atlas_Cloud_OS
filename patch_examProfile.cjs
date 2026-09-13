const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/lib/examProfile.ts', 'utf8');

code = code.replace(/  dailyQuestionGoal: number;\n/, '');
code = code.replace(/  dailyQuestionGoal: 40,\n/, '');
code = code.replace(/              dailyQuestionGoal: data\.dailyQuestionGoal \?\? local\.dailyQuestionGoal \?\? 40,\n/, '');
code = code.replace(/      dailyQuestionGoal: profile\.dailyQuestionGoal,\n/, '');

fs.writeFileSync('artifacts/study-tracker/src/lib/examProfile.ts', code);
