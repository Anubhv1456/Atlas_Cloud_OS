const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/subjects/TopicList.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetMenu = `                {/* Right Actions Cluster */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Contextual More Options Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        type="button"
                        className="p-1.5 text-muted-foreground/40 hover:text-foreground transition-colors rounded-lg hover:bg-muted cursor-pointer focus:outline-none"
                        title="More options"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border border-border/60">
                      <DropdownMenuItem 
                        onClick={() => onViewMarkers?.(topic.id, topic.name)}
                        className="text-xs cursor-pointer"
                      >
                        <Compass className="w-3.5 h-3.5 mr-2 text-primary" /> 
                        <span>Trail Markers</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => toggleWeak(topic.id)}
                        className="text-xs cursor-pointer"
                      >
                        <TriangleAlert className={cn("w-3.5 h-3.5 mr-2", isWeak ? "text-rose-500" : "text-muted-foreground")} /> 
                        <span>{isWeak ? "Remove Weak Flag" : "Flag as Weak Concept"}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => startInlineEdit(topic)}
                        className="text-xs cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-2 text-foreground" /> 
                        <span>Rename Topic</span>
                      </DropdownMenuItem>

                      {revisionSets.length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Add to Study Block
                          </DropdownMenuLabel>
                          {revisionSets.map(rs => (
                            <DropdownMenuItem 
                              key={rs.id} 
                              onClick={() => handleAddToSet(rs.id!, topic.id)}
                              className="text-xs cursor-pointer"
                            >
                              <FolderPlus className="w-3.5 h-3.5 mr-2 text-primary" /> 
                              <span className="truncate">{rs.name}</span>
                            </DropdownMenuItem>
                          ))}
                        </>
                      )}
                      
                      <DropdownMenuItem 
                        onClick={() => { setAddTopicToSet(topic); setFormOpen(true); }}
                        className="text-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 mr-2 text-primary" /> 
                        <span>New Study Block...</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        className="text-destructive focus:bg-destructive/10 text-xs cursor-pointer" 
                        onClick={() => setTopicToDelete(topic)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> 
                        <span>Delete Topic</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>`;

const newMenu = `                {/* Right Actions Cluster */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Weak Concept Toggle */}
                  <button 
                    type="button"
                    onClick={() => toggleWeak(topic.id)}
                    className={cn(
                      "p-1.5 rounded-lg border transition-colors cursor-pointer",
                      isWeak 
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20" 
                        : "bg-transparent border-transparent text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted"
                    )}
                    title={isWeak ? "Weak concept (flagged for review)" : "Mark as weak concept"}
                  >
                    <TriangleAlert className="w-3.5 h-3.5" />
                  </button>

                  {/* Contextual More Options Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        type="button"
                        className="p-1.5 text-muted-foreground/40 hover:text-foreground transition-colors rounded-lg hover:bg-muted cursor-pointer focus:outline-none"
                        title="More options"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border border-border/60">
                      <DropdownMenuItem 
                        onClick={() => startInlineEdit(topic)}
                        className="text-xs cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-2 text-foreground" /> 
                        <span>Rename Topic</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        className="text-destructive focus:bg-destructive/10 text-xs cursor-pointer" 
                        onClick={() => setTopicToDelete(topic)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> 
                        <span>Delete Topic</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>`;

if (code.includes('Trail Markers Action') || code.includes('Remove Weak Flag')) {
  code = code.replace(targetMenu, newMenu);
  fs.writeFileSync(file, code);
  console.log('Patched');
} else {
  console.log('Not found');
}
