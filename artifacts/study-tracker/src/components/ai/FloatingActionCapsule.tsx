import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  Check, 
  X, 
  Sparkles, 
  BookOpen, 
  Clock, 
  Trophy, 
  Lightbulb, 
  Edit3, 
  Zap, 
  ShieldCheck,
  ChevronDown,
  RotateCcw,
  Tag
} from 'lucide-react';
import { 
  ParsedAtlasAction, 
  ActionAddMistake, 
  ActionLogStudy, 
  ActionRecordScore,
  MistakeTag,
  MistakeErrorType,
  CognitiveDelta
} from '@/lib/ai/types';
import { STANDARD_MEDICAL_SUBJECTS } from '@/lib/ai/intentParser';
import { executeAtlasAction, ActionExecutionResult } from '@/lib/ai/atlasActionExecutor';
import { useSubjects } from '@/db';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface FloatingActionCapsuleProps {
  action: ParsedAtlasAction;
  cognitiveDelta?: CognitiveDelta;
  onConfirm?: (action: ParsedAtlasAction, result: ActionExecutionResult) => void;
  onDismiss?: () => void;
  className?: string;
  autoDismissSeconds?: number;
}

const MISTAKE_TAGS: MistakeTag[] = [
  'Drug of Choice',
  'Investigation of Choice',
  'Twin Distinction',
  'Classic Triad',
  'Diagnostic Criteria',
  'Management Protocol',
  'General Pearl'
];

const ERROR_ROOT_CAUSES: { key: MistakeErrorType; label: string }[] = [
  { key: 'concept', label: 'Concept Gap' },
  { key: 'retrieval', label: 'Retrieval' },
  { key: 'misread', label: 'Misread Stem' },
  { key: 'fomo', label: 'Overthinking' }
];

const QUICK_DURATIONS = [15, 30, 45, 60, 90, 120];

