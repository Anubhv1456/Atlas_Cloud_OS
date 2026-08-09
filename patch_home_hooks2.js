const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/dashboard/Home.hooks.tsx', 'utf8');

code = code.replace(
  "    if (primaryFocus && !(primaryFocus.contentCompleted && primaryFocus.qbankDone)) {\n      const sub = subjects.find(s => s.id === primaryFocus!.subjectId);\n      const missingTask = !primaryFocus.contentCompleted ? 'Content' : 'QBank';",
  "    const primaryProgress = primaryFocus ? systemProgressMap.get(primaryFocus.id!) ?? 0 : 0;\n    if (primaryFocus && primaryProgress < 100) {\n      const sub = subjects.find(s => s.id === primaryFocus!.subjectId);\n      const missingTask = 'Topics';"
);

fs.writeFileSync('artifacts/study-tracker/src/features/dashboard/Home.hooks.tsx', code);
console.log('Home.hooks.tsx patched again');
