import { DueCurriculumSetsCard } from './DueCurriculumSetsCard';
import { CurriculumSetScoreModal } from '@/features/subjects/CurriculumSetScoreModal';
import { ALL_TOPICS, ALL_SUBJECTS } from '@/data/ontology';
import { CurriculumSet } from '@/db/types';
import { normalizeName } from '@/lib/exam-presets';
import { useRef, useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useSubjects, useAllSystems, addSubject, updateSubject, deleteSubject, useCurrentStreak, setFocus, setSubjectFocus, updateSubjectsOrder, useAllPYQs } from '@/db';
import { SubjectCard } from '@/features/subjects/SubjectCard';
import { EmptyStateGraphic } from '@/components/EmptyStateGraphic';
import { AddDialog } from '@/components/AddDialog';
import { FocusDialog } from '@/components/FocusDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, BookOpen, Layers, X, ChevronRight, Clock, AlertCircle, Target, XCircle, Activity, ArrowUpRight, CheckCircle, Lightbulb, Lock, Pencil, Flame, Award, Sparkles, TrendingUp, Brain } from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';
import { isRevisionDue, isRevisionOverdue, sortSystemsByRevisionPriority, calculateDecayScore, daysOverdue, getRetrievability, getRetrievabilityHealth, getDailyRevisionQueue, getSystemDecayFactor } from '@/db';
import { format } from 'date-fns';
import { StudySystem, Subject } from '@/db';
import { calculateOverallProgress, calculateSubjectProgress } from '@/lib/progress';
import { ALL_SYSTEMS } from '@/data/ontology';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { DailyAnkiCard } from '@/features/revision/DailyAnkiCard';
import { useExamProfile } from '@/hooks/useExamProfile';
import { TargetExamModal } from '@/components/TargetExamModal';
import { OnboardingModal } from '@/components/OnboardingModal';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { useEffect } from 'react';
// ── Inline result sub-components ──────────────────────────────────────────────

function StatusBadge({ sys }: { sys: StudySystem }) {
  const colors = {
    Strong:  'bg-transparent text-[hsl(var(--gold))] border-[hsl(var(--gold))]/50',
    Average: 'bg-transparent text-muted-foreground border-border',
    Weak:    'bg-transparent text-destructive border-destructive/50',
  };
  return (
    <span className={cn('text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium border shrink-0', colors[sys.status])}>
      {sys.status}
    </span>
  );
}

function RevisionPill({ sys }: { sys: StudySystem }) {
  if (!sys.completionDate) return null;
  const retrievability = getRetrievability(sys);
  const health = getRetrievabilityHealth(retrievability);

  if (isRevisionOverdue(sys)) return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-destructive shrink-0 bg-destructive/10 px-2.5 py-0.5 rounded-full border border-destructive/20">
      <div className="w-1.5 h-1.5 rounded-full bg-destructive" />Overdue
    </span>
  );
  if (isRevisionDue(sys)) return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-500 shrink-0 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />Due
    </span>
  );
  if (sys.nextRevisionDate) return (
    <span className={cn("flex items-center gap-1 text-[10px] font-semibold shrink-0 px-2.5 py-0.5 rounded-full bg-muted/60 border border-border/40", health.colorClass)}>
      <div className={cn("w-1.5 h-1.5 rounded-full", health.colorClass.includes("destructive") ? "bg-destructive" : health.colorClass.includes("amber") ? "bg-amber-500" : "bg-emerald-500")} />Healthy
    </span>
  );
  return null;
}

// ── Main component ────────────────────────────────────────────────────────────

import { ActiveRevisions } from '@/features/dashboard/ActiveRevisions';
import { SubjectsGrid } from '@/features/dashboard/SubjectsGrid';
import { useHomeLogic } from './Home.hooks';

