import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Sparkles, 
  Check, 
  X, 
  Clock, 
  BookOpen, 
  Award, 
  Zap, 
  Tag, 
  AlertTriangle,
  Plus,
  Minus,
  Brain,
  HelpCircle,
  Stethoscope
} from 'lucide-react';
import { 
  ParsedAtlasAction, 
  ActionAddMistake, 
  ActionLogStudy, 
  ActionRecordScore, 
  ActionClinicalQuery,
  MistakeTag,
  MistakeErrorType,
  ConfidenceLevel,
  STANDARD_MEDICAL_SUBJECTS 
} from '@/lib/ai/intentParser';
import { executeAtlasAction, ActionExecutionResult } from '@/lib/ai/atlasActionExecutor';
import { useSubjects } from '@/db';

export interface AIActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposedAction: ParsedAtlasAction | null;
  onActionCommitted?: (result: ActionExecutionResult) => void;
  rawVoiceTranscript?: string;
}

const MISTAKE_TAG_OPTIONS: MistakeTag[] = [
  'Drug of Choice',
  'Investigation of Choice',
  'Twin Distinction',
  'Classic Triad',
  'Diagnostic Criteria',
  'Management Protocol',
  'General Pearl'
];

const ERROR_TYPE_OPTIONS: { key: MistakeErrorType; label: string; desc: string }[] = [
  { key: 'concept', label: 'Concept Gap', desc: 'Fundamental lack of understanding' },
  { key: 'retrieval', label: 'Retrieval Failure', desc: 'Forgot fact/number in the moment' },
  { key: 'misread', label: 'Misread Stem', desc: 'Overlooked EXCEPT/NOT/vital clue' },
  { key: 'fomo', label: 'FOMO / Overthink', desc: 'Changed right answer to wrong' }
];

const QUICK_DURATIONS = [15, 30, 45, 60, 90, 120];

