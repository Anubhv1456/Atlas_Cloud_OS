import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from './schema';
import { Subject, StudySystem, HistoryEntry, PYQYear, ScoreLog, OperationalModeRecord, DEFAULT_OPERATIONAL_MODE } from './types';
import { SystemStatus } from './types';
import { scheduleFirstRevision, scheduleNextRevision, isRevisionDue, today, sortSystemsByRevisionPriority, calculateDurationMultiplier, getActiveRevisionSystems } from './revisionEngine';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { generateHLC } from '../lib/hlc';
export function useSubjects() {
  return useLiveQuery(async () => {
    const subjects = await db.subjects.toArray().then(res => res.filter(s => !s.deletedAt));
    const prefs = await db.uiPreferences.where('type').equals('subject').toArray();
    return subjects.map(s => {
      const p = prefs.find(p => p.entityId === s.id);
      return {
        ...s,
        order: p?.order ?? s.id ?? 0,
        focus: p?.focus ?? null,
        focusUpdatedAt: p?.focusUpdatedAt ?? null
      };
    }).sort((a, b) => (a.order ?? a.id ?? 0) - (b.order ?? b.id ?? 0));
  }) ?? [];
}

export function useSubject(id: number | string) {
  return useLiveQuery(async () => {
    let sub = await db.subjects.get(id);
    if (!sub || sub.deletedAt) {
      if (!isNaN(Number(id))) {
        sub = await db.subjects.get(Number(id));
      }
    }
    if (!sub || sub.deletedAt) {
      const all = await db.subjects.toArray().then(res => res.filter(s => !s.deletedAt));
      const strId = String(id).toLowerCase();
      sub = all.find(s => 
        String(s.id).toLowerCase() === strId ||
        (s.ontologySubjectId && String(s.ontologySubjectId).toLowerCase() === strId) ||
        (s.name && s.name.toLowerCase() === strId) ||
        (s.name && s.name.toLowerCase().replace(/[^a-z0-9]/g, '') === strId.replace(/[^a-z0-9]/g, ''))
      );
    }
    if (!sub || sub.deletedAt) return undefined;
    const p = await db.uiPreferences.get(`subject:${sub.id}`);
    return {
      ...sub,
      order: p?.order ?? sub.id ?? 0,
      focus: p?.focus ?? null,
      focusUpdatedAt: p?.focusUpdatedAt ?? null
    };
  }, [id]);
}

export function useSystemsBySubject(subjectId: number | string) {
  return useLiveQuery(async () => {
    const systems = await db.systems.where('subjectId').equals(subjectId).toArray().then(res => res.filter(s => !s.deletedAt));
    const prefs = await db.uiPreferences.where('type').equals('system').toArray();
    return systems.map(s => {
      const p = prefs.find(p => p.entityId === s.id);
      return {
        ...s,
        order: p?.order ?? s.id ?? 0,
        focus: p?.focus ?? null,
        focusUpdatedAt: p?.focusUpdatedAt ?? null
      };
    });
  }, [subjectId]) ?? [];
}

export function useAllSystems() {
  return useLiveQuery(async () => {
    const systems = await db.systems.toArray().then(res => res.filter(s => !s.deletedAt));
    const prefs = await db.uiPreferences.where('type').equals('system').toArray();
    return systems.map(s => {
      const p = prefs.find(p => p.entityId === s.id);
      return {
        ...s,
        order: p?.order ?? s.id ?? 0,
        focus: p?.focus ?? null,
        focusUpdatedAt: p?.focusUpdatedAt ?? null
      };
    });
  }) ?? [];
}

export function useSystem(id: number) {
  return useLiveQuery(async () => {
    const sys = await db.systems.get(id);
    if (!sys || sys.deletedAt) return undefined;
    const p = await db.uiPreferences.get(`system:${id}`);
    return {
      ...sys,
      order: p?.order ?? sys.id ?? 0,
      focus: p?.focus ?? null,
        focusUpdatedAt: p?.focusUpdatedAt ?? null
    };
  }, [id]);
}

export function useHistory() {
  return useLiveQuery(() => db.history.orderBy('completedAt').reverse().toArray().then(res => res.filter(h => !h.deletedAt))) ?? [];
}

export function useHistoryByMonth(year: number, month: number) {
  return useLiveQuery(() => {
    const start = new Date(year, month, 1);
    const end   = new Date(year, month + 1, 1);
    return db.history
      .where('completedAt')
      .between(start, end, true, false)
      .reverse()
      .toArray().then(res => res.filter(h => !h.deletedAt));
  }, [year, month]) ?? [];
}

export function useEarliestHistoryDate(): Date | null {
  return useLiveQuery(async () => {
    const entry = await db.history.orderBy('completedAt').toArray().then(res => res[0]);
    return entry ? new Date(entry.completedAt) : null;
  }) ?? null;
}

