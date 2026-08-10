import React, { useState } from 'react';
import { Folder, Edit, Trash2, GripVertical, CheckCircle2, Circle, MoreVertical, Target } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { logCompletion } from '@/db/mutations';
import { OntologyTopic } from '@/data/ontology';
import { CurriculumSet } from '@/db/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CurriculumSetScoreModal } from './CurriculumSetScoreModal';
import { ALL_SUBJECTS } from '@/data/ontology';
import { CurriculumSetForm } from './CurriculumSetForm';
import { deleteCurriculumSet } from '@/db/mutations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface CurriculumSetsProps {
  systemId: number;
  subjectId: number;
  topics: OntologyTopic[];
  onLogScore?: (setId: string, setName: string) => void;
}

const colorMap = {
  teal: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  purple: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  gray: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

export function CurriculumSets({ systemId, subjectId, topics, onLogScore }: CurriculumSetsProps) {
    const [formOpen, setFormOpen] = useState(false);
  const [editSet, setEditSet] = useState<CurriculumSet | undefined>();
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [scoreModalSet, setScoreModalSet] = useState<CurriculumSet | undefined>();
  
  const curriculumSets = useLiveQuery(
    () => {
      if (!systemId) return [];
      return (db.curriculumSets || db.revisionSets)
        .where('systemId')
        .equals(systemId)
        .filter(s => !s.deletedAt)
        .sortBy('order')
        .then(res => res || []);
    },
    [systemId]
  ) || [];

  const topicProgresses = useLiveQuery(
    () => {
      if (!topics || topics.length === 0) return [];
      return db.topicProgress.where('topicId').anyOf(topics.map(t => t.id)).toArray();
    },
    [topics]
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
            taskLabel: set.name + ' Content',
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
            taskLabel: set.name + ' QBank',
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
            <Folder className="w-3.5 h-3.5" /> Study Blocks
          </h4>
          <button
            onClick={() => { setEditSet(undefined); setFormOpen(true); }}
            className="text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-md transition-colors"
          >
            + New Set
          </button>
        </div>
        <div className="p-4 rounded-xl border border-dashed border-border/60 bg-muted/20 text-center">
          <p className="text-sm text-muted-foreground">
            Organize topics the way you revise on Marrow, PrepLadder, or your own notes.
          </p>
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
          <Folder className="w-3.5 h-3.5" /> Study Blocks
        </h4>
        <button
          onClick={() => { setEditSet(undefined); setFormOpen(true); }}
          className="text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-md transition-colors"
        >
          + New Set
        </button>
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
                    sdsrStatusColor = 'text-amber-600';
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
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger className="p-1 rounded-md hover:bg-foreground/5 text-muted-foreground transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => { setEditSet(rs); setFormOpen(true); }}>
                                <Edit className="w-4 h-4 mr-2" /> Edit
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
                            <button 
                              onClick={() => togglePhase(rs.id!, 'content', rs.contentCompleted)}
                              className={cn(
                                "px-2 py-1 text-[11px] font-medium rounded-md border transition-colors flex items-center gap-1",
                                rs.contentCompleted ? "bg-primary/10 border-primary/30 text-primary" : "bg-transparent border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
                              )}
                            >
                              {rs.contentCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                              Content
                            </button>

                            <button 
                              onClick={() => togglePhase(rs.id!, 'qbank', rs.qbankCompleted)}
                              className={cn(
                                "px-2 py-1 text-[11px] font-medium rounded-md border transition-colors flex items-center gap-1",
                                rs.qbankCompleted ? "bg-primary/10 border-primary/30 text-primary" : "bg-transparent border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
                              )}
                            >
                              {rs.qbankCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                              QBank
                            </button>

                            <button
                              onClick={() => {
                              setScoreModalSet(rs);
                              setScoreModalOpen(true);
                            }}
className={cn(
                                "px-2 py-1 text-[11px] font-medium rounded-md border transition-colors flex items-center gap-1",
                                "bg-transparent border-border text-foreground hover:border-primary/50 hover:bg-primary/10 shadow-sm"
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
