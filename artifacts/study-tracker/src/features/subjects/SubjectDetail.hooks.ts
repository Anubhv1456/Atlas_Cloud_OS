import { normalizeName } from '@/lib/exam-presets';
import { useState, useMemo } from 'react';
import { useLocation, useSearch } from 'wouter';
import { DropResult } from '@hello-pangea/dnd';
import {
  useSubject, useSystemsBySubject, usePYQsBySubject, useScoreLogsBySubject,
  addSystem, updateSubject, deleteSubject, updateSystemsOrder,
  addPYQYear, addPYQYearBatch, updatePYQYear, deletePYQYear, togglePYQYear,
} from '@/db';
import { PYQYear, StudySystem } from '@/db';
import { calculateSubjectProgress, calculateSystemProgress } from '@/lib/progress';
import { isRevisionDue, sortSystemsByRevisionPriority, daysOverdue, today } from '@/db/revisionEngine';
import { ALL_SYSTEMS, ALL_SUBJECTS } from '@/data/ontology';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';
import { calculateYearScoreMap, generateCustomYearRange } from '@/features/subjects/subjectUtils';
import { validateNumberOfYears, validateYearInput } from '@/lib/validation';

export interface SystemRecommendation {
  system: StudySystem;
  reason: 'overdue_decay' | 'weak_retention' | 'high_yield_incomplete' | 'next_syllabus_block';
  reasonLabel: string;
  actionLabel: string;
  progress: number;
  daysOverdueCount?: number;
}



export function usePYQSectionLogic(subjectId: number, subjectName: string, years: PYQYear[]) {
  const [expanded,             setExpanded]             = useState(true);
  const [viewMode,             setViewMode]             = useState<'grid' | 'list'>('grid');
  const [showAdd,              setShowAdd]              = useState(false);
  const [addValue,             setAddValue]             = useState('');
  const [editTarget,           setEditTarget]           = useState<PYQYear | null>(null);
  const [editValue,            setEditValue]            = useState('');
  const [pyqToDelete,          setPyqToDelete]          = useState<PYQYear | null>(null);
  const [showPYQDeleteConfirm, setShowPYQDeleteConfirm] = useState(false);
  const [scoreModalPyq,        setScoreModalPyq]        = useState<PYQYear | null>(null);

  // Preset / Range Generator state
  const [showPresetModal,      setShowPresetModal]      = useState(false);
  const currentYearNum                                  = new Date().getFullYear();
  const [presetEndYear,        setPresetEndYear]        = useState<string>(String(currentYearNum));
  const [presetSpan,           setPresetSpan]           = useState<string>('5');
  const [presetPrefix,         setPresetPrefix]         = useState<string>('');

  const scoreLogs = useScoreLogsBySubject(subjectId);

  const yearScoreMap = useMemo(() => {
    return calculateYearScoreMap(scoreLogs);
  }, [scoreLogs]);

  const completed = years.filter(y => y.completed).length;
  const total     = years.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleAdd = async () => {
    const v = addValue.trim();
    if (!v) return;
    await addPYQYear(subjectId, v);
    setAddValue(''); setShowAdd(false);
  };

  const handleQuickAdd5YearDefaults = async () => {
    const generated: string[] = [];
    for (let i = 0; i < 5; i++) {
      generated.push(`${currentYearNum - i}`);
    }
    await addPYQYearBatch(subjectId, generated);
  };

  const spanValidation = validateNumberOfYears(presetSpan, { min: 1, max: 30, fieldName: 'Number of years' });
  const endYearValidation = validateYearInput(presetEndYear, { minYear: 1950, maxYear: currentYearNum + 10, fieldName: 'Latest year' });

  const handleGenerateCustomRange = async () => {
    if (!spanValidation.isValid || !endYearValidation.isValid) return;
    const end = endYearValidation.value;
    const span = spanValidation.value;
    const generated: string[] = [];
    const prefixStr = presetPrefix.trim() ? `${presetPrefix.trim()} ` : '';

    for (let i = 0; i < span; i++) {
      generated.push(`${prefixStr}${end - i}`);
    }

    await addPYQYearBatch(subjectId, generated);
    setShowPresetModal(false);
  };

  const handleEditSave = async () => {
    if (!editTarget || !editValue.trim()) return;
    await updatePYQYear(editTarget.id!, editValue.trim());
    setEditTarget(null); setEditValue('');
  };

  const handlePYQDeleteClick = (year: PYQYear) => {
    setPyqToDelete(year);
    setShowPYQDeleteConfirm(true);
  };

  const handlePYQDeleteConfirm = async () => {
    if (pyqToDelete) {
      setShowPYQDeleteConfirm(false);
      await deletePYQYear(pyqToDelete.id!);
      setPyqToDelete(null);
    }
  };

  const handleToggle = (year: PYQYear) => {
    const wasCompleted = year.completed;
    togglePYQYear(year.id!, subjectId, subjectName, year.year, wasCompleted);
    if (!wasCompleted) {
      setScoreModalPyq(year);
    }
  };

  const handleMarkAllComplete = async () => {
    for (const y of years) {
      if (!y.completed && y.id) {
        await togglePYQYear(y.id, subjectId, subjectName, y.year, false);
      }
    }
  };

  return {
    expanded, setExpanded,
    viewMode, setViewMode,
    showAdd, setShowAdd,
    addValue, setAddValue,
    editTarget, setEditTarget,
    editValue, setEditValue,
    pyqToDelete, setPyqToDelete,
    showPYQDeleteConfirm, setShowPYQDeleteConfirm,
    scoreModalPyq, setScoreModalPyq,
    showPresetModal, setShowPresetModal,
    currentYearNum,
    presetEndYear, setPresetEndYear,
    presetSpan, setPresetSpan,
    presetPrefix, setPresetPrefix,
    yearScoreMap,
    completed, total, percentage,
    handleAdd, handleQuickAdd5YearDefaults,
    spanValidation, endYearValidation, handleGenerateCustomRange,
    handleEditSave, handlePYQDeleteClick, handlePYQDeleteConfirm,
    handleToggle, handleMarkAllComplete
  };
}

