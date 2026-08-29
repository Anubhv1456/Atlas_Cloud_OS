import { z } from 'zod';
import { SupportedGeminiModel } from './aiSettingsStorage';

/**
 * 20th Notebook Mistake Tags
 */
export const MistakeTagSchema = z.enum([
  'Drug of Choice',
  'Investigation of Choice',
  'Twin Distinction',
  'Classic Triad',
  'Diagnostic Criteria',
  'Management Protocol',
  'General Pearl',
]);
export type MistakeTag = z.infer<typeof MistakeTagSchema>;

/**
 * Mistake Error Types (Psychometric Root Causes)
 */
export const MistakeErrorTypeSchema = z.enum(['concept', 'retrieval', 'misread', 'fomo']);
export type MistakeErrorType = z.infer<typeof MistakeErrorTypeSchema>;

/**
 * Clinical Trap Categories
 */
export const TrapCategorySchema = z.enum([
  'KNOWLEDGE_GAP',
  'READING_HASTE',
  'CONCEPTUAL_OVERLAP',
  'CALCULATION_ERROR',
]);
export type TrapCategory = z.infer<typeof TrapCategorySchema>;

/**
 * Confidence Level for Study Logging
 */
export const ConfidenceLevelSchema = z.enum(['LOW', 'MED', 'HIGH']);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

/**
 * Intent classification
 */
export const CognitiveIntentSchema = z.enum([
  'KNOWLEDGE_DISTILLATION',
  'TIME_INTERPOLATION',
  'MISTAKE_PSYCHOMETRIC_AUDIT',
  'ACTION_ADD_MISTAKE',
  'ACTION_LOG_STUDY',
  'ACTION_RECORD_SCORE',
  'CLINICAL_QUERY',
  'NONE',
]);
export type CognitiveIntent = z.infer<typeof CognitiveIntentSchema>;

/**
 * High-Yield Clinical Knowledge Distillation
 */
export const ClinicalDistillationSchema = z.object({
  hingeConcept: z.string().default(''),
  distractorTrap: z.string().default(''),
  twentyNotebookRule: z.string().default(''),
  trapCategory: TrapCategorySchema.default('CONCEPTUAL_OVERLAP'),
  tag: MistakeTagSchema.default('General Pearl'),
  isUrgent: z.boolean().default(false),
  clinicalTrigger: z.string().optional(),
});
export type ClinicalDistillation = z.infer<typeof ClinicalDistillationSchema>;

/**
 * Study Block State Delta
 */
export const StudyDeltaSchema = z.object({
  subjectId: z.union([z.string(), z.number()]).optional(),
  subjectName: z.string().default('General Medicine'),
  systemName: z.string().default('Core Review'),
  durationMinutes: z.number().int().positive().default(45),
  confidenceLevel: ConfidenceLevelSchema.default('MED'),
  topicsStudied: z.string().default(''),
});
export type StudyDelta = z.infer<typeof StudyDeltaSchema>;

/**
 * Test Score State Delta
 */
export const ScoreDeltaSchema = z.object({
  testName: z.string().default('Grand Test'),
  score: z.number().default(0),
  totalMarks: z.number().positive().default(200),
  percentage: z.number().default(0),
  weakSubjects: z.array(z.string()).default([]),
  notes: z.string().optional(),
});
export type ScoreDelta = z.infer<typeof ScoreDeltaSchema>;

/**
 * Unified Cognitive Delta — The strict typed contract between Gemini / Local Tokenizer and Atlas State
 */
export const CognitiveDeltaSchema = z.object({
  intent: CognitiveIntentSchema.default('NONE'),
  confidenceScore: z.number().min(0).max(1).default(0.9),
  targetSubjectId: z.string().default('SUB_11'),
  targetSubjectName: z.string().default('General Medicine'),
  subtopicTaxonomy: z.string().default(''),
  executiveSummary: z.string().default(''),
  distillation: ClinicalDistillationSchema.optional(),
  studyDelta: StudyDeltaSchema.optional(),
  scoreDelta: ScoreDeltaSchema.optional(),
  detectedPreferenceShift: z.object({
    suggestedSetting: z.string(),
    reason: z.string()
  }).optional(),
  source: z.enum(['LOCAL_TOKENIZER', 'GEMINI_CLOUD', 'HYBRID']).default('GEMINI_CLOUD'),
  latencyMs: z.number().optional(),
});
export type CognitiveDelta = z.infer<typeof CognitiveDeltaSchema>;

/**
 * Structured Action Payloads committed to Dexie & Firestore
 */
export interface ActionAddMistake {
  action: 'ACTION_ADD_MISTAKE';
  subjectId: string | number;
  subjectName: string;
  systemName?: string;
  tag: MistakeTag;
  ruleText: string;
  isUrgent: boolean;
  errorType?: MistakeErrorType;
  keyTakeaway: string;
  clinicalTrigger?: string;
  source?: 'GT' | 'QBank' | 'Custom';
}

export interface ActionLogStudy {
  action: 'ACTION_LOG_STUDY';
  subjectId: string | number;
  subjectName: string;
  systemName: string;
  durationMinutes: number;
  confidenceLevel: ConfidenceLevel;
  topicsStudied?: string;
}

export interface ActionRecordScore {
  action: 'ACTION_RECORD_SCORE';
  testName: string;
  score: number;
  totalMarks: number;
  weakSubjects: string[];
  notes?: string;
}

