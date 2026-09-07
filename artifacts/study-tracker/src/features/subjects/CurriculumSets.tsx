import React, { useState } from 'react';
import { Folder, Edit, Trash2, GripVertical, CheckCircle2, Circle, MoreVertical, Target, RefreshCw, Calendar, Plus, Sparkles } from 'lucide-react';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';
import { logCompletion } from '@/db/mutations';
import { OntologyTopic } from '@/data/ontology';
import { CurriculumSet } from '@/db/types';
import { useExamProfile } from '@/hooks/useExamProfile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CurriculumSetScoreModal } from './CurriculumSetScoreModal';
import { CurriculumSetForm } from './CurriculumSetForm';
import { AILoggerModal } from '@/components/AILoggerModal';
import { deleteCurriculumSet } from '@/db/mutations';
import { repairAndRehydrateRevisionDates } from '@/lib/vaultSync';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface CurriculumSetsProps {
  systemId?: number;
  subjectId: number;
  topics: OntologyTopic[];
  onLogScore?: (setId: string, setName: string) => void;
}

const colorMap = {
  teal: 'bg-zinc-800/20 text-zinc-300 border-zinc-700/50',
  amber: 'bg-zinc-800/20 text-zinc-300 border-zinc-700/50',
  purple: 'bg-zinc-800/20 text-zinc-300 border-zinc-700/50',
  blue: 'bg-zinc-800/20 text-zinc-300 border-zinc-700/50',
  gray: 'bg-zinc-800/20 text-zinc-300 border-zinc-700/50',
};

