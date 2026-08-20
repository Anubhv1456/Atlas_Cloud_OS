import React, { useState } from 'react';
import { useExamProfile } from '@/hooks/useExamProfile';
import { TargetExamModal } from '@/components/TargetExamModal';
import { OperationalModeSelector } from '@/features/dashboard/OperationalModeSelector';
import { Target, Calendar, CheckCircle2, Sliders, ChevronRight, Zap } from 'lucide-react';
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
      <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 transition-all duration-200">
        {/* ── Top Target Exam Configuration Row ────────────────────────────── */}
        <div 
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-between cursor-pointer group select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500 border border-teal-500/20 group-hover:scale-105 transition-transform">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Exam Target & Schedule
              </h3>
              <p className="text-sm sm:text-base font-bold text-foreground">
                {isConfigured ? profile.targetExam : 'Configure Target Exam'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
            <span>Configure</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* ── Key Parameters Summary Chips ─────────────────────────────────── */}
        <div 
          onClick={() => setModalOpen(true)}
          className="grid grid-cols-3 gap-2 pt-1 text-center cursor-pointer select-none"
        >
          <div className="bg-muted/20 hover:bg-muted/30 transition-colors p-2.5 rounded-xl border border-border/40">
            <span className="text-[10px] text-muted-foreground block font-medium">Level</span>
            <span className="text-xs font-bold text-foreground truncate block mt-0.5">{profile.currentYear || 'MBBS'}</span>
          </div>
          <div className="bg-muted/20 hover:bg-muted/30 transition-colors p-2.5 rounded-xl border border-border/40">
            <span className="text-[10px] text-muted-foreground block font-medium">Daily Goal</span>
            <span className="text-xs font-bold text-foreground truncate block mt-0.5">{profile.dailyQuestionGoal || 40} Qs/day</span>
          </div>
          <div className="bg-muted/20 hover:bg-muted/30 transition-colors p-2.5 rounded-xl border border-border/40">
            <span className="text-[10px] text-muted-foreground block font-medium">Exam Date</span>
            <span className="text-xs font-bold text-foreground truncate block mt-0.5">{formattedDate}</span>
          </div>
        </div>

        {/* ── Operational Mode & Study Regimen ─────────────────────────────── */}
        <div className="pt-3 border-t border-border/40 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Zap className="w-3.5 h-3.5 text-teal-500" />
              <span>Operational Mode & Pacing</span>
            </div>
            <span className="text-[11px] text-muted-foreground hidden sm:inline-block font-medium">
              Dynamic Regimen
            </span>
          </div>
          
          <OperationalModeSelector />
        </div>
      </div>

      <TargetExamModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
