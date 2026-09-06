import { useLexicon } from '@/lib/lexicon';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';
import { logMistake, updateMistakeLog } from '@/db/mutations';
import type { MistakeLog } from '@/db/types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Sparkles, 
  Plus, 
  Tag as TagIcon, 
  CornerDownLeft, 
  Check, 
  BookOpen, 
  Flame, 
  Trash2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getOntologyForExam } from '@/data/ontology';
import { useExamProfile } from '@/hooks/useExamProfile';
import { toast } from 'sonner';

export interface QuickMistakeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSubjectId?: number | string;
  defaultSystemId?: number | string;
  defaultCurriculumSetId?: string;
  defaultTopicId?: string;
  defaultTags?: string[];
  editingMistake?: MistakeLog | null;
  onDeleteMistake?: (mistake: MistakeLog) => void;
  onSaved?: () => void;
}

export interface ClinicalLens {
  id: string;
  label: string;
  tag: string;
  icon: string;
  prefix?: string;
}

export const HIGH_YIELD_CLINICAL_LENSES: ClinicalLens[] = [
  { id: 'lens_doc', label: 'Drug of Choice (DOC)', tag: 'DOC', icon: '💊', prefix: 'DOC:' },
  { id: 'lens_ioc', label: 'Investigation (IOC)', tag: 'IOC', icon: '🔍', prefix: 'IOC:' },
  { id: 'lens_triad', label: 'Classic Triad / Sign', tag: 'Triad', icon: '⚠️', prefix: 'Triad:' },
  { id: 'lens_criteria', label: 'Staging / Criteria', tag: 'Criteria', icon: '📊', prefix: 'Criteria:' },
  { id: 'lens_imaging', label: 'Imaging / Sign', tag: 'Imaging', icon: '🩻', prefix: 'Imaging:' },
  { id: 'lens_histopath', label: 'Histopath / Biopsy', tag: 'Histopath', icon: '🔬', prefix: 'Biopsy:' },
  { id: 'lens_contra', label: 'Contraindicated', tag: 'Contraindicated', icon: '🚫', prefix: 'Contraindicated:' },
  { id: 'lens_confusion', label: 'Twin Distinction', tag: 'Twin Distinction', icon: '🔄', prefix: 'Twin Distinction:' },
  { id: 'lens_peds_preg', label: 'Peds / Pregnancy', tag: 'Pregnancy-Peds', icon: '👶', prefix: 'Pregnancy/Peds:' }
];

