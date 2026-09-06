import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Clock, 
  ArrowRight, 
  Layers, 
  Flame,
  Brain,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { useClinicalFrictionEngine, DailyAgendaPulse } from '@/lib/ai/frictionEngine';
import { cn } from '@/lib/utils';

export interface DailyFrictionAgendaProps {
  onSelectAction?: (pulse: DailyAgendaPulse) => void;
  className?: string;
  activePrimarySubjectName?: string;
}

export const DailyFrictionAgenda: React.FC<DailyFrictionAgendaProps> = ({
  onSelectAction,
  className,
  activePrimarySubjectName
}) => {
  const { topDailyPulses, criticalCount, elevatedCount } = useClinicalFrictionEngine();

  // Filter out the subject currently active in the Next Action hero card to prevent duplication
  const visiblePulses = React.useMemo(() => {
    if (!activePrimarySubjectName) return topDailyPulses.slice(0, 3);
    const filtered = topDailyPulses.filter(
      p => p.subjectName.toLowerCase() !== activePrimarySubjectName.toLowerCase()
    );
    return (filtered.length > 0 ? filtered : topDailyPulses).slice(0, 3);
  }, [topDailyPulses, activePrimarySubjectName]);

  if (!visiblePulses.length) {
    return null;
  }

  return (
    <div className={cn("p-4 sm:p-5 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xs space-y-3.5", className)}>
      {/* Header with Watchlist & Queue Context */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
              <span>Decay Watchlist & Upcoming Queue</span>
              <span className="px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground text-xs font-mono">
                Next in Line
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Subdued memory half-life queue prioritized for subsequent study blocks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-mono">
          {criticalCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-medium">
              {criticalCount} Critical
            </span>
          )}
          {elevatedCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
              {elevatedCount} Approaching Half-Life
            </span>
          )}
        </div>
      </div>

      {/* Subdued Upcoming Queue Items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {visiblePulses.map((pulse, idx) => (
          <motion.div
            key={pulse.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            onClick={() => onSelectAction?.(pulse)}
            className={cn(
              "group p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer flex flex-col justify-between hover:border-primary/40",
              pulse.urgency === 'CRITICAL' && "border-rose-500/20 bg-rose-500/[0.02]"
            )}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider bg-muted/60 px-1.5 py-0.5 rounded">
                  Upcoming #{idx + 1}
                </span>

                <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                  ~{pulse.estimatedMinutes}m
                </span>
              </div>

              <h4 className="font-semibold text-foreground text-xs line-clamp-1 group-hover:text-primary transition-colors">
                {pulse.subjectName}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">
                {pulse.topicName}
              </p>
              <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-normal">
                {pulse.reason}
              </p>
            </div>

            <div className="mt-2.5 pt-2 border-t border-border/30 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1 text-xs group-hover:text-foreground transition-colors">
                {pulse.urgency === 'CRITICAL' ? (
                  <span className="text-rose-500 font-semibold">Decay intervention</span>
                ) : (
                  <span>Queued for drill</span>
                )}
              </span>

              <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

