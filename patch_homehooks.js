const fs = require('fs');
let content = fs.readFileSync('artifacts/study-tracker/src/features/dashboard/Home.hooks.tsx', 'utf-8');

// We need to remove:
// showAddSubject, setShowAddSubject,
// subjectToRename, setSubjectToRename,
// renameSubjectName, setRenameSubjectName,
// subjectToDelete, setSubjectToDelete,
// handleRenameSubjectSave, handleDeleteSubjectConfirm

content = content.replace(/const \[showAddSubject, setShowAddSubject\] = useState\(false\);/, '');
content = content.replace(/const \[subjectToRename, setSubjectToRename\] = useState<Subject \| null>\(null\);/, '');
content = content.replace(/const \[renameSubjectName, setRenameSubjectName\] = useState\(''\);/, '');
content = content.replace(/const \[subjectToDelete, setSubjectToDelete\] = useState<Subject \| null>\(null\);/, '');

// Need to remove handleRenameSubjectSave and handleDeleteSubjectConfirm
const renameFnStart = content.indexOf('const handleRenameSubjectSave = async () => {');
if (renameFnStart !== -1) {
  const nextFnStart = content.indexOf('const handleDeleteSubjectConfirm = async () => {');
  content = content.substring(0, renameFnStart) + content.substring(nextFnStart);
}

const deleteFnStart = content.indexOf('const handleDeleteSubjectConfirm = async () => {');
if (deleteFnStart !== -1) {
  const nextFnStart = content.indexOf('const insights = useMemo(() => {');
  if (nextFnStart !== -1) {
      content = content.substring(0, deleteFnStart) + content.substring(nextFnStart);
  }
}

// Removing them from return object
content = content.replace(/showAddSubject, setShowAddSubject,/, '');
content = content.replace(/subjectToRename, setSubjectToRename,/, '');
content = content.replace(/renameSubjectName, setRenameSubjectName,/, '');
content = content.replace(/subjectToDelete, setSubjectToDelete,/, '');
content = content.replace(/handleRenameSubjectSave, handleDeleteSubjectConfirm,/, '');

fs.writeFileSync('artifacts/study-tracker/src/features/dashboard/Home.hooks.tsx', content);
