import { useLexicon } from '@/lib/lexicon';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, CheckCircle2, Merge, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';
import { SubjectProgressScore } from '@/lib/subjectDeduplication';

interface SafeDeleteSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectName: string;
  subjectId: number | string;
  progressScore?: SubjectProgressScore | null;
  siblingDuplicate?: {
    subjectId: number | string;
    progressScore: SubjectProgressScore;
  } | null;
  isDeleting?: boolean;
  onConfirmDelete: () => Promise<void>;
  onMergeWithDuplicate?: () => Promise<void>;
}

export function SafeDeleteSubjectDialog({
  open,
  onOpenChange,
  subjectName,
  subjectId,
  progressScore,
  siblingDuplicate,
  isDeleting = false,
  onConfirmDelete,
  onMergeWithDuplicate
}: SafeDeleteSubjectDialogProps) {
  const lexicon = useLexicon();

  const hasLoggedProgress = Boolean(
    progressScore && (
      progressScore.completedSystemsCount > 0 ||
      progressScore.completedSetsCount > 0 ||
      progressScore.completedPyqCount > 0 ||
      progressScore.historyCount > 0 ||
      progressScore.scoreLogCount > 0 ||
      progressScore.hasActiveRevisionSchedule
    )
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] rounded-3xl mx-4 w-[calc(100%-2rem)] border-border/80 bg-background/95 backdrop-blur-xl">
        <DialogHeader className="space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-1 bg-destructive/10 text-destructive border border-destructive/20">
            {hasLoggedProgress ? (
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            ) : (
              <Trash2 className="w-6 h-6" />
            )}
          </div>
          <DialogTitle className="text-center text-xl font-bold tracking-tight text-foreground">
            {hasLoggedProgress ? 'Protect Logged Study Progress?' : `Delete "${subjectName}"?`}
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground leading-relaxed">
            {hasLoggedProgress
              ? `This subject has active revision data and completed study blocks logged.`
              : `Are you sure you want to delete this subject and its empty curriculum systems?`}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Breakdown Warning Card */}
        {hasLoggedProgress && progressScore && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-500">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Active Medical Progress Detected:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-foreground">
              {progressScore.completedSystemsCount > 0 && (
                <div className="p-2 rounded-xl bg-background/80 border border-border/40">
                  <span className="font-bold text-amber-500">{progressScore.completedSystemsCount}</span> completed systems
                </div>
              )}
              {progressScore.completedSetsCount > 0 && (
                <div className="p-2 rounded-xl bg-background/80 border border-border/40">
                  <span className="font-bold text-teal-400">{progressScore.completedSetsCount}</span> study blocks
                </div>
              )}
              {progressScore.historyCount > 0 && (
                <div className="p-2 rounded-xl bg-background/80 border border-border/40">
                  <span className="font-bold text-primary">{progressScore.historyCount}</span> revision sessions
                </div>
              )}
              {progressScore.completedPyqCount > 0 && (
                <div className="p-2 rounded-xl bg-background/80 border border-border/40">
                  <span className="font-bold text-emerald-500">{progressScore.completedPyqCount}</span> {lexicon.practiceExams} solved
                </div>
              )}
            </div>

            {siblingDuplicate && (
              <p className="text-xs text-amber-400/90 pt-1 leading-normal">
                💡 Another copy of <span className="font-semibold text-foreground">"{subjectName}"</span> exists. You can safely merge all progress into it instead of deleting!
              </p>
            )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-3">
          <Button
            variant="outline"
            className="flex-1 rounded-xl text-xs"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          {siblingDuplicate && onMergeWithDuplicate && (
            <Button
              variant="default"
              className="flex-1 rounded-xl font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-sm"
              disabled={isDeleting}
              onClick={onMergeWithDuplicate}
            >
              <Merge className="w-3.5 h-3.5" />
              <span>Merge Progress</span>
            </Button>
          )}

          <Button
            variant="destructive"
            className="flex-1 rounded-xl font-semibold text-xs shadow-sm gap-1.5"
            disabled={isDeleting}
            onClick={onConfirmDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{hasLoggedProgress ? 'Delete Anyway' : 'Delete'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
