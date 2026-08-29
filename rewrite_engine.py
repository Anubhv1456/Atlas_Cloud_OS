import sys

path = 'artifacts/study-tracker/src/lib/ai/frictionEngine.ts'
with open(path, 'r') as f:
    content = f.read()

import re
# We want to replace everything from "export function calculateSubjectFriction" to the end of the file.
start_idx = content.find("export function calculateSubjectFriction")

new_code = """export function calculateSubjectFriction(
  subjectName: string,
  subjectId: string | number,
  mistakes: MistakeLog[],
  history: HistoryEntry[],
  curriculumSets: CurriculumUnit[]
): SubjectFrictionMetric {
  const profile = SUBJECT_METRICS_PROFILE[subjectName] || {
    weight: 12,
    halfLifeDays: 14,
    cluster: 'Clinical' as const,
  };

  const relevantHistory = history.filter((h) => {
    const ids = h.subjectIds || (h.subjectId !== undefined ? [h.subjectId] : []);
    return ids.some(id => String(id) === String(subjectId));
  });

  let lastActivityDate = 0;
  relevantHistory.forEach((h) => {
    const d = new Date(h.timestamp || h.createdAt || 0).getTime();
    if (d > lastActivityDate) lastActivityDate = d;
  });

  const now = Date.now();
  
  const subjectMistakes = mistakes.filter((m) => {
    const ids = m.subjectIds || (m.subjectId !== undefined ? [m.subjectId] : []);
    return ids.some(id => String(id) === String(subjectId));
  });

  const subjectSets = curriculumSets.filter((c) => {
    const ids = c.subjectIds || (c.subjectId !== undefined ? [c.subjectId] : []);
    return ids.some(id => String(id) === String(subjectId));
  });
  
  const hasStarted = relevantHistory.length > 0 || subjectMistakes.length > 0 || subjectSets.length > 0;
  
  const daysSinceReview = lastActivityDate > 0 
    ? Math.max(1, Math.round((now - lastActivityDate) / (1000 * 60 * 60 * 24)))
    : 0; 

  const unresolvedMistakes = subjectMistakes.filter((m) => !m.resolved).length;
  const volatileMistakes = subjectMistakes.filter((m) => m.isVolatile).length;

  const completedSets = subjectSets.filter((c) => c.contentCompleted || c.qbankCompleted).length;
  const completionRatio = subjectSets.length > 0 ? completedSets / subjectSets.length : 0.0;
  const isMastered = subjectSets.length > 0 && completionRatio === 1.0;
  
  const stabilityFactor = Math.max(0.7, Math.min(1.5, 0.8 + completionRatio * 0.7));

  const weightFactor = profile.weight / 200;
  const mistakeFactor = 1 + (unresolvedMistakes * 0.4) + (volatileMistakes * 0.6);
  const decayExponent = daysSinceReview / (profile.halfLifeDays * stabilityFactor);
  const decayMultiplier = Math.exp(Math.min(decayExponent, 2.8)); 

  const rawFriction = weightFactor * mistakeFactor * decayMultiplier * 100;
  const frictionScore = Math.round(rawFriction * 10) / 10;

  let decayUrgency: 'CRITICAL' | 'ELEVATED' | 'MODERATE' | 'STABLE' | 'FRESH' | 'MASTERED' = 'STABLE';
  if (!hasStarted) {
    decayUrgency = 'FRESH';
  } else if (isMastered && daysSinceReview < profile.halfLifeDays) {
    decayUrgency = 'MASTERED';
  } else if (frictionScore >= 45 || daysSinceReview > (profile.halfLifeDays * 2)) {
    decayUrgency = 'CRITICAL';
  } else if (frictionScore >= 25 || daysSinceReview > profile.halfLifeDays) {
    decayUrgency = 'ELEVATED';
  } else if (frictionScore >= 12) {
    decayUrgency = 'MODERATE';
  } else {
    decayUrgency = 'STABLE';
  }

  const uncompletedSet = subjectSets.find((c) => !c.contentCompleted || !c.qbankCompleted);
  const recommendedTopic = uncompletedSet?.name || `${subjectName} Core`;
  
  const recommendedActionText = 
      decayUrgency === 'FRESH'
      ? `Ready to begin learning.`
      : decayUrgency === 'MASTERED'
      ? `Fully mastered. Ready for practice.`
      : decayUrgency === 'CRITICAL' || decayUrgency === 'ELEVATED'
      ? `Needs review.`
      : `Retention stable. Keep queued for spaced cycle.`;

  return {
    subjectId,
    subjectName,
    frictionScore,
    examWeightage: profile.weight,
    mistakeCount: subjectMistakes.length,
    unresolvedMistakes,
    daysSinceReview,
    decayUrgency,
    subjectHalfLifeDays: profile.halfLifeDays,
    cluster: profile.cluster,
    recommendedTopic,
    recommendedActionText,
    hasStarted,
  };
}

export function useClinicalFrictionEngine() {
  const subjects = useLiveQuery(() => db.subjects.toArray().then((s) => s.filter((x) => !x.deletedAt))) || [];
  const mistakes = useLiveQuery(() => db.mistakeLogs.toArray().then((m) => m.filter((x) => !x.deletedAt))) || [];
  const history = useLiveQuery(() => db.history.toArray(), []) || [];
  const curriculumSets = useLiveQuery(() => db.curriculumSets.toArray().then((c) => c.filter((x) => !x.deletedAt))) || [];

  const metrics: SubjectFrictionMetric[] = React.useMemo(() => {
    if (!subjects.length) return [];
    
    const mistakesBySub = new Map();
    const historyBySub = new Map();
    const curriculumBySub = new Map();
    
    mistakes.forEach(m => {
      const ids = m.subjectIds || (m.subjectId !== undefined ? [m.subjectId] : []);
      ids.forEach(rawId => {
        const id = String(rawId);
        if (!mistakesBySub.has(id)) mistakesBySub.set(id, []);
        mistakesBySub.get(id).push(m);
      });
    });
    
    history.forEach(h => {
      const ids = h.subjectIds || (h.subjectId !== undefined ? [h.subjectId] : []);
      ids.forEach(rawId => {
        const id = String(rawId);
        if (!historyBySub.has(id)) historyBySub.set(id, []);
        historyBySub.get(id).push(h);
      });
    });
    
    curriculumSets.forEach(c => {
      const ids = c.subjectIds || (c.subjectId !== undefined ? [c.subjectId] : []);
      ids.forEach(rawId => {
        const id = String(rawId);
        if (!curriculumBySub.has(id)) curriculumBySub.set(id, []);
        curriculumBySub.get(id).push(c);
      });
    });

    const calculated = subjects.map((sub) => {
      const subId = sub.id !== undefined ? sub.id : sub.name;
      const sIdStr = String(subId);
      return calculateSubjectFriction(
        sub.name, 
        subId, 
        mistakesBySub.get(sIdStr) || [], 
        historyBySub.get(sIdStr) || [], 
        curriculumBySub.get(sIdStr) || []
      );
    });

    return calculated.sort((a, b) => b.frictionScore - a.frictionScore);
  }, [subjects, mistakes, history, curriculumSets]);

  const topDailyPulses: DailyAgendaPulse[] = React.useMemo(() => {
    if (!metrics.length) return [];
    
    // Strict prioritization logic as requested by user
    const overdueMetrics = metrics.filter(m => m.hasStarted && (m.decayUrgency === 'CRITICAL' || m.decayUrgency === 'ELEVATED'));
    
    let eligibleMetrics = [];
    if (overdueMetrics.length > 0) {
      eligibleMetrics = overdueMetrics;
    } else {
      const startedMetrics = metrics.filter(m => m.hasStarted && m.decayUrgency !== 'MASTERED');
      if (startedMetrics.length > 0) {
        eligibleMetrics = startedMetrics;
      } else {
        const freshMetrics = metrics.filter(m => !m.hasStarted);
        if (freshMetrics.length > 0) {
          eligibleMetrics = freshMetrics;
        } else {
          eligibleMetrics = metrics; // just mastered ones then
        }
      }
    }
    
    const topThree = eligibleMetrics.slice(0, 3);

    return topThree.map((m, idx) => {
      let actionType: 'ACTIVE_RECALL' | 'PEARL_AUDIT' | 'WEAK_SPRINT' = 'ACTIVE_RECALL';
      let estimatedMinutes = 30;
      
      if (m.unresolvedMistakes >= 3) {
        actionType = 'PEARL_AUDIT';
        estimatedMinutes = 20;
      } else if (m.decayUrgency === 'CRITICAL') {
        actionType = 'WEAK_SPRINT';
        estimatedMinutes = 45;
      }
      
      let ctaText = 'Review';
      if (m.decayUrgency === 'FRESH') ctaText = 'Begin';
      else if (m.decayUrgency === 'MASTERED') ctaText = 'Practice';
      else ctaText = 'Review';

      return {
        id: `pulse-${m.subjectId}-${idx}`,
        subjectName: m.subjectName,
        topicName: m.recommendedTopic || `${m.subjectName} Revision`,
        urgency: m.decayUrgency,
        reason: m.recommendedActionText,
        estimatedMinutes,
        actionType,
        ctaText,
        actionPayload: {
          subjectId: m.subjectId,
          subjectName: m.subjectName,
          systemName: m.recommendedTopic || 'Core Review',
        },
      };
    });
  }, [metrics]);

  return {
    metrics,
    topDailyPulses,
    criticalCount: metrics.filter((m) => m.decayUrgency === 'CRITICAL').length,
    elevatedCount: metrics.filter((m) => m.decayUrgency === 'ELEVATED').length,
  };
}
"""

with open(path, 'w') as f:
    f.write(content[:start_idx] + new_code)
print("done rewriting friction engine")
