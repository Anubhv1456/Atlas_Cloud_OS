import React, { useState } from 'react';
import { useExamProfile } from '@/hooks/useExamProfile';
import { TargetExamModal } from '@/components/TargetExamModal';
import { OperationalModeSelector } from '@/features/dashboard/OperationalModeSelector';
import { Target, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { SettingsRow } from './SettingsLayout';

export function ExamProfileSection() {
  const { profile, isConfigured } = useExamProfile();
  const [modalOpen, setModalOpen] = useState(false);

  const formattedDate = profile.targetExamDate ? (() => {
    try {
      return format(parseISO(profile.targetExamDate), 'MMM d, yyyy');
    } catch {
      return 'Not Set';
    }
  })() : 'Not Set';

  return (
    <>
      <SettingsRow
        icon={Target}
        iconBg="bg-teal-600 dark:bg-teal-500"
        label="Target Exam & Horizon"
        sublabel={`${profile.currentYear || 'Medical Degree'} • ${profile.dailyQuestionGoal || 40} Qs/day`}
        value={isConfigured ? profile.targetExam : 'Configure'}
        chevron
        onClick={() => setModalOpen(true)}
      />

      <SettingsRow
        icon={Calendar}
        iconBg="bg-blue-500"
        label="Examination Date"
        value={formattedDate}
        chevron
        onClick={() => setModalOpen(true)}
      />

      {/* Operational Mode Segmented Control Row */}
      <div className="p-3.5 bg-card space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[13px] font-medium text-foreground">
            Operational Mode & Pacing
          </span>
          <span className="text-xs text-muted-foreground">
            Dynamic Regimen
          </span>
        </div>
        <OperationalModeSelector />
      </div>

      <TargetExamModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
