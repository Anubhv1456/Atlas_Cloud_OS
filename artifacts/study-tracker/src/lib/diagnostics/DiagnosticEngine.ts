import { db } from '@/db/schema';
import { localDb } from '@/db/localDb';
import { syncEngine } from '@/db/syncEngine';
import { getOntologyForExam } from '@/data/ontology';
import { getLocalExamProfile } from '@/lib/examProfile';
import { repairAndRehydrateRevisionDates } from '@/lib/vaultSync';
import { findDuplicateSubjectGroups, mergeAndDeduplicateAllSubjects } from '@/lib/subjectDeduplication';

export interface DiagnosticReport {
  orphanedTopics: { table: string; id: string; invalidTopicId: string }[];
  corruptedDates: { table: string; id: string; field: string; rawValue: string }[];
  duplicateSubjects: { keeperId: number | string; clones: (number | string)[] }[];
  syncAnomalies: { type: 'future_timestamp' | 'malformed_mutation'; queueId?: number }[];
}

export type DiagnosticState = 'IDLE' | 'SCANNING' | 'AWAITING_USER_CONFIRM' | 'CREATING_SNAPSHOT' | 'REPAIRING' | 'COMPLETE' | 'FAILED';

export class AtlasDiagnosticEngine {
  public state: DiagnosticState = 'IDLE';
  public report: DiagnosticReport | null = null;
  public errorMessage: string | null = null;

  private setState(newState: DiagnosticState) {
    this.state = newState;
    if (this.onStateChange) {
      this.onStateChange(newState);
    }
  }

  public onStateChange?: (state: DiagnosticState) => void;

  /**
   * DRY RUN: Scans the database without mutating any data.
   */
  public async scan(): Promise<DiagnosticReport> {
    this.setState('SCANNING');
    this.errorMessage = null;

    try {
      const report: DiagnosticReport = {
        orphanedTopics: [],
        corruptedDates: [],
        duplicateSubjects: [],
        syncAnomalies: [],
      };

      // Vector 1: Ontology & User Data Desync (Orphan Cleanup)
      const profile = getLocalExamProfile();
      const ontology = getOntologyForExam(profile.targetExam || 'USMLE Step 1');
      const validTopicIds = new Set<string>();
      
      for (const subject of ontology) {
        for (const system of subject.systems) {
          for (const topic of system.topics) {
            validTopicIds.add(topic.id);
          }
        }
      }

      // Check topicProgress
      const progresses = await db.topicProgress.toArray();
      for (const p of progresses) {
        if (!validTopicIds.has(p.topicId) && !p.deletedAt) {
          report.orphanedTopics.push({ table: 'topicProgress', id: p.id, invalidTopicId: p.topicId });
        }
        // Date Check (Vector 2 light scan)
        if (typeof p.lastStudiedAt === 'string') {
          report.corruptedDates.push({ table: 'topicProgress', id: p.id, field: 'lastStudiedAt', rawValue: p.lastStudiedAt });
        }
      }

      // Check scoreLogs
      const scoreLogs = await db.scoreLogs.toArray();
      for (const sl of scoreLogs) {
        // Date check
        if (typeof sl.timestamp === 'string') {
          report.corruptedDates.push({ table: 'scoreLogs', id: sl.id?.toString() || '0', field: 'timestamp', rawValue: sl.timestamp });
        }
      }

      // Check curriculumSets
      const sets = await db.curriculumSets.toArray();
      for (const set of sets) {
        if (set.deletedAt) continue;
        for (const tid of set.topicIds || []) {
          if (!validTopicIds.has(tid)) {
            report.orphanedTopics.push({ table: 'curriculumSets', id: set.id?.toString() || '0', invalidTopicId: tid });
          }
        }
      }

      // Check history (Date check)
      const history = await db.history.toArray();
      for (const h of history) {
        if (typeof h.completedAt === 'string') {
          report.corruptedDates.push({ table: 'history', id: h.id?.toString() || '0', field: 'completedAt', rawValue: h.completedAt });
        }
      }

      // Vector 3: Duplicate Subjects
      const duplicates = await findDuplicateSubjectGroups();
      for (const group of duplicates) {
        report.duplicateSubjects.push({
          keeperId: group.keeperSubject.id!,
          clones: group.duplicateSubjects.map(s => s.id!)
        });

      // Vector 4: Unjam Sync (LocalDB)
      for (const anomaly of this.report!.syncAnomalies) {
        if (anomaly.type === 'future_timestamp') {
          await localDb.sync_meta.put({ id: 'last_cloud_sync_timestamp', lastSyncTimestamp: Date.now() - 1000 });
        }
        if (anomaly.type === 'malformed_mutation' && anomaly.queueId) {
          await localDb.mutation_queue.delete(anomaly.queueId);
        }
      }
      }

      // Vector 4: Sync Anomalies
      const syncMeta = await localDb.sync_meta.get('last_cloud_sync_timestamp');
      if (syncMeta && syncMeta.lastSyncTimestamp > Date.now() + 60000) {
        report.syncAnomalies.push({ type: 'future_timestamp' });
      }

      const queue = await localDb.mutation_queue.toArray();
      for (const mut of queue) {
        try {
          JSON.parse(JSON.stringify(mut.payload));
        } catch (e) {
          report.syncAnomalies.push({ type: 'malformed_mutation', queueId: mut.id });
        }
      }

      this.report = report;
      this.setState('AWAITING_USER_CONFIRM');
      return report;
    } catch (err: any) {
      this.errorMessage = err.message || String(err);
      this.setState('FAILED');
      throw err;
    }
  }

