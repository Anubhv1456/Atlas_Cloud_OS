const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/pages/Onboarding.tsx', 'utf8');

code = code.replace(/subs.forEach\(s => initialStatus\[s.id\] = 'untouched'\);/, "subs.forEach(s => { if (s.id) initialStatus[s.id as string] = 'untouched'; });");
code = code.replace(/const status = syllabusStatus\[sub.id as string\];/, "const status = sub.id ? syllabusStatus[sub.id as string] : undefined;");

fs.writeFileSync('artifacts/study-tracker/src/pages/Onboarding.tsx', code);
