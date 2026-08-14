

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

export interface StudySystem {
  isHighYield?: boolean;
  id?: number;
  subjectId?: number | string;
  name: string;
  // Content — incremental progress
  contentInitialized?: boolean;
  contentUnitsTotal?: number;
  contentUnitsCompleted?: number;
  contentCompleted?: boolean;
  // QBank — binary
  qbankDone?: boolean;
  // Notes & metadata
  weakAreas: string;
  // Confidence (Strong / Average / Weak) — doubles as spaced-rep confidence
  status: SystemStatus;
  updatedAt: Date;

  // ── Focus Mode ────────────────────────────────────────────────────────────
  focus?: 'primary' | 'secondary' | null;
  focusUpdatedAt?: Date | null;

  // ── Ordering ──────────────────────────────────────────────────────────────
  order?: number;
  customTopics?: { id: string; name: string; deleted?: boolean }[];

  // ── Revision engine fields (v4) ─────────────────────────────────────────
  /** Set when both contentCompleted and qbankDone first become true. */
  /** How many revisions have been completed. */
  revisionCount: number;
  /** Date of most recent completed revision. */
  lastRevisionDate: Date | null;
  /** Current calculated interval in days. */
  currentRevisionInterval: number | null;
  /** Absolute date the next revision is due. */
  nextRevisionDate: Date | null;
  /** Decay Calibration factor (1.0 = standard, >1.0 = faster decay / complex topic, <1.0 = slower decay / high retention). Defaults to 1.0. */
  decayFactor?: number;

  // ── Multi-Day / Lengthy Active Revision fields (v11) ──────────────────────
  /** Flag indicating whether this topic/system is a lengthy, multi-day revision system. */
  isLengthy?: boolean;
  /** Pacing multiplier dynamically calibrated from student study history (default: 1.0). */
  paceMultiplier?: number;
  /** Current active revision status: 'idle' | 'in_progress' | 'completed'. Defaults to 'idle'. */
  revisionState?: 'idle' | 'in_progress' | 'completed';
  /** Timestamp when active revision was started. */
  revisionStartedAt?: Date | null;
  /** ISO Date string ('YYYY-MM-DD') when the last daily revision check-in occurred. */
  revisionLastCheckInDate?: string | null;
  /** Number of distinct study days logged during active revision. */
  revisionDaysLogged?: number;
  /** Self-reported or calculated progress percentage (0 - 100) toward completing active revision. */
  revisionProgressPercent?: number;
  deletedAt?: Date | null;
  hlc?: string;
}

/** One year entry under a subject's PYQ section. */
export interface PYQYear {
  id?: number;
  subjectId?: number | string;
  /** User-defined year label, e.g. "2024". */
  year: string;
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  hlc?: string;
}

export interface ScoreLog {
  id?: number;
  type: 'revision' | 'pyq' | 'set' | 'gt';
  subjectId?: number | string;
  systemId?: number;
  topicId?: string;
  curriculumSetId?: string;
  pyqYearId?: number;
  title: string;
  score: number;
  total: number;
  percentage: number;
  timestamp: Date;
  notes?: string;
  updatedAt?: Date;
  deletedAt?: Date | null;
  hlc?: string;
}

export interface HistoryEntry {
  id?: number;
  subjectId?: number | string;
  subjectName: string;
  /** 0 for subject-level entries (PYQs). */
  systemId: number;
  systemName: string;
  taskKey: string;
  taskLabel: string;
  completedAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  hlc?: string;
}

export interface RevisionLog {
  topicId?: string;
  curriculumSetId?: string;
  previousInterval?: number | null;
  newInterval?: number;
  reviewedAt?: string;
  date: string;
  score: number;
}

export interface TopicProgress {
  topicId: string;
  isWeak: boolean;
  notesCount?: number;
  updatedAt: Date;
  hlc?: string;
}

export type TopicLivingState = 'not_started' | 'learning' | 'practicing' | 'revision_due' | 'mastered';

export interface CurriculumSet {
  id?: string;
  subjectId?: number | string;
  systemId: number;
  name: string;
  topicIds: string[];
  color?: 'teal' | 'amber' | 'purple' | 'blue' | 'gray';
  order?: number;
  focus?: 'primary' | 'secondary' | null;
  focusUpdatedAt?: Date | null;
  customTopics?: { id: string; name: string; deleted?: boolean }[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  hlc?: string;
  
  // Phase States
  contentCompleted?: boolean;
  qbankCompleted?: boolean;

  // Duration & Pacing Calibration
  isLengthy?: boolean;
  paceMultiplier?: number;
  customDurationMinutes?: number;

  // SDSR Engine Data
  nextRevisionDate?: string;
  lastRevisionDate?: string;
  currentRevisionInterval?: number;
  revisionCount?: number;
  easeFactor?: number;
  averageScore?: number;
  scoreHistory?: ScoreLog[];
}

export type RevisionSet = CurriculumSet;

export interface MistakeLog {
  id?: number | string;
  subjectId?: number | string;
  systemId: number | string;
  curriculumSetId?: string;
  topicId?: string;

  errorType: 'concept' | 'retrieval' | 'misread' | 'fomo';
  keyTakeaway: string;
  source: 'GT' | 'QBank' | 'Custom';

  resolved: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  hlc?: string;
}

export interface RecommendationSkip {
  id?: number;
  targetId: string;
  skippedAt: Date;
  reason: 'already_studied' | 'too_difficult' | 'needs_deep_work' | 'fast_recall' | 'not_today' | 'not_relevant' | 'dismissed_gap' | 'default';
  expiresAt: Date;
}
