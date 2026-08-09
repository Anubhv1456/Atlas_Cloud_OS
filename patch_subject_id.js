const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/subjects/SubjectCard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/updateSubject\(subject\.id, newName\.trim\(\)\)/g, 'updateSubject(subject.id!, newName.trim())');
content = content.replace(/db\.history\.where\('subjectId'\)\.equals\(subject\.id\)\.delete\(\)/g, "db.history.where('subjectId').equals(subject.id!).delete()");
content = content.replace(/deleteSubject\(subject\.id\)/g, 'deleteSubject(subject.id!)');

fs.writeFileSync(file, content);
console.log('Fixed subject.id TS errors');
