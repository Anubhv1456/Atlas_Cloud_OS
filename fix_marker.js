const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/features/subjects/SystemCard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                {/* Notes */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Weak Areas / Notes</label>
                  <Textarea value={system.weakAreas} onChange={handleNotesChange} onBlur={() => {
                    if (system.weakAreas && system.weakAreas.trim().length > 0) {
                      toast('Did you discover a mnemonic or resource that finally made this click?', {
                        action: {
                          label: 'Leave Marker',
                          onClick: () => setShowInsightDialog(true)
                        },
                        id: 'weak-area-insight-' + system.id
                      });
                    }
                  }} placeholder="Note down concepts you struggle with..."
                    className="min-h-[100px] resize-none rounded-xl bg-muted/30 border-transparent focus-visible:bg-background focus-visible:border-primary" />
                </div>`;

const replacement = `                {/* Notes */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Weak Areas / Notes</label>
                  <Textarea value={system.weakAreas} onChange={handleNotesChange} placeholder="Note down concepts you struggle with..."
                    className="min-h-[100px] resize-none rounded-xl bg-muted/30 border-transparent focus-visible:bg-background focus-visible:border-primary" />
                </div>

                {/* Leave a Marker / Revisions Bottom Bar */}
                {system.contentCompleted && system.qbankDone && (
                  <div className="pt-2">
                    <div className="p-1.5 rounded-2xl border border-border/40 bg-card/40 flex items-center justify-between shadow-sm overflow-hidden flex-wrap sm:flex-nowrap gap-2 sm:gap-0">
                      <Button variant="ghost" className="rounded-xl gap-2 text-muted-foreground hover:text-foreground h-11 px-3.5" onClick={() => setShowInsightDialog(true)}>
                        <Bookmark className="w-4 h-4 text-primary" /> <span className="hidden sm:inline">View Markers</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-mono font-bold">12</span>
                      </Button>
                      
                      <div className="hidden sm:block w-px h-6 bg-border/50" />
                      
                      <div className="flex flex-col items-center px-2 flex-1 sm:flex-none">
                        <span className="text-[10px] text-muted-foreground/70 tracking-wide font-medium mb-0.5">Last revised</span>
                        <span className="text-xs text-primary font-medium">{system.lastRevisionDate ? formatDistanceToNow(new Date(system.lastRevisionDate), { addSuffix: true }) : 'Never'}</span>
                      </div>

                      <div className="hidden sm:block w-px h-6 bg-border/50" />
                      
                      <div className="flex flex-col items-center px-2 flex-1 sm:flex-none">
                        <span className="text-[10px] text-muted-foreground/70 tracking-wide font-medium mb-0.5">Next review</span>
                        <span className="text-xs text-primary font-medium">{system.nextRevisionDate ? (isToday(new Date(system.nextRevisionDate)) ? 'Today' : isTomorrow(new Date(system.nextRevisionDate)) ? 'Tomorrow' : formatDistanceToNow(new Date(system.nextRevisionDate), { addSuffix: true })) : 'Pending'}</span>
                      </div>

                      <Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-4 h-11 shadow-sm w-full sm:w-auto mt-2 sm:mt-0" onClick={() => setShowInsightDialog(true)}>
                        <Compass className="w-4 h-4 mr-2" /> Leave a Marker
                      </Button>
                    </div>
                    <div className="mt-3 mb-1 flex items-start sm:items-center justify-center gap-1.5 text-[11px] text-muted-foreground font-medium px-2 text-center sm:text-left">
                      <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5 sm:mt-0" />
                      <span>Share high-yield notes, mnemonics, or explanations to help fellow Wayfinders.</span>
                    </div>
                  </div>
                )}`;

if (content.includes('toast(')) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log('Replaced');
} else {
  console.log('Not found');
}
