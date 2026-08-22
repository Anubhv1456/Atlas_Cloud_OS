import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Sparkles, 
  BookOpen, 
  Flame, 
  Trophy, 
  Clock, 
  Edit3, 
  Plus,
  Minus,
  Tag,
  AlertCircle,
  Brain,
  Zap,
  Target,
  ChevronDown
} from 'lucide-react';
import { 
  ParsedAtlasAction, 
  ActionAddMistake, 
  ActionLogStudy, 
  ActionRecordScore,
  MistakeTag,
  ConfidenceLevel,
  MistakeErrorType
} from '@/lib/ai/intentParser';
import { executeAtlasAction } from '@/lib/ai/atlasActionExecutor';
import { UNIVERSAL_ONTOLOGY } from '@/data/ontology';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface InlineActionCardProps {
  action: ParsedAtlasAction;
  status?: 'pending' | 'committed' | 'declined';
  onCommit?: (action: ParsedAtlasAction) => void;
  onDecline?: () => void;
  className?: string;
}

const ALL_SUBJECTS = UNIVERSAL_ONTOLOGY.map((s) => s.name);

const MISTAKE_TAGS: { label: string; value: MistakeTag }[] = [
  { label: 'Drug of Choice', value: 'Drug of Choice' },
  { label: 'Investigation of Choice', value: 'Investigation of Choice' },
  { label: 'Twin Distinction', value: 'Twin Distinction' },
  { label: 'Diagnostic Triad', value: 'Classic Triad' },
  { label: 'Diagnostic Criteria', value: 'Diagnostic Criteria' },
  { label: 'Management Protocol', value: 'Management Protocol' },
  { label: 'General Pearl', value: 'General Pearl' }
];

const ROOT_CAUSES: { label: string; value: MistakeErrorType; desc: string }[] = [
  { label: 'Concept Gap', value: 'concept', desc: 'Didn\'t know theory' },
  { label: 'Retrieval Failure', value: 'retrieval', desc: 'Forgot fact/dosage' },
  { label: 'Misread Stem', value: 'misread', desc: 'Missed NOT/EXCEPT' },
  { label: 'Overthink', value: 'fomo', desc: 'Second-guessed answer' }
];

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

const COMMON_TEST_SUBJECTS = [
  'General Medicine',
  'Pharmacology',
  'Pathology',
  'Microbiology',
  'Obstetrics & Gynaecology',
  'General Surgery',
  'Anatomy',
  'Physiology',
  'Pediatrics',
  'Biochemistry'
];

