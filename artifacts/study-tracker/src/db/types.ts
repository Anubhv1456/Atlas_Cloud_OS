

export interface UIPreference {
  id: string; // 'subject:1' or 'system:2'
  type: 'subject' | 'system';
  entityId: number;
  order?: number;
  focus?: 'primary' | 'secondary' | null;
  focusUpdatedAt?: Date | null;
  customTopics?: { id: string; name: string; deleted?: boolean }[]; // kept for TS type compatibility only
  updatedAt: Date;
  hlc?: string;
}

export interface Subject {
  id?: number;
  name: string;
  order?: number;
  focus?: 'primary' | 'secondary' | null;
  focusUpdatedAt?: Date | null;
  customTopics?: { id: string; name: string; deleted?: boolean }[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  hlc?: string;
}

export type SystemStatus = 'Strong' | 'Average' | 'Weak';

/**
 * Unified Canonical Curriculum Unit (unifying StudySystem, CurriculumSet, and RevisionSet)
 */
export interface CurriculumUnit {
  id?: number | string;
  subjectId?: number | string;
  systemId?: number | string;
  name: string;
  topicIds?: string[];
  color?: 'teal' | 'amber' | 'purple' | 'blue' | 'gray';
  order?: number;
  focus?: 'primary' | 'secondary' | null;
  focusUpdatedAt?: Date | null;
  customTopics?: { id: string; name: string; deleted?: boolean }[];
  isHighYield?: boolean;

  // Content — incremental and binary states
  contentInitialized?: boolean;
  contentUnitsTotal?: number;
  contentUnitsCompleted?: number;
  contentCompleted?: boolean;
  completionDate?: Date | string | null;

  // QBank
  qbankDone?: boolean;
  qbankCompleted?: boolean;

  // Notes & metadata
  weakAreas?: string;
  status?: SystemStatus;
  
  // Duration, Depth & Pacing Calibration
  depth?: 'rapid' | 'standard' | 'deep';
  isLengthy?: boolean;
  paceMultiplier?: number;
  customDurationMinutes?: number;

  // Spaced Repetition (SDSR & v4 Engine)
  revisionCount?: number;
  lastRevisionDate?: Date | string | null;
  currentRevisionInterval?: number | null;
  nextRevisionDate?: Date | string | null;
  decayFactor?: number;
  easeFactor?: number;
  averageScore?: number;
  scoreHistory?: ScoreLog[];

  // Multi-Day / Lengthy Active Revision states
  revisionState?: 'idle' | 'in_progress' | 'completed';
  revisionStartedAt?: Date | null;
  revisionLastCheckInDate?: string | null;
  revisionDaysLogged?: number;
  revisionProgressPercent?: number;

  createdAt?: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  hlc?: string;
}

export type StudySystem = CurriculumUnit;
export type CurriculumSet = CurriculumUnit;
export type RevisionSet = CurriculumUnit;

export interface MistakeLog {
  id?: number | string;
  subjectId?: number | string;
  systemId: number | string;
  curriculumSetId?: string;
  topicId?: string;

  title?: string;
  clinicalTrigger?: string;
  tags?: string[];
  isVolatile?: boolean;

  errorType: 'concept' | 'retrieval' | 'misread' | 'fomo';
  keyTakeaway: string;
  source: 'GT' | 'QBank' | 'Custom';
  sourceExam?: string;

  resolved: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  hlc?: string;
}

export interface ScoreLog {
  id?: number | string;
  title: string;
  score: number;
  total: number;
  percentage: number;
  type?: 'set' | 'exam' | 'custom' | 'study' | 'gt' | 'swt' | 'qbank';
  subjectId?: number | string;
  systemId?: number | string;
  curriculumSetId?: string;
  timestamp: Date | string;
  notes?: string;
  weakSubjects?: string[];
  testName?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  hlc?: string;
}

export interface HistoryEntry {
  id?: number;
  subjectId: number | string;
  subjectName: string;
  systemId: number | string;
  systemName: string;
  taskKey: string;
  taskLabel: string;
  completedAt: Date | string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  hlc?: string;
}

export interface PYQYear {
  id?: number;
  subjectId: number | string;
  year: string;
  completed: boolean;
  completedAt?: Date | string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  hlc?: string;
}

export interface TopicProgress {
  id: string; // topicId
  topicId: string;
  systemId?: number | string;
  subjectId?: number | string;
  status: 'mastered' | 'weak' | 'unseen';
  lastStudiedAt?: Date | string;
  updatedAt?: Date;
  deletedAt?: Date | null;
  hlc?: string;
}

export interface RevisionLog {
  id?: number | string;
  systemId: number | string;
  subjectId: number | string;
  timestamp: Date;
  status: SystemStatus;
  interval: number;
  decayFactor?: number;
  hlc?: string;
}

export interface RecommendationSkip {
  id?: number;
  targetId: string;
  skippedAt: Date;
  reason: 'already_studied' | 'too_difficult' | 'needs_deep_work' | 'fast_recall' | 'not_today' | 'not_relevant' | 'dismissed_gap' | 'default';
  expiresAt: Date;
}

// ── Operational Mode (Adaptive Focus & Soft Recalibration Engine) ───────────
export type OperationalModeType = 'standard' | 'tactical_sprint' | 'clinical_duty' | 'final_lap' | 'holiday';

export interface OperationalModeConfig {
  mode: OperationalModeType;
  targetSubjectIds?: (number | string)[];
  targetDate?: string | null;
  dailyCapacityMinutes?: number;
  activatedAt?: string;
  recalibrationWindowDays?: number;
  previousMode?: OperationalModeType;
  lastRecalibratedAt?: string;
  notes?: string;
}

export interface OperationalModeRecord {
  id: string; // 'current' singleton record
  mode: OperationalModeType;
  targetSubjectIds: (number | string)[];
  targetDate: string | null;
  dailyCapacityMinutes: number;
  activatedAt: string;
  recalibrationWindowDays: number;
  previousMode?: OperationalModeType;
  lastRecalibratedAt?: string;
  notes?: string;
  updatedAt: Date;
  hlc?: string;
}

export const DEFAULT_OPERATIONAL_MODE: OperationalModeRecord = {
  id: 'current',
  mode: 'standard',
  targetSubjectIds: [],
  targetDate: null,
  dailyCapacityMinutes: 180,
  activatedAt: new Date().toISOString(),
  recalibrationWindowDays: 10,
  updatedAt: new Date(),
};
