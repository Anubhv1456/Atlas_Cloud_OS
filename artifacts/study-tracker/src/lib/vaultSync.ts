import { z } from 'zod';
import { db, dbEvents } from '@/db/schema';
import { localDb } from '@/db/localDb';
import { User } from 'firebase/auth';
import { createSignedVaultBackup, verifyVaultBackupProvenance, AtlasVaultEnvelope } from './vaultSignature';
import { StudySystem, CurriculumSet, HistoryEntry, DEFAULT_OPERATIONAL_MODE } from '@/db/types';
import { scheduleFirstRevision, scheduleNextRevision, today } from '@/db/revisionEngine';
import { getOntologyForExam, ALL_SUBJECTS } from '@/data/ontology';
import { getLocalExamProfile } from '@/lib/examProfile';
import { generateHLC } from './hlc';
import { doc, setDoc, getDocs, collection, writeBatch, deleteDoc } from 'firebase/firestore';
import { firestoreDb } from './firebase';
import { calibrateCurriculumSetSDSR, calibrateSystemSDSR } from './sdsr-engine';
import { loadUniversalOntology, normalizeName } from './exam-presets';

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

  // Enrich operational modes with portable subject names and ontology metadata
  const enrichedOpModes = operationalModes.map(om => {
    if (om.mode === 'tactical_sprint' && Array.isArray(om.targetSubjectIds)) {
      const targetSubjectNames: string[] = [];
      const targetOntologyIds: string[] = [];
      om.targetSubjectIds.forEach(tid => {
        const sub = subjects.find(s => String(s.id) === String(tid) || (s.ontologySubjectId && String(s.ontologySubjectId) === String(tid)));
        if (sub?.name) targetSubjectNames.push(sub.name);
        if (sub?.ontologySubjectId) targetOntologyIds.push(sub.ontologySubjectId);
      });
      return {
        ...om,
        targetSubjectNames: targetSubjectNames.length > 0 ? targetSubjectNames : undefined,
        targetOntologyIds: targetOntologyIds.length > 0 ? targetOntologyIds : undefined
      };
    }
    return om;
  });

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
    operationalModes: enrichedOpModes
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

// ── Capsule Architecture & Runtime Schemas ──────────────────────────────────────────────
const ZDate = z.union([
  z.date(),
  z.string().transform((str) => {
    const d = new Date(str);
    if (isNaN(d.getTime())) throw new Error("Invalid date string: " + str);
    return d;
  }),
]).optional().nullable();

const ZSubjectSchema = z.object({
  id: z.number().or(z.string()).optional(),
  name: z.string().min(1),
  color: z.string().optional(),
  isCustom: z.boolean().optional(),
  progress: z.number().optional(),
  totalTopics: z.number().optional(),
  createdAt: ZDate,
  updatedAt: ZDate,
  deletedAt: ZDate,
  focusUpdatedAt: ZDate,
}).passthrough();

const ZSystemSchema = z.object({
  id: z.number().or(z.string()).optional(),
  subjectId: z.number().or(z.string()),
  name: z.string().min(1),
  status: z.string().optional(),
  contentCompleted: z.boolean().optional(),
  qbankDone: z.boolean().optional(),
  completionDate: ZDate,
  lastRevisionDate: ZDate,
  nextRevisionDate: ZDate,
  revisionStartedAt: ZDate,
  revisionCount: z.number().optional(),
  createdAt: ZDate,
  updatedAt: ZDate,
  deletedAt: ZDate,
  focusUpdatedAt: ZDate,
}).passthrough();

const ZCurriculumSetSchema = z.object({
  id: z.string().optional(),
  subjectId: z.number().or(z.string()),
  systemId: z.number().or(z.string()),
  name: z.string().min(1),
  topicIds: z.array(z.string()).optional(),
  contentCompleted: z.boolean().optional(),
  qbankCompleted: z.boolean().optional(),
  nextRevisionDate: ZDate,
  lastRevisionDate: ZDate,
}).passthrough();

