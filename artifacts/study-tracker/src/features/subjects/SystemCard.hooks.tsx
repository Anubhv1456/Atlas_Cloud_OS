import { normalizeName } from '@/lib/exam-presets';
import React, { useState, useRef, useEffect } from 'react';
import { 
  StudySystem, SystemStatus, 
  updateSystem, deleteSystem, logCompletion, db, deleteHistoryEntry, 
  recordInitialEvaluation, completeRevision 
} from '@/db';
import { submitMarker, MarkerType } from '@/lib/markers';
import { getUserAlias } from '@/lib/user';
import { useAuth } from '@/hooks/useAuth';
import { calculateSystemProgress } from '@/lib/progress';
import { isRevisionDue, isRevisionOverdue, daysOverdue } from '@/db';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { useLiveQuery } from 'dexie-react-hooks';
import { ALL_SYSTEMS, ALL_SUBJECTS } from '@/data/ontology';
import { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';

export interface SystemCardProps {
  system: StudySystem;
  subjectName: string;
  defaultExpanded?: boolean;
  highlighted?: boolean;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

export function useSystemCardLogic({
  system,
  subjectName,
  defaultExpanded = false,
  highlighted = false,
}: SystemCardProps) {

  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Content dialogs
  const [showInitDialog, setShowInitDialog]   = useState(false);
  const [initValue, setInitValue]             = useState('');
  const [showEditContent, setShowEditContent] = useState(false);
  const [editCompleted, setEditCompleted]     = useState('');
  const [editTotal, setEditTotal]             = useState('');

  // Initial evaluation (shown once both tasks complete)
  const [showEvalDialog, setShowEvalDialog]   = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoreModalTopicId, setScoreModalTopicId] = useState<string | undefined>();
  const [scoreModalTopicName, setScoreModalTopicName] = useState<string | undefined>();
  const [showDecayCalibration, setShowDecayCalibration] = useState(false);

  // Rename dialog state
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameValue, setRenameValue]             = useState(system.name);

  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>();
  const [selectedTopicName, setSelectedTopicName] = useState<string | undefined>();
  const [showInsightDialog, setShowInsightDialog] = useState(false);
  const [showViewMarkersDialog, setShowViewMarkersDialog] = useState(false);
  const [insightContent, setInsightContent] = useState('');
  const [insightType, setInsightType] = useState<MarkerType>('pitfall');
  const [insightSource, setInsightSource] = useState('');
  const [isSubmittingInsight, setIsSubmittingInsight] = useState(false);
  const { user } = useAuth();

  // Guard to prevent re-triggering if already open
  const evalShownRef = useRef(false);

  // Long-press detection for Content row
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress    = useRef(false);

  // ── Auto-expand + scroll when navigated from search ──────────────────────
  useEffect(() => {
    if (highlighted && cardRef.current) {
      setExpanded(true);
      setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
    }
  }, [highlighted]);

  // ── Detect first full completion ──────────────────────────────────────────
  useEffect(() => {
    if (
      system.contentCompleted &&
      system.qbankDone &&
      !system.completionDate &&
      !evalShownRef.current
    ) {
      evalShownRef.current = true;
      setShowEvalDialog(true);
    }
  }, [system.contentCompleted, system.qbankDone, system.completionDate]);

  const ontologySubject = ALL_SUBJECTS.find(s => s.name === subjectName);
  const ontologySystem = ALL_SYSTEMS.find(s => s.subjectId === ontologySubject?.id && normalizeName(s.name) === normalizeName(system.name));
  // Merge ontology topics with custom topics
  let mergedTopics = ontologySystem ? [...ontologySystem.topics] : [];
  if (system.customTopics) {
    system.customTopics.forEach(ct => {
      const idx = mergedTopics.findIndex(t => t.id === ct.id);
      if (idx >= 0) {
        if (ct.deleted) {
           mergedTopics[idx] = { ...mergedTopics[idx], deleted: true } as any;
        } else {
           mergedTopics[idx] = { ...mergedTopics[idx], name: ct.name };
        }
      } else if (!ct.deleted) {
        mergedTopics.push({
           id: ct.id,
           subjectId: ontologySubject?.id || '',
           systemId: ontologySystem?.id || '',
           name: ct.name,
           highYield: false,
           estimatedStudyMinutes: 0,
           relatedTopics: [],
           aliases: [],
           pyqWeight: 0,
           difficulty: 'average'
        });
      }
    });
  }
  const finalTopics = mergedTopics.filter(t => !(t as any).deleted);
  const topicProgresses = useLiveQuery(
    () => {
      if (!finalTopics || finalTopics.length === 0) return [];
      return db.topicProgress.where('topicId').anyOf(finalTopics.map(t => t.id)).toArray();
    },
    [finalTopics.map(t => t.id).join(',')]
  ) || [];

  const curriculumSets = useLiveQuery(
    () => (db.curriculumSets || db.revisionSets).filter(s => s.systemId === system.id && !s.deletedAt).toArray(),
    [system.id]
  ) || [];

  // Progress
  const progress = calculateSystemProgress(curriculumSets);
  const completedCount = (system.contentCompleted ? 1 : 0) + (system.qbankDone ? 1 : 0);
  const contentPct     =
    system.contentInitialized && system.contentUnitsTotal > 0
      ? (system.contentUnitsCompleted / system.contentUnitsTotal) * 100
      : (system.contentCompleted ? 100 : 0);

  // Revision state
  const revisionDue      = isRevisionDue(system);
  const revisionOverdue  = isRevisionOverdue(system);
  const overdueDays      = daysOverdue(system);

  const handleUpdateTopic = async (topicId: string, updates: { name?: string; deleted?: boolean }) => {
     let customTopics = system.customTopics ? [...system.customTopics] : [];
     const existingIndex = customTopics.findIndex(t => t.id === topicId);
     
     if (existingIndex >= 0) {
        customTopics[existingIndex] = { ...customTopics[existingIndex], ...updates };
     } else {
        const baseTopic = ontologySystem?.topics.find(t => t.id === topicId);
        customTopics.push({ id: topicId, name: updates.name || baseTopic?.name || 'Unknown', deleted: updates.deleted });
     }
     await updateSystem(system.id!, { customTopics });
  };

  const handleRenameTopic = (topicId: string, name: string) => {
    handleUpdateTopic(topicId, { name });
  };

  const handleDeleteTopic = (topicId: string) => {
    handleUpdateTopic(topicId, { deleted: true });
  };

  const handleAddCustomTopic = async (name: string) => {
     let customTopics = system.customTopics ? [...system.customTopics] : [];
     customTopics.push({ id: `CUSTOM_TOPIC_${Date.now()}`, name });
     await updateSystem(system.id!, { customTopics });
     toast.success('Custom topic added');
  };



  // ── Content tap ───────────────────────────────────────────────────────────
  const handleContentTap = () => {
    if (isLongPress.current) return;
    if (!system.contentInitialized) { setInitValue(''); setShowInitDialog(true); return; }
    if (system.contentCompleted) {
      setEditCompleted(String(system.contentUnitsCompleted));
      setEditTotal(String(system.contentUnitsTotal));
      setShowEditContent(true);
      return;
    }

    const newCompleted = system.contentUnitsCompleted + 1;
    const isNowDone    = newCompleted >= system.contentUnitsTotal;
    updateSystem(system.id!, { contentUnitsCompleted: newCompleted, contentCompleted: isNowDone });

    logCompletion({
      subjectId: system.subjectId,
      subjectName,
      systemId: system.id!,
      systemName: system.name,
      taskKey: isNowDone ? 'contentDone' : 'contentProgress',
      taskLabel: system.contentUnitsTotal > 0 ? `Content (${newCompleted}/${system.contentUnitsTotal})` : 'Content',
      completedAt: new Date(),
    });

    if (isNowDone) {
      if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#eab308', '#f59e0b', '#d97706'] });
    }
  };

  const handleContentPointerDown = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      if (navigator.vibrate) navigator.vibrate(30);
      setEditCompleted(String(system.contentUnitsCompleted));
      setEditTotal(String(system.contentUnitsTotal));
      setShowEditContent(true);
    }, 500);
  };
  const handleContentPointerUp    = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };
  const handleContentPointerLeave = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };

  // ── Content init / edit ───────────────────────────────────────────────────
  const handleInitSave = () => {
    const total = parseInt(initValue, 10);
    if (!total || total <= 0) return;
    updateSystem(system.id!, { contentInitialized: true, contentUnitsTotal: total, contentUnitsCompleted: 0, contentCompleted: false });
    setShowInitDialog(false); setInitValue('');
  };

  const handleEditSave = () => {
    const total = parseInt(editTotal, 10), completed = parseInt(editCompleted, 10);
    if (isNaN(total) || total <= 0 || isNaN(completed) || completed < 0) return;
    const clamped = Math.min(completed, total);
    const prevCompleted = system.contentUnitsCompleted;
    const isNowDone = clamped >= total;

    updateSystem(system.id!, { contentInitialized: true, contentUnitsTotal: total, contentUnitsCompleted: clamped, contentCompleted: isNowDone });

    if (clamped > prevCompleted) {
      logCompletion({
        subjectId: system.subjectId,
        subjectName,
        systemId: system.id!,
        systemName: system.name,
        taskKey: isNowDone ? 'contentDone' : 'contentProgress',
        taskLabel: `Content (${clamped}/${total})`,
        completedAt: new Date(),
      });
    }

    setShowEditContent(false);
  };

  const handleEditReset = () => {
    updateSystem(system.id!, { contentInitialized: false, contentUnitsTotal: 0, contentUnitsCompleted: 0, contentCompleted: false });
    setShowEditContent(false);
  };

  // ── QBank toggle ──────────────────────────────────────────────────────────
  const toggleQBank = async () => {
    const wasChecked = system.qbankDone;
    if (wasChecked) {
      const historyEntries = await db.history
        .where('systemId')
        .equals(system.id!)
        .filter(h => h.taskKey === 'qbankDone' && !h.deletedAt)
        .toArray();
      if (historyEntries.length > 0) {
        historyEntries.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        await deleteHistoryEntry(historyEntries[0].id!);
      } else {
        await updateSystem(system.id!, {
          qbankDone: false,
          completionDate: null,
          nextRevisionDate: null,
        });
      }
    } else {
      updateSystem(system.id!, { qbankDone: true });
      if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#3b82f6', '#2563eb', '#1d4ed8'] });
      logCompletion({ subjectId: system.subjectId, subjectName, systemId: system.id!, systemName: system.name, taskKey: 'qbankDone', taskLabel: 'Qbank', completedAt: new Date() });
    }
  };

  // ── Initial evaluation ────────────────────────────────────────────────────
  const handleEvalSelect = async (confidence: SystemStatus) => {
    setShowEvalDialog(false);
    evalShownRef.current = false;
    await recordInitialEvaluation(system.id!, confidence);
  };

  const handleStatusChange = (status: SystemStatus) => updateSystem(system.id!, { status });
  const [localNotes, setLocalNotes] = useState(system.weakAreas || '');
  useEffect(() => {
    if (system.weakAreas !== localNotes && !localNotes) {
      setLocalNotes(system.weakAreas || '');
    }
  }, [system.weakAreas]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localNotes !== (system.weakAreas || '')) {
        updateSystem(system.id!, { weakAreas: localNotes });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [localNotes, system.id, system.weakAreas]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalNotes(e.target.value);
  };
  const handleDelete       = () => { setShowDeleteConfirm(true); };
  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    deleteSystem(system.id!);
  };

  const handleRenameSave = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    if (trimmed !== system.name) {
      await updateSystem(system.id!, { name: trimmed });
      toast.success('System Renamed', {
        description: `Renamed to "${trimmed}" successfully.`,
      });
    }
    setShowRenameDialog(false);
  };

  const handleInsightSubmit = async () => {
    const content = insightContent.trim();
    if (!content) return;
    setIsSubmittingInsight(true);
    try {
      let alias = `Waypoint ${Math.floor(Math.random() * 900) + 100}`;
      if (user?.uid) {
        alias = await getUserAlias(user.uid);
      }

      const trimmedSource = insightSource.trim();

      await submitMarker({
        subjectId: system.subjectId,
        systemId: system.id!,
        topicId: selectedTopicId,
        subjectName,
        systemName: system.name,
        topicName: selectedTopicName,
        type: insightType,
        content,
        ...(trimmedSource ? { source: trimmedSource } : {}),
        userId: user?.uid || null,
        authorAlias: alias,
      });
      toast.success('Marker Left', {
        description: 'Thanks! Your marker has been placed on the trail.',
      });
      setShowInsightDialog(false);
      setInsightContent('');
      setInsightSource('');
    } catch (e) {
      console.error('Error submitting marker:', e);
      toast.error('Failed to leave marker', {
        description: e instanceof Error ? e.message : 'Please try again later.',
      });
    } finally {
      setIsSubmittingInsight(false);
    }
  };

  

  const handleSetLogScore = (id: string, name: string) => {
    setScoreModalTopicId(id);
    setScoreModalTopicName(name);
    setScoreModalTopicId(undefined);
    setScoreModalTopicName(undefined);
    setShowScoreModal(true);
  };

  const handleRevisionComplete = async () => {
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#059669', '#047857'] });
    await completeRevision(system.id!, (system.status || 'Average'), system.subjectId, subjectName, system.name);
    setShowScoreModal(true);
    setTimeout(() => {
      toast('Know a great mnemonic?', {
        description: 'Leave a marker for the next Wayfinder.',
        action: {
          label: 'Leave Marker',
          onClick: () => setShowInsightDialog(true)
        }
      });
    }, 2500);
  };

  
  return {
    expanded, setExpanded,
    showInitDialog, setShowInitDialog, initValue, setInitValue,
    showEditContent, setShowEditContent, editCompleted, setEditCompleted, editTotal, setEditTotal,
    showEvalDialog, setShowEvalDialog, showDeleteConfirm, setShowDeleteConfirm,
    showScoreModal, setShowScoreModal, scoreModalTopicId, scoreModalTopicName, handleSetLogScore, showDecayCalibration, setShowDecayCalibration,
    showRenameDialog, setShowRenameDialog, renameValue, setRenameValue,
    showInsightDialog, setShowInsightDialog, showViewMarkersDialog, setShowViewMarkersDialog, selectedTopicId, setSelectedTopicId, selectedTopicName, setSelectedTopicName, insightContent, setInsightContent,
    insightType, setInsightType, insightSource, setInsightSource, isSubmittingInsight, handleInsightSubmit,
    cardRef, progress, completedCount, contentPct,
    revisionDue, revisionOverdue, overdueDays,
    handleContentTap, handleContentPointerDown, handleContentPointerUp, handleContentPointerLeave,
    handleInitSave, handleEditSave, handleEditReset, toggleQBank, handleEvalSelect,
    localNotes, handleStatusChange, handleNotesChange, handleDelete, handleDeleteConfirm,
    handleRenameSave, handleRevisionComplete,
    handleUpdateTopic,
    handleRenameTopic,
    handleDeleteTopic,
    handleAddCustomTopic,
    finalTopics
  };
}
