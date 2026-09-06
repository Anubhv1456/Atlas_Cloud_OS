import React, { useMemo } from 'react';
import { useExamProfile } from '@/hooks/useExamProfile';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';
import { Clock, Target, Calendar, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays, parseISO, isValid } from 'date-fns';

export function ExamCountdownWidget() {
  const { profile } = useExamProfile();
  
  const scoreLogsCount = useLiveQuery(
    () => db.scoreLogs.count(),
    [],
    0
  );

  const stats = useMemo(() => {
    if (!profile.targetExamDate) return null;
    
    const targetDate = parseISO(profile.targetExamDate);
    if (!isValid(targetDate)) return null;

    const daysLeft = Math.max(0, differenceInDays(targetDate, new Date()));
    
    // QBank Calculation
    const qbankSize = profile.targetQBankSize || 3000;
    // Assuming each ScoreLog represents 1 session of roughly 40 questions (or we can just use dailyQuestionGoal)
    // Actually, we can sum the 'total' field from all qbank scoreLogs, but that might be heavy. Let's just estimate.
    // Instead of summing, let's use the profile's daily goal to see if they are on track.
    
    // Simplification for the velocity metric:
    // If they have QBank size 3000, and N days left, required velocity = 3000 / N
    const requiredVelocity = daysLeft > 0 ? Math.ceil(qbankSize / daysLeft) : 0;
    const currentGoal = profile.dailyQuestionGoal || 40;
    
    const isBehind = requiredVelocity > currentGoal;

    return {
      daysLeft,
      requiredVelocity,
      isBehind
    };
  }, [profile.targetExamDate, profile.targetQBankSize, profile.dailyQuestionGoal]);

  if (!stats) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/60 bg-card mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            {profile.targetExam || 'Target Exam'}
          </h3>
          <p className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
            {stats.daysLeft} <span className="text-sm font-medium text-muted-foreground tracking-normal">Days Remaining</span>
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 bg-muted/40 px-4 py-2.5 rounded-lg border border-border/40">
        <Target className={cn("w-4 h-4", stats.isBehind ? "text-amber-500" : "text-emerald-500")} />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium">Required Velocity</span>
          <span className={cn("text-sm font-bold", stats.isBehind ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
            {stats.requiredVelocity} questions / day
          </span>
        </div>
      </div>
    </div>
  );
}