export function CurriculumSets({ systemId, subjectId, topics, onLogScore }: CurriculumSetsProps) {
  const { profile } = useExamProfile();
  const isUsmle = Boolean(profile.targetExam && (profile.targetExam.includes('USMLE') || profile.targetExam.includes('Step')));

  const [formOpen, setFormOpen] = useState(false);
  const [aiLoggerOpen, setAiLoggerOpen] = useState(false);
  const [editSet, setEditSet] = useState<CurriculumSet | undefined>();
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [scoreModalSet, setScoreModalSet] = useState<CurriculumSet | undefined>();
  const [isRehydrating, setIsRehydrating] = useState(false);

  const handleNudgeRevision = async (setId: string, currentRevisionDate?: Date | string | null, daysDelta: number = 3) => {
    const baseDate = currentRevisionDate ? new Date(currentRevisionDate) : new Date();
    const newDate = new Date(baseDate.getTime() + daysDelta * 24 * 60 * 60 * 1000);
    const targetDbTable = (db.curriculumSets || db.revisionSets);
    
    // Check concurrent load for Commitment Device
    const startOfDay = new Date(newDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(newDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingBlocks = await targetDbTable.filter(s => {
       if (!s.nextRevisionDate || s.deletedAt) return false;
       const d = new Date(s.nextRevisionDate);
       return d >= startOfDay && d <= endOfDay;
    }).toArray();
    
    await targetDbTable.update(setId, { nextRevisionDate: newDate, updatedAt: new Date() });
    
    const dateStr = newDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (existingBlocks.length >= 2) {
       toast.warning(`Spaced to ${dateStr}.`, {
          description: isUsmle 
             ? `Heads up: You already have ${existingBlocks.length} blocks planned for that day. Don't burn yourself out on practice questions!`
             : `Heads up: You already have ${existingBlocks.length} blocks planned for that day. Cramming too many subjects at once might make it hard to remember.`
       });
    } else {
       toast.success(`SDSR spaced to ${dateStr} (+${daysDelta}d)`);
    }
  };

  const handleRehydrateDates = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRehydrating(true);
    try {
      const res = await repairAndRehydrateRevisionDates();
      toast.success('SDSR Schedules Rehydrated', {
        description: res.message,
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to rehydrate SDSR dates');
    } finally {
      setIsRehydrating(false);
    }
  };
  
  const curriculumSets = useLiveQuery(
    () => {
      if (!subjectId && !systemId) return [];
      return (db.curriculumSets || db.revisionSets)
        .where(systemId ? 'systemId' : 'subjectId')
        .equals(systemId || subjectId)
        .filter(s => !s.deletedAt)
        .toArray().then(arr => arr.sort((a, b) => (a.order || 0) - (b.order || 0)))
        .then(res => res || []);
    },
    [systemId, subjectId]
  ) || [];

  const topicProgresses = useLiveQuery(
    () => {
      if (!topics || topics.length === 0) return [];
      return db.topicProgress.where('topicId').anyOf(topics.map(t => t.id)).toArray();
    },
    [topics.map(t => t.id).join(',')]
  ) || [];

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    const items = Array.from(curriculumSets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updates = items.map((item, index) => ({
      ...item,
      order: index
    }));
    const targetDbTable = db.curriculumSets || db.revisionSets;
    await Promise.all(updates.map(u => targetDbTable.update(u.id!, { order: u.order })));
  };

  const handleDelete = async (id: string) => {
    await deleteCurriculumSet(id);
    toast.success('Study block removed');
  };

    const togglePhase = async (setId: string, phase: 'content' | 'qbank', currentValue: boolean | undefined) => {
    const targetDbTable = db.curriculumSets || db.revisionSets;
    const isNowCompleted = !currentValue;
    const set = curriculumSets.find(s => s.id === setId);
    let subjectName = '';
    if (set) {
      const sub = await db.subjects.get(set.subjectId);
      if (sub) subjectName = sub.name;
    }

    if (phase === 'content') {
      await targetDbTable.update(setId, { contentCompleted: isNowCompleted, updatedAt: new Date() });
      if (isNowCompleted && set) {
        await logCompletion({
            subjectId: set.subjectId,
            subjectName,
            systemId: set.systemId,
            systemName: set.name,
            taskKey: 'curriculum_set_content',
            taskLabel: set.name + ' ',
            completedAt: new Date()
        });
      }
    } else {
      await targetDbTable.update(setId, { qbankCompleted: isNowCompleted, updatedAt: new Date() });
      if (isNowCompleted && set) {
        await logCompletion({
            subjectId: set.subjectId,
            subjectName,
            systemId: set.systemId,
            systemName: set.name,
            taskKey: 'curriculum_set_qbank',
            taskLabel: set.name + ' ',
            completedAt: new Date()
        });
      }
    }
  };

  if (curriculumSets.length === 0) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5" /> Practice Blocks
          </h4>
        </div>
        <div className="p-4 rounded-xl border border-dashed border-border/40 bg-transparent text-center flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted-foreground/70">
            Create custom practice blocks by grouping specific topics.
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setEditSet(undefined); setFormOpen(true); }}
            className="text-xs font-medium text-foreground bg-zinc-800/80 hover:bg-zinc-800 px-4 py-2 rounded-lg transition-colors cursor-pointer border border-white/10 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Create Block
          </button>
        </div>
        <CurriculumSetForm
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          systemId={systemId}
          subjectId={subjectId}
          allTopics={topics}
          initialData={editSet}
        />
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Folder className="w-3.5 h-3.5" /> Practice Blocks
        </h4>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1.5 rounded-md hover:bg-muted/80 text-muted-foreground transition-colors cursor-pointer">
              <MoreVertical className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleRehydrateDates} disabled={isRehydrating}>
                <RefreshCw className={cn("w-4 h-4 mr-2", isRehydrating && "animate-spin")} /> Rehydrate Dates
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); e.preventDefault(); setAiLoggerOpen(true); }}>
                <Sparkles className="w-4 h-4 mr-2 text-amber-400" /> Log AI Block
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <button
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setEditSet(undefined); setFormOpen(true); }}
            className="text-xs font-medium text-foreground bg-zinc-800/80 hover:bg-zinc-800 px-3 py-1.5 rounded-md transition-colors cursor-pointer border border-white/10 flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Block
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId={`system-${systemId}-sets`}>
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {curriculumSets.map((rs, index) => {
                const setTopics = topics.filter(t => rs.topicIds.includes(t.id));
                const total = setTopics.length;
                let weak = 0;
                
                const now = new Date();
                setTopics.forEach(t => {
                  const p = topicProgresses.find(tp => tp.topicId === t.id);
                  if (p && p.isWeak) {
                    weak++;
                  }
                });

                let sdsrStatusText = '';
                let sdsrStatusColor = '';
                if (rs.nextRevisionDate) {
                  const daysToRevision = Math.ceil((new Date(rs.nextRevisionDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  if (daysToRevision < 0) {
                    sdsrStatusText = `${Math.abs(daysToRevision)}d Overdue`;
                    sdsrStatusColor = 'text-rose-600';
                  } else if (daysToRevision === 0) {
                    sdsrStatusText = 'Due Today';
                    sdsrStatusColor = 'text-amber-400';
                  } else {
                    sdsrStatusText = `Due in ${daysToRevision}d`;
                    sdsrStatusColor = 'text-muted-foreground';
                  }
                }

                return (
                  <Draggable key={rs.id} draggableId={rs.id!} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "relative rounded-xl border p-3 flex flex-col gap-3 transition-colors bg-card",
                          snapshot.isDragging && "shadow-lg scale-[1.02]",
                          colorMap[rs.color || 'teal']
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div {...provided.dragHandleProps} className="text-muted-foreground/50 hover:text-foreground cursor-grab active:cursor-grabbing p-1 -ml-1">
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-sm text-foreground">{rs.name}</span>
                            {(rs.depth === 'rapid' || (rs.customDurationMinutes && rs.customDurationMinutes <= 15)) && (
                              <span className="text-xs font-semibold font-mono px-1.5 py-0.5 rounded bg-amber-950/20 text-amber-400 border border-white/5 border-l-2 border-l-amber-500/30">
                                ⚡ Rapid Recall
                              </span>
                            )}
                            {(rs.depth === 'deep' || rs.isLengthy) && (
                              <span className="text-xs font-semibold font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                🔬 Deep Focus
                              </span>
                            )}
                            {rs.depth === 'standard' && (
                              <span className="text-xs font-semibold font-mono px-1.5 py-0.5 rounded bg-zinc-800/40 text-teal-400 border border-white/5">
                                📖 Standard
                              </span>
                            )}
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger className="p-1 rounded-md hover:bg-foreground/5 text-muted-foreground transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); e.preventDefault(); setEditSet(rs); setFormOpen(true); }}>
                                <Edit className="w-4 h-4 mr-2" /> Edit Block
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleNudgeRevision(rs.id!, rs.nextRevisionDate, 3)}>
                                <Calendar className="w-4 h-4 mr-2 text-amber-400" /> Space SDSR (+3 Days)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleNudgeRevision(rs.id!, rs.nextRevisionDate, 7)}>
                                <Calendar className="w-4 h-4 mr-2 text-sky-500" /> Space SDSR (+7 Days)
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={() => handleDelete(rs.id!)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Remove Set
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="flex flex-wrap items-center justify-between gap-3 pl-8">
                          <div className="flex items-center gap-3 text-xs font-medium">
                            <span className="text-muted-foreground">{total} Topics</span>
                            {weak > 0 && <span className="text-rose-600 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-600" /> {weak} Weak</span>}
                            {sdsrStatusText && (
                              <span className={cn("flex items-center gap-1", sdsrStatusColor)}>
                                <div className={cn("w-1.5 h-1.5 rounded-full", sdsrStatusColor.replace('text-', 'bg-'))} />
                                {sdsrStatusText}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2"> 
 <button onClick={() => togglePhase(rs.id!, "content", rs.contentCompleted)} className={cn("px-2 py-1 text-xs font-medium rounded-md border transition-colors flex items-center gap-1 shadow-sm", rs.contentCompleted ? "bg-zinc-800/40 border-primary/30 text-primary" : "bg-background border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground")} > {rs.contentCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />} Content </button> <button onClick={() => togglePhase(rs.id!, "qbank", rs.qbankCompleted)} className={cn("px-2 py-1 text-xs font-medium rounded-md border transition-colors flex items-center gap-1 shadow-sm", rs.qbankCompleted ? "bg-zinc-800/40 border-primary/30 text-primary" : "bg-background border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground")} > {rs.qbankCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />} QBank </button>
                            

                            <button
                              onClick={(e) => { e.stopPropagation(); e.preventDefault();
                              setScoreModalSet(rs);
                              setScoreModalOpen(true);
                            }}
className={cn(
                                "px-2 py-1 text-xs font-medium rounded-md border transition-colors flex items-center gap-1",
                                "bg-transparent border-border text-foreground hover:border-primary/50 hover:bg-zinc-800/40 shadow-sm"
                              )}
                            >
                              <Target className="w-3.5 h-3.5" />
                              Log Score
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="h-px bg-border my-6" />

      <AILoggerModal open={aiLoggerOpen} onOpenChange={setAiLoggerOpen} />

      <CurriculumSetForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        systemId={systemId}
        subjectId={subjectId}
        allTopics={topics}
        initialData={editSet}
      />
    
      {scoreModalOpen && scoreModalSet && (
        <CurriculumSetScoreModal
          isOpen={scoreModalOpen}
          onClose={() => setScoreModalOpen(false)}
          curriculumSet={scoreModalSet}
          allTopics={topics}
        />
      )}
    </div>
  );
}

export const RevisionSets = CurriculumSets;
