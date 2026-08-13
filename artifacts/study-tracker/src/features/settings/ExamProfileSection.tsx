import React, { useState } from 'react';
import { useExamProfile } from '@/hooks/useExamProfile';
import { TargetExamModal } from '@/components/TargetExamModal';
import { Target, Calendar, CheckCircle2, Sliders, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function ExamProfileSection() {
  const { profile, isConfigured } = useExamProfile();
  const [modalOpen, setModalOpen] = useState(false);

  const formattedDate = profile.targetExamDate ? (() => {
    try {
      return format(parseISO(profile.targetExamDate), 'MMMM d, yyyy');
    } catch {
      return 'Not Set';
    }
  })() : 'Not Set';

  return (
    <>
      <div 
        onClick={() => setModalOpen(true)}
        className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm hover:border-border transition-all duration-200 cursor-pointer group space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500 border border-teal-500/20">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Academic Calibration
              </h3>
              <p className="text-sm font-bold text-foreground">
                {isConfigured ? profile.targetExam : 'Configure Target Exam'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
            <span>Configure</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40 text-center">
          <div className="bg-muted/20 p-2 rounded-xl border border-border/40">
            <span className="text-[10px] text-muted-foreground block font-medium">Level</span>
            <span className="text-xs font-bold text-foreground truncate block">{profile.currentYear || 'MBBS'}</span>
          </div>
          <div className="bg-muted/20 p-2 rounded-xl border border-border/40">
            <span className="text-[10px] text-muted-foreground block font-medium">Daily Goal</span>
            <span className="text-xs font-bold text-foreground truncate block">{profile.dailyQuestionGoal || 40} Qs/day</span>
          </div>
          <div className="bg-muted/20 p-2 rounded-xl border border-border/40">
            <span className="text-[10px] text-muted-foreground block font-medium">Exam Date</span>
            <span className="text-xs font-bold text-foreground truncate block">{formattedDate}</span>
          </div>
        </div>
      </div>

      <TargetExamModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
