const fs = require('fs');
const file = './artifacts/study-tracker/src/features/subjects/CurriculumSets.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /taskKey: 'contentDone',/g,
    `taskKey: 'curriculum_set_content',`
);

content = content.replace(
    /taskKey: 'qbankDone',/g,
    `taskKey: 'curriculum_set_qbank',`
);

// We need to set taskLabel to set.name + ' Content' instead of just 'Content' because we replaced it earlier and now entityName is just taskLabel for these!
content = content.replace(
    /taskLabel: 'Content',/g,
    `taskLabel: set.name + ' Content',`
);

content = content.replace(
    /taskLabel: 'QBank',/g,
    `taskLabel: set.name + ' QBank',`
);

fs.writeFileSync(file, content);
console.log('patched sets 2');
