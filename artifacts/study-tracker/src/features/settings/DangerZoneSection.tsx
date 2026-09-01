import { useLexicon } from '@/lib/lexicon';
import { Trash2, ShieldAlert, CheckCircle2, Sparkles, ArrowRight, Loader2, RefreshCcw, HardDrive, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useDangerZone } from '@/hooks/useDangerZone';
import { SettingsRow } from './SettingsLayout';
import { useLocation } from 'wouter';

export function DangerZoneSection() {
  const lexicon = useLexicon();

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
        isLast
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
              This action cannot be undone. This will permanently delete all 19 subjects, curriculum units, study blocks, score logs, revision schedules, and {lexicon.mistakesJournal} rules.
            </DialogDescription>
          </DialogHeader>

          <div className="my-2 p-3 rounded-xl bg-destructive/5 border border-destructive/15 text-xs text-destructive/90 space-y-1.5">
            <div className="font-semibold flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>What will be purged:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground pl-1">
              <li>All 19 NEET PG subjects & curriculum units</li>
              <li>Revision schedules, decay intervals & history</li>
              <li>Clinical score logs & diagnostic metrics</li>
              <li>{lexicon.mistakesJournal} high-yield pearls</li>
              <li>Voice transcripts and local cached audio</li>
            </ul>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="w-full sm:w-auto text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={isDeleting}
              className="w-full sm:w-auto text-xs font-semibold gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Purging Vault...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Yes, Delete Everything
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completion Dialog */}
      <Dialog open={showCompletionCard} onOpenChange={setShowCompletionCard}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl mx-4 w-[calc(100%-2rem)] border-emerald-500/20 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center text-xl font-bold tracking-tight">Database Reset Complete</DialogTitle>
            <DialogDescription className="text-center text-xs sm:text-sm text-muted-foreground pt-1.5 leading-relaxed">
              Atlas has been completely restored to its pristine factory state.
            </DialogDescription>
          </DialogHeader>

          {resetResult && (
            <div className="my-2 p-3 rounded-xl bg-card border border-border/60 text-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Subjects Seeded</span>
                <span className="font-semibold text-foreground">{resetResult.seededSubjects} standard subjects</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> Storage Cleared</span>
                <span className="font-semibold text-emerald-500">100% purged</span>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              onClick={() => {
                setShowCompletionCard(false);
                setLocation('/');
              }}
              className="w-full text-xs font-semibold gap-1.5 bg-primary"
            >
              Return to Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
