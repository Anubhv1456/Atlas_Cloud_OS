import React from 'react';
import { Subject, StudySystem } from '@/db';
import { CurriculumSet } from '@/db/types';
import { AtlasSkyModal as GenericAtlasSkyModal } from './AtlasSkyModal';

interface AtlasSkyControllerProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  subjects: Subject[];
  systems: StudySystem[];
  curriculumSets: CurriculumSet[];
}

export function AtlasSkyModal(props: AtlasSkyControllerProps) {
  if (!props.open) return null;
  return <GenericAtlasSkyModal {...props} />;
}
