import { useState, useMemo } from 'react';
import { historyToEvent, setToRevisionEvent, buildActivityHeatmap, groupPastEntries } from '@/features/timeline/timelineUtils';
import { useLocation } from 'wouter';
import { 
  useSubjects, useAllSystems, db, deleteHistoryEntry, useHistory
} from '@/db';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { 
  eventMatchesFilter, TimelineEvent, TimelineFilter
} from '@/db';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  isSameMonth, isSameDay
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

  // 1. Memoized activity heatmap for past completed events
  const activityByDay = useMemo(() => buildActivityHeatmap(history), [history]);

  // 2. Set of future dates with scheduled revisions (for dual-signal heatmap dots)
  const upcomingRevisionDates = useMemo(() => {
    const dates = new Set<string>();
    const todayStart = new Date(now);
    todayStart.setHours(0,0,0,0);

    curriculumSets.forEach(set => {
      if (set.nextRevisionDate) {
        const d = new Date(set.nextRevisionDate);
        if (d > todayStart) {
          dates.add(format(d, 'yyyy-MM-dd'));
        }
      }
    });
    return dates;
  }, [curriculumSets, now]);

  // 3. Actionable Queue & Upcoming Revisions derived from curriculumSets
  const { actionableQueue, allUpcomingRevisions } = useMemo(() => {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const overdue: TimelineEvent[] = [];
    const dueToday: TimelineEvent[] = [];
    const upcoming: TimelineEvent[] = [];

    curriculumSets.forEach(set => {
      if (!set.nextRevisionDate) return;
      const sub = subjects.find(s => s.id === set.subjectId);
      const subName = sub?.name ?? '';

      const due = new Date(set.nextRevisionDate);
      const dueStart = new Date(due);
      dueStart.setHours(0, 0, 0, 0);

      if (dueStart.getTime() < todayStart.getTime()) {
        overdue.push(setToRevisionEvent(set, subName, 'overdue'));
      } else if (dueStart.getTime() === todayStart.getTime()) {
        dueToday.push({
          id: `rev-set-${set.id}-due-today`,
          eventType: 'revisionSystem',
          entityName: set.name,
          subjectName: subName,
          date: due,
          status: 'upcoming',
          meta: { isDueToday: true, subjectId: set.subjectId, systemId: set.systemId },
        });
      } else if (dueStart >= monthStart && dueStart <= monthEnd) {
        upcoming.push(setToRevisionEvent(set, subName, 'upcoming'));
      }
    });

    overdue.sort((a, b) => (b.meta?.daysOverdue ?? 0) - (a.meta?.daysOverdue ?? 0));
    dueToday.sort((a, b) => a.date.getTime() - b.date.getTime());
    upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      actionableQueue: [...overdue, ...dueToday],
      allUpcomingRevisions: upcoming,
    };
  }, [curriculumSets, subjects, monthStart, monthEnd, now]);

  // 4. Completed events in the visible month
  const monthCompleted = useMemo(() => {
    return history
      .map(historyToEvent)
      .filter(e => e.date >= monthStart && e.date <= monthEnd);
  }, [history, monthStart, monthEnd]);

  // Filter helper function
  const filterEvents = (events: TimelineEvent[]) => events.filter(e => {
    const matchesCategory = eventMatchesFilter(e, filter);
    if (!matchesCategory) return false;
    if (selectedDate) return isSameDay(e.date, selectedDate);
    return true;
  });

  const filteredActionable = useMemo(() => filterEvents(actionableQueue), [actionableQueue, filter, selectedDate]);
  const filteredUpcoming   = useMemo(() => filterEvents(allUpcomingRevisions), [allUpcomingRevisions, filter, selectedDate]);
  const filteredCompleted  = useMemo(() => filterEvents(monthCompleted), [monthCompleted, filter, selectedDate]);

  // Grouped completed past entries for virtualized history list
  const pastGrouped = useMemo(() => groupPastEntries(filteredCompleted), [filteredCompleted]);

  // Calendar structure
  const days     = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd]);
  const startDow = (getDay(monthStart) + 6) % 7;
  const blanks   = useMemo(() => Array.from({ length: startDow }), [startDow]);

  const goToSystem = (subjectId?: number, systemId?: number) => {
    if (subjectId && systemId) {
      setLocation(`/subjects/${subjectId}?highlight=${systemId}`);
    } else if (subjectId) {
      setLocation(`/subjects/${subjectId}`);
    } else {
      setLocation(`/subjects`);
    }
  };

  const everythingEmpty = filteredActionable.length === 0 && filteredUpcoming.length === 0 && pastGrouped.length === 0;

  return {
    history, subjects, systems,
    calDate, setCalDate,
    selectedDate, setSelectedDate,
    filter, setFilter,
    pendingRollbackId, setPendingRollbackId,
    goToSystem, confirmRollback, handleRollbackRequest,
    now, monthStart, monthEnd, isCurrentMonth,
    activityByDay, upcomingRevisionDates,
    days, startDow, blanks,
    actionableQueue: filteredActionable,
    filteredUpcoming,
    completedHistory: filteredCompleted,
    pastGrouped, everythingEmpty
  };
}

