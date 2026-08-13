import React, { useState } from 'react';
import { BookOpen, Filter } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Subject, StudySystem } from '@/db';
import { EmptyStateGraphic } from '@/components/EmptyStateGraphic';
import { Button } from '@/components/ui/button';
import { SubjectCard } from '@/features/subjects/SubjectCard';
import { loadUniversalOntology } from '@/lib/exam-presets';
import { cn } from '@/lib/utils';

interface SubjectsGridProps {
  subjects: Subject[];
  systems?: StudySystem[];
  handleSubjectDragEnd: (result: DropResult) => void;
}

const PHASE_MAPPING: Record<string, string[]> = {
  'Pre-Clinical': ['Anatomy', 'Physiology', 'Biochemistry'],
  'Para-Clinical': ['Pathology', 'Microbiology', 'Pharmacology', 'Forensic Medicine & Toxicology', 'Community Medicine (PSM)'],
  'Clinical': ['General Medicine', 'Medicine', 'General Surgery', 'Surgery', 'Obstetrics & Gynaecology', 'OBGY', 'Pediatrics', 'Orthopedics', 'ENT (Otorhinolaryngology)', 'Ophthalmology', 'Psychiatry', 'Dermatology', 'Anaesthesiology', 'Radiology']
};

const YEAR_MAPPING: Record<string, string[]> = {
  '1st Year': ['Anatomy', 'Physiology', 'Biochemistry'],
  '2nd Year': ['Pathology', 'Microbiology', 'Pharmacology'],
  '3rd Year': ['Forensic Medicine & Toxicology', 'Community Medicine (PSM)', 'ENT (Otorhinolaryngology)', 'Ophthalmology'],
  'Final Year': ['General Medicine', 'Medicine', 'General Surgery', 'Surgery', 'Obstetrics & Gynaecology', 'OBGY', 'Pediatrics', 'Orthopedics', 'Psychiatry', 'Dermatology', 'Anaesthesiology', 'Radiology']
};

type FilterOption = 'All' | 'Pre-Clinical' | 'Para-Clinical' | 'Clinical' | '1st Year' | 'Final Year';

export function SubjectsGrid({
  subjects = [],
  systems = [],
  handleSubjectDragEnd
}: SubjectsGridProps) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');

  const safeSubjects = Array.isArray(subjects) ? subjects : [];
  const safeSystems = Array.isArray(systems) ? systems : [];

  const filteredSubjects = React.useMemo(() => {
    if (activeFilter === 'All') return safeSubjects;
    const allowedNames = PHASE_MAPPING[activeFilter] || YEAR_MAPPING[activeFilter] || [];
    return safeSubjects.filter(sub => sub && allowedNames.includes(sub.name));
  }, [safeSubjects, activeFilter]);

  return (
    <section id="subject-portfolio" className="flex-1">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-teal-500" /> Subject Radar
          </h2>
          <span className="text-[10px] font-mono font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground border border-border/40">
            {filteredSubjects.length} / {subjects.length}
          </span>
        </div>
        
        {/* Medical Phase / Year Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1 hidden sm:block" />
          {(['All', 'Pre-Clinical', 'Para-Clinical', 'Clinical'] as FilterOption[]).map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
                activeFilter === filter 
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {filter}
            </button>
          ))}
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
      ) : filteredSubjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/60 bg-muted/20">
          <p className="text-sm font-medium text-muted-foreground">No subjects found for {activeFilter}.</p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-4"
            onClick={() => setActiveFilter('All')}
          >
            View All Subjects
          </Button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleSubjectDragEnd}>
          <Droppable droppableId="subjects-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {filteredSubjects.map((subject, index) => (
                  <Draggable
                    key={subject.id}
                    draggableId={String(subject.id)}
                    index={index}
                    isDragDisabled={activeFilter !== 'All'} // Disable drag when filtered to prevent order issues
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <SubjectCard
                          subject={subject}
                          systems={safeSystems.filter(s => s && s.subjectId === subject.id)}
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
