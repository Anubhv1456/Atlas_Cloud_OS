const fs = require('fs');
let content = fs.readFileSync('artifacts/study-tracker/src/features/dashboard/Home.tsx', 'utf-8');

content = content.replace(/showAddSubject, setShowAddSubject,/, '');
content = content.replace(/subjectToRename, setSubjectToRename,/, '');
content = content.replace(/renameSubjectName, setRenameSubjectName,/, '');
content = content.replace(/subjectToDelete, setSubjectToDelete,/, '');
content = content.replace(/handleRenameSubjectSave, handleDeleteSubjectConfirm,/, '');

// Find the section where Dialogs are rendered at the bottom
const dialogsStart = content.indexOf('{/* ── Add Subject Dialog ── */}');
const dialogsEnd = content.indexOf('</main>');

if (dialogsStart !== -1 && dialogsEnd !== -1) {
  content = content.substring(0, dialogsStart) + content.substring(dialogsEnd);
}

// Check SubjectsGrid usage in Home.tsx
content = content.replace(/setShowAddSubject=\{setShowAddSubject\}/, '');
content = content.replace(/setSubjectToDelete=\{setSubjectToDelete\}/, '');
content = content.replace(/setSubjectToRename=\{setSubjectToRename\}/, '');
content = content.replace(/setRenameSubjectName=\{setRenameSubjectName\}/, '');

fs.writeFileSync('artifacts/study-tracker/src/features/dashboard/Home.tsx', content);
