const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/hooks/useOnboardingStatus.ts', 'utf8');

code = code.replace(/parsed\.hasCompletedTriage \|\| /, '');

fs.writeFileSync('artifacts/study-tracker/src/hooks/useOnboardingStatus.ts', code);
