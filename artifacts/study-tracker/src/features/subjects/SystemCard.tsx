import { useEffect, useRef, useState } from 'react';
import { StudySystem, SystemStatus } from '@/db';
import { updateSystem, deleteSystem, logCompletion, recordInitialEvaluation, completeRevision, startActiveRevision, logDailyRevisionCheckIn, toggleSystemLengthy } from '@/db';
import { ConfidenceDialog } from '@/features/revision/ConfidenceDialog';
import { ScoreLogModal } from '@/features/analytics/ScoreLogModal';
import { ChevronDown, Trash2, Check, RotateCcw, Clock, GripVertical, CheckCircle2, Award, Sliders, MoreVertical, Edit2, BookOpen, Calendar, Play, Lightbulb, Bookmark, Compass, Sparkles, Star } from 'lucide-react';
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

interface SystemCardProps {
  system: StudySystem;
  subjectName: string;
  highlighted?: boolean;
  dragHandleProps?: any;
}

// ── Circular progress ring ────────────────────────────────────────────────────
function ContentCircle({ pct }: { pct: number }) {
  const r = 9;
  const circ = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, pct / 100)) * circ;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" className="shrink-0 -rotate-90" aria-hidden>
      <circle cx="11" cy="11" r={r} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground/25" />
      {pct > 0 && (
        <circle cx="11" cy="11" r={r} fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          className="text-primary transition-all duration-300" />
      )}
    </svg>
  );
}

// ── SystemCard ────────────────────────────────────────────────────────────────
import { ViewMarkersModal } from './ViewMarkersModal';
import { useSystemCardLogic } from './SystemCard.hooks';
import { TopicList } from './TopicList';
import { CurriculumSets } from './CurriculumSets';
import { ALL_SYSTEMS, ALL_SUBJECTS } from '@/data/ontology';

