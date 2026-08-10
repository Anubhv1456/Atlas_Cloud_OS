const fs = require('fs');
const file = './artifacts/study-tracker/src/features/subjects/SystemCard.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `                    <RevisionRow
                      label="Next Recall Due"
                      value={system.nextRevisionDate
                        ? format(new Date(system.nextRevisionDate), 'MMM d, yyyy')
                        : '—'}
                      highlight={revisionDue}
                      highlightClass={revisionOverdue ? 'text-destructive font-semibold' : 'text-amber-500 dark:text-amber-400 font-semibold'}
                    />`;

const replacementStr = `                    <div className="flex items-center justify-between text-xs py-1.5 border-b border-border/30 last:border-0 group" title={system.nextRevisionDate ? format(new Date(system.nextRevisionDate), 'MMM d, yyyy') : ''}>
                      <span className="text-muted-foreground">Next Recall Due</span>
                      <span className={revisionOverdue ? 'text-destructive font-semibold' : revisionDue ? 'text-amber-500 dark:text-amber-400 font-semibold' : 'text-emerald-500 dark:text-emerald-400 font-semibold'}>
                        {system.nextRevisionDate ? (revisionOverdue ? 'Overdue' : revisionDue ? 'Due Soon' : 'Healthy') : '—'}
                      </span>
                    </div>`;

content = content.replace(targetStr, replacementStr);

fs.writeFileSync(file, content);
