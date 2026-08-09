import React, { useState } from 'react';
import { useExamProfile } from '@/hooks/useExamProfile';
import { Target, ChevronRight } from 'lucide-react';
import { TargetExamModal } from '@/components/TargetExamModal';
import { SettingsRow } from './SettingsLayout';

export function ExamProfileSection() {
  const { profile, isConfigured } = useExamProfile();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <SettingsRow
        icon={Target}
        label="Target Exam"
        value={isConfigured ? profile.targetExam : 'Not Set'}
        control={<ChevronRight className="w-4 h-4 text-muted-foreground" />}
        onClick={() => setModalOpen(true)}
      />
      <TargetExamModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