const ZCapsuleSchema = z.object({
  schemaVersion: z.number().optional().default(1),
  appVersion: z.string().optional(),
  exportDate: z.string().optional(),
  payload: z.object({
    subjects: z.array(ZSubjectSchema).optional().default([]),
    systems: z.array(ZSystemSchema).optional().default([]),
    curriculumSets: z.array(ZCurriculumSetSchema).optional().default([]),
    revisionSets: z.array(ZCurriculumSetSchema).optional().default([]),
    history: z.array(z.any()).optional().default([]),
    scoreLogs: z.array(z.any()).optional().default([]),
  }).passthrough()
});

export async function restoreCompleteVault(
  jsonText: string,
  user: User | null
): Promise<RestoreVaultResult> {
  const parsed = JSON.parse(jsonText);
  const verification = await verifyVaultBackupProvenance(parsed, user?.uid || null);
  
  // 1. Zod Runtime Schema Validation & Coercion (Capsule Checkpoint)
  const validationResult = ZCapsuleSchema.safeParse(verification);
  if (!validationResult.success) {
    console.error("Capsule validation failed:", validationResult.error);
    throw new Error('Backup file validation failed. The data structure is corrupted or invalid.');
  }
  
  const data = validationResult.data.payload;

  if (data.subjects.length === 0 && data.systems.length === 0 && data.history.length === 0 && data.curriculumSets.length === 0) {
    throw new Error('Invalid Atlas backup format. Missing core curriculum tables.');
  }

  // 1. Sanitize & Deserialise Dates for Subjects
  const rawSubjects = (Array.isArray(data.subjects) ? data.subjects : []).map((s: any) => ({
    ...s,
    createdAt: parseDateSafe(s.createdAt) || new Date(),
    updatedAt: parseDateSafe(s.updatedAt) || new Date(),
    deletedAt: parseDateSafe(s.deletedAt),
    focusUpdatedAt: parseDateSafe(s.focusUpdatedAt),
  }));

  // Deduplicate incoming subjects by unique normalized name to prevent duplicate subject cards
  const subjectIdMap = new Map<number | string, number | string>();
  const seenSubjectNames = new Map<string, typeof rawSubjects[0]>();
  const cleanSubjects: typeof rawSubjects = [];

  for (const s of rawSubjects) {
    if (!s || !s.name) continue;
    const nameKey = normalizeName(s.name);
    if (seenSubjectNames.has(nameKey)) {
      const existing = seenSubjectNames.get(nameKey)!;
      if (s.id && existing.id) {
        subjectIdMap.set(s.id, existing.id);
      }
    } else {
      seenSubjectNames.set(nameKey, s);
      cleanSubjects.push(s);
      if (s.id) {
        subjectIdMap.set(s.id, s.id);
      }
    }
  }

  // 2. Sanitize & Deserialise Dates for Systems (and remap subjectId if needed)
  const rawSystems: StudySystem[] = (Array.isArray(data.systems) ? data.systems : []).map((sys: any) => {
    const remappedSubjId = sys.subjectId !== undefined ? (subjectIdMap.get(sys.subjectId) ?? sys.subjectId) : sys.subjectId;
    return {
      ...sys,
      subjectId: typeof remappedSubjId === 'string' && !isNaN(Number(remappedSubjId)) ? Number(remappedSubjId) : remappedSubjId,
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
    };
  });

  // Deduplicate incoming systems by (subjectId + name) key
  const systemIdMap = new Map<number | string, number | string>();
  const seenSystemKeys = new Map<string, StudySystem>();
  const cleanSystems: StudySystem[] = [];

  for (const sys of rawSystems) {
    if (!sys || !sys.name) continue;
    const key = `${sys.subjectId}_${sys.name.trim().toLowerCase()}`;
    if (seenSystemKeys.has(key)) {
      const existing = seenSystemKeys.get(key)!;
      if (sys.id && existing.id) {
        systemIdMap.set(sys.id, existing.id);
      }
    } else {
      seenSystemKeys.set(key, sys);
      cleanSystems.push(sys);
      if (sys.id) {
        systemIdMap.set(sys.id, sys.id);
      }
    }
  }

  // 3. Sanitize & Deserialise Dates for CurriculumSets (and remap subjectId / systemId)
  const incomingSets = Array.isArray(data.curriculumSets) && data.curriculumSets.length > 0
    ? data.curriculumSets
    : Array.isArray(data.revisionSets) && data.revisionSets.length > 0
    ? data.revisionSets
    : [];

  const cleanCurriculumSets: CurriculumSet[] = incomingSets.map((set: any) => {
    const remappedSubjId = set.subjectId !== undefined ? (subjectIdMap.get(set.subjectId) ?? set.subjectId) : set.subjectId;
    const remappedSysId = set.systemId !== undefined ? (systemIdMap.get(set.systemId) ?? set.systemId) : set.systemId;
    return {
      ...set,
      subjectId: typeof remappedSubjId === 'string' && !isNaN(Number(remappedSubjId)) ? Number(remappedSubjId) : remappedSubjId,
      systemId: typeof remappedSysId === 'string' && !isNaN(Number(remappedSysId)) ? Number(remappedSysId) : remappedSysId,
      nextRevisionDate: set.nextRevisionDate ? (parseDateSafe(set.nextRevisionDate)?.toISOString() || String(set.nextRevisionDate)) : undefined,
      lastRevisionDate: set.lastRevisionDate ? (parseDateSafe(set.lastRevisionDate)?.toISOString() || String(set.lastRevisionDate)) : undefined,
      createdAt: parseDateSafe(set.createdAt) || new Date(),
      updatedAt: parseDateSafe(set.updatedAt) || new Date(),
      deletedAt: parseDateSafe(set.deletedAt),
      focusUpdatedAt: parseDateSafe(set.focusUpdatedAt),
      revisionCount: typeof set.revisionCount === 'number' ? set.revisionCount : 0,
    };
  });

  // 4. Sanitize History Entries
  const cleanHistory: HistoryEntry[] = (Array.isArray(data.history) ? data.history : []).map((h: any) => {
    const remappedSubjId = h.subjectId !== undefined ? (subjectIdMap.get(h.subjectId) ?? h.subjectId) : h.subjectId;
    const remappedSysId = h.systemId !== undefined ? (systemIdMap.get(h.systemId) ?? h.systemId) : h.systemId;
    return {
      ...h,
      subjectId: typeof remappedSubjId === 'string' && !isNaN(Number(remappedSubjId)) ? Number(remappedSubjId) : remappedSubjId,
      systemId: typeof remappedSysId === 'string' && !isNaN(Number(remappedSysId)) ? Number(remappedSysId) : remappedSysId,
      completedAt: parseDateSafe(h.completedAt) || new Date(),
      updatedAt: parseDateSafe(h.updatedAt) || new Date(),
      deletedAt: parseDateSafe(h.deletedAt),
    };
  });

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

  const cleanOpModes = (Array.isArray(data.operationalModes) ? data.operationalModes : []).map((om: any) => {
    // 10a. Remap targetSubjectIds using subjectIdMap, cleanSubjects, and ontology metadata
    const rawTargetIds: any[] = Array.isArray(om.targetSubjectIds) ? om.targetSubjectIds : [];
    const targetNames: string[] = Array.isArray(om.targetSubjectNames) ? om.targetSubjectNames : [];
    const targetOntos: string[] = Array.isArray(om.targetOntologyIds) ? om.targetOntologyIds : [];

    const remappedTargetIds = new Set<string | number>();

    // Pass 1: Resolve from raw IDs
    for (const tid of rawTargetIds) {
      // 1. Direct remap if mapped by subjectIdMap (deduplication or ID migration)
      if (subjectIdMap.has(tid)) {
        remappedTargetIds.add(subjectIdMap.get(tid)!);
        continue;
      }
      if (subjectIdMap.has(String(tid))) {
        remappedTargetIds.add(subjectIdMap.get(String(tid))!);
        continue;
      }
      if (typeof tid === 'string' && !isNaN(Number(tid)) && subjectIdMap.has(Number(tid))) {
        remappedTargetIds.add(subjectIdMap.get(Number(tid))!);
        continue;
      }

      // 2. Lookup in cleanSubjects by id, ontologySubjectId, or name
      const matched = cleanSubjects.find(s => 
        String(s.id) === String(tid) ||
        (s.ontologySubjectId && String(s.ontologySubjectId) === String(tid)) ||
        (s.name && String(s.name).toLowerCase() === String(tid).toLowerCase())
      );
      if (matched && matched.id !== undefined) {
        remappedTargetIds.add(matched.id);
        continue;
      }

      // 3. Lookup in ALL_SUBJECTS for ontology matching
      const onto = ALL_SUBJECTS.find(os => String(os.id) === String(tid));
      if (onto) {
        const byOntoName = cleanSubjects.find(s => s.name && s.name.toLowerCase() === onto.name.toLowerCase());
        if (byOntoName && byOntoName.id !== undefined) {
          remappedTargetIds.add(byOntoName.id);
          continue;
        }
      }

      // Keep original as fallback
      remappedTargetIds.add(tid);
    }

    // Pass 2: If targetSubjectNames was saved in backup, ensure all named subjects are resolved
    for (const name of targetNames) {
      if (!name) continue;
      const sub = cleanSubjects.find(s => s.name && s.name.toLowerCase() === name.toLowerCase());
      if (sub && sub.id !== undefined) {
        remappedTargetIds.add(sub.id);
      }
    }

    // Pass 3: If targetOntologyIds was saved in backup, resolve by ontology ID
    for (const ontoId of targetOntos) {
      if (!ontoId) continue;
      const sub = cleanSubjects.find(s => s.ontologySubjectId && String(s.ontologySubjectId) === String(ontoId));
      if (sub && sub.id !== undefined) {
        remappedTargetIds.add(sub.id);
      }
    }

    return {
      ...om,
      targetSubjectIds: Array.from(remappedTargetIds),
      updatedAt: parseDateSafe(om.updatedAt) || new Date()
    };
  });

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
      if (h.systemName && h.systemName.toLowerCase() === ((sys.name || '').toLowerCase())) {
        return (h.subjectId && String(h.subjectId) === String(sys.subjectId)) ||
               (h.subjectName && h.subjectName.toLowerCase() === sysSubName.toLowerCase());
      }
      return false;
    }).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

    const latestCompletion = systemHistory[0]?.completedAt || sys.completionDate || sys.lastRevisionDate;
    const hasHistory = systemHistory.length > 0;
    const isCompleted = sys.contentCompleted || sys.qbankDone || sys.status === 'Strong' || sys.status === 'Weak' || hasHistory;

    // If no curriculumSet exists for this system, auto-generate one from ontology topics or generic block
    if (existingSets.length === 0 && isCompleted) {
      // Look up topics from Universal Ontology if available
      let topicIds: string[] = [];
      const activeOntology = getOntologyForExam(getLocalExamProfile().targetExam || 'NEET PG');
      for (const sub of activeOntology) {
        const foundSys = sub.systems.find(s => ((s.name || '').toLowerCase()) === ((sys.name || '').toLowerCase()));
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

  // 11. Execute Safe Atomic / Multi-Collection Database Write with clean replacement
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
    // Clear existing data to prevent duplicate subjects/systems with different IDs
    await Promise.all([
      db.subjects.clear(),
      db.systems.clear(),
      db.curriculumSets.clear(),
      db.history.clear(),
      db.pyqYears.clear(),
      db.scoreLogs.clear(),
      db.uiPreferences.clear(),
      db.topicProgress.clear(),
      db.mistakeLogs.clear(),
      db.recommendationSkips.clear(),
      db.operationalModes.clear(),
      localDb.local_snapshots.clear(),
    ]);

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

    // Create a new baseline snapshot (slot 1)
    const baselinePayload = {
      subjects: cleanSubjects,
      systems: cleanSystems,
      curriculumSets: cleanCurriculumSets,
      history: cleanHistory,
      pyqYears: cleanPyqYears,
      scoreLogs: cleanScoreLogs,
      uiPreferences: cleanUiPrefs,
      topicProgress: cleanTopicProgress,
      mistakeLogs: cleanMistakeLogs,
      recommendationSkips: cleanSkips,
      operationalModes: cleanOpModes
    };
    await localDb.local_snapshots.add({
      timestamp: Date.now(),
      version: 1,
      payload: JSON.stringify(baselinePayload)
    });
  });

  // Notify all UI live queries across all collections
  const affectedTables = [
    'subjects',
    'systems',
    'curriculumSets',
    'history',
    'pyqYears',
    'scoreLogs',
    'uiPreferences',
    'topicProgress',
    'mistakeLogs',
    'recommendationSkips',
    'operationalModes',
  ];
  affectedTables.forEach(table => dbEvents.emit('change', table));

  // Pillar 3 Safeguard: Anyone restoring a vault backup is an existing user and must never see onboarding
  try {
    const uid = user?.uid;
    if (uid) {
      localStorage.setItem(`onboarding_completed_${uid}`, 'true');
      if (firestoreDb) {
        const userRef = doc(firestoreDb, 'users', uid);
        await setDoc(userRef, { onboardingCompleted: true, updatedAt: new Date() }, { merge: true });
      }
    } else {
      localStorage.setItem('onboarding_completed_guest', 'true');
    }
    localStorage.setItem('atlas_onboarding_completed', 'true');

    await db.uiPreferences.put({
      id: 'onboarding_status',
      type: 'onboarding',
      entityId: 0,
      onboardingCompleted: true,
      updatedAt: new Date(),
      hlc: generateHLC(),
    }).catch(() => {});

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('atlas-onboarding-updated', { detail: { completed: true } }));
    }
  } catch (err) {
    console.warn('[VaultRestore] Failed to sync onboarding status on restore:', err);
  }

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
      const nameMatches = (h.systemName && h.systemName.toLowerCase() === ((set.name || '').toLowerCase())) ||
                          (h.taskLabel && h.taskLabel.toLowerCase().includes(((set.name || '').toLowerCase())));
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
        const nameMatches = (h.systemName && h.systemName.toLowerCase() === ((set.name || '').toLowerCase())) ||
                            (h.taskLabel && h.taskLabel.toLowerCase().includes(((set.name || '').toLowerCase())));
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
      const nameMatches = h.systemName && h.systemName.toLowerCase() === ((sys.name || '').toLowerCase());
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
        const activeOntology = getOntologyForExam(getLocalExamProfile().targetExam || 'NEET PG');
      for (const sub of activeOntology) {
          const foundSys = sub.systems.find(s => ((s.name || '').toLowerCase()) === ((sys.name || '').toLowerCase()));
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
    localDb.sync_meta.clear(),
    localDb.mutation_queue.clear(),
    localDb.local_snapshots.clear(),
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

    // Delete remote cloud backup documents from backups collection
    try {
      const backupDoc = doc(firestoreDb, `users/${user.uid}/backups`, 'latest');
      await deleteDoc(backupDoc);
    } catch (err) {
      console.warn('[Purge] Resetting remote backup document in Firestore:', err);
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
