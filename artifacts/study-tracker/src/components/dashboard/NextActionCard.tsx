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
      toast.success("Ephemeral Study Playlist Generated", {
        description: "SDSR Engine curated your high-friction topics."
      });
      // Route into the first high-friction subject/topic
      if (topDailyPulses.length > 0) {
        setLocation('/subjects/' + topDailyPulses[0].actionPayload.subjectId);
      } else {
         toast.info("No friction detected. Enjoy your rest.");
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
        
        <Badge variant="outline" className="mb-4 bg-primary/5 text-primary border-primary/20 uppercase tracking-wider font-bold text-[10px]">
          <Sparkles className="w-3 h-3 mr-1" />
          Next Action Engine
        </Badge>
        
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          Ready for today's session?
        </h2>
        <p className="text-muted-foreground max-w-lg mb-8 text-sm sm:text-base">
          Atlas has analyzed {metrics?.length || 0} subjects and calculated your memory decay while you slept. Zero folder management required.
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
              Synthesizing...
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
              Up Next: High Friction Targets
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
                     <Badge variant="outline" className={cn(
                       "text-[9px] uppercase tracking-wider font-bold shrink-0",
                       pulse.urgency === 'CRITICAL' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                       pulse.urgency === 'ELEVATED' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                       'bg-primary/10 text-primary border-primary/20'
                     )}>
                       {pulse.urgency}
                     </Badge>
                     <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        {pulse.actionType === 'PEARL_AUDIT' ? <ShieldAlert className="w-3 h-3 text-destructive" /> : <CheckCircle2 className="w-3 h-3 text-muted-foreground" />}
                     </div>
                   </div>
                   <h4 className="font-bold text-sm text-foreground line-clamp-1 mb-1">{pulse.subjectName}</h4>
                   <p className="text-xs text-muted-foreground line-clamp-2">{pulse.reason}</p>
                </div>
                <div className="mt-4 flex items-center justify-end text-[10px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
