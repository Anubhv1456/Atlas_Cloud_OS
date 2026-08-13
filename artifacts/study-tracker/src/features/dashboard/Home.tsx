import { HelpGuideModal } from '@/components/HelpGuideModal';
import { AtlasSkyPreview } from './AtlasSkyPreview';
import { NextActionCard } from '@/components/dashboard/NextActionCard';
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
import { Plus, BookOpen, HelpCircle, Layers, X, ChevronRight, Clock, AlertCircle, Target, XCircle, Activity, ArrowUpRight, CheckCircle, Lightbulb, Lock, Pencil, Flame, Award, Sparkles, TrendingUp, Brain } from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';
import { isRevisionDue, isRevisionOverdue, sortSystemsByRevisionPriority, calculateDecayScore, daysOverdue, getRetrievability, getRetrievabilityHealth, getDailyRevisionQueue, getSystemDecayFactor } from '@/db';
import { format } from 'date-fns';
import { StudySystem, Subject } from '@/db';
import { calculateOverallProgress, calculateSubjectProgress } from '@/lib/progress';
import { ALL_SYSTEMS } from '@/data/ontology';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';
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


// ── Main component ────────────────────────────────────────────────────────────

import { SubjectsGrid } from '@/features/dashboard/SubjectsGrid';
import { useHomeLogic } from './Home.hooks';

export default function Home() {
  const {
    subjects, systems, pyqs, streak, greeting,
    primaryFocus, primaryFocusSubject, customPrimarySubject, customPrimarySystem, isAutoPrimary, isPrimaryOverriddenByRevision, isPrimaryIntentStale, isSecondaryIntentStale,
    secondaryFocus, secondaryFocusSubject, customSecondarySubject, customSecondarySystem, isAutoSecondary, isSecondaryOverriddenByRevision,
    secondaryDaysOverdue, dueRevisions,     
    
    focusDialogType, setFocusDialogType,
    
    handleSetFocus, goToSystem, goToSubject, handleSubjectDragEnd
  } = useHomeLogic();

  const { profile, isConfigured } = useExamProfile();
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { hasOnboarded, loading: onboardingLoading } = useOnboardingStatus();

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
        <header className="mb-8 flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
            <img src="/emblem.svg" alt="Atlas Logo" className="w-11 h-11 sm:w-12 sm:h-12 rounded-[14px] shadow-sm border border-border/50 object-contain transition-transform hover:scale-105 active:scale-95 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="flex items-center gap-1.5 text-teal-500 text-[11px] font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" /> NEET PG 2026 • Cohort Active
                </span>
                {streak > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0">
                    <Flame className="w-3 h-3 fill-amber-500/20" /> {streak}d Streak
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight truncate">{greeting}</h1>
            </div>
          </div>

          {/* Action controls - Top Right Corner */}
          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
            <AtlasSkyPreview />
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground rounded-full w-9 h-9 shrink-0"
              onClick={() => setHelpOpen(true)}
              title="Atlas Guidance & Help"
            >
              <HelpCircle className="w-5 h-5" />
            </Button>
          </div>
        </header>
            
        {/* ── Single Unified Focal Directive Hero ─────────────────────────────── */}
        <div className="mb-10">
          <NextActionCard
            customPrimarySubject={customPrimarySubject}
            customPrimarySystem={customPrimarySystem}
            setFocusDialogType={setFocusDialogType}
            setFocus={setFocus}
            setSubjectFocus={setSubjectFocus}
            goToSystem={goToSystem}
          />
        </div>

        {/* ── Subjects Portfolio ─────────────────────────────────────────────── */}
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
      <HelpGuideModal open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
