import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Palmtree, Sun, Calendar, ShieldCheck, Clock, RefreshCw, Sparkles, Coffee } from 'lucide-react';
import { setOperationalMode, resetOperationalMode } from '@/db/mutations';
import { OperationalModeRecord } from '@/db/types';
import { toast } from 'sonner';
import { format, addDays, differenceInDays } from 'date-fns';

interface HolidaySetupDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentModeRecord?: OperationalModeRecord | null;
}

export function HolidaySetupDrawer({
  open,
  onOpenChange,
  currentModeRecord
}: HolidaySetupDrawerProps) {
  const [targetDate, setTargetDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (currentModeRecord?.mode === 'holiday' && currentModeRecord.targetDate) {
        setTargetDate(currentModeRecord.targetDate.split('T')[0]);
      } else {
        // Default: 5 days from today
        setTargetDate(format(addDays(new Date(), 5), 'yyyy-MM-dd'));
      }
    }
  }, [open, currentModeRecord]);

  const setDaysFromNow = (days: number) => {
    setTargetDate(format(addDays(new Date(), days), 'yyyy-MM-dd'));
  };

  const daysRemaining = targetDate ? Math.max(1, differenceInDays(new Date(targetDate), new Date())) : null;
  const isCurrentlyInHoliday = currentModeRecord?.mode === 'holiday';

  const handleActivateHoliday = async () => {
    setIsSubmitting(true);
    try {
      await setOperationalMode({
        mode: 'holiday',
        targetSubjectIds: [],
        targetDate: targetDate ? new Date(targetDate).toISOString() : null,
        dailyCapacityMinutes: 0,
        notes: `Holiday break scheduled until ${targetDate || 'manual resume'}`
      });

      const formattedResume = targetDate 
        ? format(new Date(targetDate), 'EEEE, MMM d') 
        : 'when you manually return';

      toast.success('🌴 Holiday Mode Activated', {
        description: `Study streak preserved. Resuming ${formattedResume}. Enjoy your time off!`
      });

      onOpenChange(false);
    } catch (err) {
      console.error('Failed to activate holiday mode:', err);
      toast.error('Failed to activate holiday mode');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndHoliday = async () => {
    setIsSubmitting(true);
    try {
      await resetOperationalMode(10);
      toast.success('⚡ Welcome Back! Switched to Standard Mode', {
        description: 'Soft recalibration active — your backlog is smoothly smoothed over 10 days with zero debt anxiety.'
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to reset mode:', err);
      toast.error('Failed to end holiday mode');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto max-w-xl mx-auto rounded-t-[24px] border-border/80 bg-background/95 backdrop-blur-xl p-6 sm:p-7 shadow-2xl">
        <SheetHeader className="text-left pb-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm">
                <Palmtree className="w-5 h-5" />
              </div>
              <div>
                <SheetTitle className="text-lg sm:text-xl font-bold tracking-tight">
                  Holiday / Rest Freeze
                </SheetTitle>
                <SheetDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Protect your streak, silence reviews, and prevent overdue backlog anxiety while away.
                </SheetDescription>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 pt-5">
          {/* Duration Presets */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-500" />
                Return Date {daysRemaining !== null && `(${daysRemaining} day break)`}
              </label>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3">
              {[3, 5, 7, 14].map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDaysFromNow(days)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all text-center ${
                    daysRemaining === days
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/50 shadow-xs'
                      : 'bg-card/70 hover:bg-secondary/60 border-border/50 text-foreground/80'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>

            <Input
              type="date"
              min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="bg-card border-border/60 text-sm h-10 rounded-xl"
            />
          </div>

          {/* Guarantees / Peace of Mind */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Atlas Holiday Guarantees
            </div>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span><strong>Streak Shield:</strong> Your active study streak is paused and preserved.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span><strong>Zero Overdue Debt:</strong> No red overdue badges or anxiety-inducing review spikes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span><strong>Soft Recalibration on Return:</strong> Backlog items will be smoothly paced over 10 days upon your return.</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 border-t border-border/40">
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleActivateHoliday}
              className="flex-1 h-11 rounded-xl bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 shadow-md shadow-amber-500/20"
            >
              <Palmtree className="w-4 h-4 mr-2" />
              {isCurrentlyInHoliday ? 'Update Holiday Duration' : 'Freeze & Begin Holiday'}
            </Button>

            {isCurrentlyInHoliday && (
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={handleEndHoliday}
                className="h-11 rounded-xl border-border/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Resume Early (Soft Recalibrate)
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
