import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OntologyTopic } from '@/data/ontology';
import { createCurriculumSet, updateCurriculumSet } from '@/db/mutations';
import { CurriculumSet } from '@/db/types';
import { Check, Zap, Sparkles, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CurriculumSetFormProps {
  isOpen: boolean;
  onClose: () => void;
  systemId: number;
  subjectId: number;
  allTopics: OntologyTopic[];
  initialData?: CurriculumSet;
}

const COLORS = ['teal', 'amber', 'purple', 'blue', 'gray'] as const;

export function CurriculumSetForm({ isOpen, onClose, systemId, subjectId, allTopics, initialData }: CurriculumSetFormProps) {
  const [name, setName] = useState('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set());
  const [color, setColor] = useState<'teal' | 'amber' | 'purple' | 'blue' | 'gray'>('teal');
  const [depth, setDepth] = useState<'rapid' | 'standard' | 'deep'>('standard');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setSelectedTopicIds(new Set(initialData.topicIds));
        setColor(initialData.color || 'teal');
        setDepth(initialData.depth || (initialData.isLengthy ? 'deep' : 'standard'));
      } else {
        setName('');
        setSelectedTopicIds(new Set());
        setColor('teal');
        setDepth('standard');
      }
      setSearch('');
    }
  }, [isOpen, initialData]);

  const handleToggleTopic = (topicId: string) => {
    const next = new Set(selectedTopicIds);
    if (next.has(topicId)) next.delete(topicId);
    else next.add(topicId);
    setSelectedTopicIds(next);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (selectedTopicIds.size === 0) {
      toast.error('Select at least one topic');
      return;
    }

    try {
      if (initialData?.id) {
        await updateCurriculumSet(initialData.id, {
          name: name.trim(),
          topicIds: Array.from(selectedTopicIds),
          color,
          depth,
          isLengthy: depth === 'deep',
        });
        toast.success('Study block updated');
      } else {
        await createCurriculumSet({
          subjectId,
          systemId,
          name: name.trim(),
          topicIds: Array.from(selectedTopicIds),
          color,
          depth,
          isLengthy: depth === 'deep',
        });
        toast.success('Study block created');
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save Study Block');
    }
  };

  const filteredTopics = allTopics.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] max-h-[85vh] overflow-hidden flex flex-col rounded-2xl mx-4 w-[calc(100%-2rem)]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Study Block' : 'Create Study Block'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0">
          <div className="space-y-4 py-4 overflow-y-auto flex-1 px-1">
            <div className="space-y-1.5">
              <Label>Set Name</Label>
              <Input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Revision QBank, Main Content Block 1..."
                required
              />
            </div>

            {/* Cognitive Depth Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Cognitive Depth</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDepth('rapid')}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border transition-all cursor-pointer font-semibold text-xs",
                    depth === 'rapid'
                      ? "border-amber-500/50 bg-amber-500/10 shadow-xs text-amber-400 font-bold"
                      : "border-border/60 bg-muted/20 hover:bg-muted/40 text-muted-foreground"
                  )}
                >
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Rapid Recall</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDepth('standard')}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border transition-all cursor-pointer font-semibold text-xs",
                    depth === 'standard'
                      ? "border-teal-500/50 bg-teal-500/10 shadow-xs text-teal-400 font-bold"
                      : "border-border/60 bg-muted/20 hover:bg-muted/40 text-muted-foreground"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Standard</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDepth('deep')}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border transition-all cursor-pointer font-semibold text-xs",
                    depth === 'deep'
                      ? "border-sky-500/50 bg-sky-500/10 shadow-xs text-sky-400 font-bold"
                      : "border-border/60 bg-muted/20 hover:bg-muted/40 text-muted-foreground"
                  )}
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Deep Focus</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Color (Optional)</Label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center",
                      color === c ? "border-primary scale-110" : "border-transparent opacity-70 hover:opacity-100",
                      c === 'teal' && 'bg-teal-500/20 text-teal-600',
                      c === 'amber' && 'bg-amber-500/20 text-amber-600',
                      c === 'purple' && 'bg-purple-500/20 text-purple-600',
                      c === 'blue' && 'bg-blue-500/20 text-blue-600',
                      c === 'gray' && 'bg-gray-500/20 text-gray-600'
                    )}
                  >
                    {color === c && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center">
                <Label>Topics ({selectedTopicIds.size} selected)</Label>
              </div>
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search topics..."
                className="text-xs mb-2"
              />
              <div 
                className="flex-1 overflow-y-auto space-y-1 max-h-[300px] sm:max-h-[360px] overscroll-y-contain pr-1 touch-pan-y scrollbar-thin"
                style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
              >
                {filteredTopics.map(t => (
                  <label key={t.id} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1 shrink-0 rounded border-input"
                      checked={selectedTopicIds.has(t.id)}
                      onChange={() => handleToggleTopic(t.id)}
                    />
                    <span className="text-sm">{t.name}</span>
                  </label>
                ))}
                {filteredTopics.length === 0 && (
                  <div className="text-center text-muted-foreground text-xs py-4">No topics found.</div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2 sm:gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!name.trim() || selectedTopicIds.size === 0}>Save Set</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export const RevisionSetForm = CurriculumSetForm;
