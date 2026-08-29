import { Flame, TrendingUp, Award, Clock, BookOpen, AlertTriangle } from 'lucide-react';

interface OverviewStatsProps {
  learningTopicsCount?: number;
  weakTopicsCount?: number;
  streak: number;
  overallProgress: number;
  completedTasks: number;
  totalTasks: number;
  strongSystems: number;
  totalSystems: number;
  dueRevisionsCount: number;
}

export function OverviewStats({
  streak,
  overallProgress,
  completedTasks,
  totalTasks,
  strongSystems,
  totalSystems,
  dueRevisionsCount,
  learningTopicsCount = 0,
  weakTopicsCount = 0
}: OverviewStatsProps) {
  return (
    <section className="mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {/* Active Streak */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-amber-500/40 transition-all duration-200 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-amber-500 transition-colors">Streak</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-foreground">
              {streak}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">days</div>
          </div>
        </div>

        {/* Overall Completion */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all duration-200 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Completion</span>
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-foreground">
              {overallProgress}%
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{completedTasks}/{totalTasks} done</div>
          </div>
        </div>

        {/* Learning Topics */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-purple-500/40 transition-all duration-200 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Learning</span>
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-purple-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-foreground">
              {learningTopicsCount}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">In progress</div>
          </div>
        </div>

        {/* Mastered Topics */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-200 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-emerald-500 transition-colors">Solid</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-foreground">
              {strongSystems}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">High confidence</div>
          </div>
        </div>

        {/* Due Revisions */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-sky-500/40 transition-all duration-200 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-sky-500 transition-colors">Due</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-foreground">
              {dueRevisionsCount}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">To review</div>
          </div>
        </div>

        {/* Needs Focus Topics */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-destructive/40 transition-all duration-200 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-destructive transition-colors">Needs Focus</span>
            <div className="p-1.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-foreground">
              {weakTopicsCount}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Decaying recall</div>
          </div>
        </div>

      </div>
    </section>
  );
}