export const InlineActionCard: React.FC<InlineActionCardProps> = ({
  action,
  status = 'pending',
  onCommit,
  onDecline,
  className
}) => {
  const [currentAction, setCurrentAction] = useState<ParsedAtlasAction>(action);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [localStatus, setLocalStatus] = useState<'pending' | 'committed' | 'declined'>(status);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleCommit = async () => {
    setIsSubmitting(true);
    try {
      const res = await executeAtlasAction(currentAction);
      if (res.success) {
        setLocalStatus('committed');
        onCommit?.(currentAction);
      }
    } catch (err) {
      console.error('[InlineActionCard] Commit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = () => {
    setLocalStatus('declined');
    onDecline?.();
  };

  if (localStatus === 'committed') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 shadow-sm"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold">Successfully Committed to Atlas</p>
            <p className="text-[11px] opacity-80">Local IndexedDB updated & memory decay recalibrated</p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 font-mono font-bold tracking-tight">
          SYNCED
        </span>
      </motion.div>
    );
  }

  if (localStatus === 'declined') {
    return (
      <div className="mt-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/40 text-[11px] text-muted-foreground italic flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <X className="w-3.5 h-3.5 text-muted-foreground/60" />
          <span>Proposal discarded</span>
        </div>
        <button
          type="button"
          onClick={() => setLocalStatus('pending')}
          className="text-[10px] text-primary hover:underline font-medium not-italic"
        >
          Restore
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. 20th NOTEBOOK MISTAKE CARD
  // ─────────────────────────────────────────────────────────────────────────────
  if (currentAction.action === 'ACTION_ADD_MISTAKE') {
    const mistake = currentAction as ActionAddMistake;

    return (
      <div className={cn(
        "mt-3 p-4 rounded-2xl border transition-all text-xs bg-card/95 dark:bg-card/90 border-amber-500/30 shadow-md",
        className
      )}>
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Flame className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-foreground text-xs sm:text-sm">20th Notebook Mistake</span>
              <span className="text-[10px] text-muted-foreground ml-1.5">Proposed Pearl</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
          >
            <Edit3 className="w-3 h-3" />
            <span>{isEditing ? 'Collapse' : 'Edit'}</span>
          </button>
        </div>

        {/* Editable Subject & System Selectors */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 block">
                Subject
              </label>
              <select
                value={mistake.subjectName}
                onChange={(e) => {
                  const sName = e.target.value;
                  const matched = UNIVERSAL_ONTOLOGY.find((s) => s.name === sName);
                  setCurrentAction({
                    ...mistake,
                    subjectName: sName,
                    subjectId: matched?.id || mistake.subjectId
                  });
                }}
                className="w-full px-2.5 py-1.5 bg-background border border-border/80 rounded-lg text-xs text-foreground focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                {ALL_SUBJECTS.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 block">
                System / Sub-topic
              </label>
              <input
                type="text"
                value={mistake.systemName || ''}
                placeholder="e.g. Autonomic Nervous System"
                onChange={(e) => setCurrentAction({ ...mistake, systemName: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-background border border-border/80 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Interactive High-Yield Tag Pills */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1.5 block">
              High-Yield Classification Tag
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MISTAKE_TAGS.map((tag) => {
                const isSelected = mistake.tag === tag.value || (tag.value === 'Classic Triad' && mistake.tag === 'Diagnostic Triad' as any);
                return (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => setCurrentAction({ ...mistake, tag: tag.value })}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-medium transition-all cursor-pointer",
                      isSelected
                        ? "bg-amber-500 text-white shadow-xs font-semibold scale-102"
                        : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"
                    )}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Root-Cause Selector */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1.5 block">
              Root-Cause Trap
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {ROOT_CAUSES.map((rc) => {
                const isSelected = mistake.errorType === rc.value;
                return (
                  <button
                    key={rc.value}
                    type="button"
                    onClick={() => setCurrentAction({ ...mistake, errorType: rc.value })}
                    className={cn(
                      "flex flex-col items-start p-1.5 rounded-lg border text-left transition-all cursor-pointer",
                      isSelected
                        ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 font-semibold"
                        : "bg-background/60 border-border/60 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <span className="text-[11px]">{rc.label}</span>
                    <span className="text-[9px] opacity-75 leading-tight truncate">{rc.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editable Golden Rule / Takeaway Text Area */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 block">
              Golden Rule / High-Yield Takeaway
            </label>
            <textarea
              value={mistake.ruleText}
              onChange={(e) => setCurrentAction({ 
                ...mistake, 
                ruleText: e.target.value,
                keyTakeaway: e.target.value 
              })}
              rows={2}
              placeholder="Enter core takeaway or distinction..."
              className="w-full px-2.5 py-2 bg-background border border-border/80 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-amber-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Volatile Fast-Decay Toggle */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Mark as volatile for rapid 24h & 72h recall review</span>
            </div>
            <button
              type="button"
              onClick={() => setCurrentAction({ ...mistake, isUrgent: !mistake.isUrgent })}
              className={cn(
                "px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer",
                mistake.isUrgent
                  ? "bg-rose-500 text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {mistake.isUrgent ? "⚡ High Volatility" : "Normal"}
            </button>
          </div>
        </div>

        {/* Action Commit Controls */}
        <div className="flex items-center justify-end gap-2.5 mt-4 pt-3 border-t border-border/50">
          <button
            type="button"
            onClick={handleDecline}
            className="px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Decline
          </button>
          <button
            type="button"
            disabled={isSubmitting || !mistake.ruleText.trim()}
            onClick={handleCommit}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-medium text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Saving...' : '✔ Commit to 20th Notebook'}</span>
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. STUDY REVISION SESSION CARD
  // ─────────────────────────────────────────────────────────────────────────────
  if (currentAction.action === 'ACTION_LOG_STUDY') {
    const study = currentAction as ActionLogStudy;

    const handleDurationStep = (delta: number) => {
      const nextVal = Math.max(15, (study.durationMinutes || 30) + delta);
      setCurrentAction({ ...study, durationMinutes: nextVal });
    };

    return (
      <div className={cn(
        "mt-3 p-4 rounded-2xl border transition-all text-xs bg-card/95 dark:bg-card/90 border-teal-500/30 shadow-md",
        className
      )}>
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-500/15 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-foreground text-xs sm:text-sm">Study Session Block</span>
              <span className="text-[10px] text-muted-foreground ml-1.5">Proposed Log</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
          >
            <Edit3 className="w-3 h-3" />
            <span>{isEditing ? 'Collapse' : 'Edit'}</span>
          </button>
        </div>

        <div className="space-y-3">
          {/* Subject & Topic Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 block">
                Subject
              </label>
              <select
                value={study.subjectName}
                onChange={(e) => {
                  const sName = e.target.value;
                  const matched = UNIVERSAL_ONTOLOGY.find((s) => s.name === sName);
                  setCurrentAction({
                    ...study,
                    subjectName: sName,
                    subjectId: matched?.id || study.subjectId
                  });
                }}
                className="w-full px-2.5 py-1.5 bg-background border border-border/80 rounded-lg text-xs text-foreground focus:ring-1 focus:ring-teal-500 focus:outline-none"
              >
                {ALL_SUBJECTS.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 block">
                Topic / Notes
              </label>
              <input
                type="text"
                value={study.topicsStudied || study.systemName || ''}
                placeholder="e.g. Anti-arrhythmics, ECG review"
                onChange={(e) => setCurrentAction({ 
                  ...study, 
                  topicsStudied: e.target.value,
                  systemName: e.target.value || study.systemName 
                })}
                className="w-full px-2.5 py-1.5 bg-background border border-border/80 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Duration Stepper (±15 min) + Preset Chips */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1.5 block">
              Study Duration
            </label>
            <div className="flex items-center gap-3">
              {/* Stepper Controls */}
              <div className="flex items-center border border-border/80 rounded-xl bg-background p-0.5">
                <button
                  type="button"
                  onClick={() => handleDurationStep(-15)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Subtract 15 minutes"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="px-3 min-w-[70px] text-center font-mono font-bold text-xs text-teal-600 dark:text-teal-400">
                  {study.durationMinutes}m
                </div>
                <button
                  type="button"
                  onClick={() => handleDurationStep(15)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Add 15 minutes"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Preset Chips */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {DURATION_PRESETS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setCurrentAction({ ...study, durationMinutes: mins })}
                    className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-mono transition-all cursor-pointer",
                      study.durationMinutes === mins
                        ? "bg-teal-600 text-white font-bold"
                        : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Post-Session Confidence Toggles (High, Medium, Low) */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1.5 block">
              Post-Session Confidence Level
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['HIGH', 'MED', 'LOW'] as ConfidenceLevel[]).map((conf) => {
                const isSelected = study.confidenceLevel === conf;
                return (
                  <button
                    key={conf}
                    type="button"
                    onClick={() => setCurrentAction({ ...study, confidenceLevel: conf })}
                    className={cn(
                      "py-2 px-2.5 rounded-xl border text-center font-medium transition-all cursor-pointer",
                      isSelected && conf === 'HIGH' && "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold",
                      isSelected && conf === 'MED' && "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 font-bold",
                      isSelected && conf === 'LOW' && "bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 font-bold",
                      !isSelected && "bg-background/60 border-border/60 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <div className="text-xs">
                      {conf === 'HIGH' ? '🟢 High' : conf === 'MED' ? '🟡 Medium' : '🔴 Low'}
                    </div>
                    <div className="text-[9px] opacity-75 font-normal">
                      {conf === 'HIGH' ? 'Solid recall' : conf === 'MED' ? 'Standard review' : 'Decays soon'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Commit Controls */}
        <div className="flex items-center justify-end gap-2.5 mt-4 pt-3 border-t border-border/50">
          <button
            type="button"
            onClick={handleDecline}
            className="px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Decline
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleCommit}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-medium text-xs shadow-sm transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Logging...' : '✔ Log Revision Block'}</span>
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. TEST SCORE CARD
  // ─────────────────────────────────────────────────────────────────────────────
  if (currentAction.action === 'ACTION_RECORD_SCORE') {
    const scoreRec = currentAction as ActionRecordScore;
    const total = scoreRec.totalMarks > 0 ? scoreRec.totalMarks : 200;
    const pct = Math.round((scoreRec.score / total) * 100);

    const toggleWeakSubject = (subjectName: string) => {
      const existing = scoreRec.weakSubjects || [];
      const updated = existing.includes(subjectName)
        ? existing.filter((s) => s !== subjectName)
        : [...existing, subjectName];
      setCurrentAction({ ...scoreRec, weakSubjects: updated });
    };

    return (
      <div className={cn(
        "mt-3 p-4 rounded-2xl border transition-all text-xs bg-card/95 dark:bg-card/90 border-indigo-500/30 shadow-md",
        className
      )}>
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Trophy className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-foreground text-xs sm:text-sm">Test Score Entry</span>
              <span className="text-[10px] text-muted-foreground ml-1.5">Mock Evaluation</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2 py-0.5 rounded-full font-mono text-[10px] font-bold",
              pct >= 70 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" :
              pct >= 55 ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" :
              "bg-rose-500/15 text-rose-600 dark:text-rose-400"
            )}>
              {pct}% Target
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isEditing ? 'Collapse' : 'Edit'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {/* Test Name Input */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 block">
              Test Name / Source
            </label>
            <input
              type="text"
              value={scoreRec.testName}
              placeholder="e.g. Grand Test 14 (Full Syllabus)"
              onChange={(e) => setCurrentAction({ ...scoreRec, testName: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-background border border-border/80 rounded-lg text-xs text-foreground focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Score & Total Marks Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 block">
                Score Earned
              </label>
              <input
                type="number"
                value={scoreRec.score}
                onChange={(e) => setCurrentAction({ ...scoreRec, score: parseFloat(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 bg-background border border-border/80 rounded-lg font-mono text-xs text-foreground focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 block">
                Total Marks
              </label>
              <input
                type="number"
                value={scoreRec.totalMarks}
                onChange={(e) => setCurrentAction({ ...scoreRec, totalMarks: parseFloat(e.target.value) || 200 })}
                className="w-full px-2.5 py-1.5 bg-background border border-border/80 rounded-lg font-mono text-xs text-foreground focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 1-Tap Weak Area Tag Toggles */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1.5 block">
              1-Tap Flag Weak Subject Areas
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_TEST_SUBJECTS.map((sub) => {
                const isSelected = (scoreRec.weakSubjects || []).includes(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleWeakSubject(sub)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-medium transition-all cursor-pointer",
                      isSelected
                        ? "bg-rose-500 text-white font-semibold shadow-xs"
                        : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"
                    )}
                  >
                    {isSelected ? `✖ ${sub}` : `+ ${sub}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Commit Controls */}
        <div className="flex items-center justify-end gap-2.5 mt-4 pt-3 border-t border-border/50">
          <button
            type="button"
            onClick={handleDecline}
            className="px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Decline
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleCommit}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-medium text-xs shadow-sm transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Saving...' : '✔ Record Score'}</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
