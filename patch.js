const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/dashboard/Home.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
`function RevisionPill({ sys }: { sys: StudySystem }) {
  if (!sys.completionDate) return null;
  const retrievability = getRetrievability(sys);
  const health = getRetrievabilityHealth(retrievability);

  if (isRevisionOverdue(sys)) return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-destructive shrink-0 bg-destructive/10 px-2.5 py-0.5 rounded-full border border-destructive/20">
      <AlertCircle className="w-2.5 h-2.5" />{retrievability}% ({daysOverdue(sys)}d overdue)
    </span>
  );
  if (isRevisionDue(sys)) return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-500 shrink-0 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
      <Clock className="w-2.5 h-2.5" />{retrievability}% Due today
    </span>
  );
  if (sys.nextRevisionDate) return (
    <span className={cn("flex items-center gap-1 text-[10px] font-semibold shrink-0 px-2.5 py-0.5 rounded-full bg-muted/60 border border-border/40", health.colorClass)}>
      <Brain className="w-2.5 h-2.5" />{retrievability}% Recall
    </span>
  );
  return null;
}`,
`function RevisionPill({ sys }: { sys: StudySystem }) {
  if (!sys.completionDate) return null;
  const retrievability = getRetrievability(sys);
  const health = getRetrievabilityHealth(retrievability);

  if (isRevisionOverdue(sys)) return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-destructive shrink-0 bg-destructive/10 px-2.5 py-0.5 rounded-full border border-destructive/20">
      <div className="w-1.5 h-1.5 rounded-full bg-destructive" />Overdue
    </span>
  );
  if (isRevisionDue(sys)) return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-500 shrink-0 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />Due
    </span>
  );
  if (sys.nextRevisionDate) return (
    <span className={cn("flex items-center gap-1 text-[10px] font-semibold shrink-0 px-2.5 py-0.5 rounded-full bg-muted/60 border border-border/40", health.colorClass)}>
      <div className={cn("w-1.5 h-1.5 rounded-full", health.colorClass.includes("destructive") ? "bg-destructive" : health.colorClass.includes("amber") ? "bg-amber-500" : "bg-emerald-500")} />Healthy
    </span>
  );
  return null;
}`);

content = content.replace(
`              <div className="flex items-center gap-2 mb-0.5">
                <span className="flex items-center gap-1 text-primary text-[11px] font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> Medical Study Tracker
                </span>
                {isConfigured ? (
                  <button
                    onClick={() => setExamModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all text-[10px] font-bold border border-primary/20"
                    title="Edit Target Examination"
                  >
                    <Target className="w-2.5 h-2.5" />
                    {profile.targetExam}
                    {profile.targetExamDate ? \` • \${new Date(profile.targetExamDate).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}\` : ''}
                  </button>
                ) : (
                  <button
                    onClick={() => setExamModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all text-[10px] font-bold border border-amber-500/20 animate-pulse"
                  >
                    <Target className="w-2.5 h-2.5" />
                    Set Target Exam
                  </button>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{greeting}</h1>
            </div>
          </div>
          {/* Quick Search trigger opening CommandPalette */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            className="shrink-0 h-10 px-3.5 rounded-xl border border-border/80 bg-card hover:bg-muted/60 active:scale-95 transition-all text-muted-foreground shadow-sm flex items-center gap-2 group cursor-pointer self-start sm:self-auto"
            aria-label="Open search"
            title="Open Quick Search (⌘K or /)"
          >
            <SearchIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="hidden sm:inline text-xs font-medium text-muted-foreground group-hover:text-foreground">Search...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono font-medium text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded border border-border/60">
              <span className="text-[9px]">⌘</span>K
            </kbd>
          </button>
        </header>`,
`              <div className="flex items-center gap-2 mb-0.5">
                <span className="flex items-center gap-1 text-primary text-[11px] font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> Medical Study Tracker
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{greeting}</h1>
            </div>
          </div>
        </header>`);

content = content.replace(
`        </header>
                        
            <OverviewStats 
              streak={streak}
              overallProgress={topicOverallProgress}
              completedTasks={stats.completedTasks}
              totalTasks={allTopicIds.length}
              strongSystems={stats.strongSystems}
              totalSystems={allTopicIds.length}
              dueRevisionsCount={stats.dueRevisionsCount}
              weakTopicsCount={stats.weakTopicsCount}
              learningTopicsCount={stats.learningTopicsCount}
            />

            <ActiveRevisions`,
`        </header>
            
            <ActiveRevisions`);

fs.writeFileSync(file, content);
console.log("Patched successfully");
