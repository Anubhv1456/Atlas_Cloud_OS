import { useLexicon } from '@/lib/lexicon';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  ShieldAlert, 
  Target, 
  Clock, 
  BookOpen, 
  X,
  Zap
} from 'lucide-react';
import { GtAutopsyReport } from './GtAutopsyService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface GtAutopsyModalProps {
  report: GtAutopsyReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GtAutopsyModal: React.FC<GtAutopsyModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-card border border-border/80 p-0 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-border/50 bg-muted/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <span>Grand Test Psychometric Autopsy</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[10px] font-mono font-bold">
                    GT-DELTA
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  {report.testName} • {report.score} / {report.total} marks ({report.percentage}%)
                </p>
              </div>
            </div>

            {report.scoreDelta !== undefined && (
              <div className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono font-bold",
                report.scoreDelta >= 0 
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
              )}>
                {report.scoreDelta >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                <span>{report.scoreDelta >= 0 ? `+${report.scoreDelta}%` : `${report.scoreDelta}%`}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 space-y-5 text-xs">
          {/* Cluster Leakage Breakdown */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              Subject Cluster Breakdown & Leakage Severity
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {report.clusterBreakdown.map((cl) => (
                <div
                  key={cl.cluster}
                  className={cn(
                    "p-3 rounded-xl border flex flex-col justify-between",
                    cl.leakageSeverity === 'HIGH'
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
                      : cl.leakageSeverity === 'MODERATE'
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                      : "bg-muted/40 border-border/60 text-foreground"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{cl.cluster}</span>
                      <span className="text-[10px] font-mono opacity-80">~{cl.totalQuestionsEstimated} Qs</span>
                    </div>
                    <p className="text-[10px] opacity-75 mb-2">
                      {cl.weakCount > 0 ? `${cl.weakCount} flagged weak areas` : 'Retention stable'}
                    </p>
                  </div>

                  <div className="text-[10px] font-semibold">
                    {cl.subjects.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {cl.subjects.map(s => (
                          <span key={s} className="px-1.5 py-0.5 rounded bg-background/60 text-[9px] truncate max-w-full">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">0 Leakage</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3-Point Surgical Sprint Adjustment Plan */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" />
              3-Point Surgical Sprint Adjustment Plan
            </h4>

            <div className="space-y-2">
              {report.threePointSprintPlan.map((sprint, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-card border border-border/80 flex items-start gap-3 shadow-xs"
                >
                  <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-mono font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h5 className="font-semibold text-xs text-foreground">{sprint.title}</h5>
                      <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {sprint.durationDays}d Sprint
                      </span>
                    </div>
                    <p className="text-[11px] text-primary/90 font-medium mb-1 truncate">
                      Focus: {sprint.focus}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {sprint.rationale}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* High Yield Pearls to Audit */}
          {report.highYieldPearlsToAudit.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                Immediate {lexicon.mistakesJournal} Volatile Pearls to Audit
              </h4>
              <div className="space-y-1.5">
                {report.highYieldPearlsToAudit.map((pearl, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs">
                    "{pearl}"
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-muted/20 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-xs shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Apply Sprint to Study Schedule
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
