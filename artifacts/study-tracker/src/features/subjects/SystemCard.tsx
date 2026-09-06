import { LogSessionDialog } from "./LogSessionDrawer";
import { CheckSquare } from "lucide-react";
import { useEffect, useRef, useState } from 'react';
import { StudySystem, SystemStatus } from '@/db';
import { updateSystem, deleteSystem, logCompletion, recordInitialEvaluation, completeRevision, startActiveRevision, logDailyRevisionCheckIn, toggleSystemLengthy } from '@/db';
import { ConfidenceDialog } from '@/features/revision/ConfidenceDialog';
import { ScoreLogModal } from '@/features/analytics/ScoreLogModal';
import { ChevronDown, Folder, Trash2, Check, RotateCcw, Clock, GripVertical, CheckCircle2, Award, Sliders, MoreVertical, Edit2, BookOpen, Calendar, Play, Lightbulb, Bookmark, Compass, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';
import { isRevisionDue, isRevisionOverdue, daysOverdue, getRetrievability, getRetrievabilityHealth, DECAY_CALIBRATION_PRESETS, getSystemDecayFactor } from '@/db';
import { calculateSystemProgress } from '@/lib/progress';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { CurriculumSets } from './CurriculumSets';
import { TopicList } from './TopicList';
import { ViewMarkersModal } from './ViewMarkersModal';
import { useSystemCardLogic } from './SystemCard.hooks';

interface SystemCardProps {
  system: StudySystem;
  subjectName: string;
  highlighted?: boolean;
  dragHandleProps?: any;
}

export function SystemCard(props: SystemCardProps) {
  const { system, subjectName, dragHandleProps, highlighted } = props;
  
  const { 
    expanded, setExpanded, 
    showRenameDialog, setShowRenameDialog, renameValue, setRenameValue, handleRenameSave, 
    showDeleteConfirm, setShowDeleteConfirm, handleDeleteConfirm, 
    showInsightDialog, setShowInsightDialog, insightType, setInsightType, insightContent, setInsightContent, insightSource, setInsightSource, isSubmittingInsight, handleInsightSubmit, 
    showViewMarkersDialog, setShowViewMarkersDialog, selectedTopicId, setSelectedTopicId, selectedTopicName, setSelectedTopicName, 
    showEvalDialog, handleEvalSelect, scoreModalTopicId, scoreModalTopicName, showScoreModal, setShowScoreModal, 
    cardRef, progress, completedCount, contentPct, revisionDue, revisionOverdue, overdueDays, 
    weakTopicsCount, totalTopicsCount, blocksCompleted, blocksTotal,
    toggleQBank, localNotes, handleStatusChange, handleNotesChange, handleDelete, handleRevisionComplete, 
    handleUpdateTopic, handleRenameTopic, handleDeleteTopic, handleAddCustomTopic, handleResetTopics, hasCustomTopicEdits, finalTopics, 
    showLogSession, setShowLogSession, handleSetLogScore, showDecayCalibration, setShowDecayCalibration, toggleHighYield 
  } = useSystemCardLogic(props);

  return (
    <>
      <div
        ref={cardRef}
        className={cn(
          "group relative flex flex-col rounded-2xl border transition-all duration-200",
          highlighted ? "border-primary/50 shadow-[0_0_20px_rgba(var(--primary),0.1)]" : "border-border/40 hover:border-border/80",
          "bg-card"
        )}
      >
        {/* Header */}
        <div className="p-4 pb-3 cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-2.5">
            <div
              {...dragHandleProps}
              onClick={(e) => e.stopPropagation()}
              className="w-5 h-5 flex items-center justify-center text-muted-foreground/30 hover:text-foreground hover:bg-muted rounded transition-colors cursor-grab active:cursor-grabbing focus:outline-none shrink-0"
              aria-label="Drag handle"
            >
              <div className="grid grid-cols-2 gap-[2px]">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-[2.5px] h-[2.5px] rounded-full bg-current opacity-70" />
                ))}
              </div>
            </div>
            
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleHighYield(); }} 
              className="focus:outline-none p-0.5 rounded hover:bg-muted cursor-pointer shrink-0"
              title="Toggle High Yield Focus"
            >
              <Star className={cn("w-4 h-4 transition-colors", system.isHighYield ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30 hover:text-amber-500/70")} />
            </button>
            
            <h3 className="font-bold text-base text-foreground truncate min-w-0 flex-1">
              {system.name}
            </h3>

            {system.status && (
              <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shrink-0 hidden sm:inline-block", 
                system.status === 'Strong' ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10" : 
                system.status === 'Average' ? "text-amber-500 border-amber-500/30 bg-amber-500/10" : 
                "text-rose-500 border-rose-500/30 bg-rose-500/10"
              )}>
                {system.status}
              </span>
            )}

            <span className="inline-flex px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold font-mono rounded-md shrink-0">
              {progress}%
            </span>

            {(revisionDue || overdueDays > 0) && (
              <Button
                type="button"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLogSession(true);
                }}
                className="h-7 text-xs font-bold px-2.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 shrink-0 transition-colors gap-1 cursor-pointer"
                title="Start SDSR Revision"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Revise</span>
              </Button>
            )}

            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 focus:outline-none cursor-pointer">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-xl">
                  <DropdownMenuItem onClick={() => setShowLogSession(true)}>
                    <CheckSquare className="w-4 h-4 mr-2 text-primary" /> Record Session
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowRenameDialog(true)}>
                    <Edit2 className="w-4 h-4 mr-2" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-destructive focus:text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <button 
              type="button"
              className="text-muted-foreground hover:text-foreground shrink-0 focus:outline-none p-1 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            >
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", expanded && "rotate-180")} />
            </button>
          </div>

          {/* Sub-Telemetry Line */}
          <div className="pt-2 flex items-center gap-3 text-xs text-muted-foreground font-medium flex-wrap">
            {blocksTotal > 0 && (
              <span className="flex items-center gap-1 text-xs">
                <Folder className="w-3 h-3 text-primary/70" />
                <span>Modules: <strong className="text-foreground">{blocksCompleted}/{blocksTotal}</strong></span>
              </span>
            )}

            <span className="text-xs">
              Topics: <strong className="text-foreground">{totalTopicsCount}</strong>
              {weakTopicsCount > 0 && (
                <span className="text-rose-500 ml-1 font-semibold">({weakTopicsCount} weak)</span>
              )}
            </span>

            {overdueDays > 0 ? (
              <span className="text-xs text-amber-500 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>SDSR Due ({overdueDays}d overdue)</span>
              </span>
            ) : revisionDue ? (
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>SDSR Review Due</span>
              </span>
            ) : system.lastRevised ? (
              <span className="text-xs text-muted-foreground/80">
                Revised {formatDistanceToNow(system.lastRevised, { addSuffix: true })}
              </span>
            ) : null}
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="border-t border-border/40 bg-card/40 rounded-b-2xl animate-in slide-in-from-top-1 fade-in duration-150">
            <div className="p-4 space-y-6">
              
              {/* Quick Action Dock */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
                <button
                  type="button"
                  onClick={() => setShowLogSession(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 font-semibold transition-colors cursor-pointer shrink-0"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Record Session</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowViewMarkersDialog(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 text-foreground hover:bg-muted border border-border/60 font-medium transition-colors cursor-pointer shrink-0"
                >
                  <Compass className="w-3.5 h-3.5 text-primary" />
                  <span>Trail Markers</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowScoreModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 text-foreground hover:bg-muted border border-border/60 font-medium transition-colors cursor-pointer shrink-0"
                >
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>Log Score</span>
                </button>
              </div>

              {/* Curriculum Modules (Study Blocks) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-primary" />
                    <span>Curriculum Modules</span>
                  </h4>
                </div>
                <CurriculumSets 
                  systemId={system.id!} 
                  subjectId={system.subjectId} 
                  topics={finalTopics} 
                  onLogScore={(setId, setName) => handleSetLogScore(setId, setName)}
                />
              </div>

              {/* Topics List */}
              <div>
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
                  onResetTopics={handleResetTopics}
                  hasCustomEdits={hasCustomTopicEdits}
                />
              </div>

              {/* Clinical Pearls & Weak Concepts + Retention Calibration */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Clinical Pearls & Weak Concepts
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-xs font-medium text-muted-foreground">Retention Calibration:</span>
                    <DropdownMenu open={showDecayCalibration} onOpenChange={setShowDecayCalibration}>
                      <DropdownMenuTrigger className="font-semibold text-primary hover:underline flex items-center gap-0.5 focus:outline-none cursor-pointer">
                        {system.decayFactor ? system.decayFactor.toFixed(2) : '1.00'}x
                        <ChevronDown className="w-3 h-3" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-xl">
                        {DECAY_CALIBRATION_PRESETS.map((preset) => (
                          <DropdownMenuItem
                            key={preset.value}
                            onClick={() => {
                              updateSystem(system.id!, { decayFactor: preset.value });
                            }}
                            className="flex justify-between text-xs cursor-pointer"
                          >
                            <span>{preset.label}</span>
                            <span className="text-muted-foreground font-mono">{preset.value}x</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <Textarea
                  value={localNotes}
                  onChange={handleNotesChange}
                  placeholder="Note down high-yield diagnostic criteria, mnemonics, or concepts requiring extra review..."
                  className="min-h-[70px] bg-muted/20 border-border/40 resize-none text-xs rounded-xl focus-visible:ring-1 focus-visible:ring-primary/50 placeholder:text-muted-foreground/50 leading-relaxed"
                />
              </div>

            </div>
            
            {/* Integrated Ambient Footer Bar */}
            <div className="px-4 py-2.5 border-t border-border/40 bg-muted/20 rounded-b-2xl text-xs font-medium text-muted-foreground flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-1.5">
                <span>Last revised:</span>
                <strong className="text-foreground font-semibold">
                  {system.lastRevised ? formatDistanceToNow(system.lastRevised, { addSuffix: true }) : 'Never'}
                </strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span>SDSR Schedule:</span>
                <strong className={cn("font-semibold font-mono", overdueDays > 0 ? "text-amber-500" : revisionDue ? "text-amber-400" : "text-emerald-500")}>
                  {overdueDays > 0 ? `Overdue by ${overdueDays}d` : revisionDue ? 'Due Today' : 'Optimal Retention'}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Lazy-loaded Dialog Subtrees */}
      {showLogSession && (
        <LogSessionDialog isOpen={showLogSession} onOpenChange={setShowLogSession} system={system} subjectId={system.subjectId} topics={finalTopics} />
      )}

      {showRenameDialog && (
        <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
          <DialogContent className="sm:max-w-[360px] rounded-2xl mx-4 w-[calc(100%-2rem)]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Rename System</DialogTitle>
            </DialogHeader>
            <div className="py-3 space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">System Name</label>
              <Input
                autoFocus
                type="text"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleRenameSave(); } }}
                placeholder="e.g. Cardiology"
                className="text-base py-5 px-4 bg-muted/50 border-transparent focus-visible:ring-primary focus-visible:bg-background"
              />
            </div>
            <DialogFooter className="flex-row gap-2 sm:justify-end mt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowRenameDialog(false)}>Cancel</Button>
              <Button className="flex-1 rounded-xl font-semibold shadow-sm" onClick={handleRenameSave} disabled={!renameValue.trim() || renameValue.trim() === system.name}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showDeleteConfirm && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-[360px] rounded-2xl mx-4 w-[calc(100%-2rem)]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-destructive">Delete System</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <span className="font-semibold text-foreground">{system.name}</span>? This action cannot be undone.
              </p>
            </div>
            <DialogFooter className="flex-row gap-2 sm:justify-end mt-4">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button variant="destructive" className="flex-1 rounded-xl font-semibold shadow-sm" onClick={handleDeleteConfirm}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showInsightDialog && (
        <Dialog open={showInsightDialog} onOpenChange={setShowInsightDialog}>
          <DialogContent className="sm:max-w-[440px] rounded-2xl mx-4 w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto border border-border/60">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary shrink-0" />
                <span className="truncate">Leave Trail Marker {selectedTopicName ? `for ${selectedTopicName}` : `in ${system.name}`}</span>
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">Leave high-yield guidance on this trail for future medical candidates.</p>
            </DialogHeader>
            <div className="py-2 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Marker Classification</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'clinical_pearl', icon: '📌', label: 'Clinical Pearl', desc: 'High-yield diagnostic/rx key' },
                    { id: 'mnemonic', icon: '💡', label: 'Mnemonic & Trick', desc: 'Memory aid or acronym' },
                    { id: 'pitfall', icon: '⚠️', label: 'Exam Pitfall', desc: 'Common examiner trap' },
                    { id: 'resource', icon: '🎥', label: 'High-Yield Resource', desc: 'Video, diagram, or chart' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setInsightType(type.id as any)}
                      className={cn(
                        'flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer',
                        insightType === type.id
                          ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/30'
                          : 'border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-border'
                      )}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground mt-0.5 leading-tight">{type.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Medical Insight</label>
                <Textarea
                  autoFocus
                  value={insightContent}
                  onChange={e => setInsightContent(e.target.value)}
                  placeholder="What high-yield diagnostic pearl, mnemonic, or exam trap would you share with a candidate studying this topic?"
                  className="resize-none h-28 bg-muted/30 border-border/60 focus-visible:ring-primary/50 text-xs sm:text-sm leading-relaxed rounded-xl"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Reference Source (Optional)</label>
                <Input
                  type="text"
                  value={insightSource}
                  onChange={e => setInsightSource(e.target.value)}
                  placeholder="e.g. Primary QBank, Standard Reference, High-Yield Notes"
                  className="bg-muted/30 border-border/60 focus-visible:ring-primary/50 text-xs rounded-xl h-9"
                />
              </div>
            </div>
            <DialogFooter className="flex-row gap-2 sm:justify-end mt-2">
              <Button variant="ghost" className="flex-1 rounded-xl text-xs font-semibold cursor-pointer" onClick={() => setShowInsightDialog(false)}>Cancel</Button>
              <Button 
                className="flex-1 rounded-xl font-bold text-xs shadow-sm cursor-pointer" 
                onClick={handleInsightSubmit} 
                disabled={!insightContent.trim() || isSubmittingInsight}
              >
                {isSubmittingInsight ? 'Placing Marker...' : 'Place Trail Marker'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showViewMarkersDialog && (
        <ViewMarkersModal 
          isOpen={showViewMarkersDialog}
          onClose={() => setShowViewMarkersDialog(false)}
          systemId={system.id!}
          systemName={system.name}
          topicId={selectedTopicId}
          topicName={selectedTopicName}
          onLeaveMarker={() => setShowInsightDialog(true)}
        />
      )}

      {showScoreModal && (
        <ScoreLogModal
          isOpen={showScoreModal}
          onClose={() => setShowScoreModal(false)}
          initialType="revision"
          initialSubjectId={system.subjectId}
          initialSystemId={system.id}
          initialTitle={`${system.name} Revision Score`}
        />
      )}
    </>
  );
}
