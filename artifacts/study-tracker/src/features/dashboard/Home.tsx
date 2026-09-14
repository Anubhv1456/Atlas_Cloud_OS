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
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { TargetExamModal } from '@/components/TargetExamModal';
import { OnboardingModal } from '@/components/OnboardingModal';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { loadUniversalOntology } from '@/lib/exam-presets';
import { toast } from 'sonner';
import { HomeRadarSummaryCard } from '@/features/dashboard/HomeRadarSummaryCard';
import { ExamCountdownWidget } from '@/components/dashboard/ExamCountdownWidget';
import { useHomeLogic } from './Home.hooks';
import { AmbientAIWidget, ChatAssistantDrawer } from '@/components/ai';
import { HomeFloatingCommandBar } from '@/components/dashboard/HomeFloatingCommandBar';
import { useAISettings } from '@/lib/ai/aiSettingsStorage';
import { AtlasLoadingScreen } from '@/components/AtlasLoadingScreen';
import { useAuth } from '@/hooks/useAuth';
import { setOperationalMode } from '@/db/mutations';

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

function MasteryDashboard() {
  const [activeTab, setActiveTab] = useState<'radar' | 'sky'>('radar');
  
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Mastery & Analytics</h2>
        <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border/80 self-start sm:self-auto">
          <button 
            type="button"
            onClick={() => setActiveTab('radar')}
            className={cn("px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer", activeTab === 'radar' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            🕸️ Radar View
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('sky')}
            className={cn("px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer", activeTab === 'sky' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            ✨ Atlas Sky
          </button>
        </div>
      </div>
      
      {activeTab === 'radar' && <HomeRadarSummaryCard />}
      {activeTab === 'sky' && (
         <div className="bg-card border border-border/60 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] gap-5 shadow-xs relative overflow-hidden">
             <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-500/20 via-background to-background"></div>
             <div className="p-4 bg-zinc-800/40 rounded-full border border-white/5 relative z-10">
                <Sparkles className="w-8 h-8 text-amber-400" />
             </div>
             <div className="text-center relative z-10">
                 <h3 className="text-lg font-bold text-foreground">Atlas Sky Constellation</h3>
                 <p className="text-sm text-muted-foreground max-w-sm mt-1.5 mb-4 mx-auto leading-relaxed">
                   Explore your medical mastery in an ambient, interactive spatial map. As you solidify concepts, constellations connect.
                 </p>
                 <div className="flex justify-center mt-2">
                    <AtlasSkyPreview />
                 </div>
             </div>
         </div>
      )}
    </div>
  );
}

function ProactiveModeBanner() {
  const history = useLiveQuery(() => db.studyHistory.toArray(), []) || [];
  const opMode = useLiveQuery(() => db.operationalModes.get('current'), []);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !opMode || opMode.mode !== 'standard') return null;

  const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;
  const recentLogs = history.filter(h => new Date(h.completedAt).getTime() > fortyEightHoursAgo);
  const recentMinutes = recentLogs.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

  if (recentMinutes > 0) return null;

  const handleSetMode = async (mode: 'clinical_duty' | 'holiday') => {
    try {
      await setOperationalMode({
        mode,
        activatedAt: new Date().toISOString(),
        targetSubjectIds: [],
        dailyCapacityMinutes: mode === 'clinical_duty' ? 30 : 0
      });
      toast.success(`${mode === 'clinical_duty' ? 'Clinical Duty' : 'Holiday'} mode activated. Schedule protected.`);
      setDismissed(true);
    } catch (e) {
      toast.error('Failed to change mode');
    }
  };

  return (
    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start sm:items-center gap-3">
        <div className="p-2 bg-indigo-500/20 rounded-lg shrink-0 mt-1 sm:mt-0">
          <Brain className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-300">Take a breath.</h3>
          <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 mt-0.5">
            We noticed you haven't logged study time in 2 days. Want to protect your spaced-repetition schedule from snowballing?
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button onClick={() => handleSetMode('clinical_duty')} variant="outline" size="sm" className="flex-1 sm:flex-auto text-xs h-8 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 cursor-pointer">
          Clinical Duty
        </Button>
        <Button onClick={() => handleSetMode('holiday')} variant="outline" size="sm" className="flex-1 sm:flex-auto text-xs h-8 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 cursor-pointer">
          Holiday Mode
        </Button>
        <Button onClick={() => setDismissed(true)} variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 dark:text-indigo-500 hover:bg-indigo-500/20 shrink-0 cursor-pointer">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
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
  const [helpOpen, setHelpOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [chatDrawerMode, setChatDrawerMode] = useState<'text' | 'voice'>('text');
  const { hasOnboarded, loading: onboardingLoading } = useOnboardingStatus();

  const { hasAccess, isFreeTier, isTrialActive, trialDaysRemaining } = useBetaAccess();
  const { user } = useAuth();
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  const hasAffiliate = typeof window !== 'undefined' && Boolean(
    localStorage.getItem('atlas_affiliate_id') ||
    sessionStorage.getItem('atlas_pending_ref_code')
  );


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

  // ── Payment Return Feedback & URL Sanitization ──────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');

    if (paymentStatus === 'success') {
      setIsVerifyingPayment(true);
      toast.success('Payment received! Verifying lifetime access with the network...', {
        duration: 6000,
      });

      const verify = async () => {
        try {
          const sessionId = localStorage.getItem('pending_dodo_session_id');
          if (!sessionId || !user) {
             // If we don't have session ID or user yet, we will just rely on the webhook polling
             // but let's wait a bit for webhook
             await new Promise(r => setTimeout(r, 4000));
             setIsVerifyingPayment(false);
             return;
          }
          
          const idToken = await user.getIdToken();
          const res = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ sessionId })
          });
          
          if (res.ok) {
            localStorage.removeItem('pending_dodo_session_id');
            // useBetaAccess will automatically sync from Firestore shortly
          }
        } catch (e) {
          console.error("Payment verification failed", e);
        } finally {
          setIsVerifyingPayment(false);
        }
      };
      
      verify();

      // Clean query parameters from address bar without page reload
      urlParams.delete('payment');
      const cleanSearch = urlParams.toString();
      const cleanUrl = window.location.pathname + (cleanSearch ? `?${cleanSearch}` : '') + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
    } else if (paymentStatus === 'cancelled') {
      toast.info('Checkout cancelled. Your study progress and local mistake vault remain saved.');

      urlParams.delete('payment');
      const cleanSearch = urlParams.toString();
      const cleanUrl = window.location.pathname + (cleanSearch ? `?${cleanSearch}` : '') + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [user]);

  return (
    <>
      {isVerifyingPayment && (
        <AtlasLoadingScreen fullScreen message="Verifying payment status..." />
      )}
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
                  className="flex items-center gap-1.5 text-zinc-300 dark:text-teal-400 hover:text-zinc-300 text-xs sm:text-xs font-semibold uppercase tracking-wider shrink-0 transition-colors cursor-pointer group truncate max-w-[180px] sm:max-w-none"
                  title="Click to recalibrate exam target"
                >
                  <Target className="w-3.5 h-3.5 shrink-0 text-zinc-300 group-hover:scale-110 transition-transform" />
                  <span className="truncate">
                    {profile.targetExam 
                      ? `${profile.targetExam} ${profile.currentYear ? `• ${profile.currentYear}` : ''}`
                      : 'Target: USMLE Step 1'
                    }
                  </span>
                </button>

                {/* ── Milestone Usage Status Chip (Free Tier Only) ──────────────── */}
                {isTrialActive && (
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('open-paywall-modal', {
                        detail: { trigger: 'default' }
                      }));
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer shrink-0"
                    title="Click to upgrade"
                  >
                    <span className="font-semibold">🚀 14-Day Free Trial</span> • {trialDaysRemaining} Days Remaining
                  </button>
                )}

                {streak > 0 && (
                  <span className="hidden xs:inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950/20 border border-white/5 text-amber-400 shrink-0">
                    <Flame className="w-3 h-3 fill-amber-500/20" /> {streak}d
                  </span>
                )}
              </div>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight truncate">{greeting}</h1>
            </div>
            
            {/* Action controls - Top Right Corner */}
            <div className="flex items-center justify-end gap-1.5 shrink-0">
              {/* Removed AtlasSkyPreview from header */}
            </div>
          </div>
        </header>

        {/* ── Main Content Container ─────────────────────────────────────────── */}
        <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 pb-[calc(9.5rem+env(safe-area-inset-bottom,0px))] md:pb-12 min-w-0 flex flex-col relative z-10">
          
          <ExamCountdownWidget />
          
          {/* ── Single Unified Focal Directive Hero (Execution Zone) ───────────── */}
          <ProactiveModeBanner />
          
          <div className="mb-4">
            <NextActionCard />
          </div>
          
          {/* ── AI Logger (Execution Zone) ─────────────────────────────────────── */}
          <div className="mb-8">
            <AILoggerCard />
          </div>

          <div className="my-6 border-t border-border/40"></div>

          {/* ── Mastery & Analytics Zone (Reflection Zone) ────────────────────── */}
          <MasteryDashboard />

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
