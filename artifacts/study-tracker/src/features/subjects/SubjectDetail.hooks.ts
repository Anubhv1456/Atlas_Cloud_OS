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
import { calculateSubjectProgress } from '@/lib/progress';
import { ALL_SYSTEMS, ALL_SUBJECTS } from '@/data/ontology';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { calculateCompletedTopicTasks, calculateTopicsProgressPercentage } from '@/lib/progress';
import { calculateYearScoreMap, generateCustomYearRange } from '@/features/subjects/subjectUtils';
import { validateNumberOfYears, validateYearInput } from '@/lib/validation';

type StageKey = 'contentCompleted' | 'qbankDone';

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
  const subjectId = parseInt(id || '0', 10);
  const [, setLocation] = useLocation();

  const subject  = useSubject(subjectId);
  const rawSystems  = useSystemsBySubject(subjectId);
  const pyqYears = usePYQsBySubject(subjectId);

  const systems = useMemo(() => {
    return [...rawSystems].sort((a, b) => (a.order ?? Number.MAX_VALUE) - (b.order ?? Number.MAX_VALUE));
  }, [rawSystems]);

  const [showAddSystem, setShowAddSystem] = useState(false);
  
  
  
  const [activeFilter,  setActiveFilter]  = useState<StageKey | null>(null);

  const highlightId = (() => {
    const params = new URLSearchParams(search);
    const v = params.get('highlight');
    return v ? parseInt(v, 10) : null;
  })();

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    if (activeFilter !== null) return;
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
  const topicProgresses = useLiveQuery(() => db.topicProgress.where('topicId').anyOf(allTopicIds).toArray(), [allTopicsStr]) || [];

  const totalTasks     = allTopicIds.length * 2;
  const completedTasks = calculateCompletedTopicTasks(topicProgresses);
  const progress = calculateTopicsProgressPercentage(topicProgresses, allTopicIds.length);

  const pyqUnlocked = allTopicIds.length > 0 && allTopicIds.length === topicProgresses.filter(tp => tp.contentStatus === 'completed' && tp.qbankStatus === 'completed').length;

  const stagePct = (key: StageKey) => {
    if (allTopicIds.length === 0) return 0;
    
    // Instead of system level, we count topic level
    let done = 0;
    for (const tp of topicProgresses) {
      if (key === 'contentCompleted' && tp.contentStatus === 'completed') done++;
      if (key === 'qbankDone' && tp.qbankStatus === 'completed') done++;
    }
    return Math.round((done / allTopicIds.length) * 100);
  };

  const visibleSystems: StudySystem[] = activeFilter
    ? systems.filter(s => !s[activeFilter])
    : systems;

  const handleDonutClick = (key: StageKey) => {
    setActiveFilter(prev => (prev === key ? null : key));
  };

  return {
    subjectId, subject, systems, pyqYears,
    showAddSystem, setShowAddSystem,
    
    
    
    activeFilter, setActiveFilter,
    highlightId, handleDragEnd,
    totalTasks, completedTasks, progress,
    pyqUnlocked, stagePct, visibleSystems,
    handleDonutClick, 
  };
}
