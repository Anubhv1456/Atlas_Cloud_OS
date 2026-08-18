import { db } from '@/db/schema';
import { Subject, StudySystem, CurriculumSet, HistoryEntry, PYQYear, ScoreLog, UIPreference } from '@/db/types';
import { generateHLC } from '@/lib/hlc';
import { normalizeName } from '@/lib/exam-presets';

export interface SubjectProgressScore {
  subjectId: number | string;
  subjectName: string;
  systemCount: number;
  completedSystemsCount: number;
  curriculumSetsCount: number;
  completedSetsCount: number;
  historyCount: number;
  pyqCount: number;
  completedPyqCount: number;
  scoreLogCount: number;
  hasActiveRevisionSchedule: boolean;
  totalProgressScore: number;
}

/**
 * Calculates a comprehensive progress score for a given subject based on all child records:
 * - Systems completed or with revision counts / statuses
 * - Curriculum sets completed
 * - History logs
 * - PYQ logs completed
 * - Score logs
 */
export function evaluateSubjectProgress(
  subject: Subject,
  systems: StudySystem[],
  curriculumSets: CurriculumSet[],
  history: HistoryEntry[],
  pyqYears: PYQYear[],
  scoreLogs: ScoreLog[]
): SubjectProgressScore {
  const subjectId = subject.id!;
  const subSystems = systems.filter(s => s && s.subjectId === subjectId && !s.deletedAt);
  const subSets = curriculumSets.filter(s => s && s.subjectId === subjectId && !s.deletedAt);
  const subHistory = history.filter(h => h && h.subjectId === subjectId && !h.deletedAt);
  const subPyqs = pyqYears.filter(p => p && p.subjectId === subjectId && !p.deletedAt);
  const subScoreLogs = scoreLogs.filter(sc => sc && sc.subjectId === subjectId && !sc.deletedAt);

  const completedSystems = subSystems.filter(s => s.contentCompleted || s.qbankDone || (s.revisionCount && s.revisionCount > 0) || s.status === 'Strong' || s.status === 'Weak');
  const completedSets = subSets.filter(s => s.contentCompleted || s.qbankCompleted || (s.revisionCount && s.revisionCount > 0));
  const completedPyqs = subPyqs.filter(p => p.completed);
  const hasActiveRevision = subSystems.some(s => s.nextRevisionDate) || subSets.some(s => s.nextRevisionDate);

  // Calculate weighted progress score
  // 1. Systems: 10 pts per completed system + 2 pts per system present
  // 2. Curriculum Sets: 15 pts per completed set + 3 pts per set present
  // 3. History: 5 pts per history session completed
  // 4. PYQ: 10 pts per solved year
  // 5. Score logs: 5 pts per log
  // 6. Active revision schedule: 20 pts
  const totalProgressScore = 
    (completedSystems.length * 10) +
    (subSystems.length * 2) +
    (completedSets.length * 15) +
    (subSets.length * 3) +
    (subHistory.length * 5) +
    (completedPyqs.length * 10) +
    (subScoreLogs.length * 5) +
    (hasActiveRevision ? 20 : 0);

  return {
    subjectId,
    subjectName: subject.name,
    systemCount: subSystems.length,
    completedSystemsCount: completedSystems.length,
    curriculumSetsCount: subSets.length,
    completedSetsCount: completedSets.length,
    historyCount: subHistory.length,
    pyqCount: subPyqs.length,
    completedPyqCount: completedPyqs.length,
    scoreLogCount: subScoreLogs.length,
    hasActiveRevisionSchedule: hasActiveRevision,
    totalProgressScore
  };
}

export interface DuplicateSubjectGroup {
  normalizedName: string;
  displayName: string;
  subjects: Subject[];
  evaluations: SubjectProgressScore[];
  keeperSubject: Subject;
  keeperScore: SubjectProgressScore;
  duplicateSubjects: Subject[];
}

/**
 * Scans the database and finds any duplicate subjects (matching by normalized name).
 */
