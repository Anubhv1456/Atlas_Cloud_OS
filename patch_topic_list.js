const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/subjects/TopicList.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add ChevronDown to imports
if (!content.includes('ChevronDown')) {
  content = content.replace("Plus, FolderPlus } from 'lucide-react';", "Plus, FolderPlus, ChevronDown, Target } from 'lucide-react';");
}

// Add dropdown indicator to topic titles
content = content.replace(
  /<button className="text-left w-full focus:outline-none">([\s\S]*?)<\/button>/,
  `<button className="text-left w-full focus:outline-none flex items-center justify-between group-hover:text-primary transition-colors">
                        <div>$1</div>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mr-2" />
                      </button>`
);

// Replace the responsive action bar buttons
content = content.replace(
  `                  <button 
                    onClick={() => onLogScore && onLogScore(topic.id, topic.name)}
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded-md border transition-colors flex items-center gap-1",
                      "bg-transparent border-border text-muted-foreground hover:border-primary/50"
                    )}
                    title="Log Test Score"
                  >
                    🎯 Score
                  </button>`,
  `                  <button 
                    onClick={() => onLogScore && onLogScore(topic.id, topic.name)}
                    className={cn(
                      "p-1.5 sm:px-2 sm:py-1 text-xs font-medium rounded-md border transition-colors flex items-center gap-1",
                      "bg-transparent border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
                    )}
                    title="Log Test Score"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Score</span>
                  </button>`
);

content = content.replace(
  `                  <button 
                    onClick={() => toggleContent(topic.id)}
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded-md border transition-colors flex items-center gap-1",
                      isContentDone ? "bg-primary/10 border-primary/30 text-primary" : "bg-transparent border-border text-muted-foreground hover:border-primary/50"
                    )}
                    title="Toggle Content Completion"
                  >
                    {isContentDone ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                    Content
                  </button>`,
  `                  <button 
                    onClick={() => toggleContent(topic.id)}
                    className={cn(
                      "p-1.5 sm:px-2 sm:py-1 text-xs font-medium rounded-md border transition-colors flex items-center gap-1",
                      isContentDone ? "bg-primary/10 border-primary/30 text-primary" : "bg-transparent border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
                    )}
                    title="Toggle Content Completion"
                  >
                    {isContentDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">Content</span>
                  </button>`
);

content = content.replace(
  `                  <button 
                    onClick={() => toggleQBank(topic.id)}
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded-md border transition-colors flex items-center gap-1",
                      isQBankDone ? "bg-primary/10 border-primary/30 text-primary" : "bg-transparent border-border text-muted-foreground hover:border-primary/50"
                    )}
                    title="Toggle QBank Completion"
                  >
                    {isQBankDone ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                    QBank
                  </button>`,
  `                  <button 
                    onClick={() => toggleQBank(topic.id)}
                    className={cn(
                      "p-1.5 sm:px-2 sm:py-1 text-xs font-medium rounded-md border transition-colors flex items-center gap-1",
                      isQBankDone ? "bg-primary/10 border-primary/30 text-primary" : "bg-transparent border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
                    )}
                    title="Toggle QBank Completion"
                  >
                    {isQBankDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">QBank</span>
                  </button>`
);

fs.writeFileSync(file, content);
console.log('TopicList.tsx patched.');
