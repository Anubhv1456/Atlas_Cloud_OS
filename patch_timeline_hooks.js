const fs = require('fs');
const file = './artifacts/study-tracker/src/features/timeline/Timeline.hooks.tsx';
let content = fs.readFileSync(file, 'utf8');

// We need to inject CurriculumSet logic for upcoming, overdue, due today revisions.

const setLogic = `  // ── Curriculum Sets Revision Events ─────────────────────────────────────────
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
        id: \`rev-set-\${set.id}-due-today\`,
        eventType: 'revisionSystem' as const,
        entityName: \`\${set.name}\`,
        subjectName: sub?.name ?? '',
        date: new Date(set.nextRevisionDate!),
        status: 'upcoming' as const,
        meta: { isDueToday: true },
      };
    });

  const allUpcomingRevisions = [...upcomingRevisions, ...setUpcomingRevisions].sort((a, b) => a.date.getTime() - b.date.getTime());
  const allOverdueRevisions = [...overdueRevisions, ...setOverdueRevisions].sort((a, b) => a.date.getTime() - b.date.getTime());
  const allDueTodayRevisions = [...dueTodayRevisions, ...setDueTodayRevisions].sort((a, b) => a.date.getTime() - b.date.getTime());
`;

// Insert after dueTodayRevisions: TimelineEvent[]...
content = content.replace(
    /\}\);\s*\/\/ ── Apply filter ──────────────────────────────────────────────────────────/g,
    `});\n\n${setLogic}\n\n  // ── Apply filter ──────────────────────────────────────────────────────────`
);

content = content.replace(
    /const todayDue             = \(isCurrentMonth && \(\!selectedDate \|\| isSameDay\(now, selectedDate\)\)\) \? filtered\(dueTodayRevisions\) : \[\];/g,
    `const todayDue             = (isCurrentMonth && (!selectedDate || isSameDay(now, selectedDate))) ? filtered(allDueTodayRevisions) : [];`
);

content = content.replace(
    /const filteredUpcoming     = filtered\(upcomingRevisions\);/g,
    `const filteredUpcoming     = filtered(allUpcomingRevisions);`
);

content = content.replace(
    /const filteredOverdue      = isCurrentMonth \? filtered\(overdueRevisions\) : \[\];/g,
    `const filteredOverdue      = isCurrentMonth ? filtered(allOverdueRevisions) : [];`
);

fs.writeFileSync(file, content);
console.log('patched hook');
