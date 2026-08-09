const fs = require('fs');
let content = fs.readFileSync('artifacts/study-tracker/src/features/subjects/SubjectDetail.tsx', 'utf-8');

content = content.replace(/showDeleteConfirm, setShowDeleteConfirm,/, '');
content = content.replace(/showEdit, setShowEdit,/, '');
content = content.replace(/editName, setEditName,/, '');
content = content.replace(/handleSaveEdit, handleDelete, handleDeleteConfirm/, '');

const dialogsStart = content.indexOf('{/* Edit Subject Name dialog */}');
const dialogsEnd = content.indexOf('</main>');

if (dialogsStart !== -1 && dialogsEnd !== -1) {
  content = content.substring(0, dialogsStart) + content.substring(dialogsEnd);
}

// Check dropdown menu in SubjectDetail.tsx
const dropdownStart = content.indexOf('<DropdownMenu>');
const dropdownEnd = content.indexOf('</DropdownMenu>') + '</DropdownMenu>'.length;
if (dropdownStart !== -1 && dropdownEnd !== -1) {
  content = content.substring(0, dropdownStart) + content.substring(dropdownEnd);
}

fs.writeFileSync('artifacts/study-tracker/src/features/subjects/SubjectDetail.tsx', content);
