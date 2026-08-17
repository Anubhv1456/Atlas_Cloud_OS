import { db, dbEvents } from '@/db/schema';
import { User } from 'firebase/auth';
import { createSignedVaultBackup, verifyVaultBackupProvenance, AtlasVaultEnvelope } from './vaultSignature';
import { StudySystem, CurriculumSet, HistoryEntry, DEFAULT_OPERATIONAL_MODE } from '@/db/types';
import { scheduleFirstRevision, scheduleNextRevision, today } from '@/db/revisionEngine';
import { UNIVERSAL_ONTOLOGY } from '@/data/ontology';
import { generateHLC } from './hlc';
import { doc, setDoc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { firestoreDb } from './firebase';
import { calibrateCurriculumSetSDSR, calibrateSystemSDSR } from './sdsr-engine';
import { loadUniversalOntology } from './exam-presets';

/**
 * Safely parses any date-like value into a valid Date object or null
 */
function parseDateSafe(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === 'object' && typeof val.toDate === 'function') {
    const d = val.toDate();
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Export the complete, uncorrupted database vault including all curriculum sets, revision schedules, and mistake logs.
 */
export async function exportCompleteVault(user: User | null): Promise<{
  blob: Blob;
  filename: string;
  envelope: AtlasVaultEnvelope;
}> {
  const [
    subjects,
    systems,
    curriculumSets,
    history,
    pyqYears,
    scoreLogs,
    uiPreferences,
    topicProgress,
    mistakeLogs,
    recommendationSkips,
    operationalModes
  ] = await Promise.all([
    db.subjects.toArray(),
    db.systems.toArray(),
    db.curriculumSets.toArray(),
    db.history.toArray(),
    db.pyqYears.toArray(),
    db.scoreLogs.toArray(),
    db.uiPreferences.toArray(),
    db.topicProgress.toArray(),
    db.mistakeLogs.toArray(),
    db.recommendationSkips.toArray(),
    db.operationalModes.toArray(),
  ]);

  const rawData = {
    subjects,
    systems,
    curriculumSets,
    revisionSets: curriculumSets, // Backwards-compatible alias
    history,
    pyqYears,
    scoreLogs,
    uiPreferences,
    topicProgress,
    mistakeLogs,
    recommendationSkips,
    operationalModes
  };

  const envelope = await createSignedVaultBackup(rawData, user);
  const jsonStr = JSON.stringify(envelope, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const filename = `atlas-data-vault-${new Date().toISOString().slice(0, 10)}.json`;

  return { blob, filename, envelope };
}

export interface RestoreVaultResult {
  success: boolean;
  metrics: {
    subjectCount: number;
    systemCount: number;
    curriculumSetsCount: number;
    historyCount: number;
    scoreLogsCount: number;
    rehydratedRevisionSchedulesCount: number;
  };
  provenance: any;
  message: string;
}

/**
 * Robust JSON Import with Full Schema Recovery, Date Deserialization & Revision Schedule Rehydration.
 */
export async function restoreCompleteVault(
  jsonText: string,
  user: User | null
): Promise<RestoreVaultResult> {
  const parsed = JSON.parse(jsonText);
  const verification = await verifyVaultBackupProvenance(parsed, user?.uid || null);
  const data = verification.payload || {};

  if (!data.subjects && !data.systems && !data.history && !data.curriculumSets) {
    throw new Error('Invalid Atlas backup format. Missing core curriculum tables.');
  }

  // 1. Sanitize & Deserialise Dates for Subjects
  const cleanSubjects = (Array.isArray(data.subjects) ? data.subjects : []).map((s: any) => ({
    ...s,
    createdAt: parseDateSafe(s.createdAt) || new Date(),
    updatedAt: parseDateSafe(s.updatedAt) || new Date(),
    deletedAt: parseDateSafe(s.deletedAt),
    focusUpdatedAt: parseDateSafe(s.focusUpdatedAt),
  }));

  // 2. Sanitize & Deserialise Dates for Systems
  const cleanSystems: StudySystem[] = (Array.isArray(data.systems) ? data.systems : []).map((sys: any) => ({
    ...sys,
    nextRevisionDate: parseDateSafe(sys.nextRevisionDate),
    lastRevisionDate: parseDateSafe(sys.lastRevisionDate),
    completionDate: parseDateSafe(sys.completionDate),
    revisionStartedAt: parseDateSafe(sys.revisionStartedAt),
    createdAt: parseDateSafe(sys.createdAt) || new Date(),
    updatedAt: parseDateSafe(sys.updatedAt) || new Date(),
    deletedAt: parseDateSafe(sys.deletedAt),
    focusUpdatedAt: parseDateSafe(sys.focusUpdatedAt),
    revisionCount: typeof sys.revisionCount === 'number' ? sys.revisionCount : 0,
    status: sys.status || 'Average'
  }));

  // 3. Sanitize & Deserialise Dates for CurriculumSets
  const incomingSets = Array.isArray(data.curriculumSets) && data.curriculumSets.length > 0
    ? data.curriculumSets
    : Array.isArray(data.revisionSets) && data.revisionSets.length > 0
    ? data.revisionSets
    : [];

  const cleanCurriculumSets: CurriculumSet[] = incomingSets.map((set: any) => ({
    ...set,
    nextRevisionDate: set.nextRevisionDate ? (parseDateSafe(set.nextRevisionDate)?.toISOString() || String(set.nextRevisionDate)) : undefined,
    lastRevisionDate: set.lastRevisionDate ? (parseDateSafe(set.lastRevisionDate)?.toISOString() || String(set.lastRevisionDate)) : undefined,
    createdAt: parseDateSafe(set.createdAt) || new Date(),
    updatedAt: parseDateSafe(set.updatedAt) || new Date(),
    deletedAt: parseDateSafe(set.deletedAt),
    focusUpdatedAt: parseDateSafe(set.focusUpdatedAt),
    revisionCount: typeof set.revisionCount === 'number' ? set.revisionCount : 0,
  }));

  // 4. Sanitize History Entries
  const cleanHistory: HistoryEntry[] = (Array.isArray(data.history) ? data.history : []).map((h: any) => ({
    ...h,
    completedAt: parseDateSafe(h.completedAt) || new Date(),
    updatedAt: parseDateSafe(h.updatedAt) || new Date(),
    deletedAt: parseDateSafe(h.deletedAt),
  }));

  // 5. Sanitize ScoreLogs
  const cleanScoreLogs = (Array.isArray(data.scoreLogs) ? data.scoreLogs : []).map((score: any) => ({
    ...score,
    timestamp: parseDateSafe(score.timestamp) || new Date(),
    updatedAt: parseDateSafe(score.updatedAt) || new Date(),
    deletedAt: parseDateSafe(score.deletedAt),
  }));

  // 6. Sanitize PYQYears
  const cleanPyqYears = (Array.isArray(data.pyqYears) ? data.pyqYears : []).map((pyq: any) => ({
    ...pyq,
    completedAt: parseDateSafe(pyq.completedAt),
    createdAt: parseDateSafe(pyq.createdAt) || new Date(),
    updatedAt: parseDateSafe(pyq.updatedAt) || new Date(),
    deletedAt: parseDateSafe(pyq.deletedAt),
  }));

  // 7. Sanitize UI Preferences
  const cleanUiPrefs = Array.isArray(data.uiPreferences) ? data.uiPreferences : [];

  // 8. Sanitize Topic Progress
  const cleanTopicProgress = (Array.isArray(data.topicProgress) ? data.topicProgress : []).map((tp: any) => ({
    ...tp,
    updatedAt: parseDateSafe(tp.updatedAt) || new Date()
  }));

  // 9. Sanitize Mistake Logs
  const cleanMistakeLogs = (Array.isArray(data.mistakeLogs) ? data.mistakeLogs : []).map((m: any) => ({
    ...m,
    createdAt: parseDateSafe(m.createdAt) || new Date(),
    updatedAt: parseDateSafe(m.updatedAt) || new Date(),
    deletedAt: parseDateSafe(m.deletedAt)
  }));

  // 10. Sanitize Recommendation Skips & Operational Modes
  const cleanSkips = (Array.isArray(data.recommendationSkips) ? data.recommendationSkips : []).map((sk: any) => ({
    ...sk,
    skippedAt: parseDateSafe(sk.skippedAt) || new Date(),
    expiresAt: parseDateSafe(sk.expiresAt) || new Date(Date.now() + 12 * 60 * 60 * 1000)
  }));

  const cleanOpModes = (Array.isArray(data.operationalModes) ? data.operationalModes : []).map((om: any) => ({
    ...om,
    updatedAt: parseDateSafe(om.updatedAt) || new Date()
  }));

  // ── REVISION SCHEDULE RECOVERY & REHYDRATION PIPELINE ───────────────────────
  // If curriculumSets was missing from an older backup, or if system revision dates were lost:
  let rehydratedCount = 0;

  // Build a lookup map of existing or incoming curriculumSets by systemId
  const setsBySystemId = new Map<number | string, CurriculumSet[]>();
  cleanCurriculumSets.forEach(set => {
    const list = setsBySystemId.get(set.systemId) || [];
    list.push(set);
    setsBySystemId.set(set.systemId, list);
  });

  // Check each system
  for (const sys of cleanSystems) {
    if (!sys.id) continue;
    const existingSets = setsBySystemId.get(sys.id) || [];

    const sysSubject = cleanSubjects.find(s => s.id === sys.subjectId);
    const sysSubName = sysSubject?.name || '';
    // Find all history logs belonging strictly to this system within its parent subject
    const systemHistory = cleanHistory.filter(h => {
      if (h.deletedAt) return false;
      if (h.subjectId && sys.subjectId && String(h.subjectId) !== String(sys.subjectId)) return false;
      if (h.subjectName && sysSubName && h.subjectName.toLowerCase() !== sysSubName.toLowerCase()) return false;
      if (h.systemId === sys.id) return true;
      if (h.systemName && h.systemName.toLowerCase() === sys.name.toLowerCase()) {
        return (h.subjectId && String(h.subjectId) === String(sys.subjectId)) ||
               (h.subjectName && h.subjectName.toLowerCase() === sysSubName.toLowerCase());
      }
      return false;
    }).sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());

    const latestCompletion = systemHistory[0]?.completedAt || sys.completionDate || sys.lastRevisionDate;
    const hasHistory = systemHistory.length > 0;
    const isCompleted = sys.contentCompleted || sys.qbankDone || sys.status === 'Strong' || sys.status === 'Weak' || hasHistory;

    // If no curriculumSet exists for this system, auto-generate one from ontology topics or generic block
    if (existingSets.length === 0 && isCompleted) {
      // Look up topics from Universal Ontology if available
      let topicIds: string[] = [];
      for (const sub of UNIVERSAL_ONTOLOGY) {
        const foundSys = sub.systems.find(s => s.name.toLowerCase() === sys.name.toLowerCase());
        if (foundSys && foundSys.topics.length > 0) {
          topicIds = foundSys.topics.map(t => t.id);
          break;
        }
      }

      // Determine next revision date
      let scheduledNextDate: string | undefined = undefined;
      let scheduledLastDate: string | undefined = undefined;
      let revCount = sys.revisionCount || systemHistory.length || 1;

      if (sys.nextRevisionDate) {
        scheduledNextDate = sys.nextRevisionDate.toISOString();
      } else if (latestCompletion) {
        // Calculate based on days since completion
        const baseInterval = revCount === 1 ? 1 : revCount === 2 ? 3 : revCount === 3 ? 7 : revCount === 4 ? 14 : 30;
        const nextDate = new Date(latestCompletion.getTime() + baseInterval * 24 * 60 * 60 * 1000);
        scheduledNextDate = nextDate.toISOString();
        sys.nextRevisionDate = nextDate;
        sys.lastRevisionDate = latestCompletion;
        rehydratedCount++;
      } else {
        // Schedule for tomorrow
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        scheduledNextDate = tomorrow.toISOString();
        sys.nextRevisionDate = tomorrow;
        rehydratedCount++;
      }

      if (sys.lastRevisionDate) {
        scheduledLastDate = sys.lastRevisionDate.toISOString();
      } else if (latestCompletion) {
        scheduledLastDate = latestCompletion.toISOString();
      }

      const newSet: CurriculumSet = {
        id: `set_${sys.id}_auto_${generateHLC()}`,
        subjectId: sys.subjectId,
        systemId: Number(sys.id),
        name: sys.name,
        topicIds: topicIds.length > 0 ? topicIds : [`topic_${sys.id}_core`],
        color: 'teal',
        order: 0,
        contentCompleted: sys.contentCompleted || true,
        qbankCompleted: sys.qbankDone || false,
        nextRevisionDate: scheduledNextDate,
        lastRevisionDate: scheduledLastDate,
        revisionCount: revCount,
        createdAt: sys.createdAt || new Date(),
        updatedAt: new Date(),
        hlc: generateHLC()
      };

      cleanCurriculumSets.push(newSet);
      setsBySystemId.set(sys.id, [newSet]);
    } else if (existingSets.length > 0) {
      // Rehydrate missing dates on existing curriculumSets from system or history
      for (const set of existingSets) {
        if (!set.nextRevisionDate && (sys.nextRevisionDate || latestCompletion)) {
          if (sys.nextRevisionDate) {
            set.nextRevisionDate = sys.nextRevisionDate.toISOString();
            set.lastRevisionDate = sys.lastRevisionDate?.toISOString();
            set.revisionCount = sys.revisionCount || set.revisionCount || 1;
            rehydratedCount++;
          } else if (latestCompletion) {
            const revCount = set.revisionCount || sys.revisionCount || 1;
            const baseInterval = revCount === 1 ? 1 : revCount === 2 ? 3 : revCount === 3 ? 7 : 14;
            const nextDate = new Date(latestCompletion.getTime() + baseInterval * 24 * 60 * 60 * 1000);
            set.nextRevisionDate = nextDate.toISOString();
            set.lastRevisionDate = latestCompletion.toISOString();
            set.revisionCount = revCount;
            sys.nextRevisionDate = nextDate;
            sys.lastRevisionDate = latestCompletion;
            rehydratedCount++;
          }
        } else if (set.nextRevisionDate && !sys.nextRevisionDate) {
          sys.nextRevisionDate = new Date(set.nextRevisionDate);
          if (set.lastRevisionDate) sys.lastRevisionDate = new Date(set.lastRevisionDate);
          sys.revisionCount = set.revisionCount || 1;
        }
      }
    }
  }

  // 11. Execute Safe Atomic / Multi-Collection Database Write
  await db.transaction('rw', [
    db.subjects,
    db.systems,
    db.curriculumSets,
    db.history,
    db.pyqYears,
    db.scoreLogs,
    db.uiPreferences,
    db.topicProgress,
    db.mistakeLogs,
    db.recommendationSkips,
    db.operationalModes
  ], async () => {
    if (cleanSubjects.length > 0) await db.subjects.bulkPut(cleanSubjects);
    if (cleanSystems.length > 0) await db.systems.bulkPut(cleanSystems);
    if (cleanCurriculumSets.length > 0) await db.curriculumSets.bulkPut(cleanCurriculumSets);
    if (cleanHistory.length > 0) await db.history.bulkPut(cleanHistory);
    if (cleanPyqYears.length > 0) await db.pyqYears.bulkPut(cleanPyqYears);
    if (cleanScoreLogs.length > 0) await db.scoreLogs.bulkPut(cleanScoreLogs);
    if (cleanUiPrefs.length > 0) await db.uiPreferences.bulkPut(cleanUiPrefs);
    if (cleanTopicProgress.length > 0) await db.topicProgress.bulkPut(cleanTopicProgress);
    if (cleanMistakeLogs.length > 0) await db.mistakeLogs.bulkPut(cleanMistakeLogs);
    if (cleanSkips.length > 0) await db.recommendationSkips.bulkPut(cleanSkips);
    if (cleanOpModes.length > 0) await db.operationalModes.bulkPut(cleanOpModes);
  });

  // 12. Account-Hopping Interceptor Protection
  if (verification.isForeignUid && verification.isHighHistoricalVolume) {
    if (user && firestoreDb) {
      const userRef = doc(firestoreDb, 'users', user.uid);
      await setDoc(userRef, {
        vaultActivationRequired: true,
        vaultImportProvenance: {
          foreignOriginUid: verification.originUid,
          foreignOriginEmail: verification.originEmail || 'unlisted',
          exportTimestamp: verification.exportTimestamp,
          metrics: verification.metrics,
          importedAt: new Date()
        },
        betaAccess: false,
        updatedAt: new Date()
      }, { merge: true });

      localStorage.removeItem(`beta_access_${user.uid}`);
      localStorage.removeItem(`beta_access_expiry_${user.uid}`);
    }
  }

  return {
    success: true,
    metrics: {
      subjectCount: cleanSubjects.length,
      systemCount: cleanSystems.length,
      curriculumSetsCount: cleanCurriculumSets.length,
      historyCount: cleanHistory.length,
      scoreLogsCount: cleanScoreLogs.length,
      rehydratedRevisionSchedulesCount: rehydratedCount,
    },
    provenance: verification,
    message: `Restored ${cleanSubjects.length} subjects, ${cleanCurriculumSets.length} study blocks, and ${cleanHistory.length} logs.${rehydratedCount > 0 ? ` Rehydrated ${rehydratedCount} scheduled revision dates.` : ''}`
  };
}

/**
 * Diagnostic & Auto-Repair tool that scans the database,
 * replays historical score logs & completions through the SDSR engine,
 * and calibrates the exact next revision dates and intervals for all study blocks and systems.
 */
export async function repairAndRehydrateRevisionDates(): Promise<{
  repairedCount: number;
  repairedSetsCount: number;
  message: string;
}> {
  const [systems, curriculumSets, history, subjects, scoreLogs] = await Promise.all([
    db.systems.toArray(),
    db.curriculumSets.toArray(),
    db.history.toArray(),
    db.subjects.toArray(),
    db.scoreLogs.toArray()
  ]);

  let repairedCount = 0;
  let repairedSetsCount = 0;
  const newSetsToAdd: CurriculumSet[] = [];

  const subjectMap = new Map<number, string>();
  subjects.forEach(s => {
    if (s.id) subjectMap.set(s.id, s.name);
  });

  // Step 1: Rehydrate and calibrate all existing CurriculumSets using SDSR
  for (const set of curriculumSets) {
    if (!set.id || set.deletedAt) continue;

    const subjectName = subjectMap.get(set.subjectId) || 'General';

    // Find all score logs associated with this study block (scoped strictly to matching subject & system)
    const matchingScoreLogs = scoreLogs.filter(sl => {
      if (sl.deletedAt) return false;
      if (sl.curriculumSetId && sl.curriculumSetId === set.id) return true;
      if (sl.systemId === set.systemId && sl.type === 'set') {
        if (sl.subjectId && set.subjectId && String(sl.subjectId) !== String(set.subjectId)) {
          return false;
        }
        return true;
      }
      return false;
    });

    // Find all revision history entries strictly scoped to this study block and its parent subject
    const matchingHistory = history.filter(h => {
      if (h.deletedAt) return false;
      if (h.taskKey !== 'curriculum_set_revision') return false;

      // Subject scoping check: if history contains subject info, must match
      if (h.subjectId && set.subjectId && String(h.subjectId) !== String(set.subjectId)) {
        return false;
      }
      if (h.subjectName && subjectName && h.subjectName.toLowerCase() !== subjectName.toLowerCase()) {
        return false;
      }

      // Match by exact curriculumSetId
      if (h.curriculumSetId && h.curriculumSetId === set.id) return true;

      // Match by systemId within same subject
      if (h.systemId && set.systemId && Number(h.systemId) === Number(set.systemId)) {
        return true;
      }

      // If matching by name or taskLabel, subject MUST match
      const nameMatches = (h.systemName && h.systemName.toLowerCase() === set.name.toLowerCase()) ||
                          (h.taskLabel && h.taskLabel.toLowerCase().includes(set.name.toLowerCase()));
      if (nameMatches) {
        const matchesSubject = (h.subjectId && String(h.subjectId) === String(set.subjectId)) ||
                               (h.subjectName && h.subjectName.toLowerCase() === subjectName.toLowerCase());
        return matchesSubject;
      }

      return false;
    });

    // Merge logs into chronological revision events
    interface RevisionEvent {
      date: Date;
      scoreRatio: number;
    }
    const rawEvents: RevisionEvent[] = [];

    matchingScoreLogs.forEach(sl => {
      const d = parseDateSafe(sl.timestamp);
      if (d) {
        const score = (sl.percentage !== undefined ? sl.percentage : sl.score !== undefined ? sl.score : 70);
        rawEvents.push({ date: d, scoreRatio: Math.max(0.1, Math.min(1.0, score > 1 ? score / 100 : score)) });
      }
    });

    matchingHistory.forEach(h => {
      const d = parseDateSafe(h.completedAt);
      if (d) {
        let scoreRatio = 0.70;
        if (h.taskLabel) {
          const match = h.taskLabel.match(/(\d+)%/);
          if (match && match[1]) {
            scoreRatio = Math.max(0.1, Math.min(1.0, parseInt(match[1], 10) / 100));
          }
        }
        rawEvents.push({ date: d, scoreRatio });
      }
    });

    // Deduplicate events that occurred within 10 minutes of each other
    rawEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
    const dedupedEvents: RevisionEvent[] = [];
    for (const ev of rawEvents) {
      const last = dedupedEvents[dedupedEvents.length - 1];
      if (!last || Math.abs(ev.date.getTime() - last.date.getTime()) > 10 * 60 * 1000) {
        dedupedEvents.push(ev);
      } else {
        // Update to higher precision score if available
        last.scoreRatio = ev.scoreRatio;
      }
    }

    if (dedupedEvents.length > 0) {
      // Replay SDSR progression chronologically across all historical & backdated revisions
      let workingSet: CurriculumSet = {
        ...set,
        currentRevisionInterval: undefined,
        lastRevisionDate: undefined,
        nextRevisionDate: undefined,
        revisionCount: 0,
        averageScore: undefined,
      };

      for (const ev of dedupedEvents) {
        const sdsrRes = calibrateCurriculumSetSDSR(
          workingSet,
          ev.scoreRatio,
          subjectName,
          0.70,
          ev.date
        );
        workingSet = {
          ...workingSet,
          ...sdsrRes.updatedSet,
          lastRevisionDate: ev.date.toISOString(),
          nextRevisionDate: sdsrRes.nextRevisionDate.toISOString(),
        };
      }

      await db.curriculumSets.update(set.id, {
        currentRevisionInterval: workingSet.currentRevisionInterval,
        nextRevisionDate: workingSet.nextRevisionDate,
        lastRevisionDate: workingSet.lastRevisionDate,
        revisionCount: workingSet.revisionCount,
        averageScore: workingSet.averageScore,
        updatedAt: new Date(),
        hlc: generateHLC()
      });
      repairedSetsCount++;
    } else {
      // No revision events recorded yet; check for initial completion history strictly within same subject
      const setCompletions = history.filter(h => {
        if (h.deletedAt) return false;
        if (h.subjectId && set.subjectId && String(h.subjectId) !== String(set.subjectId)) return false;
        if (h.subjectName && subjectName && h.subjectName.toLowerCase() !== subjectName.toLowerCase()) return false;
        if (h.curriculumSetId && h.curriculumSetId === set.id) return true;
        if (h.systemId && set.systemId && Number(h.systemId) === Number(set.systemId)) return true;
        const nameMatches = (h.systemName && h.systemName.toLowerCase() === set.name.toLowerCase()) ||
                            (h.taskLabel && h.taskLabel.toLowerCase().includes(set.name.toLowerCase()));
        if (nameMatches) {
          return (h.subjectId && String(h.subjectId) === String(set.subjectId)) ||
                 (h.subjectName && h.subjectName.toLowerCase() === subjectName.toLowerCase());
        }
        return false;
      }).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

      const earliestCompletion = setCompletions[0]?.completedAt
        ? new Date(setCompletions[0].completedAt)
        : set.completionDate
        ? new Date(set.completionDate)
        : null;

      if (setCompletions.length > 0) {
        const earliestCompletion = new Date(setCompletions[0].completedAt);
        const initialInterval = 3;
        const nextRev = new Date(earliestCompletion.getTime() + initialInterval * 24 * 60 * 60 * 1000);
        await db.curriculumSets.update(set.id, {
          contentCompleted: set.contentCompleted ?? true,
          currentRevisionInterval: initialInterval,
          nextRevisionDate: nextRev.toISOString(),
          lastRevisionDate: earliestCompletion.toISOString(),
          completionDate: earliestCompletion.toISOString(),
          revisionCount: 0,
          updatedAt: new Date(),
          hlc: generateHLC()
        });
        repairedSetsCount++;
      } else {
        // No completion or revision history exists for this set in its subject.
        // Cleanse any contaminated dates and completion flags from cross-subject collisions.
        if (set.nextRevisionDate || set.lastRevisionDate || set.currentRevisionInterval || set.completionDate || set.contentCompleted || set.qbankCompleted) {
          await db.curriculumSets.update(set.id, {
            contentCompleted: false,
            qbankCompleted: false,
            completionDate: null as any,
            currentRevisionInterval: null as any,
            nextRevisionDate: null as any,
            lastRevisionDate: null as any,
            revisionCount: 0,
            averageScore: null as any,
            updatedAt: new Date(),
            hlc: generateHLC()
          });
          repairedSetsCount++;
        }
      }
    }
  }

  // Step 2: Synchronize and repair Systems and construct missing sets
  const freshSets = await db.curriculumSets.toArray();
  const setsBySystem = new Map<number | string, CurriculumSet[]>();
  freshSets.forEach(set => {
    if (!set.deletedAt) {
      const list = setsBySystem.get(set.systemId) || [];
      list.push(set);
      setsBySystem.set(set.systemId, list);
    }
  });

  for (const sys of systems) {
    if (!sys.id || sys.deletedAt) continue;

    const subjectName = subjectMap.get(sys.subjectId) || 'General';
    const existingSets = setsBySystem.get(sys.id) || [];
    const systemHistory = history.filter(h => {
      if (h.deletedAt) return false;
      if (h.subjectId && sys.subjectId && String(h.subjectId) !== String(sys.subjectId)) return false;
      if (h.subjectName && subjectName && h.subjectName.toLowerCase() !== subjectName.toLowerCase()) return false;
      if (h.systemId && Number(h.systemId) === Number(sys.id)) return true;
      const nameMatches = h.systemName && h.systemName.toLowerCase() === sys.name.toLowerCase();
      if (nameMatches) {
        return (h.subjectId && String(h.subjectId) === String(sys.subjectId)) ||
               (h.subjectName && h.subjectName.toLowerCase() === subjectName.toLowerCase());
      }
      return false;
    }).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

    if (existingSets.length === 0) {
      // Check if this system has completion status or score logs strictly within this subject
      const sysScoreLogs = scoreLogs.filter(sl => {
        if (sl.deletedAt) return false;
        if (sl.subjectId && sys.subjectId && String(sl.subjectId) !== String(sys.subjectId)) return false;
        return sl.systemId === sys.id;
      });
      const isSystemCompleted = systemHistory.length > 0 || sysScoreLogs.length > 0;

      if (isSystemCompleted) {
        // Recover missing CurriculumSet
        let topicIds: string[] = [];
        for (const sub of UNIVERSAL_ONTOLOGY) {
          const foundSys = sub.systems.find(s => s.name.toLowerCase() === sys.name.toLowerCase());
          if (foundSys && foundSys.topics.length > 0) {
            topicIds = foundSys.topics.map(t => t.id);
            break;
          }
        }

        const latestCompletion = systemHistory[0]?.completedAt
          ? new Date(systemHistory[0].completedAt)
          : sys.completionDate
          ? new Date(sys.completionDate)
          : sys.lastRevisionDate
          ? new Date(sys.lastRevisionDate)
          : new Date();

        // Calibrate SDSR for the system
        let sysState: Partial<StudySystem> = { ...sys };
        if (sysScoreLogs.length > 0) {
          sysScoreLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          for (const sl of sysScoreLogs) {
            const score = (sl.percentage !== undefined ? sl.percentage : sl.score !== undefined ? sl.score : 70) / 100;
            const logDate = parseDateSafe(sl.timestamp) || new Date();
            const updates = calibrateSystemSDSR(sysState as StudySystem, score, subjectName, 0.70, logDate);
            sysState = { ...sysState, ...updates };
          }
        } else {
          const updates = calibrateSystemSDSR(sysState as StudySystem, 0.70, subjectName, 0.70, latestCompletion);
          sysState = { ...sysState, ...updates };
        }

        await db.systems.update(sys.id, {
          ...sysState,
          updatedAt: new Date()
        });
        repairedCount++;

        const newSet: CurriculumSet = {
          id: `set_${sys.id}_recovered_${generateHLC()}`,
          subjectId: sys.subjectId,
          systemId: Number(sys.id),
          name: sys.name,
          topicIds: topicIds.length > 0 ? topicIds : [`topic_${sys.id}_core`],
          color: 'teal',
          order: 0,
          contentCompleted: sys.contentCompleted || true,
          qbankCompleted: sys.qbankDone || false,
          nextRevisionDate: sysState.nextRevisionDate ? new Date(sysState.nextRevisionDate).toISOString() : new Date(Date.now() + 3 * 86400000).toISOString(),
          lastRevisionDate: sysState.lastRevisionDate ? new Date(sysState.lastRevisionDate).toISOString() : latestCompletion.toISOString(),
          currentRevisionInterval: sysState.currentRevisionInterval || 3,
          revisionCount: sysState.revisionCount || 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          hlc: generateHLC()
        };

        newSetsToAdd.push(newSet);
        repairedSetsCount++;
      } else {
        if (sys.nextRevisionDate || sys.lastRevisionDate || sys.completionDate || sys.contentCompleted || sys.qbankDone) {
          await db.systems.update(sys.id, {
            contentCompleted: false,
            qbankDone: false,
            completionDate: null,
            lastRevisionDate: null,
            nextRevisionDate: null,
            revisionCount: 0,
            updatedAt: new Date()
          });
          repairedCount++;
        }
      }
    } else {
      // Synchronize System dates from its Study Blocks
      const validLastDates = existingSets
        .map(s => parseDateSafe(s.lastRevisionDate))
        .filter(Boolean) as Date[];
      const validNextDates = existingSets
        .map(s => parseDateSafe(s.nextRevisionDate))
        .filter(Boolean) as Date[];

      const latestLast = validLastDates.length > 0
        ? new Date(Math.max(...validLastDates.map(d => d.getTime())))
        : null;

      const earliestNext = validNextDates.length > 0
        ? new Date(Math.min(...validNextDates.map(d => d.getTime())))
        : null;

      const totalRevs = existingSets.reduce((sum, s) => sum + (s.revisionCount || 0), 0);
      const isAnySetCompleted = existingSets.some(s => s.contentCompleted || s.qbankCompleted);

      await db.systems.update(sys.id, {
        contentCompleted: isAnySetCompleted,
        lastRevisionDate: latestLast,
        nextRevisionDate: earliestNext,
        revisionCount: totalRevs,
        updatedAt: new Date()
      });
      repairedCount++;
    }
  }

  if (newSetsToAdd.length > 0) {
    await db.curriculumSets.bulkPut(newSetsToAdd);
  }

  const totalRepaired = repairedCount + repairedSetsCount;
  return {
    repairedCount,
    repairedSetsCount,
    message: totalRepaired > 0
      ? `SDSR recalculated and synchronized ${repairedSetsCount} study block schedules and ${repairedCount} systems from your complete study logs!`
      : 'All SDSR revision dates and intervals are currently synchronized and up to date.'
  };
}

export interface PurgeVaultResult {
  success: boolean;
  message: string;
  summary: {
    subjectsReset: number;
    systemsReset: number;
    tablesPurged: string[];
    modesReset: boolean;
    storagePurged: boolean;
  };
}

/**
 * Permanently purge all study records, scores, schedules, custom topics, operational modes, and smoothing quotas.
 * Restores the application to a pristine, clean starting state with 0% unstudied curriculum.
 */
export async function purgeCompleteDataVault(user: User | null): Promise<PurgeVaultResult> {
  const tableNames = [
    'subjects',
    'systems',
    'curriculumSets',
    'revisionSets',
    'history',
    'pyqYears',
    'scoreLogs',
    'uiPreferences',
    'topicProgress',
    'mistakeLogs',
    'recommendationSkips',
    'operationalModes',
  ];

  // 1. Wipe all local in-memory/Dexie database tables
  await Promise.all([
    db.subjects.clear(),
    db.systems.clear(),
    db.curriculumSets.clear(),
    db.revisionSets.clear(),
    db.history.clear(),
    db.pyqYears.clear(),
    db.scoreLogs.clear(),
    db.uiPreferences.clear(),
    db.topicProgress.clear(),
    db.mistakeLogs.clear(),
    db.recommendationSkips.clear(),
    db.operationalModes.clear(),
  ]);

  // 2. Put fresh default standard operational mode (clearing all smoothing quotas, holiday freezes, sprint states)
  await db.operationalModes.put({
    id: 'current',
    mode: 'standard',
    targetSubjectIds: [],
    targetDate: null,
    dailyCapacityMinutes: 180,
    activatedAt: new Date().toISOString(),
    recalibrationWindowDays: 10,
    previousMode: undefined,
    lastRecalibratedAt: undefined,
    notes: undefined,
    updatedAt: new Date(),
    hlc: generateHLC(),
  });

  // 3. Clear cloud Firestore subcollections if user is logged in
  if (user && firestoreDb) {
    const firestoreCollections = [
      'subjects',
      'systems',
      'curriculumSets',
      'revisionSets',
      'history',
      'pyqYears',
      'scoreLogs',
      'uiPreferences',
      'topicProgress',
      'mistakeLogs',
      'recommendationSkips',
      'operationalModes',
      'customTopics',
      'telemetry_logs',
    ];

    for (const colName of firestoreCollections) {
      try {
        const colRef = collection(firestoreDb, `users/${user.uid}/${colName}`);
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          const docs = snap.docs;
          for (let i = 0; i < docs.length; i += 400) {
            const batch = writeBatch(firestoreDb);
            docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
            await batch.commit();
          }
        }
      } catch (err) {
        console.warn(`[Purge] Firestore cleanup for ${colName} deferred:`, err);
      }
    }

    // Set fresh default operational mode in Firestore
    try {
      const opDoc = doc(firestoreDb, `users/${user.uid}/operationalModes`, 'current');
      await setDoc(opDoc, {
        id: 'current',
        mode: 'standard',
        targetSubjectIds: [],
        targetDate: null,
        dailyCapacityMinutes: 180,
        activatedAt: new Date().toISOString(),
        recalibrationWindowDays: 10,
        updatedAt: new Date(),
        hlc: generateHLC(),
      });
    } catch (err) {
      console.warn('[Purge] Resetting opMode doc in Firestore:', err);
    }
  }

  // 4. Purge localStorage study keys, telemetry, and leases (preserving theme)
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (
        key.startsWith('atlas_s10_') ||
        key.startsWith('atlas_telemetry_') ||
        key.startsWith('atlas_offline_lease_') ||
        key.startsWith('onboarding_completed_') ||
        key === 'atlas_s10_logs' ||
        key === 'atlas_s10_start' ||
        key === 'atlas_exam_profile' ||
        key === 'atlas_pwa_settings' ||
        key === 'pwa_settings' ||
        key.startsWith('invitation_accepted_')
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (err) {
    console.warn('[Purge] LocalStorage cleanup warning:', err);
  }

  // 5. Purge sessionStorage
  try {
    sessionStorage.clear();
  } catch (err) {
    console.warn('[Purge] SessionStorage cleanup warning:', err);
  }

  // 6. Reload clean Universal Ontology (19 MBBS subjects & organ systems initialized to 0%)
  const ontologyResult = await loadUniversalOntology({ force: true });

  // 7. Emit database events across all channels
  tableNames.forEach(tbl => dbEvents.emit('change', tbl));
  dbEvents.emit('change', 'operationalModes');
  dbEvents.emit('change', 'subjects');
  dbEvents.emit('change', 'systems');

  return {
    success: true,
    message: 'Your study workspace and data vault have been completely reset to a clean, empty starting state.',
    summary: {
      subjectsReset: ontologyResult.count || 19,
      systemsReset: 80,
      tablesPurged: tableNames,
      modesReset: true,
      storagePurged: true,
    }
  };
}
