import Dexie, { Table } from 'dexie';
import * as T from './types';

export interface SyncMeta {
  id: string; // e.g., 'history_buckets_2026-09' or 'initial_load_done'
  lastSyncTimestamp: number;
}

export interface MutationQueueItem {
  id?: number;
  collectionName: string;
  docId: string;
  action: 'PUT' | 'DELETE';
  payload: any;
  timestamp: number;
  bucketMonth: string; // YYYY-MM
}

export class AtlasLocalDB extends Dexie {
  subjects!: Table<T.Subject>;
  systems!: Table<T.StudySystem>;
  history!: Table<T.HistoryEntry>;
  pyqYears!: Table<T.PYQYear>;
  scoreLogs!: Table<T.ScoreLog>;
  uiPreferences!: Table<T.UIPreference>;
  topicProgress!: Table<T.TopicProgress>;
  curriculumSets!: Table<T.CurriculumSet>;
  revisionSets!: Table<T.CurriculumSet>;
  mistakeLogs!: Table<T.MistakeLog>;
  recommendationSkips!: Table<T.RecommendationSkip>;
  operationalModes!: Table<T.OperationalModeRecord>;
  
  sync_meta!: Table<SyncMeta>;
  mutation_queue!: Table<MutationQueueItem>;

  constructor() {
    super('AtlasStudyVaultDB');
    this.version(1).stores({
      subjects: 'id, name, examProfile, updatedAt',
      systems: 'id, subjectId, *subjectIds, name, status, examProfile, updatedAt',
      history: 'id, subjectId, systemId, completedAt, updatedAt',
      pyqYears: 'id, subjectId, year, completed, updatedAt',
      scoreLogs: 'id, title, type, subjectId, *subjectIds, systemId, timestamp, updatedAt',
      uiPreferences: 'id, type, entityId, examProfile, updatedAt',
      topicProgress: 'id, topicId, systemId, subjectId, *subjectIds, status, lastStudiedAt, updatedAt',
      curriculumSets: 'id, subjectId, *subjectIds, name, isHighYield, examProfile, updatedAt',
      revisionSets: 'id, subjectId, *subjectIds, name, examProfile, updatedAt',
      mistakeLogs: 'id, subjectId, *subjectIds, systemId, errorType, resolved, createdAt, updatedAt',
      recommendationSkips: 'id, targetId, skippedAt, expiresAt',
      operationalModes: 'id, mode, activatedAt, examProfile, updatedAt',
      
      sync_meta: 'id',
      mutation_queue: '++id, collectionName, bucketMonth, timestamp'
    });
  }
}

export const localDb = new AtlasLocalDB();
