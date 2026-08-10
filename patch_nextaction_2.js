const fs = require('fs');
const file = './artifacts/study-tracker/src/components/dashboard/NextActionCard.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /\\`No quick reviews pending. You have \\\${\(result\?\.totalCandidatesEvaluated \|\| 0\) - \(result\?\.quickEligibleCount \|\| 0\)} Deep Study Blocks due.\\`/,
  "`No quick reviews pending. You have ${(result?.totalCandidatesEvaluated || 0) - (result?.quickEligibleCount || 0)} Deep Study Blocks due.`"
);

fs.writeFileSync(file, code);
