const fs = require('fs');
const file = 'artifacts/study-tracker/src/components/SafeDeleteSubjectDialog.tsx';
let code = fs.readFileSync(file, 'utf8');

// Remove Merge button and sibling props
const btnRegex = /\{\s*siblingDuplicate && onMergeWithDuplicate && \([\s\S]*?Merge Progress[\s\S]*?<\/Button>\s*\)\s*\}/g;
code = code.replace(btnRegex, '');

fs.writeFileSync(file, code);
console.log("Patched SafeDeleteSubjectDialog.tsx");