export async function findDuplicateSubjectGroups(): Promise<DuplicateSubjectGroup[]> {
  const subjects = await db.subjects.toArray().then(res => res.filter(s => !s.deletedAt));
  const systems = await db.systems.toArray().then(res => res.filter(s => !s.deletedAt));
  const setsTable = db.curriculumSets || db.revisionSets;
  const curriculumSets = setsTable ? await setsTable.toArray().then(res => res.filter(s => !s.deletedAt)) : [];
  const history = await db.history.toArray().then(res => res.filter(h => !h.deletedAt));
  const pyqYears = await db.pyqYears.toArray().then(res => res.filter(p => !p.deletedAt));
  const scoreLogs = await db.scoreLogs.toArray().then(res => res.filter(s => !s.deletedAt));

  const groupsByNormName = new Map<string, Subject[]>();

  for (const sub of subjects) {
    if (!sub || !sub.name) continue;
    const norm = normalizeName(sub.name);
    const list = groupsByNormName.get(norm) || [];
    list.push(sub);
    groupsByNormName.set(norm, list);
  }

  const duplicateGroups: DuplicateSubjectGroup[] = [];

  for (const [norm, subList] of groupsByNormName.entries()) {
    if (subList.length <= 1) continue;

    // Evaluate each subject's progress
    const evals = subList.map(sub => 
      evaluateSubjectProgress(sub, systems, curriculumSets, history, pyqYears, scoreLogs)
    );

    // Sort evaluations to pick the keeper:
    // 1. Highest totalProgressScore
    // 2. Highest completedSetsCount
    // 3. Highest systemCount
    // 4. Oldest createdAt
    evals.sort((a, b) => {
      if (b.totalProgressScore !== a.totalProgressScore) {
        return b.totalProgressScore - a.totalProgressScore;
      }
      if (b.completedSetsCount !== a.completedSetsCount) {
        return b.completedSetsCount - a.completedSetsCount;
      }
      if (b.systemCount !== a.systemCount) {
        return b.systemCount - a.systemCount;
      }
      const subA = subList.find(s => s.id === a.subjectId);
      const subB = subList.find(s => s.id === b.subjectId);
      const timeA = subA?.createdAt ? new Date(subA.createdAt).getTime() : 0;
      const timeB = subB?.createdAt ? new Date(subB.createdAt).getTime() : 0;
      return timeA - timeB;
    });

    const keeperScore = evals[0];
    const keeperSubject = subList.find(s => s.id === keeperScore.subjectId)!;
    const duplicateSubjects = subList.filter(s => s.id !== keeperScore.subjectId);

    duplicateGroups.push({
      normalizedName: norm,
      displayName: keeperSubject.name,
      subjects: subList,
      evaluations: evals,
      keeperSubject,
      keeperScore,
      duplicateSubjects
    });
  }

  return duplicateGroups;
}

export interface MergeDeduplicateResult {
  mergedSubjectsCount: number;
  reassignedSystemsCount: number;
  reassignedSetsCount: number;
  reassignedHistoryCount: number;
  reassignedPyqsCount: number;
  reassignedScoreLogsCount: number;
  details: string[];
}

/**
 * Actively merges and removes duplicate subjects safely:
 * - Keeps the subject with the highest logged progress.
 * - Migrates any child systems, curriculum sets, history, pyqs, and score logs from the duplicate
 *   to the keeper subject so NO progress is ever lost.
 * - De-duplicates redundant empty systems if an equivalent system with progress already exists on the keeper.
 * - Soft-deletes or purges the empty duplicate subjects.
 */
