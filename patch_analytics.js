const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/analytics/Analytics.tsx', 'utf8');

const cardsBlockRegex = /\{\/\* Card 1: Overall Average \*\/\}[\s\S]*?\{\/\* Filter Bar \*\/\}$/m;
// I need to be careful with the regex. Let's just find the indexes.

const startIndex = code.indexOf('{/* Card 1: Overall Average */}');
const endIndex = code.indexOf('{/* Filter Bar */}');

if (startIndex !== -1 && endIndex !== -1) {
  const newCards = `{/* Card 1: Topics Mastered */}
        <div className="bg-card border border-border/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col justify-between shadow-xs hover:border-emerald-500/40 transition-all min-w-0">
          <div className="flex items-center justify-between gap-1 min-w-0">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 min-w-0 truncate">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
              <span className="truncate">Mastered</span>
            </span>
            <Badge variant="outline" className="text-[9px] sm:text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5 px-1.5 py-0.5 shrink-0 whitespace-nowrap">
              High Conf.
            </Badge>
          </div>

          <div className="my-1.5 sm:my-3">
            <p className="text-xl sm:text-3xl font-extrabold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 truncate">
              {stats.topicsMastered}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">
              Ready for exam
            </p>
          </div>

          <div className="pt-1.5 sm:pt-2 border-t border-border/40 flex justify-between items-center text-[10px] sm:text-xs text-muted-foreground">
            <span className="truncate">Total</span>
            <span className="font-mono font-bold text-foreground shrink-0 ml-1">{stats.totalTopics}</span>
          </div>
        </div>

        {/* Card 2: Weak Topics */}
        <div className="bg-card border border-border/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col justify-between shadow-xs hover:border-rose-500/40 transition-all min-w-0">
          <div className="flex items-center justify-between gap-1 min-w-0">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 min-w-0 truncate">
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 shrink-0" />
              <span className="truncate">Weak Topics</span>
            </span>
            <Badge variant="outline" className="text-[9px] sm:text-[10px] font-mono text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/5 px-1.5 py-0.5 shrink-0 whitespace-nowrap">
              Focus Needed
            </Badge>
          </div>

          <div className="my-1.5 sm:my-3">
            <p className="text-xl sm:text-3xl font-extrabold font-mono tracking-tight text-rose-600 dark:text-rose-400 truncate">
              {stats.topicsWeak}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">
              Low confidence
            </p>
          </div>

          <div className="pt-1.5 sm:pt-2 border-t border-border/40 flex justify-between items-center text-[10px] sm:text-xs text-muted-foreground">
            <span className="truncate">Total</span>
            <span className="font-mono font-bold text-foreground shrink-0 ml-1">{stats.totalTopics}</span>
          </div>
        </div>

        {/* Card 3: QBank Coverage */}
        <div className="bg-card border border-border/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col justify-between shadow-xs hover:border-indigo-500/40 transition-all min-w-0">
          <div className="flex items-center justify-between gap-1 min-w-0">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 min-w-0 truncate">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
              <span className="truncate">QBank Coverage</span>
            </span>
            <Badge variant="outline" className="text-[9px] sm:text-[10px] font-mono text-indigo-600 dark:text-indigo-400 border-indigo-500/30 bg-indigo-500/5 px-1.5 py-0.5 shrink-0 whitespace-nowrap">
              Practice
            </Badge>
          </div>

          <div className="my-1.5 sm:my-3">
            <p className="text-xl sm:text-3xl font-extrabold font-mono tracking-tight text-indigo-600 dark:text-indigo-400 truncate">
              {stats.qbankCoverage}%
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">
              Topics practiced
            </p>
          </div>

          <div className="pt-1.5 sm:pt-2 border-t border-border/40 flex justify-between items-center text-[10px] sm:text-xs text-muted-foreground">
            <span className="truncate">Total</span>
            <span className="font-mono font-bold text-foreground shrink-0 ml-1">{stats.totalTopics}</span>
          </div>
        </div>
      </div>

      `;
  
  code = code.substring(0, startIndex) + newCards + code.substring(endIndex);
  fs.writeFileSync('artifacts/study-tracker/src/features/analytics/Analytics.tsx', code);
  console.log('Analytics updated successfully');
}