export function QuickMistakeModal({
  open,
  onOpenChange,
  defaultSubjectId,
  defaultSystemId,
  defaultCurriculumSetId,
  defaultTopicId,
  defaultTags = [],
  editingMistake,
  onDeleteMistake,
  onSaved
}: QuickMistakeModalProps) {
  const lexicon = useLexicon();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Database subjects
  const { profile } = useExamProfile();
  const dbSubjects = useLiveQuery(() => db.subjects?.filter(s => !s.deletedAt).toArray(), []) || [];
  
  // Normalized 19 Subjects List
  const subjectOptions = useMemo(() => {
    if (dbSubjects.length > 0) {
      return dbSubjects.map(s => ({ id: s.id, name: s.name }));
    }
    return getOntologyForExam(profile.targetExam || 'NEET PG').map(s => ({ id: s.id, name: s.name }));
  }, [dbSubjects, profile.targetExam]);

  const [subjectId, setSubjectId] = useState<number | string>(subjectOptions[0]?.id || 1);
  const [keyTakeaway, setKeyTakeaway] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isVolatile, setIsVolatile] = useState(false);
  const [source, setSource] = useState<'GT' | 'QBank' | 'Custom'>('GT');
  const [saving, setSaving] = useState(false);

  // Re-hydrate form when opening or editing
  useEffect(() => {
    if (open) {
      if (editingMistake) {
        setSubjectId(editingMistake.subjectId || subjectOptions[0]?.id || 1);
        setKeyTakeaway(editingMistake.keyTakeaway || (editingMistake as any).goldenTakeaway || (editingMistake as any).questionTopic || '');
        setSelectedTags(editingMistake.tags || (editingMistake as any).coreLenses || []);
        setIsVolatile(Boolean(editingMistake.isVolatile));
        setSource(editingMistake.source || 'GT');
      } else {
        if (defaultSubjectId) {
          const match = subjectOptions.find(
            s => String(s.id).toLowerCase() === String(defaultSubjectId).toLowerCase() ||
                 s.name.toLowerCase() === String(defaultSubjectId).toLowerCase()
          );
          setSubjectId(match ? match.id : (defaultSubjectId || subjectOptions[0]?.id || 1));
        } else {
          setSubjectId(subjectOptions[0]?.id || 1);
        }
        setKeyTakeaway('');
        setSelectedTags(defaultTags || []);
        setIsVolatile(false);
        setSource('GT');
      }
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 80);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingMistake]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!keyTakeaway.trim()) {
      toast.error('Please enter the clinical rule or takeaway.');
      textareaRef.current?.focus();
      return;
    }

    setSaving(true);
    try {
      if (editingMistake && editingMistake.id) {
        await updateMistakeLog(editingMistake.id, {
          subjectId,
          keyTakeaway: keyTakeaway.trim(),
          tags: selectedTags,
          isVolatile,
          source,
          updatedAt: new Date()
        });
        toast.success(`${lexicon.mistakesJournal} rule updated`);
      } else {
        await logMistake({
          subjectId,
          systemId: defaultSystemId || 0,
          curriculumSetId: defaultCurriculumSetId,
          topicId: defaultTopicId,
          errorType: 'concept',
          keyTakeaway: keyTakeaway.trim(),
          tags: selectedTags,
          isVolatile,
          source
        });
      }

      onOpenChange(false);
      if (onSaved) onSaved();
    } catch (err) {
      console.error(`Failed to save ${lexicon.mistakesJournal} rule:`, err);
      toast.error('Could not save rule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-w-[95vw] rounded-2xl p-5 sm:p-6 bg-card border border-border/80 shadow-2xl">
        <DialogHeader className="space-y-1 text-left border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <BookOpen className="w-4 h-4" />
            </span>
            <DialogTitle className="text-lg font-extrabold tracking-tight text-foreground">
              {editingMistake ? `Edit ${lexicon.mistakesJournal} Rule` : `Add to ${lexicon.mistakesJournal}`}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Curate an atomic clinical rule, drug choice, or volatile distinction for rapid pre-GT reading.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-1">
          {/* Top Selection Row: Subject & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Subject
              </label>
              <select
                value={String(subjectId)}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-muted/40 border border-border/80 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-all"
              >
                {subjectOptions.map(s => (
                  <option key={String(s.id)} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Source
              </label>
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/80">
                {(['GT', 'QBank', 'Custom'] as const).map(src => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setSource(src)}
                    className={cn(
                      "flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      source === src
                        ? "bg-card text-foreground shadow-xs border border-border/60"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {src === 'GT' ? 'Grand Test' : src === 'QBank' ? 'Q-Bank' : 'Custom'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Core Rule Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                The Golden Rule / Key Distinction
              </label>
              <span className="text-xs text-muted-foreground font-mono">
                ⌘ + Enter to save
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={keyTakeaway}
              onChange={(e) => setKeyTakeaway(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              placeholder="e.g. Initial test for Pheo: Plasma free metanephrines. Most specific: 24h urine metanephrines. DOC for crisis: Phentolamine."
              className="w-full p-3 rounded-xl bg-muted/30 border border-border/80 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed transition-all"
            />
          </div>

          {/* Quick Tag Pills */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              High-Yield Tags (1-Tap Selection)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {HIGH_YIELD_CLINICAL_LENSES.map(lens => {
                const isSelected = selectedTags.includes(lens.tag);
                return (
                  <button
                    key={lens.id}
                    type="button"
                    onClick={() => toggleTag(lens.tag)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all border cursor-pointer",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/30 border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <span>{lens.icon}</span>
                    <span>{lens.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Volatile Pin Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <span className="p-1 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Zap className="w-4 h-4 fill-amber-500" />
              </span>
              <div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 block">
                  Mark as Volatile Trap ⚡
                </span>
                <span className="text-xs text-amber-600/80 dark:text-amber-400/80">
                  Highlight this rule in the pre-GT urgent revision spotlight.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsVolatile(!isVolatile)}
              className={cn(
                "w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer",
                isVolatile 
                  ? "bg-amber-500 border-amber-500 text-white shadow-xs" 
                  : "border-border/80 bg-card hover:border-amber-400"
              )}
            >
              {isVolatile && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          </div>

          {/* Footer Actions */}
          <DialogFooter className="flex items-center justify-between sm:justify-between pt-2 border-t border-border/60 gap-2">
            <div>
              {editingMistake && onDeleteMistake && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteMistake(editingMistake)}
                  className="text-destructive hover:bg-destructive/10 text-xs font-bold gap-1 rounded-xl h-9 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="rounded-xl text-xs font-semibold h-9 px-3.5 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs gap-1.5 h-9 px-4 cursor-pointer"
              >
                <span>{editingMistake ? 'Update Rule' : 'Save to Notebook'}</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
