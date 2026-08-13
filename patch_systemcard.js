const fs = require('fs');
const path = '/app/applet/artifacts/study-tracker/src/features/subjects/SystemCard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add Folder to imports if not present
if (!content.includes('import { TopicList }')) {
  content = content.replace(/import { CurriculumSets } from '.\/CurriculumSets';/, "import { CurriculumSets } from './CurriculumSets';\nimport { TopicList } from './TopicList';");
}
if (!content.includes('Folder')) {
  content = content.replace(/ChevronDown, /, 'ChevronDown, Folder, ');
}

// Add setSelectedTopicId, setSelectedTopicName
if (!content.includes('setSelectedTopicId')) {
  content = content.replace(/selectedTopicId, selectedTopicName/, 'selectedTopicId, setSelectedTopicId, selectedTopicName, setSelectedTopicName');
}

const targetStart = '  return (\n\n    <>\n      <div\n        ref={cardRef}';
const targetRegex = /  return \([\s\S]*?(?=      <Dialog open={showRenameDialog})/;

const replacement = `  return (
    <>
      <div
        ref={cardRef}
        className={cn(
          "group relative flex flex-col rounded-2xl border transition-all duration-300",
          highlighted ? "border-primary/50 shadow-[0_0_20px_rgba(var(--primary),0.1)]" : "border-border/40 hover:border-border",
          "bg-card"
        )}
      >
        {/* Header (always visible) */}
        <div className="flex items-center gap-3 p-4 pb-2">
          <div
            {...dragHandleProps}
            className="w-6 h-6 flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-grab active:cursor-grabbing focus:outline-none shrink-0"
            aria-label="Drag handle"
          >
            <div className="grid grid-cols-2 gap-[2px]">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-[3px] h-[3px] rounded-full bg-current opacity-70" />
              ))}
            </div>
          </div>
          
          <Star className="w-4 h-4 text-muted-foreground shrink-0" />
          
          <h3 className="font-bold text-base text-foreground truncate min-w-0">
            {system.name}
          </h3>
          
          {system.status && (
            <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border shrink-0", 
              system.status === 'Strong' ? "text-emerald-500 border-emerald-500/30" : 
              system.status === 'Average' ? "text-amber-500 border-amber-500/30" : 
              "text-rose-500 border-rose-500/30"
            )}>
              {system.status}
            </span>
          )}
          
          <div className="flex-1" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 focus:outline-none">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl">
              <DropdownMenuItem onClick={() => setShowLogSession(true)}>
                <CheckSquare className="w-4 h-4 mr-2" /> Log Session
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowRenameDialog(true)}>
                <Edit2 className="w-4 h-4 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-destructive focus:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button 
            className="text-muted-foreground hover:text-foreground shrink-0 focus:outline-none p-1"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronDown className={cn("w-4 h-4 transition-transform", expanded && "rotate-180")} />
          </button>
        </div>

        {/* Subheader: Progress Pill */}
        <div className="pl-[52px] pb-4">
          <span className="inline-flex px-1.5 py-0.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[11px] font-semibold rounded-[4px]">
             {progress}% Complete
          </span>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="border-t border-border/40 bg-card/50 rounded-b-2xl animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="p-4 space-y-8">
              
              {/* Study Blocks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Folder className="w-3.5 h-3.5" />
                    Study Blocks
                  </h4>
                </div>
                <CurriculumSets 
                  systemId={system.id!} 
                  subjectId={system.subjectId} 
                  topics={finalTopics} 
                  onLogScore={(setId, setName) => handleSetLogScore(setId, setName)}
                />
              </div>

              {/* Topics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Topics
                  </h4>
                </div>
                <TopicList
                  topics={finalTopics}
                  subjectId={system.subjectId}
                  subjectName={subjectName}
                  systemId={system.id!}
                  systemName={system.name}
                  onLogScore={handleSetLogScore}
                  onViewMarkers={(topicId, topicName) => {
                    setSelectedTopicId(topicId);
                    setSelectedTopicName(topicName);
                    setShowViewMarkersDialog(true);
                  }}
                  onLeaveMarker={(topicId, topicName) => {
                    setSelectedTopicId(topicId);
                    setSelectedTopicName(topicName);
                    setShowInsightDialog(true);
                  }}
                  onRenameTopic={handleRenameTopic}
                  onDeleteTopic={handleDeleteTopic}
                  onAddTopic={handleAddCustomTopic}
                />
              </div>

              {/* Memory Decay Calibration */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5" />
                    Memory Decay Calibration
                  </h4>
                  <DropdownMenu open={showDecayCalibration} onOpenChange={setShowDecayCalibration}>
                    <DropdownMenuTrigger className="text-xs font-semibold text-teal-500 hover:text-teal-400 flex items-center gap-1 focus:outline-none">
                      {system.decayFactor ? system.decayFactor.toFixed(2) : '1.00'}x Speed
                      <ChevronDown className="w-3 h-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {DECAY_CALIBRATION_PRESETS.map((preset) => (
                        <DropdownMenuItem
                          key={preset.value}
                          onClick={() => {
                            updateSystem(system.id!, { decayFactor: preset.value });
                          }}
                          className="flex justify-between"
                        >
                          <span>{preset.label}</span>
                          <span className="text-muted-foreground text-xs">{preset.value}x</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Weak Areas / Notes */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Weak Areas / Notes
                </h4>
                <Textarea
                  value={localNotes}
                  onChange={handleNotesChange}
                  placeholder="Note down concepts you struggle with..."
                  className="min-h-[80px] bg-muted/30 border-border/50 resize-none text-sm rounded-xl focus-visible:ring-1 focus-visible:ring-primary/50 placeholder:text-muted-foreground/50"
                />
              </div>

            </div>
            
            {/* Footer */}
            <div className="grid grid-cols-2 divide-x divide-border/40 border-t border-border/40 bg-muted/10 rounded-b-2xl">
              <div className="p-3 px-4 flex justify-between items-center">
                <div className="text-[10px] text-muted-foreground">Last revised</div>
                <div className="text-xs font-semibold text-teal-500">
                  {system.lastRevised ? formatDistanceToNow(system.lastRevised, { addSuffix: true }) : 'Never'}
                </div>
              </div>
              <div className="p-3 px-4 flex justify-between items-center">
                <div className="text-[10px] text-muted-foreground">Next review</div>
                <div className="text-xs font-semibold text-teal-500">
                  {revisionDue ? 'Due' : 'Pending'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>\n`;

content = content.replace(targetRegex, replacement);
fs.writeFileSync(path, content, 'utf8');
console.log('patched systemcard');