export interface ActionClinicalQuery {
  action: 'ACTION_CLINICAL_QUERY';
  reply: string;
  suggestedAction?: string;
}

export type ParsedAtlasAction =
  | ActionAddMistake
  | ActionLogStudy
  | ActionRecordScore
  | ActionClinicalQuery;

/**
 * Compact Gemini response schema for Routine / Low-latency commands.
 * Strips verbose psychometric analysis fields to reduce token output by >60%.
 */
export const ROUTINE_COGNITIVE_DELTA_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    intent: {
      type: 'STRING',
      enum: [
        'ACTION_ADD_MISTAKE',
        'ACTION_LOG_STUDY',
        'ACTION_RECORD_SCORE',
        'CLINICAL_QUERY',
        'NONE',
      ],
    },
    targetSubjectName: {
      type: 'STRING',
    },
    executiveSummary: {
      type: 'STRING',
    },
    studyDelta: {
      type: 'OBJECT',
      properties: {
        subjectName: { type: 'STRING' },
        durationMinutes: { type: 'INTEGER' },
        confidenceLevel: { type: 'STRING', enum: ['LOW', 'MED', 'HIGH'] },
        topicsStudied: { type: 'STRING' },
      },
    },
    scoreDelta: {
      type: 'OBJECT',
      properties: {
        testName: { type: 'STRING' },
        score: { type: 'NUMBER' },
        totalMarks: { type: 'NUMBER' },
      },
    },
    distillation: {
      type: 'OBJECT',
      properties: {
        twentyNotebookRule: { type: 'STRING' },
        tag: { type: 'STRING' },
        clinicalTrigger: { type: 'STRING' },
      },
    },
    detectedPreferenceShift: {
      type: 'OBJECT',
      properties: {
        suggestedSetting: { type: 'STRING' },
        reason: { type: 'STRING' }
      }
    }
  },
  required: ['intent', 'targetSubjectName', 'executiveSummary'],
};

/**
 * Gemini response schema definition enforcing strict structured outputs
 */
export const GEMINI_COGNITIVE_DELTA_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    intent: {
      type: 'STRING',
      enum: [
        'KNOWLEDGE_DISTILLATION',
        'TIME_INTERPOLATION',
        'MISTAKE_PSYCHOMETRIC_AUDIT',
        'ACTION_ADD_MISTAKE',
        'ACTION_LOG_STUDY',
        'ACTION_RECORD_SCORE',
        'CLINICAL_QUERY',
        'NONE',
      ],
      description: 'Primary cognitive intent of the user message.',
    },
    confidenceScore: {
      type: 'NUMBER',
      description: 'Confidence between 0.0 and 1.0 in this extraction.',
    },
    targetSubjectName: {
      type: 'STRING',
      description: 'Primary standard medical subject (e.g. Pharmacology, Pathology, Biochemistry, Medicine).',
    },
    subtopicTaxonomy: {
      type: 'STRING',
      description: 'Taxonomy path (e.g. "Pharmacology -> Autonomic Nervous System -> Anticholinergics").',
    },
    executiveSummary: {
      type: 'STRING',
      description: 'Crisp, high-yield coaching, differential takeaway, or direct explanation formatted in clean Markdown without fluff.',
    },
    distillation: {
      type: 'OBJECT',
      properties: {
        hingeConcept: {
          type: 'STRING',
          description: 'The single clinical pivot or differentiator in this topic/case.',
        },
        distractorTrap: {
          type: 'STRING',
          description: 'Why the distractor option was seductive or commonly confused.',
        },
        twentyNotebookRule: {
          type: 'STRING',
          description: 'High-yield 1-line rule for the 20th Notebook (e.g., "DOC for Torsades de Pointes is IV Magnesium Sulfate").',
        },
        trapCategory: {
          type: 'STRING',
          enum: ['KNOWLEDGE_GAP', 'READING_HASTE', 'CONCEPTUAL_OVERLAP', 'CALCULATION_ERROR'],
        },
        tag: {
          type: 'STRING',
          enum: [
            'Drug of Choice',
            'Investigation of Choice',
            'Twin Distinction',
            'Classic Triad',
            'Diagnostic Criteria',
            'Management Protocol',
            'General Pearl',
          ],
        },
        isUrgent: {
          type: 'BOOLEAN',
          description: 'True if this is a high-yield volatile fact prone to rapid memory decay.',
        },
        clinicalTrigger: {
          type: 'STRING',
          description: 'Keyword trigger vignette clue that activates this rule.',
        },
      },
    },
    studyDelta: {
      type: 'OBJECT',
      properties: {
        subjectName: { type: 'STRING' },
        systemName: { type: 'STRING' },
        durationMinutes: { type: 'INTEGER' },
        confidenceLevel: { type: 'STRING', enum: ['LOW', 'MED', 'HIGH'] },
        topicsStudied: { type: 'STRING' },
      },
    },
    scoreDelta: {
      type: 'OBJECT',
      properties: {
        testName: { type: 'STRING' },
        score: { type: 'NUMBER' },
        totalMarks: { type: 'NUMBER' },
        percentage: { type: 'NUMBER' },
        weakSubjects: { type: 'ARRAY', items: { type: 'STRING' } },
        notes: { type: 'STRING' },
      },
    },
    detectedPreferenceShift: {
      type: 'OBJECT',
      properties: {
        suggestedSetting: { type: 'STRING' },
        reason: { type: 'STRING' }
      }
    }
  },
  required: ['intent', 'targetSubjectName', 'executiveSummary'],
};
