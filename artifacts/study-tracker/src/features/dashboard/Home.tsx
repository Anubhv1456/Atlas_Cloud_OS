import { useRef, useState, useMemo, useEffect } from 'react';
import { HelpGuideModal } from '@/components/HelpGuideModal';
import { AtlasSkyPreview } from './AtlasSkyPreview';
import { NextActionCard } from '@/components/dashboard/NextActionCard';
import { AILoggerCard } from '@/components/dashboard/AILoggerCard';
import { SearchWidget } from '@/components/ai';
import { CurriculumSetScoreModal } from '@/features/subjects/CurriculumSetScoreModal';
import { CurriculumSet } from '@/db/types';
import { normalizeName } from '@/lib/exam-presets';
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
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';
import { useExamProfile } from '@/hooks/useExamProfile';
import { TargetExamModal } from '@/components/TargetExamModal';
import { OnboardingModal } from '@/components/OnboardingModal';
import { BaselineTriageModal } from '@/components/BaselineTriageModal';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { loadUniversalOntology } from '@/lib/exam-presets';
import { toast } from 'sonner';
import { HomeRadarSummaryCard } from '@/features/dashboard/HomeRadarSummaryCard';
import { ExamCountdownWidget } from '@/components/dashboard/ExamCountdownWidget';
import { useHomeLogic } from './Home.hooks';
import { AmbientAIWidget, ChatAssistantDrawer } from '@/components/ai';
import { HomeFloatingCommandBar } from '@/components/dashboard/HomeFloatingCommandBar';
import { useAISettings } from '@/lib/ai/aiSettingsStorage';

// ── Inline result sub-components ──────────────────────────────────────────────

function StatusBadge({ sys }: { sys: StudySystem }) {
  const colors = {
    Strong:  'bg-transparent text-[hsl(var(--gold))] border-[hsl(var(--gold))]/50',
    Average: 'bg-transparent text-muted-foreground border-border',
    Weak:    'bg-transparent text-destructive border-destructive/50',
  };
  return (
    <span className={cn('text-xs uppercase tracking-wider px-2 py-0.5 rounded-full font-medium border shrink-0', colors[sys.status])}>
      {sys.status}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Home() {
  const {
    subjects, systems, pyqs, streak, greeting,
    primaryFocus, primaryFocusSubject, customPrimarySubject, customPrimarySystem, isAutoPrimary, isPrimaryOverriddenByRevision, isPrimaryIntentStale, isSecondaryIntentStale,
    secondaryFocus, secondaryFocusSubject, customSecondarySubject, customSecondarySystem, isAutoSecondary, isSecondaryOverriddenByRevision,
    secondaryDaysOverdue, dueRevisions,     
    
    focusDialogType, setFocusDialogType,
    
    handleSetFocus, goToSystem, goToSubject, handleSubjectDragEnd
  } = useHomeLogic();

  const { profile, isConfigured, updateProfile } = useExamProfile();
  const { settings } = useAISettings();
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [triageOpen, setTriageOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [chatDrawerMode, setChatDrawerMode] = useState<'text' | 'voice'>('text');
  const { hasOnboarded, loading: onboardingLoading } = useOnboardingStatus();

  useEffect(() => {
    // Auto trigger onboarding if completed flag is missing
    if (!onboardingLoading && hasOnboarded === false) {
      setOnboardingOpen(true);
    } else if (!onboardingLoading && hasOnboarded && isConfigured && !profile.hasCompletedTriage) {
      setTriageOpen(true);
    }
  }, [hasOnboarded, onboardingLoading, isConfigured, profile.hasCompletedTriage]);

  useEffect(() => {
    const handleOpenOnboarding = () => setOnboardingOpen(true);
    const handleOpenMasterclass = () => setHelpOpen(true);
    window.addEventListener('open-onboarding', handleOpenOnboarding);
    window.addEventListener('open-masterclass', handleOpenMasterclass);
    return () => {
      window.removeEventListener('open-onboarding', handleOpenOnboarding);
      window.removeEventListener('open-masterclass', handleOpenMasterclass);
    };
  }, []);

  return (
    <>
      <div className="min-h-dvh w-full bg-background flex flex-col relative animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-x-hidden">
        {/* ── Full-Width Sticky Header ───────────────────────────────────────── */}
        <header className="sticky top-0 z-50 flex items-center justify-between gap-2.5 sm:gap-4 w-full bg-background/95 dark:bg-background/80 backdrop-blur-xl border-b border-border/40 py-3 px-4 sm:px-6 lg:px-8 shadow-sm">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 max-w-6xl mx-auto w-full">
            <img src="/emblem.svg" alt="Atlas Logo" className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl shadow-sm border border-border/50 object-contain transition-transform hover:scale-105 active:scale-95 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setExamModalOpen(true)}
                  className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 hover:text-teal-500 text-xs sm:text-xs font-semibold uppercase tracking-wider shrink-0 transition-colors cursor-pointer group truncate max-w-[180px] sm:max-w-none"
                  title="Click to recalibrate exam target"
                >
                  <Target className="w-3.5 h-3.5 shrink-0 text-teal-500 group-hover:scale-110 transition-transform" />
                  <span className="truncate">
                    {profile.targetExam 
                      ? `${profile.targetExam} ${profile.currentYear ? `• ${profile.currentYear}` : ''}`
                      : 'Target: NEET-PG 2026'
                    }
                  </span>
                </button>
                {streak > 0 && (
                  <span className="hidden xs:inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0">
                    <Flame className="w-3 h-3 fill-amber-500/20" /> {streak}d
                  </span>
                )}
              </div>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight truncate">{greeting}</h1>
            </div>
            
            {/* Action controls - Top Right Corner */}
            <div className="flex items-center justify-end gap-1.5 shrink-0">
              <AtlasSkyPreview />
            </div>
          </div>
        </header>

        {/* ── Main Content Container ─────────────────────────────────────────── */}
        <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 pb-[calc(9.5rem+env(safe-area-inset-bottom,0px))] md:pb-12 min-w-0 flex flex-col relative z-10">
          
          <ExamCountdownWidget />
          
          {/* ── Single Unified Focal Directive Hero ─────────────────────────────── */}
        <div className="mb-8">
          <NextActionCard />
        </div>
        
        {/* ── AI Logger (Phase 2) ─────────────────────────────── */}
        <AILoggerCard />

        {/* ── Dedicated Subject Radar Entry Card ──────────────────────────────── */}
        <div className="mb-6">
          <HomeRadarSummaryCard />
        </div>
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
      <BaselineTriageModal open={triageOpen} onOpenChange={setTriageOpen} />
      <HelpGuideModal open={helpOpen} onOpenChange={setHelpOpen} />
      {settings.isAiEnabled && (
        <>
          <HomeFloatingCommandBar
            onOpenChat={(mode) => {
              setChatDrawerMode(mode);
              setChatDrawerOpen(true);
            }}
          />
          <ChatAssistantDrawer
            open={chatDrawerOpen}
            onOpenChange={setChatDrawerOpen}
            initialMode={chatDrawerMode}
          />
        </>
      )}
    </>
  );
}
