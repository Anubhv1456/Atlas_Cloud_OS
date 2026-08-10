import { useState, useMemo } from 'react';
import { historyToEvent, systemToRevisionEvent, setToRevisionEvent, buildActivityHeatmap, groupPastEntries } from '@/features/timeline/timelineUtils';
import { useLocation } from 'wouter';
import { 
  useSubjects, useAllSystems, db, deleteHistoryEntry
} from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  sortSystemsByRevisionPriority, isRevisionDueToday, isRevisionOverdue, isRevisionUpcoming, daysOverdue,
  eventMatchesFilter, TimelineEvent, TimelineFilter
} from '@/db';
import { HistoryEntry, StudySystem, useHistory } from '@/db';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  isSameMonth, isSameDay, isToday, addMonths, subMonths 
} from 'date-fns';
import { toast } from 'sonner';





export function useTimelineLogic() {

  const [, setLocation] = useLocation();
  const history  = useHistory();
  const systems  = useAllSystems();
  const subjects = useSubjects();
  
  const curriculumSets = useLiveQuery(
    () => (db.curriculumSets || db.revisionSets)
      .filter(s => !s.deletedAt && !!s.nextRevisionDate)
      .toArray()
  ) || [];
  
  const [filter, setFilter]       = useState<TimelineFilter>('all');
  const [calDate, setCalDate]     = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [pendingRollbackId, setPendingRollbackId] = useState<number | null>(null);

  const handleRollbackRequest = (id: number) => {
    setPendingRollbackId(id);
  };

  const confirmRollback = async () => {
    if (!pendingRollbackId) return;
    try {
      await deleteHistoryEntry(pendingRollbackId);
      toast.success('Event rolled back & status reverted');
    } catch (err) {
      console.error('Failed to rollback history event:', err);
      toast.error('Failed to rollback event');
    } finally {
      setPendingRollbackId(null);
    }
  };

  const now        = new Date();
  const monthStart = startOfMonth(calDate);
  const monthEnd   = endOfMonth(calDate);
  const isCurrentMonth = isSameMonth(calDate, now);

  const activityByDay = buildActivityHeatmap(history);

  // ── Completed events in the visible month ────────────────────────────────
  const monthCompleted: TimelineEvent[] = history
    .map(historyToEvent)
    .filter(e => e.date >= monthStart && e.date <= monthEnd);

  // ── Upcoming revision events in the visible month ────────────────────────
  const upcomingRevisions: TimelineEvent[] = systems
    .filter(sys => {
      if (!sys.nextRevisionDate) return false;
      const d = new Date(sys.nextRevisionDate);
      return isRevisionUpcoming(sys) && d >= monthStart && d <= monthEnd;
    })
    .map(sys => {
      const sub = subjects.find(s => s.id === sys.subjectId);
      return systemToRevisionEvent(sys, sub?.name ?? '', 'upcoming');
    });

  // ── Overdue revision events — sorted strictly by Decay Score / Priority ──
  const overdueRevisions: TimelineEvent[] = sortSystemsByRevisionPriority(systems.filter(sys => isRevisionOverdue(sys)))
    .map(sys => {
      const sub = subjects.find(s => s.id === sys.subjectId);
      return systemToRevisionEvent(sys, sub?.name ?? '', 'overdue');
    });

  // ── Due Today revision events ─────────────────────────────────────────────
  const dueTodayRevisions: TimelineEvent[] = sortSystemsByRevisionPriority(systems.filter(sys => isRevisionDueToday(sys)))
    .map(sys => {
      const sub = subjects.find(s => s.id === sys.subjectId);
      return {
        id: `rev-${sys.id}-due-today`,
        eventType: 'revisionSystem' as const,
        entityName: `${sys.name} Revision`,
        subjectName: sub?.name ?? '',
        date: new Date(sys.nextRevisionDate!),
        status: 'upcoming' as const,
        meta: { isDueToday: true },
      };
    });

  // ── Curriculum Sets Revision Events ─────────────────────────────────────────
  const setUpcomingRevisions: TimelineEvent[] = curriculumSets
    .filter(sys => {
      if (!sys.nextRevisionDate) return false;
      const d = new Date(sys.nextRevisionDate);
      d.setHours(0, 0, 0, 0);
      const n = new Date(now);
      n.setHours(0, 0, 0, 0);
      return d > n && d >= monthStart && d <= monthEnd;
    })
    .map(set => {
      const sub = subjects.find(s => s.id === set.subjectId);
      return setToRevisionEvent(set, sub?.name ?? '', 'upcoming');
    });

  const setOverdueRevisions: TimelineEvent[] = curriculumSets
    .filter(sys => {
      if (!sys.nextRevisionDate) return false;
      const d = new Date(sys.nextRevisionDate);
      d.setHours(0, 0, 0, 0);
      const n = new Date(now);
      n.setHours(0, 0, 0, 0);
      return d < n;
    })
    .map(set => {
      const sub = subjects.find(s => s.id === set.subjectId);
      return setToRevisionEvent(set, sub?.name ?? '', 'overdue');
    });

  const setDueTodayRevisions: TimelineEvent[] = curriculumSets
    .filter(sys => {
      if (!sys.nextRevisionDate) return false;
      const d = new Date(sys.nextRevisionDate);
      d.setHours(0, 0, 0, 0);
      const n = new Date(now);
      n.setHours(0, 0, 0, 0);
      return d.getTime() === n.getTime();
    })
    .map(set => {
      const sub = subjects.find(s => s.id === set.subjectId);
      return {
        id: `rev-set-${set.id}-due-today`,
        eventType: 'revisionSystem' as const,
        entityName: `${set.name}`,
        subjectName: sub?.name ?? '',
        date: new Date(set.nextRevisionDate!),
        status: 'upcoming' as const,
        meta: { isDueToday: true },
      };
    });

  const allUpcomingRevisions = [...upcomingRevisions, ...setUpcomingRevisions].sort((a, b) => a.date.getTime() - b.date.getTime());
  const allOverdueRevisions = [...overdueRevisions, ...setOverdueRevisions].sort((a, b) => a.date.getTime() - b.date.getTime());
  const allDueTodayRevisions = [...dueTodayRevisions, ...setDueTodayRevisions].sort((a, b) => a.date.getTime() - b.date.getTime());


  // ── Apply filter ──────────────────────────────────────────────────────────
  const filtered = (events: TimelineEvent[]) => events.filter(e => {
    const matchesCategory = eventMatchesFilter(e, filter);
    if (!matchesCategory) return false;
    if (selectedDate) return isSameDay(e.date, selectedDate);
    return true;
  });

  // ── Calendar structure ───────────────────────────────────────────────────
  const days     = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = (getDay(monthStart) + 6) % 7;
  const blanks   = Array.from({ length: startDow });

  // ── Section data ──────────────────────────────────────────────────────────
  const todayDue             = (isCurrentMonth && (!selectedDate || isSameDay(now, selectedDate))) ? filtered(allDueTodayRevisions) : [];
  const todayCompleted       = (isCurrentMonth && (!selectedDate || isSameDay(now, selectedDate))) ? filtered(monthCompleted).filter(e => isToday(e.date)) : [];
  const todayEvents          = [...todayDue, ...todayCompleted];
  const filteredUpcoming     = filtered(allUpcomingRevisions);
  const filteredOverdue      = isCurrentMonth ? filtered(allOverdueRevisions) : [];

  // Past days in the selected month, most recent first
  const pastEntries = filtered(monthCompleted).filter(e => isCurrentMonth ? (!selectedDate ? !isToday(e.date) : true) : true);
  const pastGrouped = groupPastEntries(pastEntries);

  const everythingEmpty =
    todayEvents.length === 0 && filteredUpcoming.length === 0 &&
    filteredOverdue.length === 0 && pastGrouped.length === 0;

  
  const goToSystem = (subjectId: number, systemId: number) => {
    setLocation(`/subjects/${subjectId}?highlight=${systemId}`);
  };


  // ── Render ────────────────────────────────────────────────────────────────
  
  return {
    history, subjects, systems,
    calDate, setCalDate,
    selectedDate, setSelectedDate,
    filter, setFilter,
    pendingRollbackId, setPendingRollbackId,
    goToSystem, confirmRollback, handleRollbackRequest,
    now, monthStart, monthEnd, isCurrentMonth,
    activityByDay, monthCompleted, upcomingRevisions, overdueRevisions, dueTodayRevisions,
    days, startDow, blanks,
    todayDue, todayCompleted, todayEvents, filteredUpcoming, filteredOverdue,
    pastEntries, pastGrouped, everythingEmpty
  };
}
