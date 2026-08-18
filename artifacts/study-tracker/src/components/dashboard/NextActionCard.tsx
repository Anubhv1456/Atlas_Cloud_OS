import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { 
  getNextActionRecommendation, 
  NextActionEngineResult, 
  NextActionRecommendation,
  RationaleBadge,
  SessionBudget,
  RecommendationArchetype
} from '@/lib/recommendations/nextActionEngine';
import { 
  Sparkles, 
  Zap, 
  BookOpen, 
  Clock, 
  Target, 
  AlertTriangle, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  Compass,
  Folder,
  Plus,
  MoreVertical,
  XCircle,
  ThumbsDown,
  CalendarX,
  Check,
  Pencil,
  X,
  SlidersHorizontal,
  ChevronsUp,
  ChevronsDown,
  Palmtree,
  Sun,
  Flame,
  Stethoscope,
  Info,
  Layers,
  HelpCircle,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { recordS10Decision, startS10Timer } from '@/lib/telemetry';
import { db } from '@/db';
import { adaptTopicPacingFeedback, resetOperationalMode } from '@/db/mutations';
import { toast } from 'sonner';
import { StudySystem, Subject } from '@/db';
import { WhyRecommendationSheet } from './WhyRecommendationSheet';

interface NextActionCardProps {
  customPrimarySubject?: Subject;
  customPrimarySystem?: StudySystem;
  setFocusDialogType?: (type: 'primary' | 'secondary' | null) => void;
  setFocus?: (sysId: number, type: 'primary' | 'secondary' | null) => void;
  setSubjectFocus?: (subId: number, type: 'primary' | 'secondary' | null) => void;
  goToSystem?: (subjectId: number, systemId: number) => void;
}

export function NextActionCard({
  customPrimarySubject,
  customPrimarySystem,
  setFocusDialogType,
  setFocus,
  setSubjectFocus,
  goToSystem
}: NextActionCardProps = {}) {
  const [, setLocation] = useLocation();
  const [sessionBudget, setSessionBudget] = useState<SessionBudget>('quick');
  const [skipIds, setSkipIds] = useState<string[]>([]);
  const [isSwapping, setIsSwapping] = useState(false);
  const [renderTimestamp, setRenderTimestamp] = useState<number>(Date.now());
  const [s10Speed, setS10Speed] = useState<number | null>(null);
  const [whySheetOpen, setWhySheetOpen] = useState(false);

  const result: NextActionEngineResult | null = useLiveQuery(async () => {
    try {
      return await getNextActionRecommendation({
        sessionBudget,
        skipIds,
        targetExam: 'NEET PG'
      });
    } catch (err) {
      console.error('Error running NextActionEngine:', err);
      return null;
    }
  }, [sessionBudget, skipIds]) || null;

  const primary = result?.primary || null;
  const fallback = result?.fallback || null;

  useEffect(() => {
    if (primary) {
      setRenderTimestamp(Date.now());
      startS10Timer();
    }
  }, [primary?.id, sessionBudget]);

  const handleSkip = async (
    reason: 'already_studied' | 'too_difficult' | 'needs_deep_work' | 'fast_recall' | 'standard' | 'not_today' | 'not_relevant' | 'dismissed_gap' | 'default' = 'default'
  ) => {
    if (primary) {
      setIsSwapping(true);
      const elapsedSeconds = parseFloat(((Date.now() - renderTimestamp) / 1000).toFixed(1));
      recordS10Decision(false, reason, elapsedSeconds, primary.title);
      setSkipIds(prev => [...prev, primary.id]);
      try {
        if (reason === 'needs_deep_work') {
          await adaptTopicPacingFeedback(primary.systemId, primary.curriculumSetId, 'needs_deep_work');
          toast.success('Categorized as Deep Focus 🔬', {
            description: `"${primary.title}" is now classified as Deep Focus. Recommendations updated.`
          });
        } else if (reason === 'fast_recall') {
          await adaptTopicPacingFeedback(primary.systemId, primary.curriculumSetId, 'fast_recall');
          toast.success('Categorized as Rapid Recall ⚡', {
            description: `"${primary.title}" is now classified as Rapid Recall.`
          });
        } else if (reason === 'standard') {
          await adaptTopicPacingFeedback(primary.systemId, primary.curriculumSetId, 'standard');
          toast.success('Categorized as Standard Review 📖', {
            description: `"${primary.title}" is now classified as Standard Review.`
          });
        } else if (reason === 'too_difficult') {
          await adaptTopicPacingFeedback(primary.systemId, primary.curriculumSetId, 'too_difficult');
          toast.info('Paced for Deep Work ⚠️', {
            description: `Marked as high friction. Atlas shifted this to Deep Focus sessions.`
          });
        }

        await db.recommendationSkips.add({
          targetId: primary.id,
          skippedAt: new Date(),
          reason,
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000)
        });
      } catch(e) {
        console.warn('Failed to save skip to db', e);
      }
      setTimeout(() => setIsSwapping(false), 200);
    }
  };

  const handleResetSkips = () => {
    setSkipIds([]);
  };

  const handleStartRevision = (rec: NextActionRecommendation) => {
    const elapsedSeconds = parseFloat(((Date.now() - renderTimestamp) / 1000).toFixed(1));
    setS10Speed(elapsedSeconds);
    recordS10Decision(true, null, elapsedSeconds, rec.title);
    try {
      const existing = JSON.parse(localStorage.getItem('atlas_s10_logs') || '[]');
      existing.push({
        timestamp: new Date().toISOString(),
        elapsedSeconds,
        recommendationId: rec.id,
        title: rec.title,
        hitS10Target: elapsedSeconds <= 10
      });
      localStorage.setItem('atlas_s10_logs', JSON.stringify(existing.slice(-50)));
    } catch (e) {
      console.warn('Could not save S10 metric', e);
    }
    setLocation(`/subjects/${rec.subjectId}?systemId=${rec.systemId}${rec.curriculumSetId ? `&setId=${rec.curriculumSetId}` : ''}`);
  };

  const renderBadgeIcon = (iconType?: RationaleBadge['iconType']) => {
    switch (iconType) {
      case 'clock':
        return <Clock className="w-3 h-3 mr-1" />;
      case 'target':
        return <Target className="w-3 h-3 mr-1" />;
      case 'alert':
        return <AlertTriangle className="w-3 h-3 mr-1" />;
      case 'zap':
        return <Zap className="w-3 h-3 mr-1" />;
      case 'book':
        return <BookOpen className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  const getBadgeClass = (variant: RationaleBadge['variant']) => {
    switch (variant) {
      case 'destructive':
        return 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20';
      case 'amber':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'primary':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'muted':
      default:
        return 'bg-muted text-muted-foreground border-border/50';
    }
  };

  const isCustomFocusPinned = !!(customPrimarySubject || customPrimarySystem);

  // Determine Archetype for visual styling
  const archetype: RecommendationArchetype = result?.operationalMode?.mode === 'holiday' 
    ? 'holiday'
    : isCustomFocusPinned 
    ? 'tactical_strike' 
    : primary?.archetype || 'tactical_strike';

  // Archetype-driven theme configurations
  const getArchetypeCardConfig = () => {
    switch (archetype) {
      case 'tactical_sprint':
        return {
          glowColor: 'bg-primary/15',
          borderColor: 'hover:border-primary/60 border-primary/30',
          badgeText: '🎯 Tactical Sprint Direct',
          badgeBg: 'bg-primary/15 text-primary border-primary/35',
          headerLabel: 'Sprint Directive',
          actionText: 'Initiate Sprint Block',
          icon: <Target className="h-5 w-5 text-primary" />
        };
      case 'clinical_duty':
        return {
          glowColor: 'bg-emerald-500/15',
          borderColor: 'hover:border-emerald-500/60 border-emerald-500/30',
          badgeText: '🌙 Clinical Duty Micro-Dose',
          badgeBg: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/35',
          headerLabel: 'Ward Micro-Action',
          actionText: 'Start 15m Micro-Dose',
          icon: <Zap className="h-5 w-5 text-emerald-500" />
        };
      case 'remediation_clinic':
        return {
          glowColor: 'bg-destructive/15',
          borderColor: 'hover:border-destructive/60 border-destructive/30',
          badgeText: '⚠️ Diagnostic Friction Gap',
          badgeBg: 'bg-destructive/15 text-destructive border-destructive/35',
          headerLabel: 'Diagnostic Gap Remediation',
          actionText: primary?.mistakeCount && primary.mistakeCount > 0 ? `Remediate ${primary.mistakeCount} Mistake${primary.mistakeCount > 1 ? 's' : ''}` : 'Initiate Remediation',
          icon: <Stethoscope className="h-5 w-5 text-destructive" />
        };
      case 'flow_momentum':
        return {
          glowColor: 'bg-sky-500/15',
          borderColor: 'hover:border-sky-500/60 border-sky-500/30',
          badgeText: '🔥 Flow-State Momentum',
          badgeBg: 'bg-sky-500/15 text-sky-400 border-sky-500/35',
          headerLabel: 'Sequential Step',
          actionText: 'Maintain Momentum',
          icon: <Flame className="h-5 w-5 text-amber-500" />
        };
      case 'soft_recalibration':
        return {
          glowColor: 'bg-teal-500/15',
          borderColor: 'hover:border-teal-500/60 border-teal-500/30',
          badgeText: '⚡ Soft Recalibration Paced',
          badgeBg: 'bg-teal-500/15 text-teal-400 border-teal-500/35',
          headerLabel: 'Smoothing Quota',
          actionText: 'Complete Quota Block',
          icon: <Activity className="h-5 w-5 text-teal-400" />
        };
      case 'holiday':
        return {
          glowColor: 'bg-amber-500/15',
          borderColor: 'border-amber-500/30',
          badgeText: '🌴 Holiday Freeze Active',
          badgeBg: 'bg-amber-500/15 text-amber-500 border-amber-500/35',
          headerLabel: 'Protected Rest',
          actionText: 'Resume Early',
          icon: <Palmtree className="h-5 w-5 text-amber-500" />
        };
      case 'tactical_strike':
      default:
        return {
          glowColor: 'bg-primary/10',
          borderColor: 'hover:border-primary/40 border-border/70',
          badgeText: isCustomFocusPinned ? '📌 Target Focus Pinned' : 'Calculated Priority',
          badgeBg: 'bg-primary/10 text-primary border-primary/30',
          headerLabel: isCustomFocusPinned ? 'Target Focus' : 'Recommended Action',
          actionText: 'Initiate Revision',
          icon: isCustomFocusPinned ? <Target className="h-5 w-5 text-primary" /> : <Compass className="h-5 w-5 text-primary" />
        };
    }
  };

  const cardConfig = getArchetypeCardConfig();

  // Clean formatted sprint subjects for directive subtitle
  const sprintSubjectNames = result?.activeSprintSummary?.subjectNames || [];
  const sprintSubjectsText = sprintSubjectNames.length > 0
    ? (sprintSubjectNames.length === 1
        ? sprintSubjectNames[0]
        : sprintSubjectNames.length === 2
        ? `${sprintSubjectNames[0]} & ${sprintSubjectNames[1]}`
        : `${sprintSubjectNames[0]} +${sprintSubjectNames.length - 1} subjects`)
    : 'Selected sprint subjects';

  return (
    <>
      <div className={cn(
        "bg-card border rounded-3xl p-4 sm:p-6 shadow-sm transition-all relative overflow-hidden max-w-full",
        cardConfig.borderColor
      )}>
        {/* Decorative background glow */}
        <div className={cn(
          "pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full blur-3xl transition-colors duration-500",
          cardConfig.glowColor
        )} />

        {/* ── Top Meta Bar ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 mb-4 border-b border-border/60">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/60 border border-border/80 shrink-0 shadow-xs mt-0.5 sm:mt-0">
              {cardConfig.icon}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap min-w-0 mb-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary truncate">
                  {cardConfig.headerLabel}
                </span>

                <Badge variant="outline" className={cn("text-[9px] uppercase px-2 py-0.5 font-mono shrink-0 font-bold", cardConfig.badgeBg)}>
                  {cardConfig.badgeText}
                </Badge>

                {/* Circadian Indicator */}
                {result?.circadianLabel && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-muted-foreground font-mono bg-muted/40 px-2 py-0.5 rounded-full border border-border/50">
                    <Sun className="w-2.5 h-2.5 text-amber-500" />
                    {result.circadianLabel}
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed truncate">
                {isCustomFocusPinned 
                  ? "Manually pinned for immediate review session"
                  : archetype === 'tactical_sprint'
                  ? `Exclusively targeted to: ${sprintSubjectsText}`
                  : archetype === 'clinical_duty'
                  ? "High-yield volatile micro-actions calibrated for hospital shifts"
                  : archetype === 'remediation_clinic'
                  ? `${primary?.mistakeCount || 0} unresolved clinical errors detected in recent test history`
                  : archetype === 'flow_momentum'
                  ? `${result?.sessionsCompletedToday || 1} session(s) completed today (${result?.minutesStudiedToday || 0}m) • Flow state active`
                  : archetype === 'soft_recalibration'
                  ? `Smoothed pacing via Knapsack decay allocation (${result?.recalibrationStatus?.daysRemaining}d remaining)`
                  : "Ranked #1 highest recall ROI by Ebbinghaus retention and exam yield"}
              </p>
            </div>
          </div>

          {/* Time Tuner & Action Controls */}
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 shrink-0 self-start sm:self-auto w-full sm:w-auto">
            {/* Custom Focus Pin/Edit button (hidden during tactical sprint unless custom focus is already active) */}
            {setFocusDialogType && (isCustomFocusPinned || archetype !== 'tactical_sprint') && (
              <button
                type="button"
                onClick={() => setFocusDialogType('primary')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-border/60 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                title={isCustomFocusPinned ? "Change pinned focus" : "Pin custom focus"}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{isCustomFocusPinned ? "Change Focus" : "Pin Focus"}</span>
              </button>
            )}

            {/* 3-Way Cognitive Intent Tuner */}
            {result?.operationalMode?.mode !== 'holiday' && (
              <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/50 shrink-0 max-w-full overflow-x-auto no-scrollbar scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSessionBudget('quick')}
                  className={cn(
                    "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0",
                    sessionBudget === 'quick'
                      ? "bg-background text-amber-500 shadow-xs border border-amber-500/30 font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Filter 15m Rapid Recall drills & volatile concepts"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Rapid (15m)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSessionBudget('standard')}
                  className={cn(
                    "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0",
                    sessionBudget === 'standard'
                      ? "bg-background text-teal-400 shadow-xs border border-teal-500/30 font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Standard 30m organ systems & core PYQs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>Standard (30m)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSessionBudget('deep')}
                  className={cn(
                    "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0",
                    sessionBudget === 'deep'
                      ? "bg-background text-sky-400 shadow-xs border border-sky-500/30 font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Deep focus 60m sessions for complex multi-step systems"
                >
                  <BookOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Deep (60m)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Main Content Area ─────────────────────────────────────────────────── */}
        {archetype === 'holiday' ? (
          <div className="py-8 text-center space-y-4">
            <div className="inline-flex p-4 rounded-3xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-1 shadow-sm">
              <Palmtree className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-xs font-semibold">
                <Sun className="w-3.5 h-3.5" />
                <span>Holiday Freeze Shield Active</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Protected Rest & Recovery
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Your study streak is frozen and preserved. Scheduled revisions are halted. When you return, Atlas will smooth your backlog over a 10-day recalibration window.
              </p>
            </div>

            {result?.operationalMode?.targetDate && (
              <div className="text-xs text-muted-foreground bg-muted/40 px-3.5 py-1.5 rounded-xl border border-border/50 inline-block">
                Scheduled resume date: <span className="font-semibold text-foreground">{new Date(result.operationalMode.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })}</span>
              </div>
            )}

            <div className="pt-2 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await resetOperationalMode(10);
                  toast.success('⚡ Switched to Standard Mode', {
                    description: 'Soft recalibration active — your backlog is smoothly paced over 10 days.'
                  });
                }}
                className="text-xs font-semibold border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-all rounded-xl h-9 px-4 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Resume Study Early
              </Button>
            </div>
          </div>
        ) : isCustomFocusPinned ? (
          <div className="space-y-4 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium min-w-0">
                  <span className="flex items-center gap-1 text-foreground font-semibold truncate">
                    <Folder className="w-3.5 h-3.5 text-primary shrink-0" />
                    {customPrimarySubject?.name || 'Medical Curriculum'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug break-words">
                  {customPrimarySystem?.name || customPrimarySubject?.name}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-primary shrink-0" />
                  Target focus pinned for study session
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/50">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => {
                    if (customPrimarySystem && goToSystem) {
                      goToSystem(customPrimarySystem.subjectId, customPrimarySystem.id!);
                    } else if (customPrimarySubject) {
                      setLocation(`/subjects/${customPrimarySubject.id}`);
                    }
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none"
                >
                  <span>Initiate Focus Revision</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    if (customPrimarySubject && setSubjectFocus) {
                      setSubjectFocus(customPrimarySubject.id!, null);
                    }
                    if (customPrimarySystem && setFocus) {
                      setFocus(customPrimarySystem.id!, null);
                    }
                  }}
                  className="border-border/80 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl px-3.5 py-2.5 text-xs font-semibold cursor-pointer flex items-center gap-1.5 flex-1 sm:flex-none"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Pin</span>
                </Button>
              </div>
            </div>
          </div>
        ) : primary ? (
          <div className={cn("transition-opacity duration-200 min-w-0", isSwapping ? "opacity-30" : "opacity-100")}>
            {/* Priority Override & Contextual Fallback Banner */}
            {primary.priorityOverrideNotice && (
              <div className="mb-3.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-xs text-amber-500 dark:text-amber-400">
                <Zap className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span className="font-semibold">{primary.priorityOverrideNotice}</span>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 min-w-0">
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium min-w-0">
                    <span className="flex items-center gap-1 text-foreground font-semibold truncate">
                      <Folder className="w-3.5 h-3.5 text-primary shrink-0" />
                      {primary.subjectName}
                    </span>
                    {primary.systemName !== primary.title && (
                      <>
                        <span>•</span>
                        <span className="truncate">{primary.systemName}</span>
                      </>
                    )}
                  </div>

                  {/* User-Configured Cognitive Depth Badge with 1-Tap Category Switcher */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border shadow-2xs transition-all cursor-pointer hover:opacity-90 active:scale-95",
                            primary.depth === 'rapid'
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                              : primary.depth === 'deep' || primary.isLengthy
                              ? "bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20"
                              : "bg-teal-500/10 text-teal-400 border-teal-500/30 hover:bg-teal-500/20"
                          )}
                          title="Click to categorize study depth for this block"
                        >
                          {primary.depth === 'rapid' ? (
                            <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                          ) : primary.depth === 'deep' || primary.isLengthy ? (
                            <BookOpen className="w-3 h-3 text-sky-400 shrink-0" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-teal-400 shrink-0" />
                          )}
                          <span>
                            {primary.depth === 'rapid' ? '⚡ Rapid Recall' : primary.depth === 'deep' || primary.isLengthy ? '🔬 Deep Focus' : '📖 Standard'}
                          </span>
                          <SlidersHorizontal className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 space-y-0.5">
                        <DropdownMenuItem 
                          onClick={() => handleSkip('fast_recall')}
                          className="cursor-pointer gap-2 py-2 text-xs font-semibold text-foreground rounded-lg"
                        >
                          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Rapid Recall</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleSkip('standard')}
                          className="cursor-pointer gap-2 py-2 text-xs font-semibold text-foreground rounded-lg"
                        >
                          <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
                          <span>Standard</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleSkip('needs_deep_work')}
                          className="cursor-pointer gap-2 py-2 text-xs font-semibold text-foreground rounded-lg"
                        >
                          <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
                          <span>Deep Focus</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug break-words">
                  {primary.title}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  {primary.statusText}
                </p>
              </div>
            </div>

            {/* Rationale Badges & "Why This?" CDSS Trigger */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-5 pt-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
                <span className="text-[11px] font-semibold text-muted-foreground mr-1 shrink-0">
                  Why this now:
                </span>
                {primary.rationaleBadges.map((badge, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      "inline-flex items-center text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-lg border shadow-2xs whitespace-normal break-words",
                      getBadgeClass(badge.variant)
                    )}
                  >
                    {renderBadgeIcon(badge.iconType)}
                    {badge.label}
                  </span>
                ))}
              </div>

              {/* Single-Tap CDSS Mathematical Transparency Button */}
              {primary.whyBreakdown && (
                <button
                  type="button"
                  onClick={() => setWhySheetOpen(true)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg border border-primary/30 text-primary bg-primary/5 hover:bg-primary/15 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span>Why this? (Score {primary.whyBreakdown.priorityScore})</span>
                </button>
              )}
            </div>

            {/* Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => handleStartRevision(primary)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none"
                >
                  <span>
                    {sessionBudget === 'quick' || primary.depth === 'rapid'
                      ? 'Initiate 15m Rapid Drill'
                      : sessionBudget === 'deep' || primary.depth === 'deep'
                      ? 'Initiate Deep Session'
                      : cardConfig.actionText}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl px-3.5 py-2.5 text-xs font-semibold cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Skip</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-60 rounded-xl">
                    <DropdownMenuItem onClick={() => handleSkip('already_studied')} className="cursor-pointer gap-2 py-2 text-xs font-semibold">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Already studied</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSkip('fast_recall')} className="cursor-pointer gap-2 py-2 text-xs font-semibold">
                      <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Rapid Recall</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSkip('needs_deep_work')} className="cursor-pointer gap-2 py-2 text-xs font-semibold">
                      <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>Deep Focus</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSkip('too_difficult')} className="cursor-pointer gap-2 py-2 text-xs font-semibold">
                      <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                      <span>Too difficult right now</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSkip('not_today')} className="cursor-pointer gap-2 py-2 text-xs font-semibold">
                      <CalendarX className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Not today</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSkip('not_relevant')} className="cursor-pointer gap-2 py-2 text-xs font-semibold">
                      <ThumbsDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>Not relevant</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {skipIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetSkips}
                    className="text-[11px] text-muted-foreground hover:text-primary underline ml-1 cursor-pointer hidden sm:block"
                  >
                    Reset ({skipIds.length})
                  </button>
                )}
              </div>

              {/* Fallback candidate preview */}
              {fallback && (
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/30 px-3 py-1.5 rounded-xl border border-border/40 w-full sm:w-auto min-w-0">
                  <span className="font-semibold text-foreground shrink-0">Next up:</span>
                  <span className="truncate flex-1 min-w-0 max-w-full sm:max-w-[260px]">
                    {fallback.subjectName} • {fallback.title}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-6 text-center space-y-3">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-1">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              {result && !result.hasAnyCurriculumSets
                ? "Welcome to Atlas"
                : result && !result.hasPendingSyllabus
                ? "Syllabus Completed"
                : "All Clear & Up to Date!"
              }
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              {result && !result.hasAnyCurriculumSets 
                ? "Let's get started by creating your first study block."
                : sessionBudget === 'quick' && result?.quickEligibleCount === 0 && (result?.totalCandidatesEvaluated || 0) > 0
                ? `No Rapid Recall drills pending. You have ${(result?.totalCandidatesEvaluated || 0)} Deep Focus blocks due.`
                : result && !result.hasPendingSyllabus
                ? "You've conquered the entire syllabus! Take a well-deserved break, give a Grand Test (GT), or review your upcoming revision schedule."
                : "You've completed all scheduled blocks for this filter. Create new study blocks for your pending syllabus to continue studying."
              }
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-4">
              {sessionBudget === 'quick' && result?.quickEligibleCount === 0 && (result?.totalCandidatesEvaluated || 0) > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSessionBudget('deep')}
                  className="text-xs font-semibold border-primary/30 text-primary cursor-pointer w-full sm:w-auto"
                >
                  Switch to Deep Focus Block
                </Button>
              )}
              
              {result && !result.hasAnyCurriculumSets && (
                <Button
                  onClick={() => document.getElementById('subject-portfolio')?.scrollIntoView({ behavior: 'smooth' })}
                  size="sm"
                  className="text-xs font-semibold bg-primary text-primary-foreground cursor-pointer w-full sm:w-auto"
                >
                  Go to Subjects
                </Button>
              )}
              
              {result && result.hasAnyCurriculumSets && result.hasPendingSyllabus && (sessionBudget !== 'quick' || (result?.totalCandidatesEvaluated || 0) === 0) && (
                <Button
                  onClick={() => document.getElementById('subject-portfolio')?.scrollIntoView({ behavior: 'smooth' })}
                  size="sm"
                  className="text-xs font-semibold border-primary/30 text-primary cursor-pointer w-full sm:w-auto"
                  variant="outline"
                >
                  Create New Blocks
                </Button>
              )}

              {skipIds.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetSkips}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer w-full sm:w-auto"
                >
                  Reset Skipped ({skipIds.length})
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Algorithmic Decision Support Mathematical Transparency Sheet */}
      <WhyRecommendationSheet
        open={whySheetOpen}
        onOpenChange={setWhySheetOpen}
        recommendation={primary}
      />
    </>
  );
}
