/**
 * Action Schema & Protocol Definitions for Atlas Clinical Co-Pilot
 * Defines strict TypeScript and JSON interfaces for all client-executable medical actions.
 */

export type ClinicalActionType = 
  | 'ACTION_LOG_STUDY'
  | 'ACTION_UPSERT_MISTAKE'
  | 'ACTION_CALIBRATE_DECAY'
  | 'ACTION_RECORD_SCORE'
  | 'CLINICAL_QUERY';

export interface ActionLogStudyPayload {
  subjectName: string;
  systemName?: string;
  durationMinutes: number;
  confidenceLevel?: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface ActionUpsertMistakePayload {
  subjectName: string;
  systemName?: string;
  pearlRule: string;
  triggerStem?: string;
  pitfallTrap?: string;
  isVolatile?: boolean;
  errorType?: 'FACTUAL_RECALL' | 'CONCEPTUAL_CONFUSION' | 'TRICK_QUESTION' | 'OVERTHINKING' | 'SPEED_ERROR';
  source?: string;
}

export interface ActionCalibrateDecayPayload {
  subjectName: string;
  systemName?: string;
  customIntervalDays?: number;
  decayMultiplier?: number;
  action: 'RESET_DECAY' | 'EXTEND_HALF_LIFE' | 'ACCELERATE_DECAY';
}

export interface ActionRecordScorePayload {
  testName: string;
  score: number;
  totalMarks?: number;
  weakAreas?: string[];
}

export interface AtlasClinicalAction {
  id: string;
  actionType: ClinicalActionType;
  title: string;
  description: string;
  isConfirmed: boolean;
  payload: 
    | ActionLogStudyPayload
    | ActionUpsertMistakePayload
    | ActionCalibrateDecayPayload
    | ActionRecordScorePayload
    | Record<string, any>;
  createdAt: number;
}
