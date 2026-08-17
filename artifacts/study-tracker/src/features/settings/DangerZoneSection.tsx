import { Trash2, ShieldAlert, CheckCircle2, Sparkles, ArrowRight, Loader2, RefreshCcw, HardDrive, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useDangerZone } from '@/hooks/useDangerZone';
import { SettingsRow } from './SettingsLayout';
import { useLocation } from 'wouter';

export function DangerZoneSection() {
  const {
    showDeleteConfirm,
    setShowDeleteConfirm,
    isDeleting,
    showCompletionCard,
    setShowCompletionCard,
    resetResult,
    handleDeleteAll
  } = useDangerZone();

  const [, setLocation] = useLocation();

  return (
    <>
      <SettingsRow
        icon={Trash2}
        label="Delete All Data"
        destructive
        onClick={() => setShowDeleteConfirm(true)}
      />

      {/* Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={(open) => !isDeleting && setShowDeleteConfirm(open)}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl mx-4 w-[calc(100%-2rem)] border-destructive/20 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl flex items-center justify-center mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center text-xl font-bold tracking-tight">Permanently Delete All Data?</DialogTitle>
            <DialogDescription className="text-center text-xs sm:text-sm text-muted-foreground pt-1.5 leading-relaxed">
              This action cannot be undone. This will permanently delete all 19 subjects, organ systems, custom study blocks, score logs, SDSR revision intervals, operational modes, and smoothing quotas from both your local device and cloud vault.
            </DialogDescription>
          </DialogHeader>

          <div className="my-2 p-3 rounded-xl bg-destructive/5 border border-destructive/15 text-xs text-destructive/90 space-y-1.5">
            <div className="font-semibold flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              What will be permanently wiped:
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-muted-foreground">
              <li>All organ systems progress, completions, and mastery statuses</li>
              <li>All custom study blocks, topic progress, and revision due dates</li>
              <li>All operational modes, holiday states, and backlog smoothing quotas</li>
              <li>All test scores, mistake recovery logs, and telemetry history</li>
            </ul>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              disabled={isDeleting}
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl font-semibold shadow-sm gap-1.5"
              disabled={isDeleting}
              onClick={handleDeleteAll}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Purging Vault...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Everything
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Completion Message Card Dialog */}
      <Dialog open={showCompletionCard} onOpenChange={setShowCompletionCard}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl mx-4 w-[calc(100%-2rem)] border-teal-500/30 bg-background/95 backdrop-blur-2xl shadow-2xl p-6 sm:p-7">
          <DialogHeader className="space-y-3 text-center">
            <div className="mx-auto w-14 h-14 bg-teal-500/10 text-teal-400 border border-teal-500/25 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/5">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Sparkles className="w-3 h-3" /> Clean Starting State
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Workspace Reset Complete
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
              {resetResult?.message || 'All study data, spaced repetition schedules, operational modes, and smoothing quotas have been completely wiped. Your workspace is now in a pristine, empty starting state.'}
            </DialogDescription>
          </DialogHeader>

          {/* Structured Confirmation Card Matrix */}
          <div className="space-y-2 my-4">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40 border border-border/40 text-left">
              <div className="w-7 h-7 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-foreground">Curriculum Baseline Initialized</div>
                <div className="text-[11px] text-muted-foreground leading-normal">
                  All 19 MBBS subjects & organ systems restored to a clean 0% unstudied state.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40 border border-border/40 text-left">
              <div className="w-7 h-7 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                <RefreshCcw className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-foreground">Smoothing Quota & Modes Cleared</div>
                <div className="text-[11px] text-muted-foreground leading-normal">
                  All backlog smoothing quotas, holiday freezes, and tactical sprints reset to Standard.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40 border border-border/40 text-left">
              <div className="w-7 h-7 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                <HardDrive className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-foreground">Schedules & Local Caches Flushed</div>
                <div className="text-[11px] text-muted-foreground leading-normal">
                  All SDSR intervals, test logs, mistake queues, telemetry, and offline leases purged.
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl h-10 text-xs sm:text-sm font-medium"
              onClick={() => setShowCompletionCard(false)}
            >
              Stay in Settings
            </Button>
            <Button
              className="flex-1 rounded-xl h-10 text-xs sm:text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-900/20 gap-1.5"
              onClick={() => {
                setShowCompletionCard(false);
                setLocation('/');
              }}
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

