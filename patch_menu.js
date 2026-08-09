const fs = require('fs');
let content = fs.readFileSync('artifacts/study-tracker/src/features/subjects/SubjectDetail.tsx', 'utf-8');

// The dropdown menu is used for renaming and deleting the subject in the header.
// It looks like:
// <DropdownMenu>
//   <DropdownMenuTrigger ...>
//      ...
//   </DropdownMenuTrigger>
//   <DropdownMenuContent ...>
//      <DropdownMenuItem ...> Rename </DropdownMenuItem>
//      <DropdownMenuItem ...> Delete Subject </DropdownMenuItem>
//   </DropdownMenuContent>
// </DropdownMenu>

const startIndex = content.indexOf('<DropdownMenu>');
const endIndex = content.indexOf('</DropdownMenu>', startIndex);
if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + content.substring(endIndex + '</DropdownMenu>'.length);
}

// We also have to remove any usage of `showEdit` or `showDeleteConfirm` that wasn't removed previously.
content = content.replace(/<Dialog open=\{showEdit\}.*?<\/Dialog>/gs, '');
content = content.replace(/<Dialog open=\{showDeleteConfirm\}.*?<\/Dialog>/gs, '');
// Since we used regex above, we can also remove the line with `showEdit` in destructuring if it's there.
content = content.replace(/showEdit, setShowEdit,/g, '');
content = content.replace(/showDeleteConfirm, setShowDeleteConfirm,/g, '');
content = content.replace(/editName, setEditName,/g, '');
content = content.replace(/handleSaveEdit, handleDelete, handleDeleteConfirm,/g, '');

fs.writeFileSync('artifacts/study-tracker/src/features/subjects/SubjectDetail.tsx', content);
