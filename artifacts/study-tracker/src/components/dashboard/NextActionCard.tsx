import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useLiveQuery } from 'dexie-react-hooks';
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
import { db } from '@/db';

export function NextActionCard() {
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
    }
  }, [primary?.id, sessionBudget]);

  const handleSkip = async (reason: 'already_studied' | 'too_difficult' | 'not_today' | 'not_relevant' | 'dismissed_gap' | 'default' = 'default') => {
    if (primary) {
      setIsSwapping(true);
      setSkipIds(prev => [...prev, primary.id]);
      try {
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

  const isGap = primary?.type === 'topicGap' || primary?.type === 'systemGap';

  // If in triage mode, we suppress red overdue badges to lower anxiety
  const displayBadges = result?.isTriageMode && primary?.rationaleBadges
    ? primary.rationaleBadges.filter(b => b.label !== '⚡ Pending Review')
    : primary?.rationaleBadges || [];

  return (
    <div className="bg-card border border-border/60 rounded-3xl p-5 sm:p-6 shadow-sm shadow-primary/5 hover:shadow-md transition-all hover:border-primary/40 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/25 shrink-0 shadow-sm">
            <Compass className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {result?.isTriageMode && (
                <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold mb-1 w-full sm:w-auto">
                  Welcome back. We've reorganized your reviews so you can restart comfortably.
                </Badge>
              )}
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Next Best Action
              </span>
              <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 border-primary/30 text-primary font-mono">
                Sub-10s Engine
              </Badge>
            </div>
            {!result?.isTriageMode && (
              <p className="text-xs text-muted-foreground">
                Zero decision fatigue • Priority-ranked for maximum score impact
              </p>
            )}
          </div>
        </div>

        {/* Time Budget Selector Toggle */}
        <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/50 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setSessionBudget('quick')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              sessionBudget === 'quick'
                ? "bg-background text-primary shadow-sm border border-border/60 font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Quick (10–20m)
          </button>
          <button
            type="button"
            onClick={() => setSessionBudget('deep')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              sessionBudget === 'deep'
                ? "bg-background text-primary shadow-sm border border-border/60 font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            Deep Work (45m+)
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {primary ? (
        <div className={cn("transition-opacity duration-200", isSwapping ? "opacity-30" : "opacity-100")}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium">
                <span className="flex items-center gap-1 text-foreground font-semibold">
                  <Folder className="w-3.5 h-3.5 text-primary" />
                  {primary.subjectName}
                </span>
                {primary.systemName !== primary.title && (
                  <>
                    <span>•</span>
                    <span>{primary.systemName}</span>
                  </>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug">
                {primary.title}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                {primary.statusText}
              </p>
            </div>
          </div>

          {/* Rationale Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-5 pt-1">
            <span className="text-[11px] font-semibold text-muted-foreground mr-1">
              Why this now:
            </span>
            {displayBadges.map((badge, idx) => (
              <span
                key={idx}
                className={cn(
                  "inline-flex items-center text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-lg border shadow-2xs",
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
              {primary.type === 'topicGap' ? (
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
              ) : primary.type === 'systemGap' ? (
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
                    <span>Start Revision</span>
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
                    <DropdownMenuContent align="start" className="w-56 rounded-xl">
                      <DropdownMenuItem onClick={() => handleSkip('already_studied')} className="cursor-pointer gap-2 py-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <div className="flex flex-col">
                          <span className="font-semibold">Already studied</span>
                          <span className="text-[10px] text-muted-foreground">Hide for 12 hours</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSkip('not_today')} className="cursor-pointer gap-2 py-2">
                        <CalendarX className="w-4 h-4 text-amber-500" />
                        <div className="flex flex-col">
                          <span className="font-semibold">Not today</span>
                          <span className="text-[10px] text-muted-foreground">Show something else</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSkip('too_difficult')} className="cursor-pointer gap-2 py-2">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        <div className="flex flex-col">
                          <span className="font-semibold">Too difficult right now</span>
                          <span className="text-[10px] text-muted-foreground">Needs more time</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSkip('not_relevant')} className="cursor-pointer gap-2 py-2">
                        <ThumbsDown className="w-4 h-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-semibold">Not relevant</span>
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
          <h3 className="text-base font-bold text-foreground">All Clear & Up to Date!</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            {sessionBudget === 'quick' && result?.quickEligibleCount === 0
              ? 'No quick 10-20m topics left pending. Switch to "Deep Work (45m+)" to see lengthy systems requiring deep focus.'
              : 'You have no pending revisions or overdue items right now. Add new subjects or create study blocks to get recommendations.'}
          </p>
          {sessionBudget === 'quick' && result?.quickEligibleCount === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSessionBudget('deep')}
              className="mt-2 text-xs font-semibold border-primary/30 text-primary cursor-pointer"
            >
              Switch to Deep Work Block
            </Button>
          )}
          {skipIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetSkips}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Reset Skipped Topics ({skipIds.length})
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
