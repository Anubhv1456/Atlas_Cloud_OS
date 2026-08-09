const fs = require('fs');
let content = fs.readFileSync('artifacts/study-tracker/src/features/subjects/SubjectCard.tsx', 'utf-8');

const toRemove = `              {onDelete && (
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDelete(subject); }}
                  className="gap-2 py-2 text-destructive focus:text-destructive cursor-pointer text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}`;

content = content.replace(toRemove, '');
fs.writeFileSync('artifacts/study-tracker/src/features/subjects/SubjectCard.tsx', content);
