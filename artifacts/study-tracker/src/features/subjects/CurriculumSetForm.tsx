import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OntologyTopic } from '@/data/ontology';
import { createCurriculumSet, updateCurriculumSet } from '@/db/mutations';
import { CurriculumSet } from '@/db/types';
import { Check } from 'lucide-react';
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
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setSelectedTopicIds(new Set(initialData.topicIds));
        setColor(initialData.color || 'teal');
      } else {
        setName('');
        setSelectedTopicIds(new Set());
        setColor('teal');
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
        });
        toast.success('Curriculum set updated');
      } else {
        await createCurriculumSet({
          subjectId,
          systemId,
          name: name.trim(),
          topicIds: Array.from(selectedTopicIds),
          color,
        });
        toast.success('Curriculum set created');
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save Curriculum Set');
    }
  };

  const filteredTopics = allTopics.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] max-h-[85vh] overflow-hidden flex flex-col rounded-2xl mx-4 w-[calc(100%-2rem)]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Curriculum Set' : 'Create Curriculum Set'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0">
          <div className="space-y-4 py-4 overflow-y-auto flex-1 px-1">
            <div className="space-y-1.5">
              <Label>Set Name</Label>
              <Input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. PrepLadder RR, Marrow Block 1..."
                required
              />
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
              <div className="flex-1 overflow-y-auto space-y-1 max-h-[250px] pr-1">
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
