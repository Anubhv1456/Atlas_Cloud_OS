import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Brain, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert, 
  Sparkles, 
  BookOpen, 
  ArrowRight
} from 'lucide-react';
import { useLiveQuery } from '@/db';
import { db } from '@/db';
import { calculateSubjectFriction, SUBJECT_METRICS_PROFILE } from '@/lib/ai/frictionEngine';
import { cn } from '@/lib/utils';

export interface SubjectFrictionCapsuleProps {
  subjectId: number;
  subjectName: string;
  className?: string;
}

export const SubjectFrictionCapsule: React.FC<SubjectFrictionCapsuleProps> = ({
  subjectId,
  subjectName,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch subject-specific mistakes, history & curriculum
  const mistakes = useLiveQuery(
    () => db.mistakeLogs.where('subjectId').equals(subjectId).toArray(),
    [subjectId],

  );

  const history = useLiveQuery(
    () => db.history.where('subjectId').equals(subjectId).toArray(),
    [subjectId],

  );

  const curriculumSets = useLiveQuery(
    () => db.curriculumSets.where('subjectId').equals(subjectId).toArray(),
    [subjectId],

  );

  // Calculate friction metric with the mathematical formulation
  const metric = React.useMemo(() => {
    return calculateSubjectFriction(
      subjectName,
      subjectId,
      mistakes || [],
      history || [],
      curriculumSets || []
    );
  }, [subjectName, subjectId, mistakes, history, curriculumSets]);

  const profile = SUBJECT_METRICS_PROFILE[subjectName] || {
    weight: 10,
    halfLifeDays: 14,
    cluster: 'Clinical',
  };

  const unresolvedMistakes = (mistakes || []).filter(m => !m.resolved);

  return (
    <div className={cn("rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xs overflow-hidden shadow-2xs transition-all", className)}>
      {/* Compact Capsule Header */}
      <div 
        onClick={() => setIsExpanded(prev => !prev)}
        className="flex items-center justify-between p-3 sm:px-4 cursor-pointer hover:bg-muted/30 select-none transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border",
            metric.decayUrgency === 'CRITICAL' 
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
              : metric.decayUrgency === 'ELEVATED'
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          )}>
            {metric.decayUrgency === 'CRITICAL' ? <ShieldAlert className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-foreground">Diagnostic Capsule</span>
              <span className={cn(
                "text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider",
                metric.decayUrgency === 'CRITICAL' && "bg-rose-500/15 text-rose-600 dark:text-rose-400",
                metric.decayUrgency === 'ELEVATED' && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                metric.decayUrgency === 'MODERATE' && "bg-blue-500/15 text-blue-600 dark:text-blue-400",
                metric.decayUrgency === 'STABLE' && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              )}>
                {metric.decayUrgency === 'CRITICAL' ? 'Decay Alert' : metric.decayUrgency === 'ELEVATED' ? 'Half-Life Due' : metric.decayUrgency === 'MODERATE' ? 'Moderate Friction' : 'Retention Prime'}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">
                • {metric.cluster} (~{metric.examWeightage} Qs)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {metric.daysSinceReview === 1 ? 'Studied recently' : `${metric.daysSinceReview}d elapsed`} • {metric.unresolvedMistakes} active error traps
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase">Friction Index</div>
            <div className="text-xs font-mono font-bold text-foreground">{metric.frictionScore} pts</div>
          </div>
          <button
            type="button"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Fluid Hardware-Accelerated Drawer with Spring Physics */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="capsule-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: 'auto', 
              opacity: 1,
              transition: {
                height: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }
            }}
            exit={{ 
              height: 0, 
              opacity: 0,
              transition: {
                height: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.15 }
              }
            }}
            className="overflow-hidden border-t border-border/40 bg-muted/20"
          >
            <div className="p-3.5 sm:p-4 space-y-3 text-xs">
              {/* Directive Diagnosis Text */}
              <div className="p-2.5 rounded-xl bg-card border border-border/70 text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">Diagnostic Analysis: </span>
                {metric.recommendedActionText}
              </div>

              {/* Unresolved Traps in 20th Notebook */}
              {unresolvedMistakes.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-rose-500" />
                    Active 20th Notebook Bleeding Traps ({unresolvedMistakes.length})
                  </h4>
                  <div className="space-y-1">
                    {unresolvedMistakes.slice(0, 3).map((m) => (
                      <div 
                        key={m.id}
                        className="p-2 rounded-lg bg-card border border-border/60 text-[11px] text-foreground flex items-center justify-between gap-2"
                      >
                        <span className="truncate">{m.title || m.keyTakeaway || 'Volatile trap stem'}</span>
                        <span className="text-[9px] font-mono text-muted-foreground shrink-0 uppercase px-1.5 py-0.5 rounded bg-muted">
                          {m.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Memory Half-Life Window */}
              <div className="p-2.5 rounded-xl bg-card border border-border/70 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span className="text-muted-foreground">
                    Volatile Half-Life Threshold: <strong className="text-foreground font-mono">{metric.subjectHalfLifeDays} Days</strong>
                  </span>
                </div>
                <span className={cn(
                  "font-bold font-mono text-[10px]",
                  metric.daysSinceReview > metric.subjectHalfLifeDays ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                )}>
                  {metric.daysSinceReview > metric.subjectHalfLifeDays ? 'OVER HALF-LIFE' : 'WITHIN STABILITY'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
