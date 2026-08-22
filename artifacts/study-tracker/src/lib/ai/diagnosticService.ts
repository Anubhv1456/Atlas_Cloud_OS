import { z } from 'zod';
import { MistakeLog, CurriculumSet, Subject } from '@/db/types';

const MistakeLogSchema = z.object({
  id: z.string().optional(),
  subjectId: z.union([z.string(), z.number()]),
  errorType: z.string().optional(),
  deletedAt: z.date().nullable().optional(),
});

const SubjectSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  deletedAt: z.date().nullable().optional(),
});

const CurriculumSetSchema = z.object({
  id: z.union([z.string(), z.number()]),
  subjectId: z.union([z.string(), z.number()]),
  progressPercent: z.number().optional(),
  deletedAt: z.date().nullable().optional(),
});

export interface CognitiveDiagnosticProfile {
  errorTypeDistribution: Record<string, number>;
  highFrictionModules: Array<{
    subjectId: string;
    subjectName: string;
    mistakeCount: number;
    masteryPercentage: number;
  }>;
  masteryVelocity: Array<{
    subjectName: string;
    velocityScore: number;
  }>;
}

export function generateCognitiveProfile(
  mistakes: MistakeLog[],
  subjects: Subject[],
  curriculum: CurriculumSet[]
): CognitiveDiagnosticProfile {
  // Validate inputs
  const safeMistakes = z.array(MistakeLogSchema).safeParse(mistakes);
  const safeSubjects = z.array(SubjectSchema).safeParse(subjects);
  const safeCurriculum = z.array(CurriculumSetSchema).safeParse(curriculum);

  if (!safeMistakes.success || !safeSubjects.success || !safeCurriculum.success) {
    console.error("Diagnostic data validation failed", {
        mistakes: safeMistakes.error,
        subjects: safeSubjects.error,
        curriculum: safeCurriculum.error
    });
    return { errorTypeDistribution: {}, highFrictionModules: [], masteryVelocity: [] };
  }

  const profile: CognitiveDiagnosticProfile = {
    errorTypeDistribution: {},
    highFrictionModules: [],
    masteryVelocity: []
  };

  // 1. Error Type Distribution
  safeMistakes.data.forEach(m => {
    if (m.errorType) {
      profile.errorTypeDistribution[m.errorType] = (profile.errorTypeDistribution[m.errorType] || 0) + 1;
    }
  });

  // 2. High Friction Modules (High mistakes, low mastery)
  safeSubjects.data.forEach(s => {
    const subjectMistakes = safeMistakes.data.filter(m => String(m.subjectId) === String(s.id));
    const subjectCurriculum = safeCurriculum.data.find(c => String(c.subjectId) === String(s.id));
    
    if (subjectMistakes.length > 3 && (subjectCurriculum?.progressPercent || 0) < 70) {
      profile.highFrictionModules.push({
        subjectId: String(s.id),
        subjectName: s.name,
        mistakeCount: subjectMistakes.length,
        masteryPercentage: subjectCurriculum?.progressPercent || 0
      });
    }
  });

  return profile;
}
