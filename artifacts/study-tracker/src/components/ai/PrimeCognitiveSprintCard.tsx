import React from 'react';
import { motion } from 'framer-motion';
import { 
  Flame, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  Sparkles, 
  Brain, 
  Zap,
  Target
} from 'lucide-react';
import { useClinicalFrictionEngine, DailyAgendaPulse } from '@/lib/ai/frictionEngine';
import { cn } from '@/lib/utils';

export interface PrimeCognitiveSprintCardProps {
  onStartSprint?: (pulse: DailyAgendaPulse) => void;
  className?: string;
}

export const PrimeCognitiveSprintCard: React.FC<PrimeCognitiveSprintCardProps> = ({
  onStartSprint,
  className
}) => {
  const { topDailyPulses, criticalCount } = useClinicalFrictionEngine();
  const topPulse = topDailyPulses[0];

  if (!topPulse) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        "relative rounded-3xl p-5 sm:p-6 overflow-hidden border shadow-lg transition-all",
        "bg-gradient-to-br from-card via-card/95 to-muted/40 border-border/80",
        "hover:shadow-xl hover:border-primary/40",
        className
      )}
    >
      {/* Subtle Luminous Background Glow for Memory Thermal Radiance */}
      <div 
        className={cn(
          "pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20",
          topPulse.urgency === 'CRITICAL' ? "bg-rose-500" : "bg-amber-500"
        )} 
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 max-w-xl">
          {/* Signal Indicator */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs flex items-center gap-1",
              topPulse.urgency === 'CRITICAL'
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
            )}>
              <Zap className="w-3 h-3" />
              {topPulse.urgency === 'CRITICAL' ? 'Decay Alert • High Friction' : 'Prime Focus of the Hour'}
            </span>

            <span className="text-xs font-mono text-muted-foreground">
              Board Exam Weightage Priority
            </span>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>{topPulse.subjectName}:</span>
              <span className="text-primary font-medium">{topPulse.topicName}</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
              {topPulse.reason}
            </p>
          </div>
        </div>

        {/* Action Button & Time Estimate */}
        <div className="flex items-center sm:self-auto gap-3 pt-2 md:pt-0 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-bold">Estimated Time</div>
            <div className="text-sm font-mono font-bold text-foreground flex items-center justify-end gap-1">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{topPulse.estimatedMinutes} Minutes</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onStartSprint?.(topPulse)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md active:scale-98 transition-all cursor-pointer w-full sm:w-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>Engage 15m Sprint</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
