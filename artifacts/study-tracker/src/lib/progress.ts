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
  const completedTopicsContent = new Set<string>();
  const completedTopicsQbank = new Set<string>();
  curriculumSets.forEach(set => {
    if (set.contentCompleted) {
      set.topicIds.forEach(id => completedTopicsContent.add(id));
    }
    if (set.qbankCompleted) {
      set.topicIds.forEach(id => completedTopicsQbank.add(id));
    }
  });
  const contentScore = Math.min(completedTopicsContent.size, totalTopics);
  const qbankScore = Math.min(completedTopicsQbank.size, totalTopics);
  return Math.round(((contentScore + qbankScore) / (totalTopics * 2)) * 100);
}

export function calculateSystemContentCoverage(system: StudySystem, subjectName: string, curriculumSets: CurriculumSet[]): number {
  const total = getSystemTotalTopics(system, subjectName);
  if (total === 0) return 0;
  const completedTopics = new Set<string>();
  curriculumSets.filter(s => s.systemId === system.id).forEach(set => {
    if (set.contentCompleted) {
      set.topicIds.forEach(id => completedTopics.add(id));
    }
  });
  return Math.round((Math.min(completedTopics.size, total) / total) * 100);
}

export function calculateSystemQbankCoverage(system: StudySystem, subjectName: string, curriculumSets: CurriculumSet[]): number {
  const total = getSystemTotalTopics(system, subjectName);
  if (total === 0) return 0;
  const completedTopics = new Set<string>();
  curriculumSets.filter(s => s.systemId === system.id).forEach(set => {
    if (set.qbankCompleted) {
      set.topicIds.forEach(id => completedTopics.add(id));
    }
  });
  return Math.round((Math.min(completedTopics.size, total) / total) * 100);
}

export function calculateSubjectCoverage(subject: Subject, systems: StudySystem[], curriculumSets: CurriculumSet[]): { content: number, qbank: number, overall: number } {
  const total = getSubjectTotalTopics(subject, systems);
  if (total === 0) return { content: 0, qbank: 0, overall: 0 };
  const subSets = curriculumSets.filter(s => s.subjectId === subject.id);
  const completedTopicsContent = new Set<string>();
  const completedTopicsQbank = new Set<string>();
  subSets.forEach(set => {
    if (set.contentCompleted) {
      set.topicIds.forEach(id => completedTopicsContent.add(id));
    }
    if (set.qbankCompleted) {
      set.topicIds.forEach(id => completedTopicsQbank.add(id));
    }
  });
  const content = Math.round((Math.min(completedTopicsContent.size, total) / total) * 100);
  const qbank = Math.round((Math.min(completedTopicsQbank.size, total) / total) * 100);
  const overall = calculateProgressFromSets(subSets, total);
  return { content, qbank, overall };
}

export function isSystemComplete(system: StudySystem, subjectName: string, curriculumSets: CurriculumSet[]): boolean {
  const contentCoverage = calculateSystemContentCoverage(system, subjectName, curriculumSets);
  return contentCoverage === 100;
}

export function calculateSystemProgress(system: StudySystem, subjectName: string, curriculumSets: CurriculumSet[]): number {
  const total = getSystemTotalTopics(system, subjectName);
  return calculateProgressFromSets(curriculumSets.filter(s => s.systemId === system.id), total);
}

export function calculateSubjectProgress(subject: Subject, systems: StudySystem[], curriculumSets: CurriculumSet[]): number {
  const total = getSubjectTotalTopics(subject, systems);
  return calculateProgressFromSets(curriculumSets.filter(s => s.subjectId === subject.id), total);
}

export function calculateOverallProgress(subjects: Subject[], systems: StudySystem[], curriculumSets: CurriculumSet[]): number {
  let total = 0;
  subjects.forEach(sub => {
    total += getSubjectTotalTopics(sub, systems);
  });
  return calculateProgressFromSets(curriculumSets, total);
}