export function SystemCard(props: SystemCardProps) {
  const { flags } = useFeatureFlags();
  const { system, subjectName, dragHandleProps, highlighted } = props;
  const ontologySubject = ALL_SUBJECTS.find(s => s.name === subjectName);
  const ontologySystem = ALL_SYSTEMS.find(s => s.name === system.name && s.subjectId === ontologySubject?.id);
  const topics = ontologySystem?.topics || [];
  const {
    expanded, setExpanded,
    showInitDialog, setShowInitDialog, initValue, setInitValue,
    showEditContent, setShowEditContent, editCompleted, setEditCompleted, editTotal, setEditTotal,
    showEvalDialog, setShowEvalDialog, showDeleteConfirm, setShowDeleteConfirm,
    showScoreModal, setShowScoreModal, scoreModalTopicId, scoreModalTopicName, handleSetLogScore, showDecayCalibration, setShowDecayCalibration,
    showRenameDialog, setShowRenameDialog, renameValue, setRenameValue,
    showInsightDialog, setShowInsightDialog, showViewMarkersDialog, setShowViewMarkersDialog, selectedTopicId, setSelectedTopicId, selectedTopicName, setSelectedTopicName, insightContent, setInsightContent,
    insightType, setInsightType, insightSource, setInsightSource, isSubmittingInsight, handleInsightSubmit,
    cardRef, progress, completedCount, contentPct,
    revisionDue, revisionOverdue, overdueDays,
    handleContentTap, handleContentPointerDown, handleContentPointerUp, handleContentPointerLeave,
    handleInitSave, handleEditSave, handleEditReset, toggleQBank, handleEvalSelect,
    localNotes, handleStatusChange, handleNotesChange, handleDelete, handleDeleteConfirm,
    handleRenameSave, handleRevisionComplete,
    handleUpdateTopic, handleRenameTopic, handleDeleteTopic, handleAddCustomTopic, finalTopics
  } = useSystemCardLogic(props);

  const statusColors: Record<SystemStatus, string> = {
    Strong:  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    Average: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    Weak:    'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
  };

  return (
    <>
      <div ref={cardRef} className={cn(
        'bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-all duration-300',
        (system.status || 'Average') === 'Strong' && 'border-[hsl(var(--gold))]/30',
        revisionOverdue && 'border-amber-500/50',
        revisionDue && !revisionOverdue && 'border-amber-500/25',
        highlighted && 'ring-1 ring-primary ring-offset-2 ring-offset-background',
      )}>
        {/* Active Revision Banner */}
        {system.revisionState === 'in_progress' && (
          <div className="bg-sky-500/10 border-b border-sky-500/20 text-sky-600 dark:text-sky-400 px-4 py-2.5 text-xs font-medium flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              <span className="font-semibold uppercase tracking-wider text-[11px]">Active Multi-Day Revision</span>
              <span className="text-muted-foreground">• Day {system.revisionDaysLogged || 1}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded-md font-mono font-bold">
                {system.revisionProgressPercent || 0}% Done
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                Queue Paused
              </span>
            </div>
          </div>
        )}

        {/* Revision due banner (if not active in progress) */}
        {revisionDue && system.revisionState !== 'in_progress' && (
          <div className={cn(
            'flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider',
            'bg-amber-500/10 text-amber-600 dark:text-amber-500',
          )}>
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {revisionOverdue
              ? 'Pending Review'
              : 'Revision Due Today'}
          </div>
        )}

        {/* Header */}
        <div className="w-full flex items-center transition-colors min-w-0">
          {dragHandleProps && (
            <div {...dragHandleProps} className="p-2 sm:p-3 text-muted-foreground/30 hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing shrink-0">
              <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          )}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setExpanded(!expanded)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setExpanded(!expanded);
              }
            }}
            className={cn("flex-1 min-w-0 p-4 flex flex-col justify-center text-left focus:outline-none hover:bg-muted/5 cursor-pointer select-none gap-3", !dragHandleProps && "pl-4")}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 min-w-0 flex-wrap sm:flex-nowrap">
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateSystem(system.id!, { isHighYield: !system.isHighYield });
                  }}
                  className={cn(
                    "shrink-0 transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none cursor-pointer flex items-center justify-center -ml-1 p-1 rounded-full",
                    system.isHighYield 
                      ? "text-amber-500 bg-amber-500/10" 
                      : "text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-muted"
                  )}
                  title={system.isHighYield ? "High Yield Topic (Click to unmark)" : "Mark as High Yield Topic"}
                >
                  <Star className={cn("w-[18px] h-[18px] transition-all", system.isHighYield ? "fill-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" : "fill-transparent")} />
                </button>
                <h4 className="font-semibold text-lg leading-tight text-foreground truncate min-w-0">{system.name}</h4>
                <span className={cn('text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-medium border shrink-0', statusColors[system.status || 'Average'])}>
                  {system.status || 'Average'}
                </span>
                {system.focus === 'primary' && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium border border-primary/20 bg-primary/10 text-primary whitespace-nowrap shrink-0">
                    Primary Focus
                  </span>
                )}
                {system.focus === 'secondary' && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium border border-border bg-muted/50 text-muted-foreground whitespace-nowrap shrink-0">
                    Secondary Focus
                  </span>
                )}
                {system.isLengthy && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400 whitespace-nowrap shrink-0 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> Lengthy Topic
                  </span>
                )}
                {getSystemDecayFactor(system) !== 1.0 && (
                  <span className={cn('text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold border whitespace-nowrap shrink-0',
                    getSystemDecayFactor(system) > 1.0 ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  )}>
                    {getSystemDecayFactor(system) > 1.0 ? '⚡' : '🛡️'} {getSystemDecayFactor(system)}x Decay
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-4">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors focus:outline-none shrink-0"
                    aria-label="System options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 rounded-xl">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSystemLengthy(system.id!, !system.isLengthy);
                      }}
                      className="gap-2 py-2 cursor-pointer text-xs font-medium"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-sky-500" />
                      {system.isLengthy ? 'Unmark as Lengthy' : 'Mark as Lengthy Topic'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameValue(system.name);
                        setShowRenameDialog(true);
                      }}
                      className="gap-2 py-2 cursor-pointer text-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      className="text-destructive focus:text-destructive gap-2 py-2 cursor-pointer text-xs font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className={cn('text-muted-foreground transition-transform duration-300 shrink-0', expanded && 'rotate-180')}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full">
              <span className="text-xs font-mono font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">{Math.round(progress)}% Complete</span>
            </div>
          </div>
        </div>
        
        {/* Header Progress Line */}
        {!expanded && (
          <div className="h-[2px] bg-primary/10 w-full">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* Expanded body */}
        <div className={cn('grid transition-all duration-300 ease-in-out', expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
          <div className="overflow-hidden">
            <div className="p-4 pt-0 border-t border-border/50 bg-card">
              <div className="grid gap-2 py-4">
                {/* Study Blocks */}
                <CurriculumSets systemId={system.id!} subjectId={system.subjectId} topics={finalTopics} onLogScore={handleSetLogScore} />

                {/* Topics Checklist */}
                <TopicList topics={finalTopics} subjectId={system.subjectId} systemId={system.id!} subjectName={subjectName} systemName={system.name} onViewMarkers={(id, name) => { setSelectedTopicId(id); setSelectedTopicName(name); setShowViewMarkersDialog(true); }} onLeaveMarker={(id, name) => { setSelectedTopicId(id); setSelectedTopicName(name); setShowInsightDialog(true); }} onLogScore={handleSetLogScore} onRenameTopic={handleRenameTopic} onDeleteTopic={handleDeleteTopic} onAddTopic={handleAddCustomTopic} />
              </div>

              <div className="space-y-6 pt-2">
                {/* ── System Memory Decay Calibration (Collapsible) ───────────────────── */}
                <div className="rounded-xl overflow-hidden transition-all mt-6">
                  <button
                    type="button"
                    onClick={() => setShowDecayCalibration(!showDecayCalibration)}
                    className="w-full flex items-center justify-between py-2 hover:bg-muted/10 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Sliders className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Memory Decay Calibration
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-xs font-medium',
                        getSystemDecayFactor(system) > 1.0
                          ? 'text-amber-500'
                          : getSystemDecayFactor(system) < 1.0
                            ? 'text-emerald-500'
                            : 'text-primary'
                      )}>
                        {getSystemDecayFactor(system).toFixed(2)}x Speed
                      </span>
                      <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200', showDecayCalibration && 'rotate-180')} />
                    </div>
                  </button>

                  {showDecayCalibration && (
                    <div className="pb-3.5 pt-3 border-t border-border/40 mt-2 space-y-3">
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Calibrate memory decay speed for <span className="font-semibold text-foreground">{system.name}</span>. (e.g. 1.5x = 33% faster reviews, 0.8x = 20% slower).
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {DECAY_CALIBRATION_PRESETS.map((p) => {
                          const isSelected = Math.abs(getSystemDecayFactor(system) - p.factor) < 0.05;
                          return (
                            <button
                              key={p.factor}
                              type="button"
                              onClick={async () => {
                                await updateSystem(system.id!, { decayFactor: p.factor });
                                toast.success(`Decay Calibrated: ${p.label}`, {
                                  description: `${system.name} memory decay rate set to ${p.factor}x.`,
                                });
                              }}
                              className={cn(
                                'flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer',
                                isSelected
                                  ? 'bg-primary/10 border-primary text-primary font-bold shadow-2xs ring-1 ring-primary'
                                  : 'bg-background hover:bg-muted/60 border-border text-muted-foreground'
                              )}
                            >
                              <span className="text-base mb-0.5">{p.icon}</span>
                              <span className="text-[11px] font-semibold leading-tight">{p.label}</span>
                              <span className="text-[9px] opacity-75 mt-0.5 font-mono">{p.factor}x</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-1 space-y-1.5">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-muted-foreground font-medium">Fine-tune Decay Factor</span>
                          <span className="font-mono font-semibold text-foreground">{getSystemDecayFactor(system).toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.05"
                          value={getSystemDecayFactor(system)}
                          onChange={async (e) => {
                            const val = parseFloat(e.target.value);
                            await updateSystem(system.id!, { decayFactor: val });
                          }}
                          className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] text-muted-foreground font-medium">
                          <span>0.5x (Sticky Concept)</span>
                          <span>1.0x (Standard)</span>
                          <span>2.0x (Volatile Facts)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Revision details — shown only once revision engine is active */}
                {system.completionDate && (
                  <div className="bg-muted/40 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Spaced Recall Engine</p>
                      {(() => {
                        const ret = getRetrievability(system);
                        const health = getRetrievabilityHealth(ret);
                        return (
                          <span className={cn('text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-background/80 shadow-xs', health.colorClass)}>
                            {health.label}
                          </span>
                        );
                      })()}
                    </div>
                    <RevisionRow label="Revisions Completed" value={String(system.revisionCount ?? 0)} />
                    <RevisionRow
                      label="Last Revised"
                      value={system.lastRevisionDate ? formatDistanceToNow(new Date(system.lastRevisionDate), { addSuffix: true }) : 'Never'}
                    />
                    <RevisionRow
                      label="Memory Stability"
                      value={system.currentRevisionInterval ? `${system.currentRevisionInterval} days` : '—'}
                    />
                    <div className="flex items-center justify-between text-xs py-1.5 border-b border-border/30 last:border-0 group" title={system.nextRevisionDate ? format(new Date(system.nextRevisionDate), 'MMM d, yyyy') : ''}>
                      <span className="text-muted-foreground">Next Recall Due</span>
                      <span className={revisionDue ? 'text-amber-600 dark:text-amber-500 font-semibold' : 'text-emerald-500 dark:text-emerald-400 font-semibold'}>
                        {system.nextRevisionDate ? new Date(system.nextRevisionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                    {/* Multi-Day Active Revision Controls */}
                    {system.revisionState === 'in_progress' ? (
                      <div className="pt-3 pb-1 border-t border-border/60 space-y-3">
                        <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3.5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-sky-500" />
                              <span className="text-xs font-bold text-foreground">
                                Active Multi-Day Revision (Day {system.revisionDaysLogged || 1})
                              </span>
                            </div>
                            <span className="text-[10px] font-mono font-bold bg-sky-500/20 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full">
                              {system.revisionProgressPercent || 0}% Progress
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[11px] text-muted-foreground">
                              <span>Study Progress</span>
                              <span>{system.revisionProgressPercent || 0}%</span>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-sky-500 transition-all duration-300"
                                style={{ width: `${system.revisionProgressPercent || 0}%` }}
                              />
                            </div>
                            <div className="flex justify-between gap-1 pt-1">
                              {[25, 50, 75, 100].map(pct => (
                                <button
                                  key={pct}
                                  type="button"
                                  onClick={() => logDailyRevisionCheckIn(system.id!, pct)}
                                  className={cn(
                                    'flex-1 py-1 text-[10px] font-semibold rounded-md border transition-all',
                                    (system.revisionProgressPercent || 0) >= pct
                                      ? 'bg-sky-500/15 border-sky-500/30 text-sky-600 dark:text-sky-400'
                                      : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                  )}
                                >
                                  {pct}%
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={system.revisionLastCheckInDate === format(new Date(), 'yyyy-MM-dd')}
                              onClick={() => logDailyRevisionCheckIn(system.id!)}
                              className="flex-1 rounded-xl font-semibold text-xs border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
                            >
                              <Calendar className="w-3.5 h-3.5 mr-1.5" />
                              {system.revisionLastCheckInDate === format(new Date(), 'yyyy-MM-dd')
                                ? '✓ Checked In Today'
                                : "Log Today's Study"}
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              onClick={handleRevisionComplete}
                              className="flex-1 rounded-xl font-semibold text-xs bg-sky-500 hover:bg-sky-600 text-white shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                              Finish & Calibrate
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : revisionDue ? (
                      <div className="pt-2 space-y-2">
                        <Button 
                          type="button"
                          className="w-full rounded-xl font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-xs flex items-center justify-center gap-2"
                          onClick={() => startActiveRevision(system.id!)}
                        >
                          <Play className="w-4 h-4 fill-current" />
                          Start Multi-Day Revision
                        </Button>
                        <Button 
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full rounded-xl font-medium text-xs border-border text-muted-foreground hover:text-foreground"
                          onClick={handleRevisionComplete}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-primary" />
                          Quick Single-Pass Completion
                        </Button>
                      </div>
                    ) : null}

                    <div className="pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full rounded-xl font-semibold text-xs border-border hover:bg-muted"
                        onClick={() => setShowScoreModal(true)}
                      >
                        <Award className="w-3.5 h-3.5 mr-1.5 text-primary" />
                        Log Test / Revision Score
                      </Button>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Weak Areas / Notes</label>
                  <Textarea value={localNotes} onChange={handleNotesChange} placeholder="Note down concepts you struggle with..."
                    className="min-h-[100px] resize-none rounded-xl bg-muted/30 border-transparent focus-visible:bg-background focus-visible:border-primary" />
                </div>

                {/* Leave a Marker / Revisions Bottom Bar */}
                <div className="pt-2">
                  <div className="p-1.5 rounded-2xl border border-border/40 bg-card/40 flex items-center justify-between shadow-sm overflow-hidden flex-wrap sm:flex-nowrap gap-2 sm:gap-0">
                    {flags.communityMarkers && flags.markerVisibility && (
                      <>
                        <Button variant="ghost" className="rounded-xl gap-2 text-muted-foreground hover:text-foreground h-11 px-3.5" onClick={() => setShowViewMarkersDialog(true)}>
                          <Bookmark className="w-4 h-4 text-primary" /> <span className="hidden sm:inline">View Markers</span>
                        </Button>
                        <div className="hidden sm:block w-px h-6 bg-border/50" />
                      </>
                    )}
                    
                    <div className="flex flex-col items-center px-2 flex-1 sm:flex-none">
                      <span className="text-[10px] text-muted-foreground/70 tracking-wide font-medium mb-0.5">Last revised</span>
                      <span className="text-xs text-primary font-medium">{system.lastRevisionDate ? formatDistanceToNow(new Date(system.lastRevisionDate), { addSuffix: true }) : 'Never'}</span>
                    </div>

                    <div className="hidden sm:block w-px h-6 bg-border/50" />
                    
                    <div className="flex flex-col items-center px-2 flex-1 sm:flex-none cursor-help" title={system.nextRevisionDate ? format(new Date(system.nextRevisionDate), 'MMM d, yyyy') : ''}>
                      <span className="text-[10px] text-muted-foreground/70 tracking-wide font-medium mb-0.5">Next review</span>
                      <span className="text-xs text-primary font-medium">{system.nextRevisionDate ? new Date(system.nextRevisionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}</span>
                    </div>

                    
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Initial evaluation dialog ─────────────────────────────────────── */}
      <ConfidenceDialog
        open={showEvalDialog}
        title="How well do you know this system?"
        subtitle={`You've completed ${system.name}. Rate your confidence to schedule your first revision.`}
        onSelect={handleEvalSelect}
      />

      {/* ── Content init dialog ───────────────────────────────────────────── */}
      <Dialog open={showInitDialog} onOpenChange={setShowInitDialog}>
        <DialogContent className="sm:max-w-[360px] rounded-2xl mx-4 w-[calc(100%-2rem)]">
          <DialogHeader><DialogTitle className="text-xl font-semibold">How many content units does this system have?</DialogTitle></DialogHeader>
          <div className="py-4">
            <Input autoFocus type="number" min="1" placeholder="e.g. 15" value={initValue} onChange={e => setInitValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleInitSave(); } }}
              className="text-lg py-6 px-4 bg-muted/50 border-transparent focus-visible:ring-primary focus-visible:bg-background" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowInitDialog(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleInitSave} disabled={!initValue || parseInt(initValue, 10) <= 0} className="rounded-xl font-semibold px-8 shadow-sm">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit dialog (long press) ──────────────────────────────────────── */}
      <Dialog open={showEditContent} onOpenChange={setShowEditContent}>
        <DialogContent className="sm:max-w-[360px] rounded-2xl mx-4 w-[calc(100%-2rem)]">
          <DialogHeader><DialogTitle className="text-xl font-semibold">Content Progress</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Completed Units</label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0 rounded-xl border-border hover:bg-muted font-bold text-lg"
                  onClick={() => setEditCompleted(prev => String(Math.max(0, (parseInt(prev, 10) || 0) - 1)))}
                >
                  -
                </Button>
                <Input
                  autoFocus
                  type="number"
                  min="0"
                  value={editCompleted}
                  onChange={e => setEditCompleted(e.target.value)}
                  className="text-lg text-center font-mono py-5 px-3 bg-muted/50 border-transparent focus-visible:ring-primary focus-visible:bg-background"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0 rounded-xl border-border hover:bg-muted font-bold text-lg"
                  onClick={() => setEditCompleted(prev => String(Math.min(parseInt(editTotal, 10) || 999, (parseInt(prev, 10) || 0) + 1)))}
                >
                  +
                </Button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Total Units</label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0 rounded-xl border-border hover:bg-muted font-bold text-lg"
                  onClick={() => setEditTotal(prev => String(Math.max(1, (parseInt(prev, 10) || 1) - 1)))}
                >
                  -
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={editTotal}
                  onChange={e => setEditTotal(e.target.value)}
                  className="text-lg text-center font-mono py-5 px-3 bg-muted/50 border-transparent focus-visible:ring-primary focus-visible:bg-background"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0 rounded-xl border-border hover:bg-muted font-bold text-lg"
                  onClick={() => setEditTotal(prev => String((parseInt(prev, 10) || 0) + 1))}
                >
                  +
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <div className="flex gap-2 w-full">
              <Button variant="ghost" onClick={() => setShowEditContent(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button onClick={handleEditSave} disabled={!editTotal || parseInt(editTotal, 10) <= 0 || editCompleted === '' || parseInt(editCompleted, 10) < 0} className="flex-1 rounded-xl font-semibold shadow-sm">Save</Button>
            </div>
            <Button variant="ghost" onClick={handleEditReset} className="w-full rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 text-sm">
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />Reset Progress
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Rename system dialog ─────────────────────────────────────────── */}
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

      {/* ── Delete confirmation dialog ────────────────────────────────────── */}
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


      {/* ── Leave a Marker dialog ─────────────────────────────────────────── */}
      <Dialog open={showInsightDialog} onOpenChange={setShowInsightDialog}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl mx-4 w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" />
              Leave a Marker {selectedTopicName ? `for ${selectedTopicName}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-5">
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Marker Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'mnemonic', icon: '🧠', label: 'Mnemonic' },
                  { id: 'pitfall', icon: '⚠️', label: 'Pitfall' },
                  { id: 'high_yield', icon: '💎', label: 'High Yield' },
                  { id: 'resource', icon: '🎥', label: 'Best Resource' },
                  { id: 'clinical_pearl', icon: '📌', label: 'Clinical Pearl' },
                  { id: 'memory_trick', icon: '💡', label: 'Memory Trick' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setInsightType(type.id as any)}
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-all text-left',
                      insightType === type.id
                        ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary/20'
                        : 'border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-border'
                    )}
                  >
                    <span className="text-base">{type.icon}</span>
                    <span className="font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Your Note</label>
              <Textarea
                autoFocus
                value={insightContent}
                onChange={e => setInsightContent(e.target.value)}
                placeholder="What would you tell your past self before studying this topic?"
                className="resize-none h-24 bg-muted/50 border-transparent focus-visible:ring-primary focus-visible:bg-background text-sm leading-relaxed"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Source (Optional)</label>
              <Input
                type="text"
                value={insightSource}
                onChange={e => setInsightSource(e.target.value)}
                placeholder="e.g. Marrow, PrepLadder, Professor, Self-created"
                className="bg-muted/50 border-transparent focus-visible:ring-primary focus-visible:bg-background text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-end mt-2">
            <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setShowInsightDialog(false)}>Cancel</Button>
            <Button 
              className="flex-1 rounded-xl font-semibold shadow-sm" 
              onClick={handleInsightSubmit} 
              disabled={!insightContent.trim() || isSubmittingInsight}
            >
              {isSubmittingInsight ? 'Placing...' : 'Place Marker'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Markers Modal ───────────────────────────────────────────── */}
      <ViewMarkersModal 
        isOpen={showViewMarkersDialog}
        onClose={() => setShowViewMarkersDialog(false)}
        systemId={system.id!}
        systemName={system.name}
        topicId={selectedTopicId}
        topicName={selectedTopicName}
        onLeaveMarker={() => setShowInsightDialog(true)}
      />

      {/* ── Score log modal ────────────────────────────────────────────────── */}
      <ScoreLogModal
        isOpen={showScoreModal}
        onClose={() => setShowScoreModal(false)}
        initialType="revision"
        initialSubjectId={system.subjectId}
        initialSystemId={system.id}
        initialTitle={`${system.name} Revision Score`}
      />
    </>
  );
}

// ── Small helper for revision detail rows ─────────────────────────────────────
function RevisionRow({ label, value, highlight, highlightClass }: { label: string; value: string; highlight?: boolean; highlightClass?: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium text-foreground', highlight && highlightClass)}>{value}</span>
    </div>
  );
}
