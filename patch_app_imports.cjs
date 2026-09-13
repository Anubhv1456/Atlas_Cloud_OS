const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/app/ProtectedApp.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/import \{ repairAndRehydrateRevisionDates \} from '@\/lib\/vaultSync';\n/g, '');
code = code.replace(/import \{ mergeAndDeduplicateAllSubjects, findDuplicateSubjectGroups \} from '@\/lib\/subjectDeduplication';\n/g, '');

fs.writeFileSync(file, code);
console.log("Patched ProtectedApp.tsx imports");
