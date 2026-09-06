import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OntologyTopic, ALL_SUBJECTS } from '@/data/ontology';
import { logCurriculumSetScore } from '@/db/mutations';
import { CurriculumSet } from '@/db/types';
import { Sparkles, Target, TriangleAlert, ArrowRight, Check, Calendar, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { db } from '@/db';
import { generateHLC } from '@/lib/hlc';
import { useLiveQuery } from '@/hooks/useLiveQuery';

interface CurriculumSetScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  curriculumSet?: CurriculumSet;
  allTopics: OntologyTopic[];
}

const QUICK_SCORES = [40, 60, 70, 80, 90];
type DatePreset = 'today' | 'yesterday' | '2days' | 'custom';

export function CurriculumSetScoreModal({
  isOpen,
  onClose,
  curriculumSet,
  allTopics,
}: CurriculumSetScoreModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [score, setScore] = useState<number>(70);
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customDate, setCustomDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [selectedWeakTopicIds, setSelectedWeakTopicIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setTopics = curriculumSet
    ? allTopics.filter((t) => curriculumSet.topicIds.includes(t.id))
    : [];

  const topicProgresses = useLiveQuery(
    () => {
      if (!setTopics || setTopics.length === 0) return [];
      return db.topicProgress.where('topicId').anyOf(setTopics.map(t => t.id)).toArray();
    },
    [setTopics.map(t => t.id).join(',')]
  ) || [];

  const getEffectiveDate = (): Date => {
    const now = new Date();
    if (datePreset === 'today') {
      return now;
    }
    if (datePreset === 'yesterday') {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return d;
    }
    if (datePreset === '2days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 2);
      return d;
    }
    if (datePreset === 'custom' && customDate) {
      const [y, m, d] = customDate.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m - 1, d, 12, 0, 0);
      }
    }
    return now;
  };

  useEffect(() => {
    if (isOpen && curriculumSet) {
      setStep(1);
      setScore(70);
      setDatePreset('today');
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      setCustomDate(`${year}-${month}-${day}`);
      const initialWeak = new Set<string>();
      topicProgresses.forEach(tp => {
        if (tp.isWeak) initialWeak.add(tp.topicId);
      });
      setSelectedWeakTopicIds(initialWeak);
    }
  }, [isOpen, curriculumSet, topicProgresses.length]);

  if (!curriculumSet) return null;

  const handleToggleWeakTopic = (topicId: string) => {
    const next = new Set(selectedWeakTopicIds);
    if (next.has(topicId)) next.delete(topicId);
    else next.add(topicId);
    setSelectedWeakTopicIds(next);
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score < 85) {
      setStep(2);
    } else {
      await saveScoreAndClose();
    }
  };

  const saveScoreAndClose = async () => {
    setIsSubmitting(true);
    try {
      let subjectName = 'General';
      if (curriculumSet.subjectId) {
        const dbSub = await db.subjects.get(curriculumSet.subjectId as any);
        if (dbSub?.name) {
          subjectName = dbSub.name;
        } else {
          const ontoSub = ALL_SUBJECTS.find((s) => String(s.id) === String(curriculumSet.subjectId));
          if (ontoSub?.name) subjectName = ontoSub.name;
        }
      }
      const effectiveDate = getEffectiveDate();

      await logCurriculumSetScore(
        curriculumSet.id!,
        score,
        curriculumSet.topicIds,
        subjectName,
        undefined,
        effectiveDate
      );

      // Save weak topics
      const now = new Date();
      for (const t of setTopics) {
        const isNowWeak = selectedWeakTopicIds.has(t.id);
        const p = topicProgresses.find(tp => tp.topicId === t.id);
        if (p) {
          if (p.isWeak !== isNowWeak) {
            await db.topicProgress.put({ ...p, isWeak: isNowWeak, updatedAt: now, hlc: generateHLC() });
          }
        } else if (isNowWeak) {
          await db.topicProgress.put({ topicId: t.id, isWeak: true, updatedAt: now, hlc: generateHLC() });
        }
      }

      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to log score');
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayDateStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-hidden flex flex-col rounded-2xl mx-4 w-[calc(100%-2rem)]">
        <DialogHeader className="pb-2 border-b border-border/50">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            {step === 1 ? (
              <><Target className="w-3.5 h-3.5" /> Log Score</>
            ) : (
              <><TriangleAlert className="w-3.5 h-3.5 text-amber-500" /> Diagnostics</>
            )}
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            {step === 1 ? curriculumSet.name : 'What dragged you down?'}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {step === 1 
              ? `${setTopics.length} topic${setTopics.length === 1 ? '' : 's'} in this Study Block` 
              : 'Tap any specific topics you felt weak on.'}
          </p>
        </DialogHeader>

        {step === 1 ? (
          <form onSubmit={handleContinue} className="flex-1 flex flex-col min-h-0 pt-4">
            <div className="space-y-4 overflow-y-auto flex-1 px-1 pr-2">
              {/* Date Selection Box */}
              <div className="space-y-2.5 p-3.5 rounded-xl bg-card border border-border/60">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" /> Revision Date
                  </Label>
                  {datePreset !== 'today' && (
                    <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      Backdated Log
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-1.5">
                  {[
                    { id: 'today', label: 'Today' },
                    { id: 'yesterday', label: 'Yesterday' },
                    { id: '2days', label: '2d Ago' },
                    { id: 'custom', label: 'Custom' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDatePreset(item.id as DatePreset)}
                      className={cn(
                        "flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center",
                        datePreset === item.id
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/50"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {datePreset === 'custom' && (
                  <div className="pt-1">
                    <Input
                      type="date"
                      max={todayDateStr}
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full h-8 rounded-lg text-xs font-semibold bg-muted/30 border-border/70"
                    />
                  </div>
                )}

                <p className="text-xs text-muted-foreground/80 flex items-center gap-1.5">
                  <History className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span>
                    {datePreset === 'today'
                      ? `Logged as of today (${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`
                      : `SDSR schedules next recall interval based on this date.`}
                  </span>
                </p>
              </div>

              {/* Score Box */}
              <div className="space-y-3 p-3.5 rounded-xl bg-card border border-border/60">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Overall Score
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
            </div>
            <DialogFooter className="pt-4 border-t border-border/50 sm:gap-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="font-semibold shadow-md gap-1.5 cursor-pointer"
              >
                {score < 85 ? (
                  <>Continue <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Save Score</>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 pt-4">
            <div 
              className="space-y-1 max-h-[280px] sm:max-h-[350px] overflow-y-auto overscroll-y-contain pr-1 flex-1 touch-pan-y scrollbar-thin"
              style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
            >
              {setTopics.map((t) => (
                <label
                  key={t.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border text-sm font-medium cursor-pointer transition-all",
                    selectedWeakTopicIds.has(t.id)
                      ? "bg-rose-500/10 border-rose-500/30 text-foreground"
                      : "bg-card/50 border-border/40 text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <span className="flex-1">{t.name}</span>
                  <div className={cn(
                    "w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0",
                    selectedWeakTopicIds.has(t.id)
                      ? "bg-rose-500 border-rose-500 text-white"
                      : "border-muted-foreground/30"
                  )}>
                    {selectedWeakTopicIds.has(t.id) && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedWeakTopicIds.has(t.id)}
                    onChange={() => handleToggleWeakTopic(t.id)}
                  />
                </label>
              ))}
            </div>
            <DialogFooter className="pt-4 border-t border-border/50 mt-4 sm:gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={isSubmitting}>
                Back
              </Button>
              <Button
                type="button"
                onClick={saveScoreAndClose}
                disabled={isSubmitting}
                className="font-semibold shadow-md gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check className="w-4 h-4" /> Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
