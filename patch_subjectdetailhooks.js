const fs = require('fs');
let content = fs.readFileSync('artifacts/study-tracker/src/features/subjects/SubjectDetail.hooks.ts', 'utf-8');

// We need to remove:
// showDeleteConfirm, setShowDeleteConfirm
// showEdit, setShowEdit
// editName, setEditName

content = content.replace(/const \[showDeleteConfirm, setShowDeleteConfirm\] = useState\(false\);/, '');
content = content.replace(/const \[showEdit,      setShowEdit\]      = useState\(false\);/, '');
content = content.replace(/const \[editName,      setEditName\]      = useState\(''\);/, '');

// Need to remove handleSaveEdit and handleDelete and handleDeleteConfirm
const saveEditStart = content.indexOf('const handleSaveEdit = async () => {');
if (saveEditStart !== -1) {
  const nextFnStart = content.indexOf('const handleDelete = () => { setShowDeleteConfirm(true); };');
  content = content.substring(0, saveEditStart) + content.substring(nextFnStart);
}

const deleteFnStart = content.indexOf('const handleDelete = () => { setShowDeleteConfirm(true); };');
if (deleteFnStart !== -1) {
  const nextFnStart = content.indexOf('return {', deleteFnStart);
  if (nextFnStart !== -1) {
      content = content.substring(0, deleteFnStart) + content.substring(nextFnStart);
  }
}

// Removing them from return object
content = content.replace(/showDeleteConfirm, setShowDeleteConfirm,/, '');
content = content.replace(/showEdit, setShowEdit,/, '');
content = content.replace(/editName, setEditName,/, '');
content = content.replace(/handleSaveEdit, handleDelete, handleDeleteConfirm/, '');

fs.writeFileSync('artifacts/study-tracker/src/features/subjects/SubjectDetail.hooks.ts', content);
