import { format, isSameDay } from 'date-fns';
import { HistoryEntry, StudySystem, TimelineEvent, daysOverdue } from '@/db';
import { CurriculumSet } from '@/db/types';

export function historyToEvent(h: HistoryEntry): TimelineEvent {
  const typeMap: Record<string, TimelineEvent['eventType']> = {
    contentDone:     'revisionSystem',
    contentProgress: 'revisionSystem',
    qbankDone:       'qbankDone',
    pyqsDone:        'pyqsDone',
    revision:        'revisionSystem',
    curriculum_set_revision: 'revisionSystem',
    curriculum_set_content: 'revisionSystem',
    curriculum_set_qbank: 'qbankDone',
    topicMastered:   'topicMastered',
    topicWeak:       'topicWeak',
  };

  let entityName = `${h.systemName} ${h.taskLabel}`;
  if (h.taskKey === 'pyqsDone') entityName = h.taskLabel;
  if (h.taskKey === 'topicMastered' || h.taskKey === 'topicWeak') entityName = h.taskLabel;
  if (h.taskKey === 'curriculum_set_revision' || h.taskKey === 'curriculum_set_content' || h.taskKey === 'curriculum_set_qbank') entityName = h.taskLabel;

  return {
    id:          String(h.id ?? `${h.systemId}-${h.taskKey}-${h.completedAt}`),
    dbHistoryId: h.id,
    eventType:   typeMap[h.taskKey] ?? 'revisionSystem',
    entityName,
    subjectName: h.subjectName,
    date:        new Date(h.completedAt),
    status:      'completed',
  };
}

export function systemToRevisionEvent(
  sys: StudySystem,
  subjectName: string,
  status: 'upcoming' | 'overdue',
  curriculumSets: CurriculumSet[]
): TimelineEvent {
  const days = daysOverdue(sys, curriculumSets);
  return {
    id:          `rev-${sys.id}-${status}`,
    eventType:   'revisionSystem',
    entityName:  `${sys.name} Revision`,
    subjectName,
    date:        new Date(sys.nextRevisionDate!),
    status,
    meta:        status === 'overdue' ? { daysOverdue: days } : undefined,
  };
}

export function setToRevisionEvent(
  set: CurriculumSet,
  subjectName: string,
  status: 'upcoming' | 'overdue',
): TimelineEvent {
  let days = 0;
  if (status === 'overdue' && set.nextRevisionDate) {
    const due = new Date(set.nextRevisionDate);
    due.setHours(0, 0, 0, 0);
    const n = new Date();
    n.setHours(0, 0, 0, 0);
    days = Math.floor((n.getTime() - due.getTime()) / 86_400_000);
  }
  
  return {
    id:          `rev-set-${set.id}-${status}`,
    eventType:   'revisionSystem',
    entityName:  `${set.name}`,
    subjectName,
    date:        new Date(set.nextRevisionDate!),
    status,
    meta:        status === 'overdue' ? { daysOverdue: days } : undefined,
  };
}

export function buildActivityHeatmap(history: HistoryEntry[]) {
  const activityByDay = new Map<string, number>();
  history.forEach(h => {
    const d = format(new Date(h.completedAt), 'yyyy-MM-dd');
    activityByDay.set(d, (activityByDay.get(d) || 0) + 1);
  });
  return activityByDay;
}

export function groupPastEntries(pastEntries: TimelineEvent[]) {
  const pastGrouped: { date: Date; events: TimelineEvent[] }[] = [];
  pastEntries.forEach(event => {
    const existing = pastGrouped.find(g => isSameDay(g.date, event.date));
    if (existing) existing.events.push(event);
    else pastGrouped.push({ date: event.date, events: [event] });
  });
  pastGrouped.sort((a, b) => b.date.getTime() - a.date.getTime());
  return pastGrouped;
}
