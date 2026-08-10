const fs = require('fs');
const file = './artifacts/study-tracker/src/features/dashboard/Home.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/insights,\n/g, "");
code = code.replace(/secondaryDaysOverdue, dueRevisions, insights,/g, "secondaryDaysOverdue, dueRevisions,");

fs.writeFileSync(file, code);