export const FloatingActionCapsule: React.FC<FloatingActionCapsuleProps> = ({
  action,
  cognitiveDelta,
  onConfirm,
  onDismiss,
  className,
  autoDismissSeconds = 0
}) => {
  const dbSubjects = useSubjects();
  const [draftAction, setDraftAction] = useState<ParsedAtlasAction>(() => JSON.parse(JSON.stringify(action)));
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [status, setStatus] = useState<'idle' | 'committing' | 'committed' | 'dismissed'>('idle');
  const [countdown, setCountdown] = useState<number>(autoDismissSeconds);
  const [isPausedCountdown, setIsPausedCountdown] = useState<boolean>(false);
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync draft when prop action changes
  useEffect(() => {
    setDraftAction(JSON.parse(JSON.stringify(action)));
    setIsEditing(false);
    setStatus('idle');
  }, [action]);

  // Framer Motion vertical drag for swipe-up-to-dismiss gesture
  const dragY = useMotionValue(0);
  const cardOpacity = useTransform(dragY, [-60, 0, 40], [0, 1, 0.6]);
  const cardScale = useTransform(dragY, [-60, 0, 40], [0.92, 1, 0.96]);

  const subjectList = React.useMemo(() => {
    const list = [...(dbSubjects || [])];
    STANDARD_MEDICAL_SUBJECTS.forEach(s => {
      if (!list.some(d => d.name.toLowerCase() === s.name.toLowerCase())) {
        list.push({ id: s.id as any, name: s.name } as any);
      }
    });
    return list;
  }, [dbSubjects]);

  // Handle tactile commit
  const handleExecuteCommit = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (autoDismissTimerRef.current) {
      clearInterval(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
    if (status === 'committing' || status === 'committed') return;
    setStatus('committing');

    // Haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([15, 35]);
    }

    try {
      const result = await executeAtlasAction(draftAction);
      if (result.success) {
        setStatus('committed');
        toast.success(
          draftAction.action === 'ACTION_ADD_MISTAKE' 
            ? 'Saved to 20th Notebook' 
            : draftAction.action === 'ACTION_RECORD_SCORE'
            ? 'Grand Test Score Logged'
            : 'Study Session Synchronized',
          {
            description: result.message || 'Updated local curriculum matrix.',
            icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />
          }
        );
        onConfirm?.(draftAction, result);

        // Auto fade after confirmation
        setTimeout(() => {
          onDismiss?.();
        }, 1400);
      } else {
        setStatus('idle');
        toast.error('Commit failed', { description: result.message || 'Please review the fields.' });
      }
    } catch (err: any) {
      setStatus('idle');
      toast.error('Commit error', { description: err.message || 'Unexpected error' });
    }
  };

  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (autoDismissTimerRef.current) {
      clearInterval(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
    setStatus('dismissed');
    onDismiss?.();
  };

  // Drag End handler for Swipe-Up Dismissal
  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.y < -35 || info.velocity.y < -300) {
      handleDismiss();
    }
  };

  // Auto-dismiss countdown
  useEffect(() => {
    if (autoDismissSeconds > 0 && status === 'idle' && !isPausedCountdown && !isEditing) {
      setCountdown(autoDismissSeconds);
      autoDismissTimerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (autoDismissTimerRef.current) clearInterval(autoDismissTimerRef.current);
            handleDismiss();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (autoDismissTimerRef.current) {
          clearInterval(autoDismissTimerRef.current);
          autoDismissTimerRef.current = null;
        }
      };
    }
  }, [autoDismissSeconds, status, isPausedCountdown, isEditing]);

  if (status === 'committed') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="w-full p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 backdrop-blur-xl shadow-2xl flex items-center justify-between text-xs text-emerald-300"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="font-bold text-xs text-emerald-200">
              {draftAction.action === 'ACTION_ADD_MISTAKE' ? '20th Notebook Pearl Saved' : 'Action Successfully Saved'}
            </p>
            <p className="text-xs text-emerald-400/80">Curriculum database synchronized</p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          CONFIRMED
        </span>
      </motion.div>
    );
  }

  if (status === 'dismissed') {
    return null;
  }

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      style={{ y: dragY, opacity: cardOpacity, scale: cardScale }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.6, bottom: 0.15 }}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsPausedCountdown(true)}
      onMouseLeave={() => setIsPausedCountdown(false)}
      className={cn(
        "relative rounded-2xl border transition-all overflow-hidden touch-pan-y select-none",
        "bg-card/90 dark:bg-card/85 text-foreground border-border/70 backdrop-blur-2xl shadow-2xl shadow-black/30",
        className
      )}
    >
      {/* ── 1. APPLE-STYLE DRAG HANDLE & HEADER LINE ── */}
      <div className="pt-2 px-3.5 pb-2 border-b border-border/40 flex flex-col gap-1.5 bg-muted/20">
        {/* Subtle Pill Handle */}
        <div className="w-8 h-1 rounded-full bg-muted-foreground/30 mx-auto cursor-grab active:cursor-grabbing" />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold truncate min-w-0">
            {draftAction.action === 'ACTION_ADD_MISTAKE' && (
              <>
                <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-amber-600 dark:text-amber-400 font-bold truncate">
                  {(draftAction as ActionAddMistake).tag || '20th Notebook'}
                </span>
                <span className="text-muted-foreground/60">•</span>
                <span className="text-muted-foreground font-medium truncate">
                  {(draftAction as ActionAddMistake).subjectName || 'General Medicine'}
                </span>
              </>
            )}

            {draftAction.action === 'ACTION_LOG_STUDY' && (
              <>
                <Clock className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                <span className="text-teal-600 dark:text-teal-400 font-bold truncate">
                  {(draftAction as ActionLogStudy).durationMinutes}m Logged
                </span>
                <span className="text-muted-foreground/60">•</span>
                <span className="text-muted-foreground font-medium truncate">
                  {(draftAction as ActionLogStudy).subjectName}
                </span>
              </>
            )}

            {draftAction.action === 'ACTION_RECORD_SCORE' && (
              <>
                <Trophy className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="text-indigo-600 dark:text-indigo-400 font-bold truncate">
                  {(draftAction as ActionRecordScore).testName}
                </span>
              </>
            )}

            {draftAction.action === 'ACTION_CLINICAL_QUERY' && (
              <>
                <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-primary font-bold">Clinical Takeaway</span>
              </>
            )}
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {countdown > 0 && !isPausedCountdown && (
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                {countdown}s
              </span>
            )}

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={cn(
                "p-1.5 rounded-lg transition-colors cursor-pointer text-muted-foreground hover:text-foreground",
                isEditing ? "bg-primary/15 text-primary font-bold" : "hover:bg-muted"
              )}
              title={isEditing ? "View summary" : "Edit proposal"}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Dismiss (Swipe up)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. CARD BODY & INLINE MICRO-EDITOR ── */}
      <div className="p-3.5 space-y-3">
        {/* 20th Notebook Mistake Body */}
        {draftAction.action === 'ACTION_ADD_MISTAKE' && (() => {
          const mistake = draftAction as ActionAddMistake;
          return (
            <div className="space-y-3">
              {isEditing ? (
                /* Inline Micro-Editor for 20th Notebook */
                <motion.div 
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2.5"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</label>
                      <select
                        value={mistake.subjectName}
                        onChange={(e) => {
                          const sel = subjectList.find(s => s.name === e.target.value);
                          setDraftAction({
                            ...mistake,
                            subjectName: e.target.value,
                            subjectId: sel?.id || mistake.subjectId
                          });
                        }}
                        className="w-full px-2 py-1.5 bg-muted/60 border border-border/70 rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      >
                        {subjectList.map(s => (
                          <option key={s.id || s.name} value={s.name} className="bg-popover text-popover-foreground">
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tag Category</label>
                      <select
                        value={mistake.tag}
                        onChange={(e) => setDraftAction({ ...mistake, tag: e.target.value as MistakeTag })}
                        className="w-full px-2 py-1.5 bg-muted/60 border border-border/70 rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      >
                        {MISTAKE_TAGS.map(t => (
                          <option key={t} value={t} className="bg-popover text-popover-foreground">
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clinical Rule / Distinction</label>
                    <textarea
                      rows={2}
                      value={mistake.ruleText}
                      onChange={(e) => setDraftAction({ ...mistake, ruleText: e.target.value, keyTakeaway: e.target.value })}
                      placeholder="e.g. DOC for Trigeminal Neuralgia is Carbamazepine"
                      className="w-full px-2.5 py-1.5 bg-muted/60 border border-border/70 rounded-lg text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 font-sans leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Psychometric Root Cause</label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ERROR_ROOT_CAUSES.map((rc) => (
                        <button
                          key={rc.key}
                          type="button"
                          onClick={() => setDraftAction({ ...mistake, errorType: rc.key })}
                          className={cn(
                            "px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                            mistake.errorType === rc.key
                              ? "bg-primary text-primary-foreground font-bold"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {rc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Glanceable Clinical Text */
                <div>
                  <p className="text-[14px] sm:text-[15px] font-medium text-foreground leading-relaxed">
                    "{mistake.ruleText}"
                  </p>
                  
                  {/* Subtle Tags Strip */}
                  <div className="flex items-center justify-between gap-2 pt-2 mt-2 border-t border-border/40 text-xs">
                    <div className="flex items-center gap-1.5">
                      {ERROR_ROOT_CAUSES.map((rc) => (
                        <button
                          key={rc.key}
                          type="button"
                          onClick={() => setDraftAction({ ...mistake, errorType: rc.key })}
                          className={cn(
                            "px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                            mistake.errorType === rc.key
                              ? "bg-muted-foreground/20 text-foreground font-bold"
                              : "bg-muted/50 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {rc.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setDraftAction({ ...mistake, isUrgent: !mistake.isUrgent })}
                      className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0",
                        mistake.isUrgent
                          ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Zap className="w-3 h-3" />
                      <span>{mistake.isUrgent ? 'Rapid Decay' : 'Standard'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Study Block Body */}
        {draftAction.action === 'ACTION_LOG_STUDY' && (() => {
          const study = draftAction as ActionLogStudy;
          return (
            <div className="space-y-2.5">
              {isEditing ? (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</label>
                    <select
                      value={study.subjectName}
                      onChange={(e) => {
                        const sel = subjectList.find(s => s.name === e.target.value);
                        setDraftAction({
                          ...study,
                          subjectName: e.target.value,
                          subjectId: sel?.id || study.subjectId
                        });
                      }}
                      className="w-full px-2 py-1.5 bg-muted/60 border border-border/70 rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      {subjectList.map(s => (
                        <option key={s.id || s.name} value={s.name} className="bg-popover text-popover-foreground">
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration (Minutes)</label>
                    <input
                      type="number"
                      value={study.durationMinutes}
                      onChange={(e) => setDraftAction({ ...study, durationMinutes: parseInt(e.target.value, 10) || 15 })}
                      className="w-full px-2.5 py-1.5 bg-muted/60 border border-border/70 rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400">{study.durationMinutes}m</span>
                    <span className="text-xs text-muted-foreground">added to {study.subjectName}</span>
                  </div>

                  {/* Quick duration adjustment chips */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {QUICK_DURATIONS.map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDraftAction({ ...study, durationMinutes: d })}
                        className={cn(
                          "px-2 py-0.5 rounded text-xs font-mono transition-colors cursor-pointer",
                          study.durationMinutes === d
                            ? "bg-teal-500 text-white font-bold"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Score Record Body */}
        {draftAction.action === 'ACTION_RECORD_SCORE' && (() => {
          const scoreRec = draftAction as ActionRecordScore;
          const total = scoreRec.totalMarks || 200;
          const pct = Math.round((scoreRec.score / total) * 100);
          return (
            <div className="space-y-2">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score</label>
                    <input
                      type="number"
                      value={scoreRec.score}
                      onChange={(e) => setDraftAction({ ...scoreRec, score: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-2 py-1.5 bg-muted/60 border border-border/70 rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Marks</label>
                    <input
                      type="number"
                      value={scoreRec.totalMarks}
                      onChange={(e) => setDraftAction({ ...scoreRec, totalMarks: parseInt(e.target.value, 10) || 200 })}
                      className="w-full px-2 py-1.5 bg-muted/60 border border-border/70 rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-baseline gap-3">
                    <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {scoreRec.score} / {total}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {pct}% Correct
                    </span>
                  </div>

                  {scoreRec.weakSubjects && scoreRec.weakSubjects.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-xs text-muted-foreground">Focus:</span>
                      {scoreRec.weakSubjects.map(ws => (
                        <span key={ws} className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-medium">
                          {ws}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── 3. UNIFIED BOTTOM TACTILE ACTIONS ── */}
      <div className="px-3.5 py-2.5 bg-muted/30 border-t border-border/40 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground/70 font-medium">
          Swipe up to dismiss
        </span>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Done Editing
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDismiss}
              className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          )}

          <button
            type="button"
            disabled={status === 'committing'}
            onClick={handleExecuteCommit}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer select-none active:scale-95",
              draftAction.action === 'ACTION_ADD_MISTAKE' && "bg-amber-600 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400 text-zinc-950",
              draftAction.action === 'ACTION_LOG_STUDY' && "bg-teal-600 hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400 text-zinc-950",
              draftAction.action === 'ACTION_RECORD_SCORE' && "bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white",
              draftAction.action === 'ACTION_CLINICAL_QUERY' && "bg-primary hover:bg-primary/90 text-primary-foreground"
            )}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{status === 'committing' ? 'Saving...' : 'Save & Confirm'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
