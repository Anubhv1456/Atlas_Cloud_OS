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
    const map = new Map<number, Subject>();
    subjects.forEach(s => { if (s.id) map.set(s.id, s); });
    return map;
  }, [subjects]);

  const systemMap = useMemo(() => {
    const map = new Map<number, StudySystem>();
    systems.forEach(sys => { if (sys.id) map.set(sys.id, sys); });
    return map;
  }, [systems]);

  // Available systems for selected subject
  const availableSystems = useMemo(() => {
    if (selectedSubjectId === 'all') return systems;
    const subId = selectedSubjectId as string | number;
    return systems.filter(sys => sys.subjectId === subId);
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
    return formatChartData(displayLogs, subjectMap);
  }, [displayLogs, subjectMap]);

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

    // Phase 5: The Clinical Intervention (The Apex Alert)
    // We want strictly actionable, high-priority clinical thresholds based on retention metrics first.
    
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
          reason = `Critical: ${topVulnerable.name} retention has dropped below safety thresholds.`;
          badge = 'Critical Vulnerability';
          badgeColor = 'bg-rose-500/15 text-rose-500 border-rose-500/30';
          titlePrefix = 'CRITICAL: ';
      } else if (overdue > 0) {
        reason = `Warning: ${topVulnerable.name} is overdue by ${overdue} day${overdue !== 1 ? 's' : ''}. Memory decay accelerating.`;
        badge = 'Accelerated Decay';
        badgeColor = 'bg-amber-500/15 text-amber-500 border-amber-500/30';
        titlePrefix = 'WARNING: ';
      } else {
        reason = `Targeted revision due today to maintain retention state.`;
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
        reason: `Active multi-day revision in progress. Resume block to halt decay.`,
        badge: 'Session In Progress',
        badgeColor: 'bg-primary/10 text-primary border-primary/30',
        isCritical: false
      };
    }

    return null;
  }, [systems, curriculumSets, subjectMap]);

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
    scoreLogs, subjects, systems, densityLimit, setDensityLimit, searchQuery, setSearchQuery, chartData, displayLogs,
    isModalOpen, setIsModalOpen,
    filteredLogs, 
    systemBreakdownData, handleDeleteLog, studyRecommendation,
    handleSetRecommendationAsPrimary, systemMap, subjectMap, getPercentageColorBadge,
    stats, selectedType, setSelectedType, selectedSubjectId, setSelectedSubjectId,
    selectedSystemId, setSelectedSystemId, availableSystems
  };
}
