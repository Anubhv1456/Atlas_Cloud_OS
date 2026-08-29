import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useClinicalFrictionEngine } from '@/lib/ai/frictionEngine';
import { 
  Sparkles, Play, Clock, ArrowRight, AlertTriangle, CheckCircle2, ShieldAlert, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function NextActionCard(props: any) {
  const [, setLocation] = useLocation();
  const { topDailyPulses, metrics } = useClinicalFrictionEngine();
  const [isStarting, setIsStarting] = useState(false);

  const handleStartSession = () => {
    setIsStarting(true);
    setTimeout(() => {
      toast.success("Study Session Generated", {
        description: "Your personalized study session is ready."
      });
      // Route into the first high-friction subject/topic
      if (topDailyPulses.length > 0) {
        setLocation('/subjects/' + topDailyPulses[0].actionPayload.subjectId);
      } else {
         toast.info("No tasks pending. Enjoy your rest.");
      }
      setIsStarting(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* ── Massive Primary CTA (Phase 2.1) ─────────────────────────────────── */}
      <div className="bg-card border rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center">
        <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
        

        
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          Here is what needs your attention today.
        </h2>
        <p className="text-muted-foreground max-w-lg mb-8 text-sm sm:text-base">
          Your daily review is ready.
        </p>

        <Button 
          size="lg" 
          onClick={handleStartSession}
          disabled={isStarting}
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
              Start Today's Session
            </span>
          )}
        </Button>
      </div>

      {/* ── Dynamic "Up Next" Feed (Phase 2.2) ─────────────────────────────── */}
      {topDailyPulses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Up Next
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {topDailyPulses.map((pulse, idx) => (
              <div 
                key={pulse.id} 
                onClick={() => setLocation('/subjects/' + pulse.actionPayload.subjectId)}
                className="bg-card border border-border/60 hover:border-primary/30 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-colors group"
              >
                <div>
                   <div className="flex items-start justify-between gap-2 mb-2">
                     {pulse.urgency === 'CRITICAL' || pulse.urgency === 'ELEVATED' ? (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] uppercase tracking-wider font-bold shrink-0">
                        Needs Review
                      </Badge>
                    ) : pulse.urgency === 'FRESH' ? (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px] uppercase tracking-wider font-bold shrink-0">
                        New
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[9px] uppercase tracking-wider font-bold shrink-0">
                        Mastered
                      </Badge>
                    )}
                     <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        {pulse.actionType === 'PEARL_AUDIT' ? <ShieldAlert className="w-3 h-3 text-destructive" /> : <CheckCircle2 className="w-3 h-3 text-muted-foreground" />}
                     </div>
                   </div>
                   <h4 className="font-bold text-sm text-foreground line-clamp-1 mb-1">{pulse.subjectName}</h4>
                   <p className="text-xs text-muted-foreground line-clamp-2">{pulse.reason}</p>
                </div>
                <div className="mt-4 flex items-center justify-end">
                  <div className={cn(
                    "text-xs font-semibold px-3 py-1.5 rounded-full transition-colors",
                    pulse.urgency === 'FRESH' ? 'bg-primary text-primary-foreground' : 
                    pulse.urgency === 'MASTERED' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : 
                    'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                  )}>
                    {pulse.ctaText || (pulse.urgency === 'FRESH' ? 'Begin' : pulse.urgency === 'MASTERED' ? 'Practice' : 'Review')}
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
