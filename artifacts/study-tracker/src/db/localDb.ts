import Dexie, { Table } from 'dexie';
import * as T from './types';

export interface SyncMeta {
  id: string; // e.g., 'history_buckets_2026-09' or 'initial_load_done' or 'last_cloud_sync_timestamp' or 'last_snapshot_timestamp'
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

export interface LocalSnapshot {
  id?: number;
  timestamp: number;
  version: number;
  payload: string; // JSON string of all tables
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
  local_snapshots!: Table<LocalSnapshot>;

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

    this.version(2).stores({
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
      mutation_queue: '++id, collectionName, bucketMonth, timestamp',
      local_snapshots: '++id, timestamp, version'
    });
  }
}

export const localDb = new AtlasLocalDB();

// Multi-Tab Broadcast Coordination
export const tabSyncChannel = new BroadcastChannel('atlas_tab_sync');
