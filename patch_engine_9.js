const fs = require('fs');
const file = './artifacts/study-tracker/src/lib/recommendations/nextActionEngine.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /const isLengthy = yieldWeight >= 85; \/\/ Medicine \/ High Yield blocks default to Deep Work\n    const topicCount = set.topicIds.length;\n    \n    const yieldInfo = getSubjectWeightageInfo\(subjectName, targetExam\);\n    const yieldWeight = yieldInfo.weight \|\| 70;/,
  "const topicCount = set.topicIds.length;\n    \n    const yieldInfo = getSubjectWeightageInfo(subjectName, targetExam);\n    const yieldWeight = yieldInfo.weight || 70;\n    \n    const isLengthy = yieldWeight >= 85; // High Yield blocks default to Deep Work"
);

fs.writeFileSync(file, code);
