const fs = require('fs');
const file = './artifacts/study-tracker/src/components/dashboard/NextActionCard.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldText = "'No quick 10-20m topics left pending. Switch to \"Deep Work (45m+)\" to see lengthy systems requiring deep focus.'";
const newText = "\\`No quick reviews pending. You have \\${(result?.totalCandidatesEvaluated || 0) - (result?.quickEligibleCount || 0)} Deep Study Blocks due.\\`";

code = code.replace(oldText, newText);

fs.writeFileSync(file, code);
