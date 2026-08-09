const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/subjects/SubjectCard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<DropdownMenuItem[\s\S]*?<PencilLine className="w-3\.5 h-3\.5" \/> Rename\s*<\/DropdownMenuItem>/, '');

fs.writeFileSync(file, content);
console.log('Removed Rename from SubjectCard');
