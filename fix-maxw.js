const fs = require('fs');
const file = './artifacts/study-tracker/src/features/timeline/Timeline.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('w-[60%] mx-auto', 'max-w-2xl w-[90%] md:w-[60%] mx-auto');

fs.writeFileSync(file, content);