/** All systems that have a revision due today or overdue. */
export function useRevisionsDue(): StudySystem[] {
  const systems = useLiveQuery(() => db.systems.toArray()) ?? [];
  const now = today();
  return systems.filter(s => isRevisionDue(s, [], now));
}

/** Systems currently in active multi-day revision. */
export function useActiveRevisions(): StudySystem[] {
  return useLiveQuery(() => db.systems.where('revisionState').equals('in_progress').toArray()) ?? [];
}

/** All PYQ years for a specific subject, ordered by year label. */
export function usePYQsBySubject(subjectId: number | string): PYQYear[] {
  return useLiveQuery(
    () => db.pyqYears.where('subjectId').equals(subjectId).toArray().then(arr => arr.sort((a, b) => Number(a.year) - Number(b.year))),
    [subjectId],
  ) ?? [];
}

/** All PYQ years across all subjects. */
export function useAllPYQs(): PYQYear[] {
  return useLiveQuery(() => db.pyqYears.toArray().then(res => res.filter(p => !p.deletedAt))) ?? [];
}

/** All score logs for a specific subject. */
export function useScoreLogsBySubject(subjectId: number | string): ScoreLog[] {
  return useLiveQuery(
    () => db.scoreLogs.where('subjectId').equals(subjectId).toArray(),
    [subjectId]
  ) ?? [];
}

// ── Actions ────────────────────────────────────────────────────────────────

export function useCurrentStreak(): number {
  return useLiveQuery(async () => {
    const history = await db.history.orderBy('completedAt').reverse().toArray().then(res => res.filter(h => !h.deletedAt));
    if (history.length === 0) return 0;

    const opMode = await db.operationalModes.get('current');
    const isHoliday = opMode?.mode === 'holiday';

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    if (isHoliday && opMode?.activatedAt) {
      // Streak is frozen at holiday activation date
      currentDate = new Date(opMode.activatedAt);
      currentDate.setHours(0, 0, 0, 0);
    }

    const dates = new Set(history.map(entry => {
      const d = new Date(entry.completedAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }));

    // Check if there is an entry for reference date. If not, check the day before.
    let timeToCheck = currentDate.getTime();
    if (!dates.has(timeToCheck)) {
      timeToCheck -= 86400000;
      if (!dates.has(timeToCheck)) {
        return 0; // Missed prior days
      }
    }

    while (dates.has(timeToCheck)) {
      streak++;
      timeToCheck -= 86400000; // Move back one day
    }
    return streak;
  }) ?? 0;
}

export async function getDaysSinceLastStudy(): Promise<number> {
  const latestLog = await db.scoreLogs.orderBy('timestamp').reverse().toArray().then(res => res[0]);
  if (!latestLog) return 0;
  
  const now = new Date();
  const logDate = new Date(latestLog.timestamp);
  
  const diffTime = Math.abs(now.getTime() - logDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// ── Operational Mode Queries (Adaptive Focus & Soft Recalibration) ──────────

export async function checkAndHandleAutoExpiry(rec?: OperationalModeRecord | null): Promise<OperationalModeRecord> {
  const current = rec || DEFAULT_OPERATIONAL_MODE;
  if ((current.mode === 'tactical_sprint' || current.mode === 'holiday') && current.targetDate) {
    const targetDateObj = new Date(current.targetDate);
    // Consider end of target date (or direct ISO timestamp if formatted)
    const targetTime = targetDateObj.getTime();
    if (!isNaN(targetTime) && targetTime < Date.now()) {
      // Auto-trigger soft recalibration recovery without user intervention
      const autoRecalibrated: OperationalModeRecord = {
        id: 'current',
        mode: 'standard',
        targetSubjectIds: [],
        targetDate: null,
        dailyCapacityMinutes: 180,
        activatedAt: new Date().toISOString(),
        recalibrationWindowDays: current.recalibrationWindowDays || 10,
        previousMode: current.mode,
        lastRecalibratedAt: new Date().toISOString(),
        notes: current.mode === 'holiday' 
          ? 'Auto-transitioned to standard recovery after holiday ended'
          : 'Auto-transitioned to standard recovery after sprint target date elapsed',
        updatedAt: new Date(),
        hlc: generateHLC(),
      };
      await db.operationalModes.put(autoRecalibrated);
      return autoRecalibrated;
    }
  }
  return current;
}

export function useOperationalMode(): OperationalModeRecord {
  const record = useLiveQuery(async () => {
    const rec = await db.operationalModes.get('current');
    return await checkAndHandleAutoExpiry(rec);
  });

  return record ?? DEFAULT_OPERATIONAL_MODE;
}

export async function getOperationalMode(): Promise<OperationalModeRecord> {
  const rec = await db.operationalModes.get('current');
  return await checkAndHandleAutoExpiry(rec);
}

