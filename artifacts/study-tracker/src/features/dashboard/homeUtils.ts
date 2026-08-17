import { ReactNode } from 'react';
import { Subject, StudySystem, PYQYear } from '@/db';
import { CurriculumSet, OperationalModeRecord } from '@/db/types';
import { isRevisionDue, isRevisionDueToday, daysOverdue, calculateDecayScore, sortSystemsByRevisionPriority } from '@/db';
import { isSystemComplete } from '@/lib/progress';
import { ALL_SUBJECTS } from '@/data/ontology';
import React from 'react';
import { BookOpen, AlertCircle, Target, Activity, Sparkles, Flame } from 'lucide-react';

export function determineFocusSystems(
  rawSubjects: Subject[],
  rawSystems: StudySystem[],
  rawCurriculumSets: CurriculumSet[],
  now: Date,
  opMode?: OperationalModeRecord | null
) {
  let subjects = rawSubjects;
  let systems = rawSystems;
  let curriculumSets = rawCurriculumSets;

  if (opMode?.mode === 'tactical_sprint' && Array.isArray(opMode.targetSubjectIds) && opMode.targetSubjectIds.length > 0) {
    const targetSet = new Set(opMode.targetSubjectIds.map(String));
    subjects = rawSubjects.filter(s => {
      if (targetSet.has(String(s.id))) return true;
      if (s.ontologySubjectId && targetSet.has(String(s.ontologySubjectId))) return true;
      const matchesTarget = opMode.targetSubjectIds?.some(tid => {
        const onto = ALL_SUBJECTS.find(os => String(os.id) === String(tid));
        return onto && s.name && onto.name.toLowerCase() === s.name.toLowerCase();
      });
      return Boolean(matchesTarget);
    });
    const matchedSubIds = new Set(subjects.map(s => String(s.id)));
    systems = rawSystems.filter(sys => matchedSubIds.has(String(sys.subjectId)));
    curriculumSets = rawCurriculumSets.filter(set => matchedSubIds.has(String(set.subjectId)));
  }

  const customPrimarySubject = subjects.find(s => s.focus === 'primary');
  const primarySubjectStale = customPrimarySubject?.focusUpdatedAt && (now.getTime() - new Date(customPrimarySubject.focusUpdatedAt).getTime() > 72 * 60 * 60 * 1000);
  
  const customPrimarySystem = systems.find(s => s.focus === 'primary');
  const primarySystemStale = customPrimarySystem?.focusUpdatedAt && (now.getTime() - new Date(customPrimarySystem.focusUpdatedAt).getTime() > 72 * 60 * 60 * 1000);

  const customSecondarySubject = subjects.find(s => s.focus === 'secondary');
  const secondarySubjectStale = customSecondarySubject?.focusUpdatedAt && (now.getTime() - new Date(customSecondarySubject.focusUpdatedAt).getTime() > 72 * 60 * 60 * 1000);
  
  const customSecondarySystem = systems.find(s => s.focus === 'secondary');
  const secondarySystemStale = customSecondarySystem?.focusUpdatedAt && (now.getTime() - new Date(customSecondarySystem.focusUpdatedAt).getTime() > 72 * 60 * 60 * 1000);

  const subjectIndexMap = new Map<number, number>();
  subjects.forEach((sub, idx) => {
    if (sub.id !== undefined) subjectIndexMap.set(sub.id, idx);
  });
  
  const sortSystemsByPriority = (a: StudySystem, b: StudySystem) => {
    if (a.isHighYield && !b.isHighYield) return -1;
    if (!a.isHighYield && b.isHighYield) return 1;
    
    const subIdxA = subjectIndexMap.get(a.subjectId) ?? Number.MAX_VALUE;
    const subIdxB = subjectIndexMap.get(b.subjectId) ?? Number.MAX_VALUE;
    if (subIdxA !== subIdxB) return subIdxA - subIdxB;
    
    return (a.order ?? Number.MAX_VALUE) - (b.order ?? Number.MAX_VALUE);
  };

  const sortedSystemsByPriority = [...systems].sort(sortSystemsByPriority);
  
  const incompleteSystems = sortedSystemsByPriority.filter(s => {
    const subName = subjects.find(sub => sub.id === s.subjectId)?.name || '';
    return !isSystemComplete(s, subName, curriculumSets);
  });

  let primaryFocus: StudySystem | undefined = undefined;
  let primaryFocusSubject: Subject | undefined = undefined;
  let isAutoPrimary = false;
  let isPrimaryOverriddenByRevision = false;
  let isPrimaryIntentStale = !!(primarySubjectStale || primarySystemStale);

  if (customPrimarySubject) {
    primaryFocusSubject = customPrimarySubject;
    const subSystems = sortedSystemsByPriority.filter(s => s.subjectId === customPrimarySubject.id);
    const subIncomplete = subSystems.filter(s => {
      const subName = customPrimarySubject.name;
      return !isSystemComplete(s, subName, curriculumSets);
    });
    primaryFocus = subIncomplete[0] || subSystems[0];
  } else if (customPrimarySystem) {
    primaryFocus = customPrimarySystem;
    primaryFocusSubject = subjects.find(s => s.id === customPrimarySystem.subjectId);
  } else if (incompleteSystems.length > 0) {
    primaryFocus = incompleteSystems[0];
    primaryFocusSubject = subjects.find(s => s.id === primaryFocus!.subjectId);
    isAutoPrimary = true;
  }

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const unsortedDueRevisions = systems.filter(s => isRevisionDue(s, curriculumSets, now) && s.id !== primaryFocus?.id);
  const dueRevisions = sortSystemsByRevisionPriority(unsortedDueRevisions, curriculumSets, now);

  let secondaryFocus: StudySystem | undefined = undefined;
  let secondaryFocusSubject: Subject | undefined = undefined;
  let isSecondaryOverriddenByRevision = false;
  let isAutoSecondary = false;
  let isSecondaryIntentStale = !!(secondarySubjectStale || secondarySystemStale);

  const activeMultiDaySystem = systems.find(s => s.revisionState === 'in_progress');
  if (activeMultiDaySystem) {
    secondaryFocus = activeMultiDaySystem;
    secondaryFocusSubject = subjects.find(s => s.id === activeMultiDaySystem.subjectId);
    isSecondaryOverriddenByRevision = true;
  } else if (dueRevisions.length > 0) {
    secondaryFocus = dueRevisions[0];
    secondaryFocusSubject = subjects.find(s => s.id === secondaryFocus!.subjectId);
    isSecondaryOverriddenByRevision = true;
    isAutoSecondary = true;
  } else if (customSecondarySubject) {
    secondaryFocusSubject = customSecondarySubject;
    const subSystems = sortedSystemsByPriority.filter(s => s.subjectId === customSecondarySubject.id);
    const subIncomplete = subSystems.filter(s => {
      const subName = customSecondarySubject.name;
      return !isSystemComplete(s, subName, curriculumSets);
    });
    secondaryFocus = subIncomplete[0] || subSystems[0];
  } else if (customSecondarySystem) {
    secondaryFocus = customSecondarySystem;
    secondaryFocusSubject = subjects.find(s => s.id === customSecondarySystem.subjectId);
  } else {
    const remainingIncomplete = incompleteSystems.filter(s => s.id !== primaryFocus?.id);
    if (remainingIncomplete.length > 0) {
      secondaryFocus = remainingIncomplete[0];
      secondaryFocusSubject = subjects.find(s => s.id === secondaryFocus!.subjectId);
      isAutoSecondary = true;
    }
  }

  let secondaryDaysOverdue = 0;
  if (isSecondaryOverriddenByRevision && secondaryFocus) {
    // Wait, nextRevisionDate is now on CurriculumSets...
    // Let's compute it from systems and curriculumSets.
    // For now we will rely on daysOverdue logic in db/revisionEngine
    secondaryDaysOverdue = daysOverdue(secondaryFocus, curriculumSets, now);
  }

  return {
    isPrimaryIntentStale,
    isSecondaryIntentStale,
    customPrimarySubject,
    customPrimarySystem,
    customSecondarySubject,
    customSecondarySystem,
    primaryFocus,
    primaryFocusSubject,
    isAutoPrimary,
    isPrimaryOverriddenByRevision,
    secondaryFocus,
    secondaryFocusSubject,
    isAutoSecondary,
    isSecondaryOverriddenByRevision,
    dueRevisions,
    secondaryDaysOverdue
  };
}
