import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useNextActionEngine } from '@/hooks/useNextActionEngine';
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
    if (rec.archetype === 'remediation_clinic') return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    if (rec.isFreshState) return <Sparkles className="w-4 h-4 text-emerald-500" />;
    return <Book className="w-4 h-4 text-blue-500" />;
  };

  if (loading || !result) {
    return (
      <div className="bg-card border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center justify-center animate-pulse h-64">
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
      <div className="bg-card border rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center">
        <div className="absolute top-4 right-4">
          <Badge variant="outline" className="bg-muted/50 text-[10px] tracking-wider uppercase font-medium">
             {phaseLabel}
          </Badge>
        </div>
        <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
        
        {primary ? (
          <>
            <Badge variant="outline" className="mb-4 bg-primary/5 text-primary border-primary/20">
              {primary.whyBreakdown.depthLabel}
            </Badge>
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
          className="h-16 px-10 rounded-full text-lg shadow-[0_0_40px_rgba(var(--primary-rgb,59,130,246),0.4)] hover:shadow-[0_0_60px_rgba(var(--primary-rgb,59,130,246),0.6)] hover:scale-105 transition-all duration-300"
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
                className="w-[260px] sm:w-[280px] shrink-0 snap-start bg-card border border-border/60 hover:border-primary/30 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-colors group"
              >
                <div>
                   <div className="flex items-start justify-between gap-2 mb-2">
                     <Badge variant="outline" className={cn("text-[9px] uppercase tracking-wider font-bold shrink-0", 
                         pulse.archetype === 'remediation_clinic' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                         pulse.archetype === 'zenith' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                        'bg-primary/10 text-primary border-primary/20'
                     )}>
                        {pulse.archetype.replace('_', ' ')}
                     </Badge>
                     <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {getOntologyIcon(pulse)}
                     </div>
                   </div>
                   <h4 className="font-bold text-sm text-foreground line-clamp-1 mb-0.5">{pulse.systemName || pulse.subjectName}</h4>
                   {(pulse.systemName && pulse.systemName !== pulse.subjectName) && (
                     <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 line-clamp-1">{pulse.subjectName}</p>
                   )}
                   <p className="text-xs text-muted-foreground line-clamp-2">{pulse.whyBreakdown.humanizedMessage || pulse.title}</p>
                </div>
                <div className="mt-4 flex items-center justify-end">
                  <div className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
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
