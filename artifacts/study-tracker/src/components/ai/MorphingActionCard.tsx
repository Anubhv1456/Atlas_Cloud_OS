import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
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
  Undo2
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

export interface MorphingActionCardProps {
  action: ParsedAtlasAction;
  cognitiveDelta?: CognitiveDelta;
  onCommit?: (action: ParsedAtlasAction, result: ActionExecutionResult) => void;
  onDismiss?: () => void;
  className?: string;
  enableSwipe?: boolean;
  autoCommitSeconds?: number;
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

export const MorphingActionCard: React.FC<MorphingActionCardProps> = ({
  action,
  cognitiveDelta,
  onCommit,
  onDismiss,
  className,
  enableSwipe = true,
  autoCommitSeconds = 0 // 0 means manual unless configured
}) => {
  const dbSubjects = useSubjects();
  const [draftAction, setDraftAction] = useState<ParsedAtlasAction>(() => JSON.parse(JSON.stringify(action)));
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [status, setStatus] = useState<'idle' | 'committing' | 'committed' | 'dismissed'>('idle');
  const [countdown, setCountdown] = useState<number>(autoCommitSeconds);
  const [isPausedCountdown, setIsPausedCountdown] = useState<boolean>(false);
  const autoCommitTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Framer motion drag setup for tactile swiping
  const dragX = useMotionValue(0);
  const cardOpacity = useTransform(dragX, [-150, 0, 150], [0.3, 1, 0.3]);
  const cardScale = useTransform(dragX, [-150, 0, 150], [0.96, 1, 0.96]);

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
    if (autoCommitTimerRef.current) {
      clearInterval(autoCommitTimerRef.current);
      autoCommitTimerRef.current = null;
    }
    if (status === 'committing' || status === 'committed') return;
    setStatus('committing');

    try {
      const result = await executeAtlasAction(draftAction);
      if (result.success) {
        setStatus('committed');
        toast.success(
          draftAction.action === 'ACTION_ADD_MISTAKE' 
            ? 'Saved to 20th Notebook' 
            : 'Study Session Synchronized',
          {
            description: result.message || 'Updated local curriculum matrix.',
            icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />
          }
        );
        onCommit?.(draftAction, result);
      } else {
        setStatus('idle');
        toast.error('Commit failed', { description: result.error || 'Please review the fields.' });
      }
    } catch (err: any) {
      setStatus('idle');
      toast.error('Commit error', { description: err.message || 'Unexpected error' });
    }
  };

  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (autoCommitTimerRef.current) {
      clearInterval(autoCommitTimerRef.current);
      autoCommitTimerRef.current = null;
    }
    setStatus('dismissed');
    onDismiss?.();
  };

  // Drag End handler for swipe gestures
  const handleDragEnd = (_: any, info: any) => {
    if (!enableSwipe) return;
    if (info.offset.x > 100) {
      handleExecuteCommit();
    } else if (info.offset.x < -100) {
      handleDismiss();
    }
  };

  // Auto-commit countdown
  useEffect(() => {
    if (autoCommitSeconds > 0 && status === 'idle' && !isPausedCountdown && !isEditing) {
      setCountdown(autoCommitSeconds);
      autoCommitTimerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (autoCommitTimerRef.current) clearInterval(autoCommitTimerRef.current);
            handleExecuteCommit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (autoCommitTimerRef.current) {
          clearInterval(autoCommitTimerRef.current);
          autoCommitTimerRef.current = null;
        }
      };
    }
  }, [autoCommitSeconds, status, isPausedCountdown, isEditing]);

  if (status === 'committed') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: -2 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="font-semibold text-xs">Saved to 20th Notebook</p>
            <p className="text-xs opacity-75">Curriculum matrix updated</p>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 font-bold">
          SYNCED
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
      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
      style={{ x: dragX, opacity: cardOpacity, scale: cardScale }}
      drag={enableSwipe ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.3}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsPausedCountdown(true)}
      onMouseLeave={() => setIsPausedCountdown(false)}
      className={cn(
        "relative rounded-2xl border transition-all overflow-hidden touch-pan-y select-none",
        "bg-zinc-950/95 dark:bg-zinc-900/98 text-zinc-100 border-zinc-800/90 shadow-xl shadow-black/40",
        className
      )}
    >
      {/* ── 1. UNIFIED MONOCHROMATIC CLINICAL HEADER LINE ── */}
      <div className="px-3.5 py-2.5 border-b border-zinc-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200 truncate">
            {draftAction.action === 'ACTION_ADD_MISTAKE' && (
              <>
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-amber-300 font-medium">
                  {(draftAction as ActionAddMistake).tag || '20th Notebook'}
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-300 font-normal truncate">
                  {(draftAction as ActionAddMistake).subjectName || 'General Medicine'}
                </span>
              </>
            )}

            {draftAction.action === 'ACTION_LOG_STUDY' && (
              <>
                <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="text-teal-300 font-medium">
                  {(draftAction as ActionLogStudy).durationMinutes}m Logged
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-300 font-normal truncate">
                  {(draftAction as ActionLogStudy).subjectName}
                </span>
              </>
            )}

            {draftAction.action === 'ACTION_RECORD_SCORE' && (
              <>
                <Trophy className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="text-indigo-300 font-medium truncate">
                  {(draftAction as ActionRecordScore).testName}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action icons & Auto-commit indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          {countdown > 0 && !isPausedCountdown && (
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              {countdown}s
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Edit details"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── 2. FOCAL CLINICAL BODY (TYPOGRAPHY FIRST: 16px, high contrast, 1.5 line-height) ── */}
      <div className="p-3.5 space-y-3">
        {/* 20th Notebook Mistake Body */}
        {draftAction.action === 'ACTION_ADD_MISTAKE' && (() => {
          const mistake = draftAction as ActionAddMistake;
          return (
            <div className="space-y-3">
              {isEditing ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
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
                      className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none"
                    >
                      {subjectList.map(s => (
                        <option key={s.id || s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>

                    <select
                      value={mistake.tag}
                      onChange={(e) => setDraftAction({ ...mistake, tag: e.target.value as MistakeTag })}
                      className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none"
                    >
                      {MISTAKE_TAGS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <textarea
                    rows={2}
                    value={mistake.ruleText}
                    onChange={(e) => setDraftAction({ ...mistake, ruleText: e.target.value, keyTakeaway: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-100 resize-none font-sans"
                  />
                </div>
              ) : (
                /* The Primary Focal Clinical Text */
                <p className="text-[14px] sm:text-[15px] text-zinc-100 font-medium leading-relaxed">
                  "{mistake.ruleText}"
                </p>
              )}

              {/* Minimal Error Taxonomy Tokens */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/80 text-xs">
                <div className="flex items-center gap-1.5">
                  {ERROR_ROOT_CAUSES.map((rc) => (
                    <button
                      key={rc.key}
                      type="button"
                      onClick={() => setDraftAction({ ...mistake, errorType: rc.key })}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                        mistake.errorType === rc.key
                          ? "bg-zinc-200 text-zinc-950 font-bold"
                          : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200"
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
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "text-zinc-500 hover:text-zinc-400"
                  )}
                >
                  <Zap className="w-3 h-3" />
                  <span>{mistake.isUrgent ? 'Rapid Decay' : 'Standard'}</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* Study Block Body */}
        {draftAction.action === 'ACTION_LOG_STUDY' && (() => {
          const study = draftAction as ActionLogStudy;
          return (
            <div className="space-y-2.5">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-teal-300">{study.durationMinutes}m</span>
                <span className="text-xs text-zinc-400">added to {study.subjectName}</span>
              </div>

              {study.topicName && (
                <p className="text-xs text-zinc-300">
                  <span className="text-zinc-500">Topic:</span> {study.topicName}
                </p>
              )}

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
                        ? "bg-teal-400 text-zinc-950 font-bold"
                        : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Score Record Body */}
        {draftAction.action === 'ACTION_RECORD_SCORE' && (() => {
          const scoreRec = draftAction as ActionRecordScore;
          const total = scoreRec.totalQuestions || 200;
          const pct = Math.round((scoreRec.score / total) * 100);
          return (
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-xl font-bold font-mono text-indigo-300">
                  {scoreRec.score} / {total}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {pct}% Correct
                </span>
              </div>

              {scoreRec.weakSubjects && scoreRec.weakSubjects.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-xs text-zinc-500">Focus:</span>
                  {scoreRec.weakSubjects.map(ws => (
                    <span key={ws} className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 text-xs">
                      {ws}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── 3. UNIFIED FLAT BOTTOM ACTIONS ── */}
      <div className="px-3.5 py-2.5 bg-zinc-900/60 border-t border-zinc-800/80 flex items-center justify-between gap-2">
        <span className="text-xs text-zinc-500 font-mono">
          Swipe right to save
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            Dismiss
          </button>

          <button
            type="button"
            disabled={status === 'committing'}
            onClick={handleExecuteCommit}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-xl text-zinc-950 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95",
              draftAction.action === 'ACTION_ADD_MISTAKE' && "bg-amber-400 hover:bg-amber-300",
              draftAction.action === 'ACTION_LOG_STUDY' && "bg-teal-400 hover:bg-teal-300",
              draftAction.action === 'ACTION_RECORD_SCORE' && "bg-indigo-400 hover:bg-indigo-300",
              draftAction.action === 'ACTION_CLINICAL_QUERY' && "bg-primary hover:bg-primary/90"
            )}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{status === 'committing' ? 'Saving...' : 'Save Rule'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
