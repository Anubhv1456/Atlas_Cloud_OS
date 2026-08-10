const fs = require('fs');
const file = './artifacts/study-tracker/src/features/subjects/SystemCard.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `                    <div className="flex flex-col items-center px-2 flex-1 sm:flex-none">
                      <span className="text-[10px] text-muted-foreground/70 tracking-wide font-medium mb-0.5">Next review</span>
                      <span className="text-xs text-primary font-medium">{system.nextRevisionDate ? (isToday(new Date(system.nextRevisionDate)) ? 'Today' : isTomorrow(new Date(system.nextRevisionDate)) ? 'Tomorrow' : formatDistanceToNow(new Date(system.nextRevisionDate), { addSuffix: true })) : 'Pending'}</span>
                    </div>`;

const replacementStr = `                    <div className="flex flex-col items-center px-2 flex-1 sm:flex-none cursor-help" title={system.nextRevisionDate ? format(new Date(system.nextRevisionDate), 'MMM d, yyyy') : ''}>
                      <span className="text-[10px] text-muted-foreground/70 tracking-wide font-medium mb-0.5">Next review</span>
                      <span className="text-xs text-primary font-medium">{system.nextRevisionDate ? (revisionOverdue ? 'Overdue' : revisionDue ? 'Due Soon' : 'Healthy') : 'Pending'}</span>
                    </div>`;

content = content.replace(targetStr, replacementStr);

fs.writeFileSync(file, content);
