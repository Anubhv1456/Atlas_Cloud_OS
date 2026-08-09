import React from 'react';
import { BookOpen } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Subject, StudySystem } from '@/db';
import { EmptyStateGraphic } from '@/components/EmptyStateGraphic';
import { Button } from '@/components/ui/button';
import { SubjectCard } from '@/features/subjects/SubjectCard';
import { loadUniversalOntology } from '@/lib/exam-presets';

interface SubjectsGridProps {
  subjects: Subject[];
  systems: StudySystem[];
  handleSubjectDragEnd: (result: DropResult) => void;
}

export function SubjectsGrid({
  subjects,
  systems,
  handleSubjectDragEnd
}: SubjectsGridProps) {
  return (
    <section className="flex-1">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" /> Subject Portfolio
          </h2>
          <span className="text-[10px] font-mono font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground border border-border/40">
            {subjects.length}
          </span>
        </div>
      </div>
      
      {subjects.length === 0 ? (
        <EmptyStateGraphic
          icon={BookOpen}
          title="Curriculum Initializing"
          description="Your medical curriculum is being loaded..."
          action={
            <Button 
              onClick={async () => {
                await loadUniversalOntology();
                window.location.reload();
              }} 
              variant="outline"
              size="sm" 
              className="gap-1.5 rounded-xl shadow-xs mt-2"
            >
              <BookOpen className="w-4 h-4" /> Load MBBS Preset
            </Button>
          }
        />
      ) : (
        <DragDropContext onDragEnd={handleSubjectDragEnd}>
          <Droppable droppableId="subjects-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {subjects.map((subject, index) => (
                  <Draggable
                    key={subject.id}
                    draggableId={String(subject.id)}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <SubjectCard
                          subject={subject}
                          systems={systems.filter(s => s.subjectId === subject.id)}
                          dragHandleProps={provided.dragHandleProps}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </section>
  );
}