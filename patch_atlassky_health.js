const fs = require('fs');
const file = './artifacts/study-tracker/src/features/dashboard/AtlasSkyModal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /const syllabusHealth = totalSyllabusTasks > 0 \? \(completedSyllabusTasks \/ totalSyllabusTasks\) \* 100 : 0;/g,
    `const syllabusHealth = syllabusProgress;`
);

content = content.replace(
    /if \(totalSyllabusTasks === 0\) \{/g,
    `if (syllabusProgress === 0 && qbankHealth === 0 && statusHealth === 0) {`
);

fs.writeFileSync(file, content);
console.log('patched health');
