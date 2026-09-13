const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/components/dashboard/ExamCountdownWidget.tsx', 'utf8');

const newCode = `import React, { useMemo } from 'react';
import { useExamProfile } from '@/hooks/useExamProfile';
import { Calendar } from 'lucide-react';
import { differenceInDays, parseISO, isValid } from 'date-fns';

export function ExamCountdownWidget() {
  const { profile } = useExamProfile();

  const stats = useMemo(() => {
    if (!profile.targetExamDate) return null;
    
    const targetDate = parseISO(profile.targetExamDate);
    if (!isValid(targetDate)) return null;
    const daysLeft = Math.max(0, differenceInDays(targetDate, new Date()));
    
    return {
      daysLeft,
    };
  }, [profile.targetExamDate]);

  if (!stats) return null;

  return (
    <div className="flex p-4 rounded-xl border border-border/60 bg-card mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-zinc-800/40 flex items-center justify-center text-primary">
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
    </div>
  );
}
`;

fs.writeFileSync('artifacts/study-tracker/src/components/dashboard/ExamCountdownWidget.tsx', newCode);
