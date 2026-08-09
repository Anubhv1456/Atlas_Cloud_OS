const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/dashboard/Home.tsx';
let content = fs.readFileSync(file, 'utf8');

// The unused variables and dialogs in Home.tsx
// Let's just remove them.
content = content.replace(/<AddDialog[\s\S]*?onSave={addSubject}\s*\/>/, '');
content = content.replace(/\{\/\* Rename Subject dialog \*\/\}[\s\S]*?<\/Dialog>/, '');
content = content.replace(/\{\/\* Delete Subject confirmation dialog \*\/\}[\s\S]*?<\/Dialog>/, '');

fs.writeFileSync(file, content);
console.log("Patched successfully");