export const AIActionConfirmModal: React.FC<AIActionConfirmModalProps> = ({
  isOpen,
  onClose,
  proposedAction,
  onActionCommitted,
  rawVoiceTranscript
}) => {
  const dbSubjects = useSubjects();
  const [isSaving, setIsSaving] = useState(false);
  const [draftAction, setDraftAction] = useState<ParsedAtlasAction | null>(null);

  // Sync state whenever proposedAction changes
  useEffect(() => {
    if (proposedAction) {
      // Deep clone to allow user edits without mutating original props
      setDraftAction(JSON.parse(JSON.stringify(proposedAction)));
    } else {
      setDraftAction(null);
    }
  }, [proposedAction]);

  if (!isOpen || !draftAction) return null;

  // Unified available subject list combining DB subjects + standard 19 medical subjects
  const subjectOptions = Array.from(
    new Map(
      [
        ...STANDARD_MEDICAL_SUBJECTS.map(s => ({ id: s.id, name: s.name })),
        ...dbSubjects.map(s => ({ id: s.id ?? s.name, name: s.name }))
      ].map(item => [item.name.toLowerCase(), item])
    ).values()
  );

  const handleCommit = async () => {
    if (!draftAction) return;
    setIsSaving(true);
    try {
      const result = await executeAtlasAction(draftAction);
      if (result.success) {
        onActionCommitted?.(result);
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const renderActionHeader = () => {
    let title = 'Review & Edit AI Proposal';
    let badgeText = 'AI Action';
    let icon = <Sparkles className="w-5 h-5 text-primary" />;

    switch (draftAction.action) {
      case 'ACTION_ADD_MISTAKE':
        title = '20th Notebook Mistake Proposal';
        badgeText = 'Clinical Pearl';
        icon = <Zap className="w-5 h-5 text-amber-500" />;
        break;
      case 'ACTION_LOG_STUDY':
        title = 'Study Session Proposal';
        badgeText = 'Spaced Recall';
        icon = <Clock className="w-5 h-5 text-blue-500" />;
        break;
      case 'ACTION_RECORD_SCORE':
        title = 'Grand Test Score Proposal';
        badgeText = 'Mock Exam';
        icon = <Award className="w-5 h-5 text-emerald-500" />;
        break;
      case 'ACTION_CLINICAL_QUERY':
        title = 'Clinical Coaching Insight';
        badgeText = 'Atlas AI';
        icon = <Brain className="w-5 h-5 text-primary" />;
        break;
    }

    return (
      <DialogHeader className="space-y-2 border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-muted flex items-center justify-center">
              {icon}
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold tracking-tight">
                ✨ AI Proposal — Review & Edit
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {title} • Verify parsed fields before saving to database
              </DialogDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs font-medium uppercase tracking-wider px-2.5 py-0.5">
            {badgeText}
          </Badge>
        </div>

        {rawVoiceTranscript && (
          <div className="bg-muted/60 p-2.5 rounded-md border text-xs text-muted-foreground mt-1 flex items-start gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
            <span className="italic line-clamp-2">"{rawVoiceTranscript}"</span>
          </div>
        )}
      </DialogHeader>
    );
  };

  const renderMistakeEditor = (mistake: ActionAddMistake) => {
    return (
      <div className="space-y-4 py-2">
        {/* Subject & System */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Medical Subject</Label>
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={mistake.subjectName}
              onChange={(e) => {
                const selected = subjectOptions.find(s => s.name === e.target.value);
                setDraftAction({
                  ...mistake,
                  subjectName: e.target.value,
                  subjectId: selected ? selected.id : mistake.subjectId
                });
              }}
            >
              {subjectOptions.map((s) => (
                <option key={String(s.id)} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">System / Chapter</Label>
            <Input
              value={mistake.systemName || ''}
              placeholder="e.g. Glomerular Diseases, CVS, Autonomic"
              className="h-9 text-sm"
              onChange={(e) => setDraftAction({ ...mistake, systemName: e.target.value })}
            />
          </div>
        </div>

        {/* High-Yield Tag Picker */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-foreground flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-primary" /> High-Yield Tag
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {MISTAKE_TAG_OPTIONS.map((tag) => {
              const isSelected = mistake.tag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setDraftAction({ ...mistake, tag })}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary font-medium shadow-xs'
                      : 'bg-background hover:bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rule Text / Key Takeaway */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground flex items-center justify-between">
            <span>20th Notebook Golden Rule (Takeaway)</span>
            <span className="text-[11px] text-muted-foreground">Keep crisp & memorable</span>
          </Label>
          <Textarea
            value={mistake.ruleText}
            rows={3}
            className="text-sm font-medium resize-none"
            placeholder="Enter the high-yield rule or clinical trap..."
            onChange={(e) => setDraftAction({ ...mistake, ruleText: e.target.value, keyTakeaway: e.target.value })}
          />
        </div>

        {/* Root Cause Error Type */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-foreground">Root Cause Classification</Label>
          <div className="grid grid-cols-2 gap-2">
            {ERROR_TYPE_OPTIONS.map((errOpt) => {
              const isSelected = mistake.errorType === errOpt.key;
              return (
                <button
                  key={errOpt.key}
                  type="button"
                  onClick={() => setDraftAction({ ...mistake, errorType: errOpt.key })}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-card hover:bg-muted/50 border-border text-foreground'
                  }`}
                >
                  <div className="text-xs font-semibold">{errOpt.label}</div>
                  <div className="text-[10px] text-muted-foreground line-clamp-1">{errOpt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Clinical Trigger & Urgency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1 border-t">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-foreground">Question Stem Context (Optional)</Label>
            <Input
              value={mistake.clinicalTrigger || ''}
              placeholder="e.g. Young female with proteinuria & hematuria"
              className="h-8 text-xs"
              onChange={(e) => setDraftAction({ ...mistake, clinicalTrigger: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0">
            <div className="text-right">
              <Label className="text-xs font-medium flex items-center gap-1 cursor-pointer">
                <Zap className={`w-3.5 h-3.5 ${mistake.isUrgent ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
                Volatile Trap
              </Label>
              <p className="text-[10px] text-muted-foreground">High decay rate</p>
            </div>
            <Switch
              checked={mistake.isUrgent}
              onCheckedChange={(checked) => setDraftAction({ ...mistake, isUrgent: checked })}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderStudyEditor = (study: ActionLogStudy) => {
    const handleStepMinutes = (delta: number) => {
      const current = study.durationMinutes || 60;
      const next = Math.max(5, current + delta);
      setDraftAction({ ...study, durationMinutes: next });
    };

    return (
      <div className="space-y-4 py-2">
        {/* Subject & Module */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Subject</Label>
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={study.subjectName}
              onChange={(e) => {
                const selected = subjectOptions.find(s => s.name === e.target.value);
                setDraftAction({
                  ...study,
                  subjectName: e.target.value,
                  subjectId: selected ? selected.id : study.subjectId
                });
              }}
            >
              {subjectOptions.map((s) => (
                <option key={String(s.id)} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">System / Module</Label>
            <Input
              value={study.systemName}
              placeholder="e.g. CVS, Renal, Cranial Nerves"
              className="h-9 text-sm"
              onChange={(e) => setDraftAction({ ...study, systemName: e.target.value })}
            />
          </div>
        </div>

        {/* Duration Stepper */}
        <div className="space-y-2 p-3 bg-muted/40 rounded-lg border">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" /> Study Duration
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleStepMinutes(-15)}
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <div className="min-w-[70px] text-center font-bold text-base text-foreground">
                {study.durationMinutes} <span className="text-xs font-normal text-muted-foreground">mins</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleStepMinutes(15)}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {QUICK_DURATIONS.map((dur) => (
              <button
                key={dur}
                type="button"
                onClick={() => setDraftAction({ ...study, durationMinutes: dur })}
                className={`text-xs px-2 py-0.5 rounded border transition-all ${
                  study.durationMinutes === dur
                    ? 'bg-primary text-primary-foreground border-primary font-medium'
                    : 'bg-background hover:bg-muted text-muted-foreground border-border'
                }`}
              >
                {dur >= 60 ? `${dur / 60}h` : `${dur}m`}
              </button>
            ))}
          </div>
        </div>

        {/* Confidence Level Pill Selector */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-foreground">Post-Study Recall Confidence</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { level: 'HIGH' as ConfidenceLevel, label: '🟢 High', sub: 'Strong (7d+ recall)' },
              { level: 'MED' as ConfidenceLevel, label: '🟡 Medium', sub: 'Average (3d recall)' },
              { level: 'LOW' as ConfidenceLevel, label: '🔴 Low', sub: 'Weak (1d review)' }
            ].map((c) => {
              const isSelected = study.confidenceLevel === c.level;
              return (
                <button
                  key={c.level}
                  type="button"
                  onClick={() => setDraftAction({ ...study, confidenceLevel: c.level })}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-primary ring-1 ring-primary'
                      : 'bg-card hover:bg-muted/50 border-border text-foreground'
                  }`}
                >
                  <div className="text-xs font-bold">{c.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{c.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Topics Studied (Optional) */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground">Topics Covered (Optional)</Label>
          <Input
            value={study.topicsStudied || ''}
            placeholder="e.g. Valvular heart disease, ECG patterns, Murmurs"
            className="h-9 text-sm"
            onChange={(e) => setDraftAction({ ...study, topicsStudied: e.target.value })}
          />
        </div>
      </div>
    );
  };

  const renderScoreEditor = (scoreRec: ActionRecordScore) => {
    const percentage = scoreRec.totalMarks > 0 
      ? Math.round((scoreRec.score / scoreRec.totalMarks) * 100) 
      : 0;

    const handleRemoveWeakSubject = (subjToRemove: string) => {
      const updated = scoreRec.weakSubjects.filter(s => s !== subjToRemove);
      setDraftAction({ ...scoreRec, weakSubjects: updated });
    };

    const handleAddWeakSubject = (subjToAdd: string) => {
      if (!subjToAdd || scoreRec.weakSubjects.includes(subjToAdd)) return;
      setDraftAction({ ...scoreRec, weakSubjects: [...scoreRec.weakSubjects, subjToAdd] });
    };

    return (
      <div className="space-y-4 py-2">
        {/* Test Name */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground">Grand Test / Mock Exam Name</Label>
          <Input
            value={scoreRec.testName}
            placeholder="e.g. Marrow GT 12, Prepladder CBT 3, INI-CET Mock 4"
            className="h-9 text-sm"
            onChange={(e) => setDraftAction({ ...scoreRec, testName: e.target.value })}
          />
        </div>

        {/* Score & Total with Live Percentage */}
        <div className="p-3 bg-muted/40 rounded-lg border space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-foreground">Score Achieved</Label>
              <Input
                type="number"
                value={scoreRec.score}
                className="h-9 text-sm font-semibold"
                onChange={(e) => setDraftAction({ ...scoreRec, score: Number(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-foreground">Total Maximum Score</Label>
              <Input
                type="number"
                value={scoreRec.totalMarks}
                className="h-9 text-sm"
                onChange={(e) => setDraftAction({ ...scoreRec, totalMarks: Number(e.target.value) || 200 })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
            <span className="text-muted-foreground font-medium">Calculated Percentage:</span>
            <div className="flex items-center gap-2">
              <span className={`font-bold text-sm ${percentage >= 70 ? 'text-emerald-500' : percentage >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                {percentage}%
              </span>
              <Badge variant={percentage >= 70 ? 'default' : 'secondary'} className="text-[10px] py-0">
                {percentage >= 75 ? 'Target Exceeded 🎯' : percentage >= 60 ? 'Competitive Range' : 'Needs Reinforcement'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Weak Subjects Tag Editor */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-foreground flex items-center justify-between">
            <span>Weak Subjects Identified</span>
            <span className="text-[11px] text-muted-foreground">Will be prioritized in Atlas</span>
          </Label>

          <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-background rounded-md border">
            {scoreRec.weakSubjects.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">No weak subjects flagged yet.</span>
            ) : (
              scoreRec.weakSubjects.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-medium"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => handleRemoveWeakSubject(s)}
                    className="hover:text-rose-800 dark:hover:text-rose-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Quick add dropdown */}
          <div className="flex items-center gap-2">
            <select
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-muted-foreground"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  handleAddWeakSubject(e.target.value);
                  e.target.value = '';
                }
              }}
            >
              <option value="" disabled>+ Add weak subject...</option>
              {STANDARD_MEDICAL_SUBJECTS.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Test Notes */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground">Reflections & High-Yield Mistakes (Optional)</Label>
          <Textarea
            value={scoreRec.notes || ''}
            rows={2}
            className="text-xs resize-none"
            placeholder="Key takeaways or time-management reflections..."
            onChange={(e) => setDraftAction({ ...scoreRec, notes: e.target.value })}
          />
        </div>
      </div>
    );
  };

  const renderClinicalQueryView = (query: ActionClinicalQuery) => {
    return (
      <div className="space-y-4 py-2">
        <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Brain className="w-4 h-4" /> Atlas Clinical Coach
          </div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {query.reply}
          </p>
        </div>

        {query.suggestedAction && (
          <div className="p-3 rounded-md bg-muted/60 border text-xs space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Recommended Study Step:
            </div>
            <p className="text-muted-foreground">{query.suggestedAction}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent 
        className="w-[95vw] max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6"
        hideCloseButton={false}
      >
        {renderActionHeader()}

        {/* Interactive Form Switcher */}
        {draftAction.action === 'ACTION_ADD_MISTAKE' && renderMistakeEditor(draftAction as ActionAddMistake)}
        {draftAction.action === 'ACTION_LOG_STUDY' && renderStudyEditor(draftAction as ActionLogStudy)}
        {draftAction.action === 'ACTION_RECORD_SCORE' && renderScoreEditor(draftAction as ActionRecordScore)}
        {draftAction.action === 'ACTION_CLINICAL_QUERY' && renderClinicalQueryView(draftAction as ActionClinicalQuery)}

        {/* Footer Actions */}
        <DialogFooter className="flex-row items-center justify-end gap-2 pt-3 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 sm:flex-none"
          >
            <X className="w-4 h-4 mr-1.5 text-muted-foreground" />
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleCommit}
            disabled={isSaving}
            className="flex-1 sm:flex-none font-semibold shadow-xs"
          >
            {isSaving ? (
              <span className="flex items-center gap-1.5">Saving to Atlas...</span>
            ) : (
              <>
                <Check className="w-4 h-4 mr-1.5 text-primary-foreground" />
                Confirm & Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
