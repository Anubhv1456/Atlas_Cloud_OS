const fs = require('fs');
const file = './artifacts/study-tracker/src/lib/recommendations/nextActionEngine.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace everything from `// 1. Process Study Blocks` to the end of the file.
const splitStr = "  // 1. Process Study Blocks (Primary Scheduling Entity)";
const parts = code.split(splitStr);

if (parts.length === 2) {
  const replacement = `  // 1. Process Study Blocks (Primary Scheduling Entity)
  for (const set of curriculumSets) {
    if (!set.id) continue;
    const candidateId = \`set:\${set.id}\`;
    
    const parentSystem = systemMap.get(set.systemId);
    if (parentSystem) {
      systemsWithSets.add(parentSystem.id!);
      if (!set.contentCompleted || !set.qbankCompleted) {
        systemsWithIncompleteSets.add(parentSystem.id!);
      }
    }
    
    if (localSkipIds.has(candidateId)) continue;
    
    const subjectName = subjectMap.get(set.subjectId) || 
       ALL_SUBJECTS.find(s => String(s.id) === String(set.subjectId))?.name || 'Medical Subject';
    const systemName = parentSystem?.name || 'System';
    
    const isLengthy = set.topicIds.length > 5;
    const topicCount = set.topicIds.length;
    
    const yieldInfo = getSubjectWeightageInfo(subjectName, targetExam);
    const yieldWeight = yieldInfo.weight || 70;
    
    let daysOverdue = 0;
    let isOverdue = false;
    let isDueToday = false;
    
    if (set.nextRevisionDate) {
      const revDate = new Date(set.nextRevisionDate);
      const diffMs = now.getTime() - revDate.getTime();
      const diffDays = diffMs / (1000 * 3600 * 24);
      if (diffDays >= 1) {
        isOverdue = true;
        daysOverdue = Math.floor(diffDays);
      } else if (diffDays >= -0.5) {
        isDueToday = true;
      }
    }
    
    const lastDate = set.lastRevisionDate ? new Date(set.lastRevisionDate) : (set.updatedAt ? new Date(set.updatedAt) : now);
    const stability = set.currentRevisionInterval && set.currentRevisionInterval > 0 ? set.currentRevisionInterval : getInitialInterval('Average');
    const baseDecayFactor = parentSystem && typeof parentSystem.decayFactor === 'number' && parentSystem.decayFactor > 0 ? parentSystem.decayFactor : 1.0;
    
    let daysSinceLastRev = Math.max(0, (now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    
    const topicMemoryLosses = set.topicIds.map(tid => {
      const isWeak = weakTopicMap.has(tid);
      return getTopicMemoryLoss(lastDate, stability, isWeak, baseDecayFactor, now);
    });
    
    const baseMemoryLoss = calculateBlockMemoryLoss(topicMemoryLosses);
    
    const yieldModifier = yieldWeight >= 85 ? 1.2 : (yieldWeight <= 40 ? 0.8 : 1.0);
    
    let actionIndex = Math.min(100, Math.round(baseMemoryLoss * yieldModifier));
    
    // Recent exposure suppression (last 18 hours)
    if (daysSinceLastRev < 0.75) {
      actionIndex = 0;
    }
    
    const isPinned = set.focus === 'primary';
    if (isPinned) {
      // Pinned Intent Lifecycle handling - if stale, UI might downgrade, but here we just give it massive boost
      actionIndex += 1000; 
    }
    
    // Triage Mode Filter
    if (isTriageMode && !isPinned && actionIndex <= 80) {
      continue; // Skip blocks that don't meet critical triage threshold
    }
    
    // Build Rationale Badges
    const badges: RationaleBadge[] = [];
    
    if (isTriageMode && actionIndex > 80 && !isPinned) {
      badges.push({ label: '🚨 Triage Priority', variant: 'destructive', iconType: 'alert' });
    } else if (isOverdue) {
      badges.push({ label: \`⚡ Overdue\`, variant: 'amber', iconType: 'clock' });
    } else if (isDueToday) {
      badges.push({ label: '🕒 Due Today', variant: 'amber', iconType: 'clock' });
    }
    
    if (yieldWeight >= 85) {
      badges.push({ label: \`🎯 High Yield (\${yieldInfo.tag.split('•')[0].trim()})\`, variant: 'primary', iconType: 'target' });
    }
    
    if (isPinned) {
      badges.push({ label: '⭐ Pinned', variant: 'primary', iconType: 'target' });
    }
    
    const isBlockWeak = topicMemoryLosses.length > 0 && topicMemoryLosses.some(loss => loss > 80);
    if (isBlockWeak) {
      badges.push({ label: '⚠️ Weak Area', variant: 'destructive', iconType: 'alert' });
    }
    
    const estimatedMinutes = isLengthy ? 45 : 15;
    const revisionCount = set.revisionCount || 0;
    
    let statusText = '';
    if (isOverdue) statusText = \`\${daysOverdue} days overdue (Pass #\${revisionCount + 1})\`;
    else if (isDueToday) statusText = \`Due today (Pass #\${revisionCount + 1})\`;
    else if (set.contentCompleted && set.qbankCompleted) statusText = \`Completed • Pass #\${revisionCount}\`;
    else statusText = \`In Progress • \${topicCount} topics\`;
    
    rawCandidates.push({
      id: candidateId,
      type: 'curriculumSet',
      title: set.name,
      subjectName,
      systemName,
      subjectId: set.subjectId,
      systemId: set.systemId,
      curriculumSetId: set.id,
      isLengthy,
      estimatedMinutes,
      priorityScore: actionIndex,
      rationaleBadges: badges,
      topicCount,
      inferredScore: 100 - baseMemoryLoss,
      daysOverdue: isOverdue ? daysOverdue : 0,
      revisionCount,
      statusText
    });
  }

  const totalCandidatesEvaluated = rawCandidates.length;

  // Filter candidates by session budget
  let filteredCandidates = rawCandidates;
  if (sessionBudget === 'quick') {
    filteredCandidates = rawCandidates.filter(c => !c.isLengthy);
  }
  const quickEligibleCount = rawCandidates.filter(c => !c.isLengthy).length;

  // If Quick filter results in empty, DO NOT fall back to Deep. Be honest.
  // NextActionCard will handle the empty state.
  
  // Sort by Action Index descending
  filteredCandidates.sort((a, b) => b.priorityScore - a.priorityScore);
  
  const primary = filteredCandidates[0] || null;
  const fallback = filteredCandidates[1] || (filteredCandidates.length > 1 ? filteredCandidates.find(c => c.id !== primary?.id) : null) || null;

  return {
    primary,
    fallback,
    sessionBudget,
    totalCandidatesEvaluated,
    quickEligibleCount,
    isTriageMode
  };
}
`;
  fs.writeFileSync(file, parts[0] + replacement);
}
