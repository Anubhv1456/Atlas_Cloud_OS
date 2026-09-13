import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useNextActionEngine } from '@/hooks/useNextActionEngine';
import { useOperationalMode } from '@/db';
import { isSoftRecalibrating } from '@/db/revisionEngine';
import { 
  Sparkles, Play, Clock, ArrowRight, AlertTriangle, CheckCircle2, ShieldAlert, Zap, Target, Book, Crosshair
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function NextActionCard() {
  const [, setLocation] = useLocation();
  const { result, loading } = useNextActionEngine();
  const opMode = useOperationalMode();
  const recalStatus = opMode ? isSoftRecalibrating(opMode, new Date()) : { active: false, progressRatio: 0, daysRemaining: 0 };
  const [isStarting, setIsStarting] = useState(false);

  const handleStartSession = () => {
    setIsStarting(true);
    setTimeout(() => {
      toast.success("Study Session Generated", {
        description: "Your personalized study session is ready."
      });
      if (result?.primary) {
        setLocation('/subjects/' + result.primary.subjectId);
      } else { 
        toast.info("No tasks pending. Enjoy your rest.");
      }
      setIsStarting(false);
    }, 800);
  };

  const getOntologyIcon = (rec: any) => {
    // Basic dynamic mapping, could be expanded
    if (rec.archetype === 'zenith') return <Target className="w-4 h-4 text-primary" />;
    if (rec.archetype === 'remediation_clinic') return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    if (rec.isFreshState) return <Sparkles className="w-4 h-4 text-emerald-400" />;
    return <Book className="w-4 h-4 text-zinc-300" />;
  };

  if (recalStatus.active && result?.primary) {
    const totalCount = (result.upcomingQueue?.length || 0) + 1;
    const completed = 15 - Math.min(15, totalCount); // Mocking bounded queue
    return (
      <div className="bg-background/95 border border-white/[0.06] rounded-xl p-6 sm:p-8 shadow-md relative overflow-hidden flex flex-col items-center text-center">
        
        {/* Soft Recalibration Halo / Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="z-10 w-full max-w-lg flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-4 border border-primary/20">
            <Zap className="w-3 h-3" /> Soft Recalibration™ Active
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            Recovery Session
          </h2>
          
          <div className="flex items-center justify-between w-full mb-2 mt-4 px-2">
            <span className="text-xs text-muted-foreground font-medium">Recovery Batch</span>
            <span className="text-xs text-foreground font-bold">{completed} / 15 completed</span>
          </div>
          <div className="w-full bg-muted/40 rounded-lg h-2 mb-8 overflow-hidden border border-white/[0.02]">
            <div className="bg-primary h-full rounded-lg transition-all duration-1000 ease-out" style={{ width: `${(completed / 15) * 100}%` }} />
          </div>

          <Button 
            size="lg" 
            className="w-full rounded-xl h-14 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold tracking-wide transition-all group"
            onClick={handleStartSession}
            disabled={isStarting}
          >
            {isStarting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Initializing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play className="w-5 h-5 fill-current" />
                Resume Recovery: 15 High-Yield Cards (12 min)
              </span>
            )}
          </Button>

          <p className="mt-6 text-[11px] text-muted-foreground/70 font-medium tracking-wide">
            320 low-yield reviews safely parked in Deep Storage™.<br className="hidden sm:block"/> Focus on today's high-yield targets.
          </p>
        </div>
      </div>
    );
  }

  if (loading || !result) {
    return (
      <div className="bg-card border rounded-xl p-6 sm:p-8 shadow-sm flex flex-col items-center justify-center animate-pulse h-64">
        <div className="w-12 h-12 rounded-full bg-muted mb-4" />
        <div className="h-6 w-1/3 bg-muted rounded mb-2" />
        <div className="h-4 w-1/2 bg-muted rounded" />
      </div>
    );
  }

  const { primary, upcomingQueue, isFreshState } = result;
  
  // Phase indicator
  let phaseLabel = "Phase: Active Spaced Repetition";
  if (isFreshState) phaseLabel = "Phase: Calibration";
  else if (result.operationalMode?.mode === 'final_lap') phaseLabel = "Phase: Final Lap";

  return (
    <div className="space-y-6">
      {/* ── Massive Primary CTA (Phase 2.1) ─────────────────────────────────── */}
      <div className="bg-card border border-border/60 rounded-xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center">
        {primary ? (
          <>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
              {primary.subjectName}
            </h2>
            <p className="text-muted-foreground max-w-lg mb-8 text-sm sm:text-base">
              {primary.whyBreakdown.humanizedMessage || `Your daily review is ready. ${primary.estimatedMinutes || 30} mins.`}
            </p>
          </>
        ) : (
          <>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
              All Caught Up.
            </h2>
            <p className="text-muted-foreground max-w-lg mb-8 text-sm sm:text-base">
              You have completed all high-priority reviews for now.
            </p>
          </>
        )}

        <Button 
          size="lg" 
          onClick={handleStartSession}
          disabled={isStarting || !primary}
          className="h-16 px-10 rounded-xl text-lg shadow-sm hover:scale-105 transition-all duration-300"
        >
          {isStarting ? (
            <span className="flex items-center gap-2">
              <Zap className="w-5 h-5 animate-pulse" />
              Preparing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Play className="w-5 h-5 fill-current" />
              {primary ? "Start Today's Session" : "Rest Now"}
            </span>
          )}
        </Button>
        <p className="mt-6 text-xs text-muted-foreground/80 font-medium">
          Note: Keep using Anki for daily micro-flashcards. Use Study Tracker to macro-schedule your QBank blocks and modules.
        </p>
      </div>

      {/* ── Dynamic "Up Next" Feed (Phase 2.2) ─────────────────────────────── */}
      {upcomingQueue && upcomingQueue.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Up Next Queue
            </h3>
          </div>
          <div className="flex overflow-x-auto pb-4 -mx-1 px-1 gap-3 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {upcomingQueue.map((pulse, idx) => (
              <div 
                 key={pulse.id} 
                 onClick={() => setLocation('/subjects/' + pulse.subjectId)}
                className="w-[260px] sm:w-[280px] shrink-0 snap-start bg-card border border-border/60 hover:border-primary/30 rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-colors group"
              >
                <div>
                   <div className="flex items-start justify-between gap-2 mb-2">
                     <Badge variant="outline" className={cn("text-[9px] uppercase tracking-wider font-bold shrink-0", 
                         pulse.archetype === 'remediation_clinic' ? 'bg-amber-950/20 text-amber-400 border-white/5' : 
                         pulse.archetype === 'zenith' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                        'bg-zinc-800/40 text-primary border-white/5'
                     )}>
                        {pulse.archetype.replace('_', ' ')}
                     </Badge>
                     <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {getOntologyIcon(pulse)}
                     </div>
                   </div>
                   <h4 className="font-bold text-sm text-foreground line-clamp-1 mb-0.5">{pulse.systemName || pulse.subjectName}</h4>
                   {(pulse.systemName && pulse.systemName !== pulse.subjectName) && (
                     <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 line-clamp-1">{pulse.subjectName}</p>
                   )}
                   <p className="text-xs text-muted-foreground line-clamp-2">{pulse.whyBreakdown.humanizedMessage || pulse.title}</p>
                </div>
                <div className="mt-4 flex items-center justify-end">
                  <div className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors bg-zinc-800/40 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                    {pulse.estimatedMinutes ? `${pulse.estimatedMinutes}m` : 'Review'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
