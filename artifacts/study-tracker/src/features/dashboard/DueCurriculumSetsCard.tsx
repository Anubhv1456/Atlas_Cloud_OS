import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { ALL_SUBJECTS, ALL_TOPICS } from '@/data/ontology';
import { CurriculumSet } from '@/db/types';
import { CurriculumSetScoreModal } from '@/features/subjects/CurriculumSetScoreModal';
import { Clock, Folder, Target, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isToday, isBefore, startOfDay, differenceInDays } from 'date-fns';

export function DueCurriculumSetsCard() {
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [selectedSet, setSelectedSet] = useState<CurriculumSet | undefined>();

  const dueSets = useLiveQuery(async () => {
    const table = db.curriculumSets || db.revisionSets;
    const now = new Date();
    const sets = await table
      .filter(s => !s.deletedAt && s.nextRevisionDate != null && new Date(s.nextRevisionDate) <= now)
      .toArray();
    return sets || [];
  }, []) || [];

  const handleOpenScoreModal = (set: CurriculumSet) => {
    setSelectedSet(set);
    setScoreModalOpen(true);
  };

  const today = startOfDay(new Date());

  if (dueSets.length === 0) {
    return (
      <div className="p-4 rounded-2xl border border-border/60 bg-card/60 mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Revisions Up to Date</h3>
            <p className="text-xs text-muted-foreground">No Curriculum Sets due for recall today.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-amber-500" /> Revisions Due Today ({dueSets.length})
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {dueSets.map((set) => {
          const subject = ALL_SUBJECTS.find((s) => s.id == (set.subjectId as any));
          const revDate = new Date(set.nextRevisionDate!);
          const isOverdue = isBefore(revDate, today) && !isToday(revDate);
          const daysOverdueCount = isOverdue ? differenceInDays(today, revDate) : 0;

          return (
            <div
              key={set.id}
              className="p-4 rounded-2xl border border-border/80 bg-card shadow-sm flex flex-col justify-between gap-3 transition-all hover:border-primary/30"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Folder className="w-3 h-3 text-primary" />
                    {subject ? subject.name : 'Medical Subject'}
                  </span>

                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0',
                      isOverdue
                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    )}
                  >
                    {isOverdue ? `${daysOverdueCount}d overdue` : 'Due Today'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-foreground leading-snug">
                  {set.name}
                </h3>

                <p className="text-xs text-muted-foreground">
                  {set.topicIds.length} topic{set.topicIds.length === 1 ? '' : 's'} scheduled for recall
                </p>
              </div>

              <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {set.revisionCount ? `Pass #${set.revisionCount + 1}` : 'First Recall Pass'}
                </span>

                <button
                  onClick={() => handleOpenScoreModal(set)}
                  className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm hover:opacity-90"
                >
                  <Target className="w-3.5 h-3.5" /> Log Score
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <CurriculumSetScoreModal
        isOpen={scoreModalOpen}
        onClose={() => setScoreModalOpen(false)}
        curriculumSet={selectedSet}
        allTopics={ALL_TOPICS}
      />
    </div>
  );
}
