import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Zap, 
  Brain, 
  Target, 
  ShieldAlert, 
  BookOpen, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getLogTimestamp } from '@/features/analytics/analyticsUtils';
import { SUBJECT_METRICS_PROFILE } from '@/lib/ai/frictionEngine';
import { ScoreLog } from '@/db';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ScoreAutopsyRowProps {
  log: ScoreLog;
  subName?: string;
  onDelete: (id: number) => void;
  getPercentageColorBadge: (pct: number) => string;
}

export const ScoreAutopsyRow: React.FC<ScoreAutopsyRowProps> = ({
  log,
  subName,
  onDelete,
  getPercentageColorBadge
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  let logColor = "bg-purple-500";
  if (log.type === 'gt') logColor = "bg-primary";
  else if (log.type === 'revision') logColor = "bg-blue-500";
  else if (log.type === 'set') logColor = "bg-amber-500";

  // Derive recovery topics from weak subjects or subject profile
  const weakSubjects = log.weakSubjects || (subName ? [subName] : []);
  
  const recoveryTopics: { subject: string; cluster: string; volatile: string[] }[] = [];
  weakSubjects.forEach((ws) => {
    if (!ws) return;
    const profile = SUBJECT_METRICS_PROFILE[ws];
    if (profile) {
      recoveryTopics.push({
        subject: ws,
        cluster: profile.cluster || 'Clinical',
        volatile: (profile.volatileTopics || ['High-Yield Review', 'Trap Stems']).slice(0, 3),
      });
    } else {
      recoveryTopics.push({
        subject: ws,
        cluster: 'Clinical',
        volatile: ['High-Yield Review', 'Trap Stems'],
      });
    }
  });

  return (
    <div className="border-b border-border/30 last:border-b-0 transition-colors">
      {/* Primary Log Line */}
      <div 
        onClick={() => setIsExpanded(prev => !prev)}
        className="group flex items-center justify-between py-3 px-2 rounded-xl cursor-pointer hover:bg-muted/30 transition-colors select-none"
      >
        <div className="flex items-start gap-3.5 overflow-hidden min-w-0">
          <div className="pt-1.5 shrink-0">
            <div className={cn("w-2.5 h-2.5 rounded-full", logColor)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                {log.title || 'Score Record'}
              </span>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.2 rounded bg-muted text-muted-foreground shrink-0">
                {log.type === 'gt' ? 'GT' : log.type === 'pyq' ? 'PYQ' : log.type === 'set' ? 'SET' : 'REV'}
              </span>
              {weakSubjects.length > 0 && (
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hidden sm:inline-flex items-center gap-1">
                  <ShieldAlert className="w-2.5 h-2.5" />
                  {weakSubjects.length} {weakSubjects.length === 1 ? 'Leakage' : 'Leakages'}
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-2 truncate">
              <span className="font-medium">{formatDistanceToNow(getLogTimestamp(log), { addSuffix: true })}</span>
              {subName && (
                <>
                  <span className="opacity-30">•</span>
                  <span className="truncate">{subName}</span>
                </>
              )}
              {log.notes && (
                <>
                  <span className="opacity-30">•</span>
                  <span className="truncate italic opacity-75">{log.notes}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0 pl-3">
          <div className="flex flex-col items-end">
            <span className={cn(
              "font-mono font-bold text-lg leading-none",
              log.percentage >= 75 ? 'text-emerald-500' : 
              log.percentage < 60 ? 'text-rose-500' : 'text-amber-500'
            )}>
              {log.percentage}%
            </span>
            <span className="text-[10px] text-muted-foreground font-mono mt-1">
              {log.score}/{log.total}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:bg-muted/60 transition-colors">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              title="Delete score entry"
              aria-label="Delete score entry"
              onClick={(e) => {
                e.stopPropagation();
                if (log.id) onDelete(log.id);
              }}
              className="w-7 h-7 rounded-lg opacity-70 sm:opacity-0 sm:group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:bg-destructive/20 transition-all focus:opacity-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Fluid Expandable Recovery Autopsy Capsule */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="score-autopsy"
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
            className="overflow-hidden bg-muted/25 rounded-xl border border-border/40 my-1 mx-2 p-3 sm:p-4 text-xs space-y-3"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="font-bold text-foreground text-xs">Actionable Recovery Capsule</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                Recorded {log.total} questions • Accuracy {log.percentage}%
              </span>
            </div>

            {/* Recovery Topics & Cluster Diagnostics */}
            {recoveryTopics.length > 0 ? (
              <div className="space-y-2">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-500" />
                  Target High-Friction Recovery Topics:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {recoveryTopics.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-card border border-border/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground text-xs">{item.subject}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground uppercase">
                          {item.cluster}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.volatile.map((vol, vIdx) => (
                          <span key={vIdx} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300">
                            {vol}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-card border border-border/60 text-muted-foreground text-[11px] flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Performance was balanced. Maintain active spaced recall pace.</span>
              </div>
            )}

            {/* Surgical Recovery Sprint Directives */}
            <div className="p-2.5 rounded-xl bg-card border border-border/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-[11px] text-muted-foreground">
                  Recommended Recovery Strategy: <strong className="text-foreground">Timed 25-Q Drill on flagged volatile traps</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-command-palette'));
                }}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Drill Weak Subjects</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
