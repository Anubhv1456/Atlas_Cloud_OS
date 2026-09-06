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
import { useLiveQuery } from '@/hooks/useLiveQuery';
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
  const [showLogSession, setShowLogSession] = useState(false);

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
      
      false &&
      
      !evalShownRef.current
    ) {
      evalShownRef.current = true;
      setShowEvalDialog(true);
    }
  }, [false]);

  const ontologySubject = ALL_SUBJECTS.find(s => 
    s.name?.toLowerCase() === subjectName?.toLowerCase() ||
    (system.subjectId && String(s.id).toLowerCase() === String(system.subjectId).replace(/^subj_/, '').toLowerCase())
  );
  const ontologySystem = ALL_SYSTEMS.find(s => 
    (system.ontologySystemId && s.id === system.ontologySystemId) ||
    (s.id && system.id && String(s.id).toLowerCase() === String(system.id).replace(/^sys_/, '').toLowerCase()) ||
    ((ontologySubject ? s.subjectId === ontologySubject.id : true) && 
    normalizeName(s.name) === normalizeName(system.name))
  );
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
  const progress = calculateSystemProgress(system, subjectName, curriculumSets);
  const completedCount = 0;
  const contentPct = 0;
    false
      ? (system.contentUnitsCompleted / system.contentUnitsTotal) * 100
      : 0;

  // Revision state
  const revisionDue      = isRevisionDue(system, curriculumSets || []);
  const revisionOverdue  = isRevisionOverdue(system, curriculumSets || []);
  const overdueDays      = daysOverdue(system, curriculumSets || []);

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

  const handleRenameTopic = async (topicId: string, name: string) => {
    try {
      const cleanName = name.trim();
      if (!cleanName) return;
      await handleUpdateTopic(topicId, { name: cleanName });
      toast.success(`Renamed topic to "${cleanName}"`);
    } catch (e: any) {
      console.error('Failed to rename topic:', e);
      toast.error('Failed to rename topic', { description: e?.message });
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    try {
      await handleUpdateTopic(topicId, { deleted: true });
      // Remove topic ID from any curriculumSets or revisionSets
      const targetTable = db.curriculumSets || db.revisionSets;
      if (targetTable) {
        const sets = await targetTable.where('systemId').equals(system.id!).toArray();
        for (const s of sets) {
          if (s.topicIds && s.topicIds.includes(topicId)) {
            const nextTopicIds = s.topicIds.filter(id => id !== topicId);
            await targetTable.update(s.id!, {
              topicIds: nextTopicIds,
              updatedAt: new Date(),
              hlc: generateHLC()
            });
          }
        }
      }
      toast.success('Topic deleted');
    } catch (e: any) {
      console.error('Failed to delete topic:', e);
      toast.error('Failed to delete topic', { description: e?.message });
    }
  };

  const handleAddCustomTopic = async (name: string) => {
     const cleanName = name.trim();
     if (!cleanName) return;
     let customTopics = system.customTopics ? [...system.customTopics] : [];
     customTopics.push({ id: `CUSTOM_TOPIC_${Date.now()}`, name: cleanName });
     await updateSystem(system.id!, { customTopics });
     toast.success(`Added "${cleanName}"`);
  };

  const handleResetTopics = async () => {
    try {
      await updateSystem(system.id!, { customTopics: [] });
      toast.success('Topics restored to default curriculum');
    } catch (e: any) {
      console.error('Failed to reset topics:', e);
      toast.error('Failed to reset topics', { description: e?.message });
    }
  };



  // ── Content tap ───────────────────────────────────────────────────────────

  const toggleQBank = async () => {
    // Left empty for now, maybe we remove this too? Or leave it as is if it's unused.
  };

  const handleEvalSelect = async (status: SystemStatus) => {
    await recordInitialEvaluation(system.id!, status);
    setShowEvalDialog(false);
  };

  const toggleHighYield = async () => {
    await updateSystem(system.id!, { isHighYield: !system.isHighYield });
  };

  const handleStatusChange = async (status: SystemStatus) => {
    await updateSystem(system.id!, { status });
  };

  const handleNotesChange = async (notes: string) => {
    setLocalNotes(notes);
    await updateSystem(system.id!, { notes });
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (system.id !== undefined && system.id !== null) {
        await deleteSystem(system.id);
        setShowDeleteConfirm(false);
        toast.success(`Deleted ${system.name}`);
      }
    } catch (e: any) {
      console.error('Failed to delete system:', e);
      toast.error('Failed to delete system', { description: e?.message || 'Unknown database error' });
    }
  };

  const handleRenameSave = async () => {
    if (!renameValue.trim() || renameValue.trim() === system.name) {
      setShowRenameDialog(false);
      return;
    }
    await updateSystem(system.id!, { name: renameValue.trim() });
    setShowRenameDialog(false);
    toast.success('System renamed');
  };

  const handleSetLogScore = (topicId: string, topicName: string) => {
    setScoreModalTopicId(topicId);
    setScoreModalTopicName(topicName);
    setShowScoreModal(true);
  };

  const handleInsightSubmit = async () => {
    if (!insightContent.trim()) return;
    setIsSubmittingInsight(true);
    try {
      const alias = await getUserAlias();
      await submitMarker({
        subjectId: system.subjectId,
        subjectName: props.subjectName,
        systemName: system.name,
        topicName: selectedTopicName || "",
        systemId: system.id!,
        topicId: selectedTopicId,
        type: insightType,
        content: insightContent.trim(),
        authorAlias: alias,
        userId: user?.uid || null,
        source: insightSource.trim() || undefined
      });
      toast.success('Marker placed successfully', {
        description: selectedTopicName ? `Added to ${selectedTopicName}` : 'Added to system'
      });
      setInsightContent('');
      setInsightSource('');
      setShowInsightDialog(false);
    } catch (e: any) {
      toast.error('Failed to place marker', {
        description: e.message || 'Please try again later'
      });
    } finally {
      setIsSubmittingInsight(false);
    }
  };

  const handleRevisionComplete = async () => {
    await completeRevision(system.id!);
    toast.success('Revision completed', {
      description: 'Progress logged and next date scheduled.'
    });
  };

  const [localNotes, setLocalNotes] = useState(system.notes || '');


  const weakTopicsCount = topicProgresses.filter(tp => tp.isWeak).length;
  const totalTopicsCount = finalTopics.length;
  const blocksCompleted = curriculumSets.filter(s => s.contentCompleted && s.qbankCompleted).length;
  const blocksTotal = curriculumSets.length;

  return {
    expanded, setExpanded,
    showInitDialog, setShowInitDialog, initValue, setInitValue,
    showEditContent, setShowEditContent, editCompleted, setEditCompleted, editTotal, setEditTotal,
    showEvalDialog, setShowEvalDialog, showDeleteConfirm, setShowDeleteConfirm,
    showScoreModal, setShowScoreModal, scoreModalTopicId, scoreModalTopicName, handleSetLogScore, showDecayCalibration, setShowDecayCalibration,
    showLogSession, setShowLogSession,
    showRenameDialog, setShowRenameDialog, renameValue, setRenameValue,
    showInsightDialog, setShowInsightDialog, showViewMarkersDialog, setShowViewMarkersDialog, selectedTopicId, setSelectedTopicId, selectedTopicName, setSelectedTopicName, insightContent, setInsightContent,
    insightType, setInsightType, insightSource, setInsightSource, isSubmittingInsight, handleInsightSubmit,
    cardRef, progress, completedCount, contentPct,
    revisionDue, revisionOverdue, overdueDays,
    weakTopicsCount, totalTopicsCount, blocksCompleted, blocksTotal,
    toggleQBank, handleEvalSelect, toggleHighYield,
    localNotes, handleStatusChange, handleNotesChange, handleDelete, handleDeleteConfirm,
    handleRenameSave, handleRevisionComplete,
    handleUpdateTopic, handleRenameTopic, handleDeleteTopic, handleAddCustomTopic, handleResetTopics,
    hasCustomTopicEdits: Boolean(system.customTopics && system.customTopics.length > 0),
    finalTopics
  };
}