export async function mergeAndDeduplicateAllSubjects(): Promise<MergeDeduplicateResult> {
  const groups = await findDuplicateSubjectGroups();
  if (groups.length === 0) {
    return {
      mergedSubjectsCount: 0,
      reassignedSystemsCount: 0,
      reassignedSetsCount: 0,
      reassignedHistoryCount: 0,
      reassignedPyqsCount: 0,
      reassignedScoreLogsCount: 0,
      details: []
    };
  }

  let totalMergedSubjects = 0;
  let totalReassignedSystems = 0;
  let totalReassignedSets = 0;
  let totalReassignedHistory = 0;
  let totalReassignedPyqs = 0;
  let totalReassignedScoreLogs = 0;
  const details: string[] = [];

  const setsTable = db.curriculumSets || db.revisionSets;

  await db.transaction('rw', [
    db.subjects,
    db.systems,
    db.curriculumSets,
    db.history,
    db.pyqYears,
    db.scoreLogs,
    db.uiPreferences
  ], async () => {
    const now = new Date();
    const hlc = generateHLC();

    for (const group of groups) {
      const keeperId = group.keeperSubject.id!;
      const keeperName = group.keeperSubject.name;

      // Existing systems under the keeper subject
      const keeperSystems = await db.systems.where('subjectId').equals(keeperId).toArray().then(res => res.filter(s => !s.deletedAt));
      const keeperSystemNormMap = new Map<string, StudySystem>();
      keeperSystems.forEach(sys => {
        keeperSystemNormMap.set(normalizeName(sys.name), sys);
      });

      for (const dupSub of group.duplicateSubjects) {
        const dupId = dupSub.id!;
        totalMergedSubjects++;

        // 1. Reassign or Merge Systems
        const dupSystems = await db.systems.where('subjectId').equals(dupId).toArray().then(res => res.filter(s => !s.deletedAt));

        for (const sys of dupSystems) {
          const sysNorm = normalizeName(sys.name);
          const existingKeeperSys = keeperSystemNormMap.get(sysNorm);

          if (existingKeeperSys && existingKeeperSys.id !== sys.id) {
            // Re-point child curriculum sets, history, score logs from sys.id to existingKeeperSys.id
            if (setsTable) {
              await setsTable.where('systemId').equals(sys.id!).modify({
                subjectId: keeperId,
                systemId: existingKeeperSys.id!,
                updatedAt: now,
                hlc
              });
            }
            await db.history.where('systemId').equals(sys.id!).modify({
              subjectId: keeperId,
              systemId: existingKeeperSys.id!,
              subjectName: keeperName,
              updatedAt: now,
              hlc
            });
            await db.scoreLogs.where('systemId').equals(sys.id!).modify({
              subjectId: keeperId,
              systemId: existingKeeperSys.id!,
              updatedAt: now,
              hlc
            });

            // If the duplicate system had completion or revision schedule but keeper didn't, adopt it!
            if ((sys.contentCompleted || sys.qbankDone || (sys.revisionCount && sys.revisionCount > 0)) &&
                (!existingKeeperSys.contentCompleted && !existingKeeperSys.qbankDone)) {
              await db.systems.update(existingKeeperSys.id!, {
                contentCompleted: sys.contentCompleted || existingKeeperSys.contentCompleted,
                qbankDone: sys.qbankDone || existingKeeperSys.qbankDone,
                revisionCount: Math.max(sys.revisionCount || 0, existingKeeperSys.revisionCount || 0),
                nextRevisionDate: existingKeeperSys.nextRevisionDate || sys.nextRevisionDate,
                lastRevisionDate: existingKeeperSys.lastRevisionDate || sys.lastRevisionDate,
                status: existingKeeperSys.status === 'Average' && sys.status !== 'Average' ? sys.status : existingKeeperSys.status,
                updatedAt: now,
                hlc
              });
            }

            // Mark the redundant system deleted
            await db.systems.update(sys.id!, { deletedAt: now, updatedAt: now, hlc });
            await db.uiPreferences.delete(`system:${sys.id}`);
            totalReassignedSystems++;
          } else {
            // Move system directly to keeper subject
            await db.systems.update(sys.id!, {
              subjectId: keeperId,
              updatedAt: now,
              hlc
            });
            keeperSystemNormMap.set(sysNorm, sys);
            totalReassignedSystems++;
          }
        }

        // 2. Reassign Curriculum Sets directly under dupId
        if (setsTable) {
          const setsCount = await setsTable.where('subjectId').equals(dupId).count();
          if (setsCount > 0) {
            await setsTable.where('subjectId').equals(dupId).modify({
              subjectId: keeperId,
              updatedAt: now,
              hlc
            });
            totalReassignedSets += setsCount;
          }
        }

        // 3. Reassign History entries under dupId
        const histCount = await db.history.where('subjectId').equals(dupId).count();
        if (histCount > 0) {
          await db.history.where('subjectId').equals(dupId).modify({
            subjectId: keeperId,
            subjectName: keeperName,
            updatedAt: now,
            hlc
          });
          totalReassignedHistory += histCount;
        }

        // 4. Reassign PYQ Years under dupId
        const dupPyqs = await db.pyqYears.where('subjectId').equals(dupId).toArray().then(res => res.filter(p => !p.deletedAt));
        const keeperPyqs = await db.pyqYears.where('subjectId').equals(keeperId).toArray().then(res => res.filter(p => !p.deletedAt));
        const keeperPyqYearsSet = new Set(keeperPyqs.map(p => p.year.trim().toLowerCase()));

        for (const pyq of dupPyqs) {
          if (keeperPyqYearsSet.has(pyq.year.trim().toLowerCase())) {
            // Redundant duplicate year, soft delete
            await db.pyqYears.update(pyq.id!, { deletedAt: now, updatedAt: now, hlc });
          } else {
            // Migrate to keeper
            await db.pyqYears.update(pyq.id!, {
              subjectId: keeperId,
              updatedAt: now,
              hlc
            });
            keeperPyqYearsSet.add(pyq.year.trim().toLowerCase());
            totalReassignedPyqs++;
          }
        }

        // 5. Reassign Score Logs
        const scoreCount = await db.scoreLogs.where('subjectId').equals(dupId).count();
        if (scoreCount > 0) {
          await db.scoreLogs.where('subjectId').equals(dupId).modify({
            subjectId: keeperId,
            updatedAt: now,
            hlc
          });
          totalReassignedScoreLogs += scoreCount;
        }

        // 6. Delete the duplicate subject record and its preference
        await db.subjects.update(dupId, { deletedAt: now, updatedAt: now, hlc });
        await db.uiPreferences.delete(`subject:${dupId}`);
      }

      details.push(`Preserved progress for "${keeperName}" and merged ${group.duplicateSubjects.length} duplicate copy(ies).`);
    }
  });

  return {
    mergedSubjectsCount: totalMergedSubjects,
    reassignedSystemsCount: totalReassignedSystems,
    reassignedSetsCount: totalReassignedSets,
    reassignedHistoryCount: totalReassignedHistory,
    reassignedPyqsCount: totalReassignedPyqs,
    reassignedScoreLogsCount: totalReassignedScoreLogs,
    details
  };
}
