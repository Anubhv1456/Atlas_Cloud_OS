const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/components/TargetExamModal.tsx', 'utf8');

// The line `setDailyQuestionGoal(defaultDaily > 300 ? 300 : defaultDaily);` is left behind.
// It looks like the regex missed the block inside the `useEffect` that calculates the default.
const regex = /\s*setDailyQuestionGoal\(defaultDaily > 300 \? 300 : defaultDaily\);/g;
code = code.replace(regex, '');

fs.writeFileSync('artifacts/study-tracker/src/components/TargetExamModal.tsx', code);
