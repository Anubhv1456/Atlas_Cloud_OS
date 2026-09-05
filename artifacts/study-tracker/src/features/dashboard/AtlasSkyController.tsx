import React from 'react';
import { useExamProfile } from '@/hooks/useExamProfile';
import { AtlasSkyModal as NeetPgAtlasSkyModal } from './AtlasSkyModal';
import { UsmleAtlasSkyModal } from './UsmleAtlasSkyModal';
import { Subject, StudySystem } from '@/db';
import { CurriculumSet } from '@/db/types';

interface AtlasSkyControllerProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  subjects: Subject[];
  systems: StudySystem[];
  curriculumSets: CurriculumSet[];
}

export function AtlasSkyModal(props: AtlasSkyControllerProps) {
  const { profile } = useExamProfile();
  
  const isUSMLE = Boolean(profile.targetExam && profile.targetExam.toLowerCase().includes('usmle'));

  if (isUSMLE) {
    return <UsmleAtlasSkyModal {...props} />;
  }

  return <NeetPgAtlasSkyModal {...props} />;
}
