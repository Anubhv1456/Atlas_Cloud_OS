import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OntologyTopic, ALL_SUBJECTS } from '@/data/ontology';
import { logCurriculumSetScore } from '@/db/mutations';
import { CurriculumSet } from '@/db/types';
import { Sparkles, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CurriculumSetScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  curriculumSet?: CurriculumSet;
  allTopics: OntologyTopic[];
}

const QUICK_SCORES = [40, 60, 70, 80, 90];

export function CurriculumSetScoreModal({
  isOpen,
  onClose,
  curriculumSet,
  allTopics,
}: CurriculumSetScoreModalProps) {
  const [score, setScore] = useState<number>(70);
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter topics belonging to this set
  const setTopics = curriculumSet
    ? allTopics.filter((t) => curriculumSet.topicIds.includes(t.id))
    : [];

  useEffect(() => {
    if (isOpen && curriculumSet) {
      setScore(70);
      setSelectedTopicIds(new Set(curriculumSet.topicIds));
    }
  }, [isOpen, curriculumSet]);

  if (!curriculumSet) return null;

  const handleToggleTopic = (topicId: string) => {
    const next = new Set(selectedTopicIds);
    if (next.has(topicId)) next.delete(topicId);
    else next.add(topicId);
    setSelectedTopicIds(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTopicIds.size === 0) {
      toast.error('Select at least one topic that was revised');
      return;
    }

    setIsSubmitting(true);
    try {
      const subjectName = ALL_SUBJECTS.find((s) => s.id == (curriculumSet.subjectId as any))?.name || 'General';

      await logCurriculumSetScore(
        curriculumSet.id!,
        score,
        Array.from(selectedTopicIds),
        subjectName
      );

      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to log score');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-hidden flex flex-col rounded-2xl mx-4 w-[calc(100%-2rem)]">
        <DialogHeader className="pb-2 border-b border-border/50">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <Target className="w-3.5 h-3.5" /> Log Score & Recalibrate
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            {curriculumSet.name}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {setTopics.length} topic{setTopics.length === 1 ? '' : 's'} in this Curriculum Set
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 pt-4">
          <div className="space-y-6 overflow-y-auto flex-1 px-1 pr-2">
            {/* Score Input Section */}
            <div className="space-y-3 p-4 rounded-xl bg-card border border-border/60">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  QBank / Test Score
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={score}
                    onChange={(e) => setScore(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-16 text-center font-bold text-lg h-9 rounded-lg"
                  />
                  <span className="font-bold text-foreground">%</span>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary py-1"
              />

              <div className="flex items-center justify-between gap-1.5 pt-1">
                {QUICK_SCORES.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setScore(val)}
                    className={cn(
                      "flex-1 py-1 px-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
                      score === val
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/50"
                    )}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            {/* Topics Included Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Topics Revised ({selectedTopicIds.size} of {setTopics.length})
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedTopicIds.size === setTopics.length) {
                      setSelectedTopicIds(new Set());
                    } else {
                      setSelectedTopicIds(new Set(setTopics.map((t) => t.id)));
                    }
                  }}
                  className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                >
                  {selectedTopicIds.size === setTopics.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
                {setTopics.map((t) => (
                  <label
                    key={t.id}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors",
                      selectedTopicIds.has(t.id)
                        ? "bg-primary/5 border-primary/30 text-foreground"
                        : "bg-card/50 border-border/40 text-muted-foreground opacity-60 hover:opacity-100"
                    )}
                  >
                    <span>{t.name}</span>
                    <input
                      type="checkbox"
                      checked={selectedTopicIds.has(t.id)}
                      onChange={() => handleToggleTopic(t.id)}
                      className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border/50 sm:gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || selectedTopicIds.size === 0}
              className="font-semibold shadow-md gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Recalibrate Future Reviews
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
