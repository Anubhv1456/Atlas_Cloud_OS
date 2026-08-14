import React, { useState, useEffect, useMemo } from 'react';
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
  Zap,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_SUBJECTS } from '@/data/ontology';
import { toast } from 'sonner';

export interface QuickMistakeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSubjectId?: number | string;
  defaultSystemId?: number | string;
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
  const dbSubjects = useLiveQuery(() => db.subjects?.filter(s => !s.deletedAt).toArray()) || [];
  const dbSystems = useLiveQuery(() => db.systems?.filter(s => !s.deletedAt).toArray()) || [];

  // Combine db subjects with ontology subjects for comprehensive selection
  const subjects = useMemo(() => {
    if (dbSubjects.length > 0) return dbSubjects;
    return ALL_SUBJECTS.map(s => ({ id: s.id, name: s.name }));
  }, [dbSubjects]);

  const [subjectId, setSubjectId] = useState<string | number>('');
  const [systemId, setSystemId] = useState<string | number>('');
  const [curriculumSetId, setCurriculumSetId] = useState<string>('');
  const [topicId, setTopicId] = useState<string>('');
  const [errorType, setErrorType] = useState<'concept' | 'retrieval' | 'misread' | 'fomo'>('concept');
  const [source, setSource] = useState<'GT' | 'QBank' | 'Custom'>('QBank');
  const [keyTakeaway, setKeyTakeaway] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available systems filtered by selected subject
  const availableSystems = useMemo(() => {
    if (!subjectId) return [];
    return dbSystems.filter(sys => String(sys.subjectId) === String(subjectId));
  }, [dbSystems, subjectId]);

  // Sync state whenever modal opens or defaults change
  useEffect(() => {
    if (open) {
      const initialSubjectId = defaultSubjectId !== undefined
        ? defaultSubjectId 
        : (subjects[0]?.id !== undefined ? subjects[0].id : 1);
      
      setSubjectId(initialSubjectId);
      setCurriculumSetId(defaultCurriculumSetId || '');
      setTopicId(defaultTopicId || '');
      setKeyTakeaway('');
      setErrorType('concept');
      setSource('QBank');

      // Find matching systems for initial subject
      const matchingSystems = dbSystems.filter(sys => String(sys.subjectId) === String(initialSubjectId));
      if (defaultSystemId !== undefined && matchingSystems.some(sys => String(sys.id) === String(defaultSystemId))) {
        setSystemId(defaultSystemId);
      } else if (matchingSystems.length > 0) {
        setSystemId(matchingSystems[0].id!);
      } else {
        setSystemId(defaultSystemId !== undefined ? defaultSystemId : 0);
      }
    }
  }, [open, defaultSubjectId, defaultSystemId, defaultCurriculumSetId, defaultTopicId, subjects, dbSystems]);

  // When subject is changed manually by user, auto-select first available system
  const handleSubjectChange = (newSubId: string | number) => {
    setSubjectId(newSubId);
    const matching = dbSystems.filter(sys => String(sys.subjectId) === String(newSubId));
    if (matching.length > 0) {
      setSystemId(matching[0].id!);
    } else {
      setSystemId(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyTakeaway.trim()) {
      toast.error('Please enter a 1-line key takeaway rule.');
      return;
    }
    if (!subjectId) {
      toast.error('Please select a subject.');
      return;
    }

    setIsSubmitting(true);
    try {
      await logMistake({
        subjectId,
        systemId: systemId || 0,
        curriculumSetId: curriculumSetId ? curriculumSetId.trim() : undefined,
        topicId: topicId ? topicId.trim() : undefined,
        errorType,
        keyTakeaway: keyTakeaway.trim(),
        source
      });
      setKeyTakeaway('');
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to log mistake:', err);
      toast.error(err?.message || 'Failed to save takeaway.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const insertPromptShortcut = (prefix: string) => {
    setKeyTakeaway(prev => {
      if (!prev) return prefix + ' ';
      if (prev.endsWith(' ') || prev.endsWith('.')) return `${prev} ${prefix} `;
      return `${prev}. ${prefix} `;
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
      <DialogContent id="quick-mistake-dialog" className="sm:max-w-lg rounded-3xl p-6 border-border/80 shadow-2xl bg-card text-foreground">
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
              <Label htmlFor="mistake-subject-select" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Subject *
              </Label>
              <select
                id="mistake-subject-select"
                value={String(subjectId)}
                onChange={e => handleSubjectChange(e.target.value)}
                className="w-full h-9 rounded-xl border border-border/80 bg-muted/20 px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                {subjects.map(s => (
                  <option key={String(s.id)} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="mistake-system-select" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                System
              </Label>
              <select
                id="mistake-system-select"
                value={String(systemId)}
                onChange={e => setSystemId(e.target.value)}
                className="w-full h-9 rounded-xl border border-border/80 bg-muted/20 px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                {availableSystems.length === 0 ? (
                  <option value="0">General / All Systems</option>
                ) : (
                  availableSystems.map(sys => (
                    <option key={String(sys.id)} value={String(sys.id)}>
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
              <Label htmlFor="mistake-topic-input" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Topic Tag (Optional)
              </Label>
              <span className="text-[10px] text-muted-foreground font-normal">e.g., Mitral Stenosis</span>
            </div>
            <Input
              id="mistake-topic-input"
              value={topicId}
              onChange={e => setTopicId(e.target.value)}
              placeholder="e.g. Rheumatic Heart Disease or Wernicke Encephalopathy"
              className="h-9 text-xs rounded-xl border-border/80 bg-muted/20 text-foreground"
            />
          </div>

          {/* Error Classification Pills */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Error Root Cause *
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {errorTypePills.map(pill => {
                const Icon = pill.icon;
                const isSelected = errorType === pill.id;
                return (
                  <button
                    key={pill.id}
                    id={`btn-error-type-${pill.id}`}
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
                  id={`btn-source-${src.toLowerCase()}`}
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
              <Label htmlFor="mistake-takeaway-input" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                1-Line High-Yield Rule *
              </Label>
              {/* Clinical Prompt Shortcuts */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground/70 font-medium mr-0.5">Insert:</span>
                <button
                  type="button"
                  onClick={() => insertPromptShortcut('DOC:')}
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-muted/40 hover:bg-primary/20 hover:text-primary text-muted-foreground border border-border/40 transition-colors cursor-pointer"
                >
                  + DOC
                </button>
                <button
                  type="button"
                  onClick={() => insertPromptShortcut('IOC:')}
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-muted/40 hover:bg-primary/20 hover:text-primary text-muted-foreground border border-border/40 transition-colors cursor-pointer"
                >
                  + IOC
                </button>
                <button
                  type="button"
                  onClick={() => insertPromptShortcut('Classic triad:')}
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-muted/40 hover:bg-primary/20 hover:text-primary text-muted-foreground border border-border/40 transition-colors cursor-pointer"
                >
                  + Triad
                </button>
              </div>
            </div>

            <textarea
              id="mistake-takeaway-input"
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
              id="btn-cancel-mistake"
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              id="btn-save-mistake"
              type="submit"
              disabled={isSubmitting || !keyTakeaway.trim() || !subjectId}
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
