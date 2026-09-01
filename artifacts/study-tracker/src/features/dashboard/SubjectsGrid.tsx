import React, { useState, useMemo } from 'react';
import { BookOpen, Filter, Target, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Subject, StudySystem, useOperationalMode } from '@/db';
import { EmptyStateGraphic } from '@/components/EmptyStateGraphic';
import { Button } from '@/components/ui/button';
import { SubjectCard } from '@/features/subjects/SubjectCard';
import { loadUniversalOntology } from '@/lib/exam-presets';
import { ALL_SUBJECTS, USMLE_ONTOLOGY, GENERAL_ONTOLOGY, NEETPG_ONTOLOGY } from '@/data/ontology';
import { useExamProfile } from '@/hooks/useExamProfile';
import { isSubjectInProfScope, getPhaseNameForProfile } from '@/lib/curriculumScope';
import { cn } from '@/lib/utils';

interface SubjectsGridProps {
  subjects: Subject[];
  systems?: StudySystem[];
  handleSubjectDragEnd: (result: DropResult) => void;
}





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

  const isUSMLE = profile.targetExam?.toLowerCase().includes('usmle');
  const isCustom = profile.targetExam?.toLowerCase().includes('custom') || profile.targetExam?.toLowerCase().includes('general');

  // If in MBBS Professional mode and not overridden, strictly isolate subjects of that professional year
  const profFilteredSubjects = useMemo(() => {
    // 1. Find which ontology represents the active exam
    let activeOntology = NEETPG_ONTOLOGY;
    if (isUSMLE) activeOntology = USMLE_ONTOLOGY;
    else if (isCustom) activeOntology = GENERAL_ONTOLOGY;

    const activeSubjectNames = new Set(activeOntology.map(s => s.name.toLowerCase()));

    // 2. Filter out subjects that do not belong to the active exam curriculum AT ALL
    const activeTrackSubjects = safeSubjects.filter(sub => activeSubjectNames.has(sub.name.toLowerCase()));

    // 3. Apply year isolation if needed
    if (showAllOverride || !isMBBSProf) {
      return activeTrackSubjects; 
    }
    return activeTrackSubjects.filter(sub => isSubjectInProfScope(sub.name, profile.targetExam, activeYear));
  }, [safeSubjects, isMBBSProf, showAllOverride, profile.targetExam, activeYear, isUSMLE, isCustom]);

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

  


  const filterTabs = useMemo(() => {
    if (isUSMLE) return ['All', 'Organ Systems', 'Multisystem', 'General Principles'];
    if (isCustom) return ['All', 'Medical', 'Surgical', 'Basic Sciences'];
    return ['All', 'Pre-Clinical', 'Para-Clinical', 'Clinical'];
  }, [isUSMLE, isCustom]);

  const filteredSubjects = useMemo(() => {
    if (activeFilter === 'All') return candidateSubjects;
    return candidateSubjects.filter(sub => {
      if (!sub) return false;
      const lower = sub.name.toLowerCase();
      if (isUSMLE) {
         if (activeFilter === 'Organ Systems') return lower.includes('system') && !lower.includes('immune');
         if (activeFilter === 'Multisystem') return lower.includes('immune') || lower.includes('hematology') || lower.includes('musculoskeletal');
         if (activeFilter === 'General Principles') return lower.includes('principles') || lower.includes('pathology') || lower.includes('microbiology');
         return true;
      }
      if (isCustom) {
         if (activeFilter === 'Medical') return lower.includes('medicine') || lower.includes('pediatrics');
         if (activeFilter === 'Surgical') return lower.includes('surgery') || lower.includes('obstetrics');
         if (activeFilter === 'Basic Sciences') return lower.includes('sciences') || lower.includes('anatomy');
         return true;
      }
      // NEET PG (Default)
      if (activeFilter === 'Pre-Clinical') return ['anatomy', 'physiology', 'biochemistry'].includes(lower);
      if (activeFilter === 'Para-Clinical') return ['pathology', 'microbiology', 'pharmacology', 'forensic', 'community'].some(k => lower.includes(k));
      if (activeFilter === 'Clinical') return ['medicine', 'surgery', 'obstetrics', 'pediatrics', 'orthopedics', 'psychiatry', 'dermatology', 'radiology', 'anaesthesiology', 'ophthalmology', 'ent'].some(k => lower.includes(k));
      return true;
    });
  }, [candidateSubjects, activeFilter, isUSMLE, isCustom]);


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
                  {getPhaseNameForProfile(profile.targetExam, activeYear)} Syllabus
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
            {(filterTabs).map(filter => (
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
