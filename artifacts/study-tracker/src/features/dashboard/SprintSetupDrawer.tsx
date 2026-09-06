import React, { useState, useEffect, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Target, Calendar, Clock, Check, Sparkles, X, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { setOperationalMode, resetOperationalMode } from '@/db/mutations';
import { OperationalModeRecord, Subject } from '@/db/types';
import { getOntologyForExam } from '@/data/ontology';
import { useExamProfile } from '@/hooks/useExamProfile';
import { toast } from 'sonner';
import { format, addDays, differenceInDays } from 'date-fns';

interface SprintSetupDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentModeRecord?: OperationalModeRecord | null;
  availableSubjects: Subject[];
}

export function SprintSetupDrawer({
  open,
  onOpenChange,
  currentModeRecord,
  availableSubjects
}: SprintSetupDrawerProps) {
  const { profile } = useExamProfile();
  const examOntology = useMemo(() => {
    return getOntologyForExam(profile.targetExam || 'NEET PG');
  }, [profile.targetExam]);

  // Combine db subjects and ontology subjects for complete coverage
  const subjectsList = useMemo(() => {
    const list: { id: string | number; name: string }[] = [];
    const seen = new Set<string>();

    availableSubjects.forEach(s => {
      if (s.name && !seen.has(s.name.toLowerCase())) {
        seen.add(s.name.toLowerCase());
        list.push({ id: s.id, name: s.name });
      }
    });

    if (list.length === 0) {
      examOntology.forEach(s => {
        if (s.name && !seen.has(s.name.toLowerCase())) {
          seen.add(s.name.toLowerCase());
          list.push({ id: s.id, name: s.name });
        }
      });
    }

    return list;
  }, [availableSubjects, examOntology]);

  const [selectedSubjectIds, setSelectedSubjectIds] = useState<(string | number)[]>([]);
  const [targetDate, setTargetDate] = useState<string>('');
  const [dailyCapacityMinutes, setDailyCapacityMinutes] = useState<number>(480); // 8h default for sprint
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (currentModeRecord?.mode === 'tactical_sprint' && currentModeRecord.targetSubjectIds?.length) {
        setSelectedSubjectIds(currentModeRecord.targetSubjectIds);
        setTargetDate(currentModeRecord.targetDate ? currentModeRecord.targetDate.split('T')[0] : format(addDays(new Date(), 14), 'yyyy-MM-dd'));
        setDailyCapacityMinutes(currentModeRecord.dailyCapacityMinutes || 480);
      } else {
        // Defaults: 14 days from now
        setTargetDate(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
        setDailyCapacityMinutes(480);
      }
    }
  }, [open, currentModeRecord]);

  const toggleSubject = (id: string | number) => {
    setSelectedSubjectIds(prev => {
      const exists = prev.some(item => String(item) === String(id));
      if (exists) {
        return prev.filter(item => String(item) !== String(id));
      } else {
        return [...prev, id];
      }
    });
  };

  const setDaysFromNow = (days: number) => {
    setTargetDate(format(addDays(new Date(), days), 'yyyy-MM-dd'));
  };

  const daysRemaining = useMemo(() => {
    if (!targetDate) return null;
    const diff = differenceInDays(new Date(targetDate), new Date());
    return Math.max(1, diff);
  }, [targetDate]);

  const handleActivate = async () => {
    if (selectedSubjectIds.length === 0) {
      toast.error('Please select at least one subject for the Intense Review.');
      return;
    }

    setIsSubmitting(true);
    try {
      await setOperationalMode({
        mode: 'tactical_sprint',
        targetSubjectIds: selectedSubjectIds,
        targetDate: targetDate ? new Date(targetDate).toISOString() : null,
        dailyCapacityMinutes,
        notes: `Intense Review on ${selectedSubjectIds.length} subjects`
      });

      const selectedNames = subjectsList
        .filter(s => selectedSubjectIds.some(id => String(id) === String(s.id)))
        .map(s => s.name)
        .slice(0, 3)
        .join(', ');

      toast.success(`🎯 Intense Review Activated`, {
        description: `Focused exclusively on ${selectedNames}${selectedSubjectIds.length > 3 ? ` +${selectedSubjectIds.length - 3} more` : ''}.`
      });

      onOpenChange(false);
    } catch (err) {
      console.error('Failed to activate sprint:', err);
      toast.error('Failed to activate sprint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndSprint = async () => {
    setIsSubmitting(true);
    try {
      await resetOperationalMode(10);
      toast.success('Switched to Standard Mode', {
        description: 'Soft recalibration active — backlog will be smoothly smoothed over 10 days without debt anxiety.'
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to reset mode:', err);
      toast.error('Failed to end sprint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCurrentlyInSprint = currentModeRecord?.mode === 'tactical_sprint';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto max-w-2xl mx-auto rounded-t-[24px] border-border/80 bg-background/95 backdrop-blur-xl p-6 sm:p-7 shadow-2xl">
        <SheetHeader className="text-left pb-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <SheetTitle className="text-lg sm:text-xl font-bold tracking-tight">
                  Intense Review Mode
                </SheetTitle>
                <SheetDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Triage all recommendations, QBanks, and active recall drills strictly to selected exam subjects.
                </SheetDescription>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 pt-5">
          {/* Step 1: Select Subjects */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-mono flex items-center justify-center font-bold">1</span>
                Target Exam Subjects ({selectedSubjectIds.length} selected)
              </label>
              {selectedSubjectIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedSubjectIds([])}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Subject Chips Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-border/40 rounded-xl bg-card/40">
              {subjectsList.map(subject => {
                const isSelected = selectedSubjectIds.some(id => String(id) === String(subject.id));
                return (
                  <button
                    key={String(subject.id)}
                    type="button"
                    onClick={() => toggleSubject(subject.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left border ${
                      isSelected
                        ? 'bg-primary/15 border-primary text-primary font-semibold shadow-xs'
                        : 'bg-card/60 hover:bg-secondary/60 border-border/50 text-foreground/80'
                    }`}
                  >
                    <span className="truncate mr-1">{subject.name}</span>
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 shrink-0 text-primary" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Target Exam Date */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-mono flex items-center justify-center font-bold">2</span>
                Target Exam Date {daysRemaining !== null && `(${daysRemaining} days remaining)`}
              </label>
            </div>

            <div className="flex items-center gap-2 flex-wrap mb-2.5">
              {[7, 14, 21, 30].map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDaysFromNow(days)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    daysRemaining === days
                      ? 'bg-primary text-primary-foreground border-primary font-medium shadow-xs'
                      : 'bg-secondary/50 hover:bg-secondary border-border/50 text-foreground'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="date"
                min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="bg-card border-border/60 text-sm h-10 rounded-xl"
              />
            </div>
          </div>

          {/* Step 3: Intensity & Capacity */}
          <div>
            <label className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2.5">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-mono flex items-center justify-center font-bold">3</span>
              Daily Target Commitment
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Moderate', mins: 240, desc: '4 hours/day' },
                { label: 'Intensive', mins: 360, desc: '6 hours/day' },
                { label: 'Full Sprint', mins: 480, desc: '8+ hours/day' },
              ].map(opt => (
                <button
                  key={opt.mins}
                  type="button"
                  onClick={() => setDailyCapacityMinutes(opt.mins)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    dailyCapacityMinutes === opt.mins
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'bg-card/60 hover:bg-secondary/40 border-border/50 text-muted-foreground'
                  }`}
                >
                  <div className="text-xs font-medium text-foreground">{opt.label}</div>
                  <div className="text-xs opacity-75">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 border-t border-border/40">
            <Button
              type="button"
              disabled={isSubmitting || selectedSubjectIds.length === 0}
              onClick={handleActivate}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-md shadow-primary/20"
            >
              <Target className="w-4 h-4 mr-2" />
              {isCurrentlyInSprint ? 'Update Intense Review' : `Activate Sprint (${selectedSubjectIds.length} Subjects)`}
            </Button>

            {isCurrentlyInSprint && (
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={handleEndSprint}
                className="h-11 rounded-xl border-border/80 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                End Sprint (Soft Recalibrate)
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-xl text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