export default function Home() {
  const {
    subjects, systems, pyqs, streak, greeting,
    primaryFocus, primaryFocusSubject, customPrimarySubject, customPrimarySystem, isAutoPrimary, isPrimaryOverriddenByRevision,
    secondaryFocus, secondaryFocusSubject, customSecondarySubject, customSecondarySystem, isAutoSecondary, isSecondaryOverriddenByRevision,
    secondaryDaysOverdue, dueRevisions, insights,
    
     
    
    focusDialogType, setFocusDialogType,
    
    handleSetFocus, goToSystem, goToSubject, handleSubjectDragEnd
  } = useHomeLogic();

  const { profile, isConfigured } = useExamProfile();
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const { hasOnboarded, loading: onboardingLoading } = useOnboardingStatus();

    const allTopicIds = systems.flatMap(sys => {
    const subject = subjects.find(sub => sub.id === sys.subjectId);
    const ontologySubject = subject ? ALL_SUBJECTS.find(s => s.name === subject.name) : undefined;
    const os = ALL_SYSTEMS.find(s => s.subjectId === ontologySubject?.id && normalizeName(s.name) === normalizeName(sys.name));
    return os ? os.topics.map(t => t.id) : [];
  });
  
  const stats = useLiveQuery(async () => {
    let completedTasks = 0;
    let strongSystems = 0;
    let dueRevisionsCount = 0;
    let weakTopicsCount = 0;
    let learningTopicsCount = 0;
    let sum = 0;
    
    const now = new Date();
    await db.topicProgress.each(tp => {
      if (tp.isWeak) weakTopicsCount++;
    });
    await (db.curriculumSets || db.revisionSets).each(set => {
      if (set.contentCompleted && set.qbankCompleted) completedTasks++;
      if (set.averageScore && set.averageScore >= 80) strongSystems++;
      if (set.nextRevisionDate && new Date(set.nextRevisionDate) <= now) dueRevisionsCount++;
      if (set.contentCompleted || set.qbankCompleted) {
        if (!(set.contentCompleted && set.qbankCompleted)) {
          learningTopicsCount++;
        }
      }
      
      const v1 = set.contentCompleted ? 50 : 0;
      const v2 = set.qbankCompleted ? 50 : 0;
      sum += (v1 + v2);
    });
    
    return { completedTasks, strongSystems, dueRevisionsCount, weakTopicsCount, learningTopicsCount, sum };
  }, []) || { completedTasks: 0, strongSystems: 0, dueRevisionsCount: 0, weakTopicsCount: 0, learningTopicsCount: 0, sum: 0 };

  
  let topicOverallProgress = 0;
  if (allTopicIds.length > 0) {
    let sum = 0;
    
    topicOverallProgress = Math.round((sum / allTopicIds.length) * 100);
  }

  useEffect(() => {
    // Auto trigger onboarding if completed flag is missing
    if (!onboardingLoading && hasOnboarded === false) {
      setOnboardingOpen(true);
    }
  }, [hasOnboarded, onboardingLoading]);

  useEffect(() => {
    const handleOpenOnboarding = () => setOnboardingOpen(true);
    window.addEventListener('open-onboarding', handleOpenOnboarding);
    return () => window.removeEventListener('open-onboarding', handleOpenOnboarding);
  }, []);

  return (
    <>
      <div className="min-h-full bg-background px-4 sm:px-6 lg:px-8 pt-8 pb-28 md:pb-10 max-w-6xl mx-auto flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="relative z-10 flex-1 flex flex-col">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img src="/emblem.svg" alt="Atlas Logo" className="w-12 h-12 rounded-[14px] shadow-sm border border-border/50 object-contain transition-transform hover:scale-105 active:scale-95" />
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="flex items-center gap-1 text-primary text-[11px] font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> Medical Study Tracker
                </span>
                
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{greeting}</h1>
            </div>
          </div>

          
        </header>
            
            

            <DueCurriculumSetsCard />
            <ActiveRevisions
              primaryFocus={primaryFocus || null}
              primaryFocusSubject={primaryFocusSubject || null}
              isAutoPrimary={isAutoPrimary}
              isPrimaryOverriddenByRevision={isPrimaryOverriddenByRevision}
              secondaryFocus={secondaryFocus || null}
              secondaryFocusSubject={secondaryFocusSubject || null}
              isAutoSecondary={isAutoSecondary}
              isSecondaryOverriddenByRevision={isSecondaryOverriddenByRevision}
              secondaryDaysOverdue={secondaryDaysOverdue}
              setFocusDialogType={setFocusDialogType}
              setFocus={setFocus}
              setSubjectFocus={setSubjectFocus}
              goToSystem={goToSystem}
              subjects={subjects}
              systems={systems}
              customPrimarySubject={customPrimarySubject}
              customPrimarySystem={customPrimarySystem}
              customSecondarySubject={customSecondarySubject}
              customSecondarySystem={customSecondarySystem}
            />
{/* ── Knowledge Insights ──────────────────────────────────────────────── */}
            {insights.length > 0 && (
              <section className="mb-12">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Strategic Insights
                </h2>
                <div className="grid gap-3">
                  {insights.map((insight) => (
                    <div
                      key={insight.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-card rounded-2xl border border-border/80 shadow-sm transition-all hover:border-primary/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 p-2 bg-muted/50 rounded-xl border border-border/50">
                          {insight.icon}
                        </div>
                        <div className="space-y-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border inline-block ${insight.badgeClass}`}>
                            {insight.badge}
                          </span>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {insight.text}
                          </p>
                        </div>
                      </div>
                      {insight.actionLabel && insight.onAction && (
                        <button
                          onClick={insight.onAction}
                          className="shrink-0 self-end sm:self-center px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs transition-colors flex items-center gap-1 border border-primary/20 cursor-pointer"
                        >
                          {insight.actionLabel} <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}



            
            <SubjectsGrid
              subjects={subjects}
              systems={systems}
              
              
              
              
              handleSubjectDragEnd={handleSubjectDragEnd}
            />
</div>
      </div>

      
      <FocusDialog
        open={focusDialogType !== null}
        onOpenChange={(isOpen) => !isOpen && setFocusDialogType(null)}
        title={`Set ${focusDialogType === 'primary' ? 'Primary' : 'Secondary'} Focus`}
        focusType={focusDialogType}
        systems={systems}
        subjects={subjects}
        onSelectSystem={(systemId) => {
          if (focusDialogType) {
            setFocus(systemId, focusDialogType);
          }
        }}
        onSelectSubject={(subjectId) => {
          if (focusDialogType) {
            setSubjectFocus(subjectId, focusDialogType);
          }
        }}
      />

      

      

      <TargetExamModal open={examModalOpen} onOpenChange={setExamModalOpen} />
      <OnboardingModal open={onboardingOpen} onOpenChange={setOnboardingOpen} />
    </>
  );
}
