import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { ALL_SYSTEMS } from '@/data/ontology';
import { BookOpen, AlertCircle, Target, Activity, Sparkles, Flame } from 'lucide-react';
import { useState, ReactNode, useMemo, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  useSubjects, useAllSystems, addSubject, updateSubject, deleteSubject, 
  useCurrentStreak, setFocus, setSubjectFocus, updateSubjectsOrder, useAllPYQs, Subject, StudySystem 
} from '@/db';
import { 
  sortSystemsByRevisionPriority, isRevisionDue, isRevisionOverdue, 
  daysOverdue, calculateDecayScore, today 
} from '@/db';
import { calculateSubjectProgress } from '@/lib/progress';
import { determineFocusSystems } from '@/features/dashboard/homeUtils';
import { DropResult } from '@hello-pangea/dnd';
import { useAIInsights } from '@/hooks/useAIInsights';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

export function useHomeLogic() {

  const subjects = useSubjects();
  const streak = useCurrentStreak();
  const systems  = useAllSystems();
  const pyqs = useAllPYQs();
  const [, setLocation] = useLocation();
  
  const curriculumSets = useLiveQuery(
    () => (db.curriculumSets || db.revisionSets).filter(s => !s.deletedAt).toArray()
  ) || [];

  const weakTopicIds = useLiveQuery(
    () => db.topicProgress.toArray().then(res => res.filter(t => t.isWeak).map(t => t.topicId))
  ) || [];

  const [focusDialogType, setFocusDialogType] = useState<'primary' | 'secondary' | null>(null);

  const {
    customPrimarySubject,
    customPrimarySystem,
    customSecondarySubject,
    customSecondarySystem,
    primaryFocus,
    primaryFocusSubject,
    isAutoPrimary,
    isPrimaryOverriddenByRevision,
    isPrimaryIntentStale,
    isSecondaryIntentStale,
    secondaryFocus,
    secondaryFocusSubject,
    isAutoSecondary,
    isSecondaryOverriddenByRevision,
    dueRevisions,
    secondaryDaysOverdue
  } = determineFocusSystems(subjects, systems, today());

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const aiInsight = null;

  const handleSubjectDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(subjects);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    await updateSubjectsOrder(items.filter(s => s.id !== undefined).map(s => ({ id: s.id as number, order: s.order })));
  };

  const insights = useMemo(() => {
    if (systems.length === 0 || subjects.length === 0) return [];

    const candidates: any[] = [];
    const now = new Date();
    
    if (aiInsight) candidates.push(aiInsight);

    // 0. SUBJECT FOCUS STRATEGY (Priority Confidence: 96)
    if (customPrimarySubject || customSecondarySubject) {
      const activeFocusedSub = customPrimarySubject || customSecondarySubject;
      const subSystems = systems.filter(s => s.subjectId === activeFocusedSub?.id);
      const subIncomplete = subSystems.filter(s => !(s.contentCompleted && s.qbankDone));
      
      candidates.push({
        id: `subject-focus-${activeFocusedSub?.id}`,
        confidence: 96,
        badge: customPrimarySubject ? 'PRIMARY SUBJECT FOCUS' : 'SECONDARY SUBJECT FOCUS',
        badgeClass: 'bg-primary/10 text-primary border-primary/20',
        icon: <BookOpen className="w-4 h-4 text-primary shrink-0" />,
        text: (
          <span>
            <strong className="text-foreground">{activeFocusedSub?.name}</strong> is set as your focus subject ({subIncomplete.length} of {subSystems.length} topics remaining). Next topic: <strong className="text-foreground">{primaryFocus?.name || 'Subject Completed!'}</strong>.
          </span>
        ),
        actionLabel: 'Open Subject',
        onAction: () => setLocation(`/subjects/${activeFocusedSub?.id}`),
      });
    }

    // 1. KNOWLEDGE DECAY & REVISION DEBT (Highest Priority: 98-100)
    const sortedByDecay = sortSystemsByRevisionPriority(systems, now);
    const topDecaySystem = sortedByDecay[0];
    if (topDecaySystem && (isRevisionDue(topDecaySystem, now) || topDecaySystem.status === 'Weak' || topDecaySystem.revisionState === 'in_progress')) {
      const sub = subjects.find(s => s.id === topDecaySystem.subjectId);
      const overdue = daysOverdue(topDecaySystem, now);
      const decayScore = calculateDecayScore(topDecaySystem, now);
      const isDueToday = isRevisionDue(topDecaySystem, now) && overdue === 0;

      let badge = 'REVISION DUE';
      let badgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      let statusText = 'due today';

      if (overdue > 0) {
        badge = 'NEEDS REVISION';
        badgeClass = 'bg-destructive/10 text-destructive border-destructive/20';
        statusText = `${overdue}d overdue`;
      } else if (topDecaySystem.revisionState === 'in_progress') {
        badge = 'ACTIVE SESSION';
        badgeClass = 'bg-primary/10 text-primary border-primary/20';
        statusText = `Day ${topDecaySystem.revisionDaysLogged || 1} logged`;
      } else if (!isDueToday && topDecaySystem.status === 'Weak') {
        badge = 'WEAK CONFIDENCE';
        badgeClass = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
        statusText = 'weak confidence';
      }

      candidates.push({
        id: 'decay-critical',
        confidence: 98 + Math.min(decayScore, 2),
        badge,
        badgeClass,
        icon: <AlertCircle className="w-4 h-4 text-destructive shrink-0" />,
        text: (
          <span>
            <strong className="text-foreground">{topDecaySystem.name}</strong> ({sub?.name}) requires attention ({statusText}, {topDecaySystem.status.toLowerCase()} confidence).
          </span>
        ),
        actionLabel: 'Review Now',
        onAction: () => setLocation(`/subjects/${topDecaySystem.subjectId}?highlight=${topDecaySystem.id}`),
      });
    }

    // 2. PRIMARY FOCUS STEP AWAY (Confidence: 94)
    if (primaryFocus && !(primaryFocus.contentCompleted && primaryFocus.qbankDone)) {
      const sub = subjects.find(s => s.id === primaryFocus!.subjectId);
      const missingTask = 'Topics';
      candidates.push({
        id: 'primary-focus-near',
        confidence: 94,
        badge: 'PRIMARY FOCUS',
        badgeClass: 'bg-primary/10 text-primary border-primary/20',
        icon: <Target className="w-4 h-4 text-primary shrink-0" />,
        text: (
          <span>
            Primary Focus <strong className="text-foreground">{primaryFocus.name}</strong> ({sub?.name}) is 1 task away from mastery ({missingTask} pending).
          </span>
        ),
        actionLabel: 'Complete Task',
        onAction: () => setLocation(`/subjects/${primaryFocus!.subjectId}?highlight=${primaryFocus.id}`),
      });
    }

    // 3. SUBJECT COVERAGE IMBALANCE (Confidence: 88)
    const subjectStats = subjects.map(sub => {
      const subSets = curriculumSets.filter(s => s.subjectId === sub.id);
      const totalCount = subSets.length;
      const ratio = calculateSubjectProgress(sub, systems, subSets) / 100;
      return { sub, totalCount, ratio };
    }).filter(s => s.totalCount > 0);

    if (subjectStats.length >= 2) {
      subjectStats.sort((a, b) => b.ratio - a.ratio);
      const highest = subjectStats[0];
      const lowest = subjectStats[subjectStats.length - 1];

      if (highest.ratio >= 0.6 && lowest.ratio <= 0.25 && highest.sub.id !== lowest.sub.id) {
        candidates.push({
          id: 'coverage-imbalance',
          confidence: 88,
          badge: 'COVERAGE GAP',
          badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          icon: <Activity className="w-4 h-4 text-amber-500 shrink-0" />,
          text: (
            <span>
              Study focus is skewed: <strong className="text-foreground">{highest.sub.name}</strong> is {Math.round(highest.ratio * 100)}% complete, while <strong className="text-foreground">{lowest.sub.name}</strong> lags at {Math.round(lowest.ratio * 100)}%.
            </span>
          ),
          actionLabel: `Focus ${lowest.sub.name}`,
          onAction: () => setLocation(`/subjects/${lowest.sub.id}`),
        });
      }
    }

    // 4. PYQ READINESS GAP (Confidence: 84)
    if (pyqs.length > 0) {
      for (const sub of subjects) {
        const subSets = curriculumSets.filter(s => s.subjectId === sub.id);
        const subPYQs = pyqs.filter(p => p.subjectId === sub.id);
        if (subSets.length > 0 && subPYQs.length > 0) {
          const sysRatio = calculateSubjectProgress(sub, systems, subSets) / 100;
          const pyqRatio = subPYQs.filter(p => p.completed).length / subPYQs.length;
          if (sysRatio >= 0.5 && pyqRatio <= 0.3) {
            candidates.push({
              id: `pyq-gap-${sub.id}`,
              confidence: 84,
              badge: 'EXAM READINESS',
              badgeClass: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
              icon: <BookOpen className="w-4 h-4 text-sky-500 shrink-0" />,
              text: (
                <span>
                  You completed {Math.round(sysRatio * 100)}% of <strong className="text-foreground">{sub.name}</strong> topics but solved only {Math.round(pyqRatio * 100)}% of past year papers.
                </span>
              ),
              actionLabel: 'Solve PYQs',
              onAction: () => setLocation(`/subjects/${sub.id}`),
            });
            break;
          }
        }
      }
    }

    // 5. SUBJECT MASTERY MILESTONE (Confidence: 82)
    for (const sub of subjects) {
      const subSys = systems.filter(s => s.subjectId === sub.id);
      if (subSys.length > 1) {
        const incomplete = subSys.filter(s => !(s.contentCompleted && s.qbankDone));
        if (incomplete.length === 1) {
          const target = incomplete[0];
          candidates.push({
            id: `milestone-${sub.id}`,
            confidence: 82,
            badge: 'MASTERY MILESTONE',
            badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            icon: <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />,
            text: (
              <span>
                Only 1 system (<strong className="text-foreground">{target.name}</strong>) left to reach 100% completion in <strong className="text-foreground">{sub.name}</strong>!
              </span>
            ),
            actionLabel: 'Finish Subject',
            onAction: () => setLocation(`/subjects/${sub.id}?highlight=${target.id}`),
          });
          break;
        }
      }
    }

    // 6. PERFECT MOMENTUM & STREAK (Confidence: 70)
    const nowTime = new Date();
    nowTime.setHours(0,0,0,0);
    const overdueCount = curriculumSets.filter(s => {
      if (!s.nextRevisionDate) return false;
      const d = new Date(s.nextRevisionDate);
      d.setHours(0,0,0,0);
      return d < nowTime;
    }).length;
    if (overdueCount === 0 && streak > 0) {
      candidates.push({
        id: 'perfect-momentum',
        confidence: 70,
        badge: 'PEAK MOMENTUM',
        badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        icon: <Flame className="w-4 h-4 text-amber-500 shrink-0" />,
        text: (
          <span>
            Zero overdue revisions and an active <strong className="text-foreground">{streak}-day streak</strong>! All your scheduled revisions are up to date.
          </span>
        ),
        actionLabel: 'View Timeline',
        onAction: () => setLocation('/timeline'),
      });
    }

    candidates.sort((a, b) => b.confidence - a.confidence);
    return candidates.slice(0, 2);
  }, [systems, subjects, pyqs, primaryFocus, customPrimarySubject, customSecondarySubject, streak, setLocation]);

  const handleSetFocus = (systemId: number) => {
    if (focusDialogType) {
      setFocus(systemId, focusDialogType);
    }
  };

  // Navigate to a system (open its parent subject with highlight)
  const goToSystem = (subjectId: number, systemId: number) => {
    
    setLocation(`/subjects/${subjectId}?highlight=${systemId}`);
  };

  const goToSubject = (subjectId: number) => {
    
    setLocation(`/subjects/${subjectId}`);
  };

  
  return {
    subjects, systems, pyqs,
    streak,
    greeting,
    primaryFocus, primaryFocusSubject, customPrimarySubject, customPrimarySystem, isAutoPrimary, isPrimaryOverriddenByRevision, isPrimaryIntentStale,
    secondaryFocus, secondaryFocusSubject, customSecondarySubject, customSecondarySystem, isAutoSecondary, isSecondaryOverriddenByRevision, isSecondaryIntentStale,
    secondaryDaysOverdue,
    dueRevisions,
        
    
    
    
    focusDialogType, setFocusDialogType,
    
    handleSetFocus, goToSystem, goToSubject, handleSubjectDragEnd
  };
}
