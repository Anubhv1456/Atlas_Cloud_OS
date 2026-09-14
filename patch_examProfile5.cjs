const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/lib/examProfile.ts', 'utf8');

code = code.replace(/  hasCompletedTriage\?: boolean;\n/, '');
code = code.replace(/              hasCompletedTriage: data\.hasCompletedTriage \?\? local\.hasCompletedTriage,\n/, '');
code = code.replace(/      hasCompletedTriage: profile\.hasCompletedTriage \?\? false,\n/, '');

fs.writeFileSync('artifacts/study-tracker/src/lib/examProfile.ts', code);
