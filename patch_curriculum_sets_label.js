const fs = require('fs');
const file = './artifacts/study-tracker/src/features/subjects/CurriculumSets.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /taskLabel: set\.name \+ ' Content',/g,
    `taskLabel: 'Content',`
);

content = content.replace(
    /taskLabel: set\.name \+ ' QBank',/g,
    `taskLabel: 'QBank',`
);

fs.writeFileSync(file, content);
console.log('patched labels');
