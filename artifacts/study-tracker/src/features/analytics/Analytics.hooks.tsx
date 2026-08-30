import { format } from 'date-fns';
import { ALL_SYSTEMS } from '@/data/ontology';
import { filterScoreLogs, applyDensityLimit, calculateAnalyticsStats, formatChartData, calculateSystemBreakdown } from '@/features/analytics/analyticsUtils';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { 
  useSubjects, useAllSystems,  db, setFocus,
  StudySystem, Subject 
} from '@/db';
import { 
  sortSystemsByRevisionPriority, isRevisionDue, isRevisionOverdue, daysOverdue
} from '@/db';
import { toast as sonnerToast } from 'sonner';
import { toast } from '@/hooks/use-toast';

export function useAnalyticsLogic() {

  const { toast } = useToast();
  const scoreLogs = useLiveQuery(() => db.scoreLogs.orderBy('timestamp').toArray().then(res => res.filter(s => !s.deletedAt)), []) || [];
  const mistakeLogs = useLiveQuery(() => db.mistakeLogs.toArray().then(res => res.filter(m => !m.deletedAt)), []) || [];
  const subjects = useLiveQuery(() => db.subjects.toArray().then(res => res.filter(s => !s.deletedAt)), []) || [];
  const systems = useLiveQuery(() => db.systems.toArray().then(res => res.filter(s => !s.deletedAt)), []) || [];
  const curriculumSets = useLiveQuery(() => (db.curriculumSets || db.revisionSets)?.filter(s => !s.deletedAt).toArray(), []) || [];

  // Filter state
  const [selectedType, setSelectedType] = useState<'all' | 'revision' | 'pyq' | 'set' | 'gt'>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedSystemId, setSelectedSystemId] = useState<string>('all');
  const [densityLimit, setDensityLimit] = useState<string>('10'); // Default: Last 10 results
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Subject lookup maps
  const subjectMap = useMemo(() => {
    const map = new Map<number | string, Subject>();
    subjects.forEach(s => { 
      if (s.id !== undefined && s.id !== null) {
        map.set(s.id, s);
        map.set(String(s.id), s);
      }
    });
    return map as Map<any, Subject>;
  }, [subjects]);

  const systemMap = useMemo(() => {
    const map = new Map<number | string, StudySystem>();
    systems.forEach(sys => { 
      if (sys.id !== undefined && sys.id !== null) {
        map.set(sys.id, sys);
        map.set(String(sys.id), sys);
      }
    });
    return map as Map<any, StudySystem>;
  }, [systems]);

  // Available systems for selected subject
  const availableSystems = useMemo(() => {
    if (selectedSubjectId === 'all') return systems;
    return systems.filter(sys => String(sys.subjectId) === String(selectedSubjectId));
  }, [systems, selectedSubjectId]);

  // Filtered score logs
  const filteredLogs = useMemo(() => {
    return filterScoreLogs(scoreLogs, selectedType, selectedSubjectId, selectedSystemId, searchQuery);
  }, [scoreLogs, selectedType, selectedSubjectId, selectedSystemId, searchQuery]);

  // Apply density limit for chart & main view
  const displayLogs = useMemo(() => {
    return applyDensityLimit(filteredLogs, densityLimit);
  }, [filteredLogs, densityLimit]);

  
  const topicProgresses = useLiveQuery(() => db.topicProgress.toArray()) || [];
  
  // Calculate summary stats
  const stats = useMemo(() => {
    const baseStats = calculateAnalyticsStats(filteredLogs);
    
    // topics metrics
    const totalTopics = ALL_SYSTEMS.flatMap(s => s.topics).length;
    const mastered = 0; // Removing topic level confidence, not needed right now
    const weak = topicProgresses.filter(tp => tp.isWeak).length;
    const qbankDone = 0; // Topic level qbank doesn't exist anymore
    const qbankCoverage = 0;

  
    return {
      ...baseStats,
      topicsMastered: mastered,
      topicsWeak: weak,
      qbankCoverage,
      totalTopics
    };
  }, [filteredLogs, topicProgresses]);


  // Chart data formatting
  const chartData = useMemo(() => {
    return formatChartData(displayLogs, subjectMap, selectedSubjectId);
  }, [displayLogs, subjectMap, selectedSubjectId]);

  // Unique subjects with scores, plus Grand Tests, plus curriculum subjects
  const scoredSubjects = useMemo(() => {
    const map = new Map<string, { id: string | number; name: string; count: number; avgScore: number; totalPct: number }>();
    
    // 1. First populate with subjects that have recorded score logs
    scoreLogs.forEach(log => {
      if (log.type === 'gt' || log.title.toLowerCase().includes('grand test') || log.title.toLowerCase().startsWith('gt')) {
        const existing = map.get('gt') || { id: 'gt', name: 'Grand Tests (Mocks)', count: 0, avgScore: 0, totalPct: 0 };
        existing.totalPct += log.percentage;
        existing.count += 1;
        existing.avgScore = Math.round((existing.totalPct / existing.count) * 10) / 10;
        map.set('gt', existing);
      } else if (log.subjectId !== undefined && log.subjectId !== null && String(log.subjectId).trim() !== '') {
        const subIdKey = String(log.subjectId);
        const sub = subjectMap.get(log.subjectId as any) || subjects.find(s => String(s.id) === subIdKey);
        let name = sub?.name;
        
        if (!name) {
          // If systemId present, infer from system
          if (log.systemId) {
            const sys = systemMap.get(log.systemId as any) || systems.find(s => String(s.id) === String(log.systemId));
            if (sys && sys.subjectId) {
              const matchedSub = subjectMap.get(sys.subjectId as any);
              if (matchedSub) name = matchedSub.name;
            }
          }
        }

        if (!name) {
          name = `Subject ${log.subjectId}`;
        }

        const existing = map.get(subIdKey) || { id: log.subjectId, name, count: 0, avgScore: 0, totalPct: 0 };
        existing.totalPct += log.percentage;
        existing.count += 1;
        existing.avgScore = Math.round((existing.totalPct / existing.count) * 10) / 10;
        map.set(subIdKey, existing);
      }
    });

    // 2. If subjects exist in curriculum, ensure active subjects are represented
    subjects.forEach(sub => {
      if (sub.id !== undefined && sub.id !== null) {
        const subIdKey = String(sub.id);
        if (!map.has(subIdKey)) {
          // Check if there are systems with logs
          const subSystems = systems.filter(sys => String(sys.subjectId) === subIdKey);
          const sysIds = new Set(subSystems.map(s => String(s.id)));
          const matchedLogs = scoreLogs.filter(l => l.systemId && sysIds.has(String(l.systemId)));
          
          if (matchedLogs.length > 0) {
            const totalPct = matchedLogs.reduce((acc, l) => acc + l.percentage, 0);
            map.set(subIdKey, {
              id: sub.id,
              name: sub.name,
              count: matchedLogs.length,
              avgScore: Math.round((totalPct / matchedLogs.length) * 10) / 10,
              totalPct,
            });
          }
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      // Prioritize subjects with more score logs
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
  }, [scoreLogs, subjects, systems, subjectMap, systemMap]);

  // System Breakdown averages for Bar Chart
  const systemBreakdownData = useMemo(() => {
    return calculateSystemBreakdown(filteredLogs, systemMap, subjectMap);
  }, [filteredLogs, systemMap, subjectMap]);

  const handleDeleteLog = async (id: number) => {
    try {
      await db.scoreLogs.update(id, { deletedAt: new Date(), updatedAt: new Date() });
      toast({
        title: 'Entry Deleted',
        description: 'Score record removed successfully.',
      });
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const getPercentageColorBadge = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    if (pct >= 60) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    return 'bg-rose-500/10 text-rose-500 border-rose-500/30';
  };

  // Actionable Priority Recommendation Calculation
  const studyRecommendation = useMemo(() => {
    if (systems.length === 0) return null;

    // Filter systems if a specific subject is selected
    const scopedSystems = selectedSubjectId !== 'all'
      ? systems.filter(s => String(s.subjectId) === String(selectedSubjectId))
      : systems;

    if (scopedSystems.length === 0) return null;

    // Use DB state to find the most vulnerable system by decay/status
    const sortedByDecay = sortSystemsByRevisionPriority(scopedSystems, curriculumSets);
    const topVulnerable = sortedByDecay.length > 0 ? sortedByDecay[0] : null;

    if (topVulnerable && (isRevisionDue(topVulnerable, curriculumSets) || topVulnerable.status === 'Weak')) {
      const subName = subjectMap.get(topVulnerable.subjectId)?.name ?? 'Subject';
      const overdue = daysOverdue(topVulnerable, curriculumSets);
      
      let reason = '';
      let badge = '';
      let badgeColor = '';
      let titlePrefix = '';

      if (topVulnerable.status === 'Weak') {
        reason = `Retention for ${topVulnerable.name} is below baseline. A targeted drill will restore stability.`;
        badge = 'Priority Intervention';
        badgeColor = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25';
        titlePrefix = '';
      } else if (overdue > 0) {
        reason = `Overdue by ${overdue} day${overdue !== 1 ? 's' : ''}. A 15-minute targeted drill will restore retention to >80%.`;
        badge = 'Memory Recall Due';
        badgeColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25';
        titlePrefix = '';
      } else {
        reason = `Targeted revision scheduled today to maintain peak retention.`;
        badge = 'Scheduled Recall';
        badgeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
        titlePrefix = '';
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
    const activeMultiDay = scopedSystems.find(s => s.revisionState === 'in_progress');
    if (activeMultiDay) {
      const subName = subjectMap.get(activeMultiDay.subjectId)?.name ?? 'Subject';
      return {
        system: activeMultiDay,
        subjectName: subName,
        title: activeMultiDay.name,
        reason: `Active multi-day revision in progress. Resume block to halt decay.`,
        badge: 'Session In Progress',
        badgeColor: 'bg-primary/10 text-primary border-primary/30',
        isCritical: false
      };
    }

    return null;
  }, [systems, curriculumSets, subjectMap, selectedSubjectId]);

  const handleSetRecommendationAsPrimary = async (system: StudySystem) => {
    try {
      if (system.id) {
        await setFocus(system.id, 'primary');
        sonnerToast.success('Initiated Target Revision');
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to set focus', variant: 'destructive' });
    }
  };

  return {
    scoreLogs, mistakeLogs, subjects, scoredSubjects, systems, curriculumSets, densityLimit, setDensityLimit, searchQuery, setSearchQuery, chartData, displayLogs,
    isModalOpen, setIsModalOpen,
    filteredLogs, 
    systemBreakdownData, handleDeleteLog, studyRecommendation,
    handleSetRecommendationAsPrimary, systemMap, subjectMap, getPercentageColorBadge,
    stats, selectedType, setSelectedType, selectedSubjectId, setSelectedSubjectId,
    selectedSystemId, setSelectedSystemId, availableSystems
  };
}
