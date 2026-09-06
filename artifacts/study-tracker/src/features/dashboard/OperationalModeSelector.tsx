import React, { useState, useMemo } from 'react';
import { useOperationalMode, setOperationalMode, resetOperationalMode, Subject, isSoftRecalibrating, useSubjects } from '@/db';
import { ALL_SUBJECTS } from '@/data/ontology';
import { SprintSetupDrawer } from './SprintSetupDrawer';
import { HolidaySetupDrawer } from './HolidaySetupDrawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gauge, Target, Moon, Settings, X, Calendar, RefreshCw, Sparkles, CheckCircle2, ChevronRight, Sun, PauseCircle } from 'lucide-react';
import { toast } from 'sonner';
import { differenceInDays, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface OperationalModeSelectorProps {
  availableSubjects?: Subject[];
  className?: string;
}

export function OperationalModeSelector({ availableSubjects: propSubjects, className }: OperationalModeSelectorProps) {
  const opMode = useOperationalMode();
  const dbSubjects = useSubjects();
  const availableSubjects = propSubjects || dbSubjects || [];
  const [sprintDrawerOpen, setSprintDrawerOpen] = useState(false);
  const [holidayDrawerOpen, setHolidayDrawerOpen] = useState(false);

  const currentMode = opMode?.mode || 'standard';
  const recalibrationInfo = useMemo(() => isSoftRecalibrating(opMode), [opMode]);

  // Format Sprint summary if active
  const sprintDetails = useMemo(() => {
    if (currentMode !== 'tactical_sprint' || !opMode) return null;

    const targetIds = opMode.targetSubjectIds || [];
    const resolvedNames = targetIds.map(id => {
      const dbSub = availableSubjects.find(s => String(s.id) === String(id));
      if (dbSub) return dbSub.name;
      const ontoSub = ALL_SUBJECTS.find(s => String(s.id) === String(id));
      if (ontoSub) return ontoSub.name;
      const fuzzy = availableSubjects.find(s => s.name && s.name.toLowerCase().includes(String(id).toLowerCase()));
      return fuzzy ? fuzzy.name : null;
    }).filter(Boolean) as string[];

    const names = resolvedNames.length > 0 ? resolvedNames : ['Exam'];

    const activatedDate = opMode.activatedAt ? new Date(opMode.activatedAt) : new Date();
    const dayOfSprint = Math.max(1, differenceInDays(new Date(), activatedDate) + 1);

    let totalSprintDays: number | null = null;
    let daysLeft: number | null = null;
    if (opMode.targetDate) {
      const target = new Date(opMode.targetDate);
      totalSprintDays = Math.max(1, differenceInDays(target, activatedDate));
      daysLeft = Math.max(0, differenceInDays(target, new Date()));
    }

    const titlePrefix = names.length === 1 
      ? `${names[0]} Prof Sprint` 
      : names.length === 2 
      ? `${names.join(' & ')} Sprint` 
      : `${names[0]} +${names.length - 1} Sprint`;

    const dayText = totalSprintDays 
      ? `Day ${dayOfSprint} of ${totalSprintDays}` 
      : `Day ${dayOfSprint}`;

    return {
      names,
      title: titlePrefix,
      dayText,
      daysLeft,
      targetDateFormatted: opMode.targetDate ? format(new Date(opMode.targetDate), 'MMM d') : null
    };
  }, [currentMode, opMode, availableSubjects]);

  const handleSelectMode = async (modeKey: 'standard' | 'tactical_sprint' | 'clinical_duty' | 'holiday') => {
    if (modeKey === currentMode && modeKey !== 'tactical_sprint' && modeKey !== 'holiday') {
      return;
    }

    if (modeKey === 'tactical_sprint') {
      // Open sprint configuration drawer
      setSprintDrawerOpen(true);
      return;
    }

    if (modeKey === 'holiday') {
      // Open holiday configuration drawer
      setHolidayDrawerOpen(true);
      return;
    }

    if (modeKey === 'clinical_duty') {
      try {
        await setOperationalMode({
          mode: 'clinical_duty',
          dailyCapacityMinutes: 30,
          notes: 'Active hospital duty - 30m micro-dose feed'
        });
        toast.success('🌙 Clinical Duty Mode Active', {
          description: 'Feed capped to 3 high-yield micro-actions (< 30 min total) calibrated for hospital shifts.'
        });
      } catch (err) {
        console.error('Failed to set clinical duty mode:', err);
        toast.error('Failed to update mode');
      }
      return;
    }

    if (modeKey === 'standard') {
      try {
        await resetOperationalMode(10);
        toast.success('Standard Mode Active', {
          description: 'Soft recalibration active — your backlog is smoothed over 10 days without debt anxiety.'
        });
      } catch (err) {
        console.error('Failed to reset mode:', err);
        toast.error('Failed to update mode');
      }
    }
  };

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* ── Intent Pill Segmented Bar ───────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap min-w-0 max-w-full">
        <div className="inline-flex items-center p-1 rounded-2xl bg-card/80 border border-border/60 shadow-xs backdrop-blur-md max-w-full overflow-x-auto no-scrollbar scrollbar-none">
          {/* Standard Mode Pill */}
          <button
            type="button"
            onClick={() => handleSelectMode('standard')}
            className={cn(
              "flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer select-none shrink-0",
              currentMode === 'standard'
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            )}
          >
            <Gauge className="w-3.5 h-3.5 shrink-0" />
            <span>Standard</span>
          </button>

          {/* Intense Review Mode Pill */}
          <button
            type="button"
            onClick={() => handleSelectMode('tactical_sprint')}
            className={cn(
              "flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer select-none shrink-0",
              currentMode === 'tactical_sprint'
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            )}
          >
            <Target className="w-3.5 h-3.5 shrink-0" />
            <span>Intense Review</span>
            {currentMode === 'tactical_sprint' && opMode?.targetSubjectIds?.length ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            ) : null}
          </button>

          {/* Clinical Duty Pill */}
          <button
            type="button"
            onClick={() => handleSelectMode('clinical_duty')}
            className={cn(
              "flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer select-none shrink-0",
              currentMode === 'clinical_duty'
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            )}
          >
            <Moon className="w-3.5 h-3.5 shrink-0" />
            <span>Clinical Duty</span>
          </button>

          {/* Holiday / Rest Freeze Pill */}
          <button
            type="button"
            onClick={() => handleSelectMode('holiday')}
            className={cn(
              "flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer select-none shrink-0",
              currentMode === 'holiday'
                ? "bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20 scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            )}
          >
            <Sun className="w-3.5 h-3.5 shrink-0" />
            <span>Rest & Pause</span>
            {currentMode === 'holiday' && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            )}
          </button>
        </div>

        {/* Quick Configuration Buttons */}
        {currentMode === 'tactical_sprint' && (
          <button
            type="button"
            onClick={() => setSprintDrawerOpen(true)}
            className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-primary/10"
          >
            <Settings className="w-3.5 h-3.5" />
            Configure Sprint
          </button>
        )}

        {currentMode === 'holiday' && (
          <button
            type="button"
            onClick={() => setHolidayDrawerOpen(true)}
            className="text-xs font-medium text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-amber-500/10"
          >
            <Settings className="w-3.5 h-3.5" />
            Edit Break Duration
          </button>
        )}
      </div>

      {/* ── Contextual Active Status Banner ─────────────────────────────────── */}
      {currentMode === 'tactical_sprint' && sprintDetails && (
        <div 
          onClick={() => setSprintDrawerOpen(true)}
          className="group cursor-pointer flex items-center justify-between p-3 sm:px-4 rounded-xl bg-gradient-to-r from-primary/15 via-primary/8 to-transparent border border-primary/30 transition-all hover:border-primary/50 shadow-xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                  {sprintDetails.title}
                </span>
                <span className="text-muted-foreground text-xs">•</span>
                <span className="text-xs font-medium text-primary">
                  {sprintDetails.dayText}
                </span>
                {sprintDetails.targetDateFormatted && (
                  <span className="text-xs text-muted-foreground">
                    (Target: {sprintDetails.targetDateFormatted})
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground/90 mt-0.5 truncate">
                Triage locked to selected subjects. Tap to edit targets or end sprint.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              Edit / End
            </Badge>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      )}

      {currentMode === 'clinical_duty' && (
        <div className="flex items-center justify-between p-3 sm:px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              <Moon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  Clinical Duty Mode Active
                </span>
                <span className="text-muted-foreground text-xs">•</span>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  3 Micro-Doses (≤ 30m Total)
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Calibrated for post-call fatigue and on-ward shifts. No overdue debt accumulation.
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => handleSelectMode('standard')}
            className="text-xs text-muted-foreground hover:text-foreground h-8 px-2.5 rounded-lg shrink-0 ml-2"
          >
            Switch to Standard
          </Button>
        </div>
      )}

      {currentMode === 'holiday' && (
        <div className="flex items-center justify-between p-3 sm:px-4 rounded-xl bg-amber-500/10 border border-amber-500/25 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <Sun className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  Rest & Pause Active
                </span>
                <span className="text-muted-foreground text-xs">•</span>
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  {opMode?.targetDate ? `Until ${format(new Date(opMode.targetDate), 'EEE, MMM d')}` : 'Paused'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Streak is frozen and reviews are paused. Zero backlog debt accumulation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleSelectMode('standard')}
              className="text-xs border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-slate-950 h-8 px-2.5 rounded-lg"
            >
              Resume Early
            </Button>
          </div>
        </div>
      )}

      {recalibrationInfo.active && currentMode === 'standard' && (
        <div className="flex items-center justify-between p-3 sm:px-4 rounded-xl bg-teal-500/10 border border-teal-500/25 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  Soft Recalibration Active
                </span>
                <span className="text-muted-foreground text-xs">•</span>
                <span className="text-xs font-medium text-teal-400">
                  Day {Math.max(1, 10 - recalibrationInfo.daysRemaining)} of 10 ({recalibrationInfo.daysRemaining}d left)
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Backlog items are smoothly drip-fed alongside daily items. Zero debt pressure.
              </p>
            </div>
          </div>

          <Badge variant="outline" className="text-xs bg-teal-500/10 border-teal-500/30 text-teal-400 shrink-0 ml-2">
            Paced Recovery
          </Badge>
        </div>
      )}

      {/* ── Sprint Setup Drawer ─────────────────────────────────────────────── */}
      <SprintSetupDrawer
        open={sprintDrawerOpen}
        onOpenChange={setSprintDrawerOpen}
        currentModeRecord={opMode}
        availableSubjects={availableSubjects}
      />

      {/* ── Holiday Setup Drawer ────────────────────────────────────────────── */}
      <HolidaySetupDrawer
        open={holidayDrawerOpen}
        onOpenChange={setHolidayDrawerOpen}
        currentModeRecord={opMode}
      />
    </div>
  );
}