export function useSubjectDetailLogic(id: string | undefined) {
  const search  = useSearch();
  const subjectId = id as string | number; // allow string IDs
  const [, setLocation] = useLocation();

  const subject  = useSubject(subjectId);
  const effectiveSubjectId = subject?.id ?? subjectId;
  const rawSystems  = useSystemsBySubject(effectiveSubjectId);
  const pyqYears = usePYQsBySubject(effectiveSubjectId);

  const systems = useMemo(() => {
    return [...rawSystems].sort((a, b) => (a.order ?? Number.MAX_VALUE) - (b.order ?? Number.MAX_VALUE));
  }, [rawSystems]);

  const [showAddSystem, setShowAddSystem] = useState(false);
  
  
  
  
  const highlightId = (() => {
    const params = new URLSearchParams(search);
    const v = params.get('highlight');
    return v ? v : null;
  })();

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
        const items = Array.from(systems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updates = items.map((item, index) => ({
      id: item.id!,
      order: index
    }));
    await updateSystemsOrder(updates);
  };

  
  
  const allTopicIds = systems.flatMap(sys => {
    const ontologySubject = subject ? ALL_SUBJECTS.find(s => s.name === subject.name) : undefined;
    const os = ALL_SYSTEMS.find(s => s.subjectId === ontologySubject?.id && normalizeName(s.name) === normalizeName(sys.name));
    return os ? os.topics.map(t => t.id) : [];
  });
  
  const allTopicsStr = allTopicIds.join(',');
  const topicProgresses = useLiveQuery(
    () => {
      if (allTopicIds.length === 0) return [];
      return db.topicProgress.where('topicId').anyOf(allTopicIds).toArray();
    }, 
    [allTopicsStr]
  ) || [];

  const revisionSets = useLiveQuery(
    () => {
      if (!subject?.id) return [];
      return (db.curriculumSets || db.revisionSets)
        .where('subjectId')
        .equals(subject.id)
        .filter(s => !s.deletedAt)
        .toArray();
    },
    [subject?.id]
  ) || [];

  const totalTasks = revisionSets.length;
  const completedTasks = revisionSets.reduce((acc, rs) => acc + ((rs.contentCompleted && rs.qbankCompleted) ? 1 : 0), 0);
  const progress = subject && systems ? calculateSubjectProgress(subject, systems, revisionSets) : 0;

  const pyqCompletedCount = pyqYears.filter(y => y.completed).length;
  const pyqTotalCount = pyqYears.length;

  const now = today();
  const overdueSystems = useMemo(() => {
    return systems.filter(sys => isRevisionDue(sys, revisionSets, now) || sys.status === 'Weak');
  }, [systems, revisionSets, now]);

  const recommendedFocus = useMemo<SystemRecommendation | null>(() => {
    if (!subject || systems.length === 0) return null;
    const subjectName = subject.name;

    // Precompute system progress map
    const systemProgressMap = new Map<number | string, number>();
    systems.forEach(sys => {
      if (sys.id !== undefined) {
        systemProgressMap.set(sys.id, calculateSystemProgress(sys, subjectName, revisionSets));
      }
    });

    // 1. Priority 1: Active Memory Decay & Overdue Spaced Repetition
    const dueSystems = systems.filter(sys => isRevisionDue(sys, revisionSets, now));
    if (dueSystems.length > 0) {
      const sortedDue = sortSystemsByRevisionPriority(dueSystems, revisionSets, now);
      const topDue = sortedDue[0];
      const overdueDays = daysOverdue(topDue, revisionSets, now);
      const prog = systemProgressMap.get(topDue.id!) ?? 0;

      return {
        system: topDue,
        reason: 'overdue_decay',
        reasonLabel: overdueDays > 0 ? `${overdueDays}d Overdue Revision` : 'Revision Due Today',
        actionLabel: 'Review System',
        progress: prog,
        daysOverdueCount: overdueDays,
      };
    }

    // 2. Priority 2: Weak Retention Flags
    const weakSystems = systems.filter(sys => sys.status === 'Weak');
    if (weakSystems.length > 0) {
      const sortedWeak = [...weakSystems].sort((a, b) => {
        const progA = systemProgressMap.get(a.id!) ?? 0;
        const progB = systemProgressMap.get(b.id!) ?? 0;
        return progA - progB;
      });
      const topWeak = sortedWeak[0];
      const prog = systemProgressMap.get(topWeak.id!) ?? 0;

      return {
        system: topWeak,
        reason: 'weak_retention',
        reasonLabel: 'Weak Retention Flag',
        actionLabel: 'Reinforce Weak System',
        progress: prog,
      };
    }

    // 3. Priority 3: Incomplete High-Yield Systems
    const highYieldIncomplete = systems.filter(sys => {
      const prog = systemProgressMap.get(sys.id!) ?? 0;
      return sys.isHighYield && prog < 100;
    });
    if (highYieldIncomplete.length > 0) {
      const topHY = highYieldIncomplete[0];
      const prog = systemProgressMap.get(topHY.id!) ?? 0;

      return {
        system: topHY,
        reason: 'high_yield_incomplete',
        reasonLabel: 'High-Yield Priority Block',
        actionLabel: prog === 0 ? 'Start High-Yield' : 'Continue High-Yield',
        progress: prog,
      };
    }

    // 4. Priority 4: Next Incomplete Syllabus System in order
    const nextIncomplete = systems.find(sys => {
      const prog = systemProgressMap.get(sys.id!) ?? 0;
      return prog < 100;
    });
    if (nextIncomplete) {
      const prog = systemProgressMap.get(nextIncomplete.id!) ?? 0;

      return {
        system: nextIncomplete,
        reason: 'next_syllabus_block',
        reasonLabel: 'Next Syllabus Module',
        actionLabel: prog === 0 ? 'Start System' : 'Continue System',
        progress: prog,
      };
    }

    // 5. All systems 100% complete and no revisions due
    return null;
  }, [subject, systems, revisionSets, now]);

  const isSubjectMastered = useMemo(() => {
    if (!subject || systems.length === 0) return false;
    const hasDue = systems.some(sys => isRevisionDue(sys, revisionSets, now));
    if (hasDue) return false;
    const all100 = systems.every(sys => {
      const prog = calculateSystemProgress(sys, subject.name, revisionSets);
      return prog === 100;
    });
    return all100;
  }, [subject, systems, revisionSets, now]);

  return {
    subjectId, subject, systems, pyqYears,
    showAddSystem, setShowAddSystem,
    highlightId, handleDragEnd,
    totalTasks, completedTasks, progress,
    pyqCompletedCount, pyqTotalCount,
    overdueSystemsCount: overdueSystems.length,
    recommendedFocus,
    recommendedSystem: recommendedFocus?.system || null,
    isSubjectMastered,
    pyqUnlocked: true, 
  };
}
