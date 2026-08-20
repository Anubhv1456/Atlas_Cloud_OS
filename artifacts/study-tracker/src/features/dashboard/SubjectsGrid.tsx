import React, { useState, useMemo } from 'react';
import { BookOpen, Filter, Target, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Subject, StudySystem, useOperationalMode } from '@/db';
import { EmptyStateGraphic } from '@/components/EmptyStateGraphic';
import { Button } from '@/components/ui/button';
import { SubjectCard } from '@/features/subjects/SubjectCard';
import { loadUniversalOntology } from '@/lib/exam-presets';
import { ALL_SUBJECTS } from '@/data/ontology';
import { useExamProfile } from '@/hooks/useExamProfile';
import { isSubjectInProfScope, NMC_MBBS_PROFESSIONAL_YEARS } from '@/lib/curriculumScope';
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
  const [showAllOverride, setShowAllOverride] = useState(false);
  const opMode = useOperationalMode();
  const { profile } = useExamProfile();

  const isMBBSProf = Boolean(
    profile.targetExam && 
    (profile.targetExam.toLowerCase().includes('mbbs') || profile.targetExam.toLowerCase().includes('professional exam'))
  );

  const activeYear = profile.currentYear || 'Final MBBS';

  const safeSubjects = Array.isArray(subjects) ? subjects : [];
  const safeSystems = Array.isArray(systems) ? systems : [];

  // If in MBBS Professional mode and not overridden, strictly isolate subjects of that professional year
  const profFilteredSubjects = useMemo(() => {
    if (!isMBBSProf || showAllOverride) return safeSubjects;
    return safeSubjects.filter(sub => isSubjectInProfScope(sub.name, profile.targetExam, activeYear));
  }, [safeSubjects, isMBBSProf, showAllOverride, profile.targetExam, activeYear]);

  const isSprintActive = opMode.mode === 'tactical_sprint' && Array.isArray(opMode.targetSubjectIds) && opMode.targetSubjectIds.length > 0;

  // Resolve target subject IDs including ontology mapping
  const sprintSubjectIdsSet = useMemo(() => {
    if (!isSprintActive) return new Set<string>();
    const set = new Set(opMode.targetSubjectIds.map(String));
    profFilteredSubjects.forEach(s => {
      if (s.ontologySubjectId && set.has(String(s.ontologySubjectId))) {
        set.add(String(s.id));
      }
      const match = opMode.targetSubjectIds?.some(tid => {
        const onto = ALL_SUBJECTS.find(os => String(os.id) === String(tid));
        return onto && s.name && onto.name.toLowerCase() === s.name.toLowerCase();
      });
      if (match && s.id !== undefined) {
        set.add(String(s.id));
      }
    });
    return set;
  }, [isSprintActive, opMode.targetSubjectIds, profFilteredSubjects]);

  // Candidates considering sprint focus
  const candidateSubjects = useMemo(() => {
    if (isSprintActive && !showAllOverride && sprintSubjectIdsSet.size > 0) {
      return profFilteredSubjects.filter(sub => sprintSubjectIdsSet.has(String(sub.id)));
    }
    return profFilteredSubjects;
  }, [profFilteredSubjects, isSprintActive, showAllOverride, sprintSubjectIdsSet]);

  const filteredSubjects = useMemo(() => {
    if (activeFilter === 'All') return candidateSubjects;
    const allowedNames = PHASE_MAPPING[activeFilter] || YEAR_MAPPING[activeFilter] || [];
    return candidateSubjects.filter(sub => sub && allowedNames.includes(sub.name));
  }, [candidateSubjects, activeFilter]);

  return (
    <section id="subject-portfolio" className="flex-1">
      {/* ── MBBS Professional Year Focus Banner ────────────────────────────── */}
      {isMBBSProf && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/25 text-foreground mb-5 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30 shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                  {NMC_MBBS_PROFESSIONAL_YEARS[activeYear]?.name || activeYear} Syllabus
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  University Exam Calibrated
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {showAllOverride
                  ? `Showing all ${safeSubjects.length} subjects (MBBS Year filter paused)`
                  : `Isolated strictly to your upcoming ${activeYear} university examination.`}
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setShowAllOverride(prev => !prev)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-teal-500/30 bg-teal-500/15 hover:bg-teal-500/25 text-teal-600 dark:text-teal-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            {showAllOverride ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Isolate {activeYear} ({profFilteredSubjects.length})</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>View All 19 Subjects ({safeSubjects.length})</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Sprint Focus Banner ────────────────────────────────────────────── */}
      {isSprintActive && !isMBBSProf && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-foreground mb-5 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-amber-500 dark:text-amber-400">Active Exam Focus</span>
                {opMode.targetDate && (
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Target: {new Date(opMode.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {showAllOverride
                  ? `Showing all ${safeSubjects.length} subjects (Exam focus paused)`
                  : `Focused exclusively on ${sprintSubjectIdsSet.size} priority exam subjects.`}
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setShowAllOverride(prev => !prev)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            {showAllOverride ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Focus Sprint ({sprintSubjectIdsSet.size})</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>View All ({safeSubjects.length})</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-teal-500" /> Subjects
          </h2>
          <span className="text-[10px] font-mono font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground border border-border/40">
            {filteredSubjects.length} {isMBBSProf && !showAllOverride ? `in ${activeYear}` : `/ ${subjects.length}`}
          </span>
        </div>
        
        {/* Medical Phase / Year Filter */}
        {(!isMBBSProf || showAllOverride) && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-none no-scrollbar max-w-full">
            <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1 hidden sm:block shrink-0" />
            {(['All', 'Pre-Clinical', 'Para-Clinical', 'Clinical'] as FilterOption[]).map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer shrink-0",
                  activeFilter === filter 
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold" 
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {subjects.length === 0 ? (
        <EmptyStateGraphic
          icon={BookOpen}
          title="Curriculum Initializing"
          description="Your medical curriculum is being loaded..."
          action={
            <Button 
              onClick={async () => {
                await loadUniversalOntology({ force: true, showToast: true });
              }} 
              variant="outline"
              size="sm" 
              className="gap-1.5 rounded-xl shadow-xs mt-2"
            >
              <BookOpen className="w-4 h-4" /> Load Universal Curriculum
            </Button>
          }
        />
      ) : filteredSubjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/60 bg-muted/20">
          <p className="text-sm font-medium text-muted-foreground">
            {isSprintActive && !showAllOverride
              ? `No sprint target subjects match '${activeFilter}'.`
              : `No subjects found for ${activeFilter}.`}
          </p>
          <div className="flex items-center gap-2 mt-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveFilter('All')}
            >
              Reset Filter
            </Button>
            {isSprintActive && !showAllOverride && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllOverride(true)}
              >
                View All {safeSubjects.length} Subjects
              </Button>
            )}
          </div>
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
                    isDragDisabled={activeFilter !== 'All' || (isSprintActive && !showAllOverride)} // Disable drag when filtered or in sprint focus to preserve canonical order
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
