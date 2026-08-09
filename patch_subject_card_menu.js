const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/subjects/SubjectCard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `<div className="flex items-center gap-1 shrink-0 ml-1">
          <div
            {...dragHandleProps}`;

const replacement = `<div className="flex items-center gap-1 shrink-0 ml-1 relative z-20">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors focus:outline-none shrink-0"
              aria-label="Subject options"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <MoreVertical className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl">
              <DropdownMenuItem
                onClick={async (e) => {
                  e.stopPropagation();
                  const newName = window.prompt('Rename Subject:', subject.name);
                  if (newName && newName.trim() && newName.trim() !== subject.name) {
                    await updateSubject(subject.id, newName.trim());
                    toast.success('Subject Renamed');
                  }
                }}
                className="gap-2 py-2 cursor-pointer text-xs"
              >
                <PencilLine className="w-3.5 h-3.5" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async (e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to reset all progress for this subject? This cannot be undone.')) {
                    await db.topicProgress.where('topicId').anyOf(allTopicIds).delete();
                    await db.history.where('subjectId').equals(subject.id).delete();
                    toast.success('Progress reset for ' + subject.name);
                  }
                }}
                className="gap-2 py-2 cursor-pointer text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" /> Reset Progress
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async (e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to delete this subject and all its systems?')) {
                    await deleteSubject(subject.id);
                    toast.success('Subject deleted');
                  }
                }}
                className="text-destructive focus:text-destructive gap-2 py-2 cursor-pointer text-xs font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div
            {...dragHandleProps}`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
