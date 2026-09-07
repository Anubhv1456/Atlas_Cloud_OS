import React from 'react';
import { Subject, StudySystem } from '@/db';
import { CurriculumSet } from '@/db/types';
import { AtlasSkyModal as GenericAtlasSkyModal } from './AtlasSkyModal';
import { UsmleAtlasSkyModal } from './UsmleAtlasSkyModal';
import { useExamProfile } from '@/hooks/useExamProfile';

interface AtlasSkyControllerProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  subjects: Subject[];
  systems: StudySystem[];
  curriculumSets: CurriculumSet[];
}

export function AtlasSkyModal(props: AtlasSkyControllerProps) {
  const { profile } = useExamProfile();
  const isUsmle = Boolean(profile.targetExam && (profile.targetExam.includes('USMLE') || profile.targetExam.includes('Step')));

  if (!props.open) return null;

  if (isUsmle) {
    return <UsmleAtlasSkyModal {...props} />;
  }

  return <GenericAtlasSkyModal {...props} />;
}
