import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { ALL_SUBJECTS, ALL_TOPICS } from '@/data/ontology';
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
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Brain, 
  Zap, 
  Eye, 
  AlertTriangle, 
  Plus, 
  Check, 
  FileText,
  Sparkles 
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
  const availableSystems = systems.filter(sys => sys.subjectId === subjectId);

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

  const errorTypePills = [
    {
      id: 'concept' as const,
      label: 'Concept',
      icon: Brain,
      color: 'border-purple-500/40 text-purple-600 bg-purple-500/10 dark:text-purple-400',
      description: 'Misunderstood pathophys / core rule'
    },
    {
      id: 'retrieval' as const,
      label: 'Retrieval',
      icon: Zap,
      color: 'border-amber-500/40 text-amber-600 bg-amber-500/10 dark:text-amber-400',
      description: 'Knew concept, failed memory recall'
    },
    {
      id: 'misread' as const,
      label: 'Misread',
      icon: Eye,
      color: 'border-blue-500/40 text-blue-600 bg-blue-500/10 dark:text-blue-400',
      description: 'Misread question stem / EXCEPT / NOT'
    },
    {
      id: 'fomo' as const,
      label: 'FOMO',
      icon: AlertTriangle,
      color: 'border-destructive/40 text-destructive bg-destructive/10',
      description: 'Overthought or picked obscure option'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-3xl p-6 border-primary/20 shadow-xl bg-card">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
              <FileText className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Log Mistake to Notebook
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            2-tap capture to replace physical error logs. System-level aggregated for high-yield review.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {/* Subject & System Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Subject
              </Label>
              <select
                value={subjectId}
                onChange={e => setSubjectId(Number(e.target.value))}
                className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                System
              </Label>
              <select
                value={systemId}
                onChange={e => setSystemId(Number(e.target.value))}
                className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
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
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Topic Tag (Optional)</span>
              <span className="text-[10px] text-muted-foreground font-normal">e.g., Mitral Stenosis</span>
            </Label>
            <Input
              value={topicId}
              onChange={e => setTopicId(e.target.value)}
              placeholder="e.g. Wernicke Encephalopathy or Rheumatic Heart Disease"
              className="h-9 text-xs rounded-xl border-border bg-background"
            />
          </div>

          {/* Error Type Selector Pills */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Error Classification
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
                      "flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                      isSelected
                        ? `${pill.color} border-2 shadow-xs font-bold`
                        : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold leading-tight">{pill.label}</div>
                      <div className="text-[10px] text-muted-foreground leading-none font-normal line-clamp-1">
                        {pill.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Source Selector */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
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
                      : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  {src === 'GT' ? 'Grand Test (GT)' : src === 'QBank' ? 'QBank Session' : 'Custom Note'}
                </button>
              ))}
            </div>
          </div>

          {/* Key Takeaway Text input */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              1-Line Key Takeaway / High-Yield Rule *
            </Label>
            <textarea
              value={keyTakeaway}
              onChange={e => setKeyTakeaway(e.target.value)}
              placeholder="e.g., Wernicke triad: confusion, ataxia, ophthalmoplegia. Give thiamine BEFORE glucose."
              rows={3}
              required
              className="w-full rounded-xl border border-border bg-background p-3 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          <DialogFooter className="pt-2 border-t border-border/50 flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !keyTakeaway.trim() || !systemId}
              className="bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md cursor-pointer px-5"
            >
              {isSubmitting ? 'Saving...' : 'Save to Mistake Log'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
