const fs = require('fs');
const path = '/app/applet/artifacts/study-tracker/src/features/analytics/Analytics.hooks.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /const studyRecommendation = useMemo\(\(\) => \{[\s\S]*?\}\);/m;

const newLogic = `const studyRecommendation = useMemo(() => {
    if (systems.length === 0) return null;

    // Phase 5: The Clinical Intervention (The Apex Alert)
    // We want strictly actionable, high-priority clinical thresholds based on retention metrics first.
    
    // First, let's see if any system is critically weak (< 60%) based on system breakdown data
    // To do this right, we need systemBreakdownData to be computed BEFORE this block if possible, 
    // or just calculate it manually here for the top vulnerability.
    
    // Let's use the DB state to find the most vulnerable system by decay/status
    const sortedByDecay = sortSystemsByRevisionPriority(systems, curriculumSets);
    const topVulnerable = sortedByDecay.length > 0 ? sortedByDecay[0] : null;

    if (topVulnerable && (isRevisionDue(topVulnerable, curriculumSets) || topVulnerable.status === 'Weak')) {
      const subName = subjectMap.get(topVulnerable.subjectId)?.name ?? 'Subject';
      const overdue = daysOverdue(topVulnerable, curriculumSets);
      
      let reason = '';
      let badge = '';
      let badgeColor = '';
      let titlePrefix = '';

      if (topVulnerable.status === 'Weak') {
          reason = \`Critical: \${topVulnerable.name} retention has dropped below safety thresholds.\`;
          badge = 'Critical Vulnerability';
          badgeColor = 'bg-rose-500/15 text-rose-500 border-rose-500/30';
          titlePrefix = 'CRITICAL: ';
      } else if (overdue > 0) {
        reason = \`Warning: \${topVulnerable.name} is overdue by \${overdue} day\${overdue !== 1 ? 's' : ''}. Memory decay accelerating.\`;
        badge = 'Accelerated Decay';
        badgeColor = 'bg-amber-500/15 text-amber-500 border-amber-500/30';
        titlePrefix = 'WARNING: ';
      } else {
        reason = \`Targeted revision due today to maintain retention state.\`;
        badge = 'Scheduled Maintenance';
        badgeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      }

      return {
        system: topVulnerable,
        subjectName: subName,
        title: titlePrefix + topVulnerable.name,
        reason,
        badge,
        badgeColor,
        isCritical: topVulnerable.status === 'Weak' || overdue > 2
      };
    }
    
    // Fallback: Active multi-day
    const activeMultiDay = systems.find(s => s.revisionState === 'in_progress');
    if (activeMultiDay) {
      const subName = subjectMap.get(activeMultiDay.subjectId)?.name ?? 'Subject';
      return {
        system: activeMultiDay,
        subjectName: subName,
        title: activeMultiDay.name,
        reason: \`Active multi-day revision in progress. Resume block to halt decay.\`,
        badge: 'Session In Progress',
        badgeColor: 'bg-primary/10 text-primary border-primary/30',
        isCritical: false
      };
    }

    return null;
  }, [systems, curriculumSets, subjectMap]);`;

content = content.replace(regex, newLogic);
fs.writeFileSync(path, content);
