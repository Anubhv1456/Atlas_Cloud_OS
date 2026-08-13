const fs = require('fs');
const path = '/app/applet/artifacts/study-tracker/src/features/analytics/Analytics.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStatsRow = `      {/* Main Charts Section */}`;

const replaceStatsRow = `      {/* Top Level Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Avg Score</span>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight">{stats.avgPercentage}%</span>
          </div>
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Target Pass Rate</span>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight">{stats.targetPassRate}%</span>
          </div>
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col justify-center border-primary/20 bg-primary/5">
          <div className="flex items-center gap-1 mb-1">
            <Trophy className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Avg GT Score</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-primary">{stats.avgGtScore > 0 ? stats.avgGtScore : '--'}</span>
          </div>
        </div>
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Logs</span>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight">{stats.totalLogs}</span>
            <span className="text-[10px] text-muted-foreground mb-1">({stats.gtCount} GTs)</span>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}`;

content = content.replace(targetStatsRow, replaceStatsRow);

// Import Trophy if missing
if (!content.includes('Trophy,')) {
    content = content.replace('Award,', 'Award,\n  Trophy,');
}

fs.writeFileSync(path, content);
