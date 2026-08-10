const fs = require('fs');
const file = './artifacts/study-tracker/src/features/dashboard/Home.hooks.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /const insights = useMemo\(\(\) => \{[\s\S]*?return candidates.sort\(\(a, b\) => b\.confidence - a\.confidence\);\n  \}, \[systems, subjects, isAutoPrimary, primaryFocus, isAutoSecondary, secondaryFocus, dueRevisions, secondaryDaysOverdue, customPrimarySubject, customSecondarySubject, aiInsight, setLocation\]\);\n/g,
  ""
);

code = code.replace(/insights,\n/g, "");

fs.writeFileSync(file, code);
