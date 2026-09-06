import { useLexicon } from '@/lib/lexicon';
import React from 'react';
import { Link } from 'wouter';
import { useSubjects, useAllSystems } from '@/db';
import { useExamProfile } from '@/hooks/useExamProfile';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';
import { 
  LayoutGrid, 
  ChevronRight, 
  BookOpen, 
  Layers, 
  Zap, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  TrendingUp 
} from 'lucide-react';
import { calculateOverallProgress } from '@/lib/progress';

export function HomeRadarSummaryCard() {
  const lexicon = useLexicon();

  const subjects = useSubjects();
  const systems = useAllSystems();
  const { profile } = useExamProfile();

  const activeMistakes = useLiveQuery(() => 
    db.mistakeLogs?.filter(m => !m.deletedAt && !m.resolved).toArray()
  ) || [];

  const rawSubjects = subjects || [];
  const rawSystems = systems || [];

  const overallProgress = calculateOverallProgress(rawSystems);
  const completedSystems = rawSystems.filter(s => s.status === 'Strong').length;

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4 transition-all hover:border-border">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
            <LayoutGrid className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Curriculum Overview
            </h2>
            <p className="text-xs text-muted-foreground">
              {rawSubjects.length} Subjects • {rawSystems.length} Curriculum Units
            </p>
          </div>
        </div>

        <Link
          href="/radar"
          className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <span>View All Subjects</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-0.5">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">
            Progress
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-foreground">
              {overallProgress}%
            </span>
            <span className="text-xs text-muted-foreground">completed</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 space-y-0.5">
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest block">
            Subjects
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400">
              {rawSubjects.length}
            </span>
            <span className="text-xs text-teal-600/70 dark:text-teal-400/70">active</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-0.5">
          <span className="text-xs font-bold text-primary uppercase tracking-widest block">
            Solid Units
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-primary">
              {completedSystems}
            </span>
            <span className="text-xs text-primary/70">mastered</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-0.5">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block">
            {lexicon.mistakesJournal}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {activeMistakes.length}
            </span>
            <span className="text-xs text-amber-600/70 dark:text-amber-400/70">rules</span>
          </div>
        </div>
      </div>
    </div>
  );
}
