import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { 
  getNextActionRecommendation, 
  NextActionEngineResult, 
  NextActionRecommendation,
  RationaleBadge 
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
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { recordS10Decision, startS10Timer } from '@/lib/telemetry';
import { db } from '@/db';
import { adaptTopicPacingFeedback } from '@/db/mutations';
import { toast } from 'sonner';

import { StudySystem, Subject } from '@/db';
import { Pencil, X, SlidersHorizontal, ChevronsUp, ChevronsDown } from 'lucide-react';

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
  const [sessionBudget, setSessionBudget] = useState<'quick' | 'deep'>('quick');
  const [skipIds, setSkipIds] = useState<string[]>([]);
  const [isSwapping, setIsSwapping] = useState(false);
  const [renderTimestamp, setRenderTimestamp] = useState<number>(Date.now());
  const [s10Speed, setS10Speed] = useState<number | null>(null);

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
    reason: 'already_studied' | 'too_difficult' | 'needs_deep_work' | 'fast_recall' | 'not_today' | 'not_relevant' | 'dismissed_gap' | 'default' = 'default'
  ) => {
    if (primary) {
      setIsSwapping(true);
      const elapsedSeconds = parseFloat(((Date.now() - renderTimestamp) / 1000).toFixed(1));
      recordS10Decision(false, reason, elapsedSeconds, primary.title);
      setSkipIds(prev => [...prev, primary.id]);
      try {
        if (reason === 'needs_deep_work') {
          await adaptTopicPacingFeedback(primary.systemId, primary.curriculumSetId, 'needs_deep_work');
          toast.success('Pacing Adapted 📚', {
            description: `Atlas reclassified "${primary.title}" as Deep Work (~35-50 min). Future recommendations adapted.`
          });
        } else if (reason === 'fast_recall') {
          await adaptTopicPacingFeedback(primary.systemId, primary.curriculumSetId, 'fast_recall');
          toast.success('Pacing Adapted ⚡', {
            description: `Marked "${primary.title}" for Quick Recall (≤ 20 min).`
          });
        } else if (reason === 'too_difficult') {
          await adaptTopicPacingFeedback(primary.systemId, primary.curriculumSetId, 'too_difficult');
          toast.info('Paced for Deep Work ⚠️', {
            description: `Marked as high-friction. Atlas shifted this to Deep Work sessions.`
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

  const isGap = (primary as any)?.type === 'topicGap' || (primary as any)?.type === 'systemGap';

  // If in triage mode, we suppress red overdue badges to lower anxiety
  const displayBadges = result?.isTriageMode && primary?.rationaleBadges
    ? primary.rationaleBadges.filter(b => b.label !== '⚡ Pending Review')
    : primary?.rationaleBadges || [];

  const isCustomFocusPinned = !!(customPrimarySubject || customPrimarySystem);

  return (
    <div className="bg-card border border-border/60 rounded-3xl p-4 sm:p-6 shadow-sm shadow-primary/5 hover:shadow-md transition-all hover:border-primary/40 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-4 mb-4 border-b border-border/60">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/25 shrink-0 shadow-sm mt-0.5 sm:mt-0">
            {isCustomFocusPinned ? (
              <Target className="h-5 w-5" />
            ) : (
              <Compass className="h-5 w-5 animate-pulse" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            {result?.isTriageMode && (
              <div className="mb-1.5">
                <Badge variant="outline" className="text-[11px] sm:text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold py-0.5 px-2.5 leading-snug whitespace-normal inline-block">
                  Session calibrated for optimal retention.
                </Badge>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary truncate">
                {isCustomFocusPinned ? "Target Focus" : "Recommended Action"}
              </span>
              <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 border-primary/30 text-primary font-mono shrink-0">
                {isCustomFocusPinned ? "Manually Pinned" : "Calculated Focus"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isCustomFocusPinned 
                ? "Manually pinned for immediate review"
                : "Calculated based on memory decay and exam weightage"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between sm:justify-end shrink-0 pt-1 md:pt-0">
          {/* Custom Focus Pin/Edit button */}
          {setFocusDialogType && (
            <button
              type="button"
              onClick={() => setFocusDialogType('primary')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-border/60 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
              title={isCustomFocusPinned ? "Change pinned focus" : "Pin custom focus"}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{isCustomFocusPinned ? "Change Focus" : "Set Focus"}</span>
            </button>
          )}

          {/* Time Budget Selector Toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/50 shrink-0 max-w-full overflow-x-auto">
            <button
              type="button"
              onClick={() => setSessionBudget('quick')}
              className={cn(
                "flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                sessionBudget === 'quick'
                  ? "bg-background text-primary shadow-xs border border-border/60 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Quick (&le; 20m)</span>
            </button>
            <button
              type="button"
              onClick={() => setSessionBudget('deep')}
              className={cn(
                "flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                sessionBudget === 'deep'
                  ? "bg-background text-primary shadow-xs border border-border/60 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Deep (30m+)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isCustomFocusPinned ? (
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 min-w-0">
            <div className="space-y-1.5 min-w-0">
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

                {/* Dynamic Estimated Duration Badge with 1-Tap Adaptive Recalibration */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border shadow-2xs transition-all cursor-pointer hover:opacity-90 active:scale-95",
                          primary.estimatedMinutes <= 20
                            ? "bg-teal-500/10 text-teal-400 border-teal-500/30 hover:bg-teal-500/20"
                            : "bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20"
                        )}
                        title="Click to adapt estimated study duration for this topic"
                      >
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>~{primary.estimatedMinutes} min {primary.estimatedMinutes <= 20 ? 'Quick Recall' : 'Deep Work'}</span>
                        <SlidersHorizontal className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 rounded-xl">
                      <div className="px-3 py-2 border-b border-border/50 text-[11px]">
                        <p className="font-semibold text-foreground">Calibrate Duration Pacing</p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                          Atlas adapts future recommendations to your personal study speed.
                        </p>
                      </div>
                      <DropdownMenuItem 
                        onClick={() => handleSkip('needs_deep_work')}
                        className="cursor-pointer gap-2.5 py-2.5"
                      >
                        <ChevronsUp className="w-4 h-4 text-sky-400 shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-foreground">Needs Deep Work 📚</span>
                          <span className="text-[10px] text-muted-foreground">Takes longer (~35–50 min)</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleSkip('fast_recall')}
                        className="cursor-pointer gap-2.5 py-2.5"
                      >
                        <ChevronsDown className="w-4 h-4 text-teal-400 shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-foreground">Fast Recall Only ⚡</span>
                          <span className="text-[10px] text-muted-foreground">Quick & compact (≤ 15 min)</span>
                        </div>
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

          {/* Rationale Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-5 pt-1 min-w-0">
            <span className="text-[11px] font-semibold text-muted-foreground mr-1 shrink-0">
              Why this now:
            </span>
            {displayBadges.map((badge, idx) => (
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

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {(primary as any).type === 'topicGap' ? (
                <>
                  <Button
                    onClick={() => handleStartRevision(primary)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none"
                  >
                    <span>Add to Block</span>
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStartRevision(primary)}
                    className="border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl px-3.5 py-2.5 text-xs font-semibold cursor-pointer flex-1 sm:flex-none"
                  >
                    Create New
                  </Button>
                </>
              ) : (primary as any).type === 'systemGap' ? (
                <>
                  <Button
                    onClick={() => handleStartRevision(primary)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none"
                  >
                    <span>Add Topics</span>
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSkip('dismissed_gap')}
                    className="border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl px-3.5 py-2.5 text-xs font-semibold cursor-pointer flex-1 sm:flex-none"
                  >
                    Dismiss for now
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => handleStartRevision(primary)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none"
                  >
                    <span>Initiate Revision</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl px-3.5 py-2.5 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Skip</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-60 rounded-xl">
                      <DropdownMenuItem onClick={() => handleSkip('already_studied')} className="cursor-pointer gap-2 py-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs">Already studied</span>
                          <span className="text-[10px] text-muted-foreground">Hide for 12 hours</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSkip('needs_deep_work')} className="cursor-pointer gap-2 py-2">
                        <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs">Takes more time (Deep Work)</span>
                          <span className="text-[10px] text-muted-foreground">Adapt & move to Deep Work 📚</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSkip('fast_recall')} className="cursor-pointer gap-2 py-2">
                        <Zap className="w-4 h-4 text-teal-400 shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs">Quick Review Only</span>
                          <span className="text-[10px] text-muted-foreground">Mark as fast recall (≤ 15m) ⚡</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSkip('too_difficult')} className="cursor-pointer gap-2 py-2">
                        <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs">Too difficult right now</span>
                          <span className="text-[10px] text-muted-foreground">High friction • Schedule deep</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSkip('not_today')} className="cursor-pointer gap-2 py-2">
                        <CalendarX className="w-4 h-4 text-amber-500 shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs">Not today</span>
                          <span className="text-[10px] text-muted-foreground">Show something else</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSkip('not_relevant')} className="cursor-pointer gap-2 py-2">
                        <ThumbsDown className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs">Not relevant</span>
                          <span className="text-[10px] text-muted-foreground">Low yield for me</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}

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
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/30 px-3 py-1.5 rounded-xl border border-border/40 w-full sm:w-auto mt-2 sm:mt-0">
                <span className="font-semibold text-foreground shrink-0">Next up:</span>
                <span className="truncate max-w-[200px] sm:max-w-[260px]">
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
              ? `No quick reviews pending. You have ${(result?.totalCandidatesEvaluated || 0)} Deep Study Blocks due.`
              : result && !result.hasPendingSyllabus
              ? "You've conquered the entire syllabus! Take a well-deserved break, give a Grand Test (GT), or review your upcoming revision schedule."
              : "You've completed all your scheduled blocks. Make new study blocks for your pending syllabus to continue studying."
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
                Switch to Deep Work Block
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
  );
}