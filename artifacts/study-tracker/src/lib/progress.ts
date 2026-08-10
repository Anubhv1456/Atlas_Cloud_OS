import { StudySystem, Subject } from '@/db';
import { CurriculumSet } from '@/db/types';
import { ALL_SUBJECTS, ALL_SYSTEMS } from '@/data/ontology';
import { normalizeName } from '@/lib/exam-presets';

export function getSystemTotalTopics(system: StudySystem, subjectName: string): number {
  const ontologySubject = ALL_SUBJECTS.find(s => s.name === subjectName);
  const os = ALL_SYSTEMS.find(s => s.subjectId === ontologySubject?.id && normalizeName(s.name) === normalizeName(system.name));
  const customTopics = system.customTopics?.filter(t => !(t as any).deleted) || [];
  return (os?.topics.length || 0) + customTopics.length;
}

export function getSubjectTotalTopics(subject: Subject, systems: StudySystem[]): number {
  const subSystems = systems.filter(s => s.subjectId === subject.id);
  return subSystems.reduce((acc, sys) => acc + getSystemTotalTopics(sys, subject.name), 0);
}

export function calculateProgressFromSets(curriculumSets: CurriculumSet[], totalTopics: number): number {
  if (totalTopics === 0) return 0;
  
  const contentCompletedTopics = new Set<string>();
  const qbankCompletedTopics = new Set<string>();
  
  curriculumSets.forEach(set => {
    if (set.contentCompleted) {
      set.topicIds.forEach(id => contentCompletedTopics.add(id));
    }
    if (set.qbankCompleted) {
      set.topicIds.forEach(id => qbankCompletedTopics.add(id));
    }
  });
  
  const completed = contentCompletedTopics.size + qbankCompletedTopics.size;
  return Math.round((Math.min(completed, totalTopics * 2) / (totalTopics * 2)) * 100);
}

export function calculateSystemProgress(system: StudySystem, subjectName: string, curriculumSets: CurriculumSet[]): number {
  const total = getSystemTotalTopics(system, subjectName);
  return calculateProgressFromSets(curriculumSets, total);
}

export function calculateSubjectProgress(subject: Subject, systems: StudySystem[], curriculumSets: CurriculumSet[]): number {
  const total = getSubjectTotalTopics(subject, systems);
  return calculateProgressFromSets(curriculumSets, total);
}

export function calculateOverallProgress(subjects: Subject[], systems: StudySystem[], curriculumSets: CurriculumSet[]): number {
  let total = 0;
  subjects.forEach(sub => {
    total += getSubjectTotalTopics(sub, systems);
  });
  return calculateProgressFromSets(curriculumSets, total);
}

