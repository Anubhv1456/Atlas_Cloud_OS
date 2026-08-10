const fs = require('fs');
const file = './artifacts/study-tracker/src/features/subjects/TopicList.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add CircleDashed to imports
content = content.replace(
  `import { CheckCircle2, Circle, Target, MessageSquarePlus, MessageCircle, TriangleAlert, ChevronDown, FolderPlus, Plus, GripVertical, Settings2 } from 'lucide-react';`,
  `import { CheckCircle2, Circle, CircleDashed, Target, MessageSquarePlus, MessageCircle, TriangleAlert, ChevronDown, FolderPlus, Plus, GripVertical, Settings2 } from 'lucide-react';`
);

const targetRender = `                          ) : (
                            <span className={cn("text-sm font-medium transition-colors", "text-foreground")}>
                              {topic.name}
                            </span>
                          )}`;

const replacementRender = `                          ) : (
                            <div className="flex items-center gap-2">
                              {(() => {
                                const sets = revisionSets.filter(rs => rs.topicIds.includes(topic.id));
                                let status = 'empty';
                                if (sets.length > 0) {
                                  if (sets.some(rs => rs.contentCompleted && rs.qbankCompleted)) status = 'checked';
                                  else if (sets.some(rs => rs.contentCompleted || rs.qbankCompleted)) status = 'half';
                                }
                                if (status === 'checked') return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
                                if (status === 'half') return <CircleDashed className="w-4 h-4 text-amber-500 shrink-0" />;
                                return <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />;
                              })()}
                              <span className={cn("text-sm font-medium transition-colors", "text-foreground truncate")}>
                                {topic.name}
                              </span>
                            </div>
                          )}`;

content = content.replace(targetRender, replacementRender);

fs.writeFileSync(file, content);
