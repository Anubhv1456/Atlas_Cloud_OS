import React, { lazy, Suspense, useRef } from 'react';
import { useExamProfile } from '@/hooks/useExamProfile';
import { Subject, StudySystem } from '@/db';
import { CurriculumSet } from '@/db/types';

const NeetPgAtlasSkyModal = lazy(() => import('./AtlasSkyModal').then(m => ({ default: m.AtlasSkyModal })));
const UsmleAtlasSkyModal = lazy(() => import('./UsmleAtlasSkyModal').then(m => ({ default: m.UsmleAtlasSkyModal })));

interface AtlasSkyControllerProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  subjects: Subject[];
  systems: StudySystem[];
  curriculumSets: CurriculumSet[];
}

export function AtlasSkyModal(props: AtlasSkyControllerProps) {
  const { profile } = useExamProfile();
  const hasMounted = useRef(false);
  
  if (props.open) {
    hasMounted.current = true;
  }
  
  const isUSMLE = Boolean(profile.targetExam && profile.targetExam.toLowerCase().includes('usmle'));

  if (!hasMounted.current) return null;

  return (
    <Suspense fallback={null}>
      {isUSMLE ? <UsmleAtlasSkyModal {...props} /> : <NeetPgAtlasSkyModal {...props} />}
    </Suspense>
  );
}