  /**
   * MUTATION: Executes repairs across the 4 vectors with a pre-snapshot failsafe.
   */
  public async repair(): Promise<void> {
    if (!this.report) {
      throw new Error("Cannot repair without a valid diagnostic scan report.");
    }

    try {
      this.setState('CREATING_SNAPSHOT');
      // Create rollback failsafe
      await syncEngine.captureLocalSnapshot();

      this.setState('REPAIRING');

      const profile = getLocalExamProfile();
      const ontology = getOntologyForExam(profile.targetExam || 'USMLE Step 1');
      const validTopicIds = new Set<string>();
      
      for (const subject of ontology) {
        for (const system of subject.systems) {
          for (const topic of system.topics) {
            validTopicIds.add(topic.id);
          }
        }
      }

      await db.transaction('rw', [
        db.subjects,
        db.systems,
        db.history,
        db.pyqYears,
        db.scoreLogs,
        db.uiPreferences,
        db.topicProgress,
        db.curriculumSets,
        db.revisionSets,
        db.mistakeLogs,
        
      ], async () => {
        // Vector 1: Fix Orphans
        if (this.report!.orphanedTopics.length > 0) {
          const progresses = await db.topicProgress.toArray();
          for (const p of progresses) {
            if (!validTopicIds.has(p.topicId)) {
              await db.topicProgress.where('topicId').equals(p.topicId).delete();
            }
          }

          const sets = await db.curriculumSets.toArray();
          for (const set of sets) {
            if (set.deletedAt) continue;
            let changed = false;
            const newTopicIds = (set.topicIds || []).filter(tid => {
              if (!validTopicIds.has(tid)) {
                changed = true;
                return false;
              }
              return true;
            });
            if (changed && set.id) {
              await db.curriculumSets.update(set.id, { topicIds: newTopicIds });
            }
          }
        }

      });

      // Vector 3: Deduplication (has its own robust transaction inside)
      if (this.report!.duplicateSubjects.length > 0) {
        await mergeAndDeduplicateAllSubjects();
      }

      // Vector 2: Rehydrate Schedules (has its own robust transaction inside)
      if (this.report!.corruptedDates.length > 0 || this.report!.orphanedTopics.length > 0) {
        await repairAndRehydrateRevisionDates();
      }

      this.setState('COMPLETE');
    } catch (err: any) {
      this.errorMessage = err.message || String(err);
      this.setState('FAILED');
      throw err;
    }
  }
}

export const diagnosticEngine = new AtlasDiagnosticEngine();
