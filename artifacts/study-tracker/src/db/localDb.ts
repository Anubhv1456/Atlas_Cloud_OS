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

/**
 * Requests persistent storage allocation from the device engine to prevent
 * background OS database evictions under high memory pressure.
 */
export async function ensurePersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        const granted = await navigator.storage.persist();
        console.log(`[Storage Persist] Requested persistence. Granted: ${granted}`);
        return granted;
      }
      return isPersisted;
    } catch (err) {
      console.warn('[Storage Persist] Persistent storage request error:', err);
    }
  }
  return false;
}

/**
 * Executes a Dexie write transaction with strict quota-exceeded guards.
 */
export async function safeDbWrite<T>(writePromise: Promise<T>): Promise<T | null> {
  try {
    return await writePromise;
  } catch (err: any) {
    if (err.name === 'QuotaExceededError' || err.message?.includes('QuotaExceededError')) {
      console.error('[DATABASE CRITICAL] Out of local disk space. Write aborted.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('atlas-system-alert', {
          detail: {
            type: 'QUOTA_EXCEEDED',
            message: 'Your browser is out of local disk storage. Please free up space on your device or export an instant backup to protect your study blocks.'
          }
        }));
      }
    } else {
      console.error('[DATABASE WRITE ERROR]:', err);
    }
    return null;
  }
}
