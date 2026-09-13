import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, CheckCircle2, Loader2, ServerCrash } from 'lucide-react';
import { diagnosticEngine, DiagnosticReport, DiagnosticState } from '@/lib/diagnostics/DiagnosticEngine';
import { motion, AnimatePresence } from 'framer-motion';

export function DiagnosticModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [state, setState] = useState<DiagnosticState>('IDLE');
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Setup listener
      diagnosticEngine.onStateChange = (newState) => {
        setState(newState);
        if (newState === 'AWAITING_USER_CONFIRM' && diagnosticEngine.report) {
          setReport(diagnosticEngine.report);
        } else if (newState === 'FAILED') {
          setError(diagnosticEngine.errorMessage);
        } else if (newState === 'COMPLETE') {
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      };

      // Kick off scan
      diagnosticEngine.scan().catch(console.error);
    } else {
      // Reset state if closed manually
      diagnosticEngine.state = 'IDLE';
      setState('IDLE');
      setReport(null);
      setError(null);
    }
  }, [open]);

  const totalAnomalies = report 
    ? report.orphanedTopics.length + report.corruptedDates.length + report.duplicateSubjects.length + report.syncAnomalies.length 
    : 0;

  return (
    <Dialog open={open} onOpenChange={(val) => { if(state !== 'REPAIRING' && state !== 'CREATING_SNAPSHOT' && state !== 'SCANNING') onOpenChange(val); }}>
      <DialogContent className="sm:max-w-[420px] rounded-xl mx-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            System Diagnostics
          </DialogTitle>
          <DialogDescription>
            Analyzes database integrity, normalizes types, and resolves state conflicts.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 min-h-[160px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
            {state === 'SCANNING' && (
              <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-4 py-8">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">Scanning medical ontology and database...</p>
              </motion.div>
            )}

            {state === 'AWAITING_USER_CONFIRM' && report && (
              <motion.div key="report" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {totalAnomalies === 0 ? (
                  <div className="flex flex-col items-center text-center gap-3 py-6">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">Database is Healthy</h4>
                      <p className="text-xs text-muted-foreground mt-1">No orphans, duplicates, or corrupted structures were found.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <div className="text-sm font-medium">Found {totalAnomalies} anomalies requiring repair.</div>
                    </div>
                    
                    <div className="space-y-2 max-h-[180px] overflow-y-auto px-1 scrollbar-hide">
                      {report.orphanedTopics.length > 0 && (
                        <div className="flex justify-between items-center text-sm py-2 border-b border-border/50">
                          <span className="text-muted-foreground">Orphaned Topics</span>
                          <span className="font-mono font-bold text-rose-500">{report.orphanedTopics.length}</span>
                        </div>
                      )}
                      {report.corruptedDates.length > 0 && (
                        <div className="flex justify-between items-center text-sm py-2 border-b border-border/50">
                          <span className="text-muted-foreground">Degraded Data Types</span>
                          <span className="font-mono font-bold text-amber-500">{report.corruptedDates.length}</span>
                        </div>
                      )}
                      {report.duplicateSubjects.length > 0 && (
                        <div className="flex justify-between items-center text-sm py-2 border-b border-border/50">
                          <span className="text-muted-foreground">Duplicated Subjects</span>
                          <span className="font-mono font-bold text-amber-500">{report.duplicateSubjects.length}</span>
                        </div>
                      )}
                      {report.syncAnomalies.length > 0 && (
                        <div className="flex justify-between items-center text-sm py-2 border-b border-border/50">
                          <span className="text-muted-foreground">Sync State Jams</span>
                          <span className="font-mono font-bold text-rose-500">{report.syncAnomalies.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {(state === 'CREATING_SNAPSHOT' || state === 'REPAIRING') && (
              <motion.div key="repairing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-4 py-8">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">
                    {state === 'CREATING_SNAPSHOT' ? 'Creating Failsafe Snapshot...' : 'Applying Database Repairs...'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Please do not close this tab.</p>
                </div>
              </motion.div>
            )}

            {state === 'COMPLETE' && (
              <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center gap-3 py-6">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Repairs Successful</h4>
                  <p className="text-xs text-muted-foreground mt-1">Reloading application to apply changes...</p>
                </div>
              </motion.div>
            )}

            {state === 'FAILED' && (
              <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center gap-3 py-6">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
                  <ServerCrash className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Repair Failed</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border/50">
          {(state === 'AWAITING_USER_CONFIRM' || state === 'FAILED') && (
            <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
          {state === 'AWAITING_USER_CONFIRM' && totalAnomalies > 0 && (
            <Button 
              className="rounded-xl shadow-xs font-semibold px-6" 
              onClick={() => diagnosticEngine.repair().catch(console.error)}
            >
              Auto-Fix Issues
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
