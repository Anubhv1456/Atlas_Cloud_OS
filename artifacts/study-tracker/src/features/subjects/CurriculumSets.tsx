import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { OntologyTopic } from '@/data/ontology';
import { Folder, MoreVertical, Edit, Trash2, GripVertical, CheckCircle2 } from 'lucide-react';
import { CurriculumSet } from '@/db/types';
import { CurriculumSetForm } from './CurriculumSetForm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deleteCurriculumSet } from '@/db/mutations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface CurriculumSetsProps {
  systemId: number;
  subjectId: number;
  topics: OntologyTopic[];
}

const colorMap = {
  teal: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  purple: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  gray: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

export function CurriculumSets({ systemId, subjectId, topics }: CurriculumSetsProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editSet, setEditSet] = useState<CurriculumSet | undefined>();
  
  const curriculumSets = useLiveQuery(
    () => (db.curriculumSets || db.revisionSets)
      .where('systemId')
      .equals(systemId)
      .filter(s => !s.deletedAt)
      .sortBy('order')
      .then(res => res || []),
    [systemId]
  ) || [];

  const topicProgresses = useLiveQuery(
    () => db.topicProgress.where('topicId').anyOf(topics.map(t => t.id)).toArray(),
    [topics]
  ) || [];

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    const items = Array.from(curriculumSets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update orders in DB
    const updates = items.map((item, index) => ({
      ...item,
      order: index
    }));
    const targetDbTable = db.curriculumSets || db.revisionSets;
    await Promise.all(updates.map(u => targetDbTable.update(u.id!, { order: u.order })));
  };

  const handleDelete = async (id: string) => {
    await deleteCurriculumSet(id);
    toast.success('Curriculum set removed');
  };

  if (curriculumSets.length === 0) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5" /> Curriculum Sets
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
          <Folder className="w-3.5 h-3.5" /> Curriculum Sets
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
                // Calculate derived summary
                const setTopics = topics.filter(t => rs.topicIds.includes(t.id));
                const total = setTopics.length;
                let completed = 0;
                let due = 0;
                let weak = 0;
                
                const now = new Date();
                setTopics.forEach(t => {
                  const p = topicProgresses.find(tp => tp.topicId === t.id);
                  if (p) {
                    if (p.contentStatus === 'completed' && p.qbankStatus === 'completed') {
                      completed++;
                    }
                    if (p.nextRevisionDate && now >= p.nextRevisionDate) {
                      due++;
                    }
                    if (p.confidence === 'low') {
                      weak++;
                    }
                  }
                });

                return (
                  <Draggable key={rs.id} draggableId={rs.id!} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "relative rounded-xl border p-3 flex flex-col gap-2 transition-colors bg-card",
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

                        <div className="flex items-center gap-4 text-xs font-medium pl-8">
                          <span className="text-muted-foreground">{total} Topics</span>
                          {due > 0 && <span className="text-amber-600 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-600" /> {due} Due</span>}
                          {weak > 0 && <span className="text-rose-600 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-600" /> {weak} Weak</span>}
                          {(total > 0 && completed === total) && <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> All Done</span>}
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
    </div>
  );
}

export const RevisionSets = CurriculumSets;
