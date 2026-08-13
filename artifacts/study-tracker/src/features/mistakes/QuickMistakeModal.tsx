import React, { useState, useEffect } from 'react';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';
import { logMistake } from '@/db/mutations';
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
import { Label } from '@/components/ui/label';
import { 
  Brain, 
  Eye, 
  RotateCcw,
  Sparkles,
  FileText,
  Zap,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuickMistakeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSubjectId?: number;
  defaultSystemId?: number;
  defaultCurriculumSetId?: string;
  defaultTopicId?: string;
}

export function QuickMistakeModal({
  open,
  onOpenChange,
  defaultSubjectId,
  defaultSystemId,
  defaultCurriculumSetId,
  defaultTopicId
}: QuickMistakeModalProps) {
  const subjects = useLiveQuery(() => db.subjects.filter(s => !s.deletedAt).toArray()) || [];
  const systems = useLiveQuery(() => db.systems.filter(s => !s.deletedAt).toArray()) || [];

  const [subjectId, setSubjectId] = useState<number>(defaultSubjectId || (subjects[0]?.id || 1));
  const [systemId, setSystemId] = useState<number>(defaultSystemId || 0);
  const [curriculumSetId, setCurriculumSetId] = useState<string>(defaultCurriculumSetId || '');
  const [topicId, setTopicId] = useState<string>(defaultTopicId || '');
  const [errorType, setErrorType] = useState<'concept' | 'retrieval' | 'misread' | 'fomo'>('concept');
  const [source, setSource] = useState<'GT' | 'QBank' | 'Custom'>('QBank');
  const [keyTakeaway, setKeyTakeaway] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync defaults when modal opens
  useEffect(() => {
    if (open) {
      if (defaultSubjectId) setSubjectId(defaultSubjectId);
      if (defaultSystemId) setSystemId(defaultSystemId);
      if (defaultCurriculumSetId) setCurriculumSetId(defaultCurriculumSetId);
      if (defaultTopicId) setTopicId(defaultTopicId);
    }
  }, [open, defaultSubjectId, defaultSystemId, defaultCurriculumSetId, defaultTopicId]);

  // Filter systems by selected subject
  const availableSystems = systems.filter(sys => String(sys.subjectId) === String(subjectId));

  // Set default system when subject changes if current systemId is invalid
  useEffect(() => {
    if (availableSystems.length > 0) {
      if (!systemId || !availableSystems.some(sys => sys.id === systemId)) {
        setSystemId(availableSystems[0].id!);
      }
    } else if (subjects.length > 0 && (!subjectId || !subjects.some(s => s.id === subjectId))) {
      setSubjectId(subjects[0].id!);
    }
  }, [subjectId, availableSystems, systems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyTakeaway.trim()) return;
    if (!subjectId || !systemId) return;

    setIsSubmitting(true);
    try {
      await logMistake({
        subjectId,
        systemId,
        curriculumSetId: curriculumSetId || undefined,
        topicId: topicId.trim() || undefined,
        errorType,
        keyTakeaway: keyTakeaway.trim(),
        source
      });
      setKeyTakeaway('');
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to log mistake:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const insertPromptShortcut = (prefix: string) => {
    setKeyTakeaway(prev => {
      if (!prev) return prefix;
      if (prev.endsWith(' ') || prev.endsWith('.')) return `${prev} ${prefix}`;
      return `${prev}. ${prefix}`;
    });
  };

  const errorTypePills = [
    {
      id: 'concept' as const,
      label: 'Knowledge Gap',
      icon: Brain,
      color: 'border-rose-500/40 text-rose-500 bg-rose-500/10 dark:text-rose-400',
      description: 'Missing core clinical concept'
    },
    {
      id: 'misread' as const,
      label: 'Execution Slip',
      icon: Eye,
      color: 'border-amber-500/40 text-amber-500 bg-amber-500/10 dark:text-amber-400',
      description: 'Misread option or question stem'
    },
    {
      id: 'retrieval' as const,
      label: 'Retrieval Failure',
      icon: RotateCcw,
      color: 'border-sky-500/40 text-sky-500 bg-sky-500/10 dark:text-sky-400',
      description: 'Fact recall slip under time pressure'
    },
    {
      id: 'fomo' as const,
      label: 'Overthinking',
      icon: HelpCircle,
      color: 'border-purple-500/40 text-purple-500 bg-purple-500/10 dark:text-purple-400',
      description: 'Changed right answer to wrong'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-3xl p-6 border-border/80 shadow-2xl bg-card text-foreground">
        <DialogHeader className="space-y-1 pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold text-foreground tracking-tight">
                Express Mistake Capture
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Convert QBank & GT errors into high-yield active recall takeaways.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Subject & System Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Subject
              </Label>
              <select
                value={subjectId}
                onChange={e => setSubjectId(Number(e.target.value))}
                className="w-full h-9 rounded-xl border border-border/80 bg-muted/20 px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                System
              </Label>
              <select
                value={systemId}
                onChange={e => setSystemId(Number(e.target.value))}
                className="w-full h-9 rounded-xl border border-border/80 bg-muted/20 px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                {availableSystems.length === 0 ? (
                  <option value={0}>No systems defined</option>
                ) : (
                  availableSystems.map(sys => (
                    <option key={sys.id} value={sys.id}>
                      {sys.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Optional Topic Tag */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Topic Tag (Optional)
              </Label>
              <span className="text-[10px] text-muted-foreground font-normal">e.g., Mitral Stenosis</span>
            </div>
            <Input
              value={topicId}
              onChange={e => setTopicId(e.target.value)}
              placeholder="e.g. Rheumatic Heart Disease or Wernicke Encephalopathy"
              className="h-9 text-xs rounded-xl border-border/80 bg-muted/20 text-foreground"
            />
          </div>

          {/* Error Classification Pills */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Error Root Cause
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {errorTypePills.map(pill => {
                const Icon = pill.icon;
                const isSelected = errorType === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setErrorType(pill.id)}
                    className={cn(
                      "flex items-start gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer",
                      isSelected
                        ? `${pill.color} border-2 shadow-xs font-bold`
                        : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight">{pill.label}</div>
                      <div className="text-[10px] text-muted-foreground leading-none font-normal truncate mt-0.5">
                        {pill.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Source Pills */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Question Source
            </Label>
            <div className="flex items-center gap-2">
              {(['QBank', 'GT', 'Custom'] as const).map(src => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setSource(src)}
                  className={cn(
                    "flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                    source === src
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {src === 'GT' ? 'Grand Test (GT)' : src === 'QBank' ? 'QBank' : 'Custom Note'}
                </button>
              ))}
            </div>
          </div>

          {/* Key Takeaway Text Input with Clinical Prompt Shortcuts */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                1-Line High-Yield Rule *
              </Label>
              {/* Clinical Prompt Shortcuts */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground/70 font-medium mr-0.5">Insert:</span>
                <button
                  type="button"
                  onClick={() => insertPromptShortcut('DOC:')}
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-muted/40 hover:bg-primary/20 hover:text-primary text-muted-foreground border border-border/40 transition-colors"
                >
                  + DOC
                </button>
                <button
                  type="button"
                  onClick={() => insertPromptShortcut('IOC:')}
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-muted/40 hover:bg-primary/20 hover:text-primary text-muted-foreground border border-border/40 transition-colors"
                >
                  + IOC
                </button>
                <button
                  type="button"
                  onClick={() => insertPromptShortcut('Classic triad:')}
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-muted/40 hover:bg-primary/20 hover:text-primary text-muted-foreground border border-border/40 transition-colors"
                >
                  + Triad
                </button>
              </div>
            </div>

            <textarea
              value={keyTakeaway}
              onChange={e => setKeyTakeaway(e.target.value)}
              placeholder="e.g. DOC for acute Wernicke Encephalopathy is IV Thiamine BEFORE Glucose."
              rows={3}
              required
              className="w-full rounded-xl border border-border/80 bg-muted/20 p-3 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <DialogFooter className="pt-2 border-t border-border/40 flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !keyTakeaway.trim() || !systemId}
              className="bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-xs cursor-pointer px-5 gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Save to Vault'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
