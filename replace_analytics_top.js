const fs = require('fs');
const path = '/app/applet/artifacts/study-tracker/src/features/analytics/Analytics.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\{\/\* Page Header \*\/\}.*?\{\/\* Main Charts Section \*\/\}/s;

const newTop = `{/* Diagnostics Apex - Readiness Metric */}
      <div className="pt-2 pb-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-widest text-[11px] font-bold">
            <Activity className="w-3.5 h-3.5" />
            Global Readiness Index
          </div>
          <div className="flex items-baseline gap-4 mt-1">
            <h1 className="text-7xl sm:text-8xl font-light tracking-tighter text-foreground">
              {stats.readinessIndex}<span className="text-4xl sm:text-5xl text-muted-foreground font-light">%</span>
            </h1>
            {stats.readinessTrend !== 0 && (
              <span className={\`text-sm sm:text-base font-semibold \${stats.readinessTrend > 0 ? 'text-emerald-500' : 'text-rose-500'}\`}>
                {stats.readinessTrend > 0 ? '↗' : '↘'} {Math.abs(stats.readinessTrend)}%
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-3 max-w-md leading-relaxed">
            Your living memory diagnostic. This index decays automatically over time and strengthens when you log high-yield revisions.
          </p>
        </div>
        
        <div className="mt-8">
           <Button
            onClick={() => setIsModalOpen(true)}
            className="rounded-full px-6 font-semibold shadow-sm text-xs bg-foreground text-background hover:bg-foreground/90 transition-all"
          >
            <Plus className="w-3.5 h-3.5 mr-2" />
            Log Score
          </Button>
        </div>
      </div>

      {/* Actionable Priority Recommendation Banner */}
      {studyRecommendation && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 bg-primary/10 text-primary border-primary/20">
                <Sparkles className="w-3 h-3" /> Next Bearing
              </span>
              <span className={\`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border \${studyRecommendation.badgeColor}\`}>
                {studyRecommendation.badge}
              </span>
            </div>
            <h3 className="text-base font-bold text-foreground">
              {studyRecommendation.title} <span className="text-xs font-normal text-muted-foreground">({studyRecommendation.subjectName})</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {studyRecommendation.reason}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSetRecommendationAsPrimary(studyRecommendation.system)}
              className="rounded-xl font-semibold text-xs border-primary/30 hover:bg-primary/10 text-primary bg-background"
            >
              Set as Primary Focus
            </Button>
          </div>
        </div>
      )}

      {/* Main Charts Section */}`;

content = content.replace(regex, newTop);
fs.writeFileSync(path, content);
