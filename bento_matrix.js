const fs = require('fs');
const path = '/app/applet/artifacts/study-tracker/src/features/analytics/Analytics.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\{\/\* System Breakdown Bar Chart \*\/\}.*?(?=\{\/\* Score History Table \*\/\})/s;

const newMatrix = `{/* The Vulnerability Matrix (Replaces Bar Chart) */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
              <Target className="w-4 h-4 text-rose-500" />
              Vulnerability Matrix
            </h2>
            <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">
              Heatmap of your most at-risk systems. Larger, red blocks require immediate attention.
            </p>
          </div>

          {systemBreakdownData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border/60 rounded-2xl p-6 text-center">
              <p className="text-xs text-muted-foreground font-medium">No system test data available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 auto-rows-[100px] gap-3">
              {[...systemBreakdownData]
                .sort((a, b) => a.average - b.average) // Sort by lowest average first (most vulnerable)
                .map((sys, idx) => {
                  let spanClasses = "col-span-1 row-span-1";
                  if (idx === 0) spanClasses = "col-span-2 row-span-2"; // Apex vulnerability
                  else if (idx === 1) spanClasses = "col-span-2 row-span-1"; // Secondary vulnerability

                  let colorClasses = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
                  let scoreColor = "text-emerald-600 dark:text-emerald-500";
                  
                  if (sys.average < 60) {
                    colorClasses = "bg-rose-500/15 text-rose-700 dark:text-rose-400";
                    scoreColor = "text-rose-600 dark:text-rose-500";
                  } else if (sys.average < 75) {
                    colorClasses = "bg-amber-500/15 text-amber-700 dark:text-amber-400";
                    scoreColor = "text-amber-600 dark:text-amber-500";
                  }

                  return (
                    <div 
                      key={sys.name} 
                      className={\`rounded-3xl p-4 flex flex-col justify-between transition-transform hover:scale-[1.02] cursor-default \${spanClasses} \${colorClasses}\`}
                    >
                      <span className={\`font-bold \${idx === 0 ? 'text-lg md:text-xl' : 'text-sm'} leading-tight tracking-tight\`}>
                        {sys.fullName}
                      </span>
                      <div className="flex items-end justify-between mt-2">
                        <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">
                          {sys.count} Logs
                        </span>
                        <span className={\`font-mono font-bold \${idx === 0 ? 'text-5xl' : 'text-2xl'} \${scoreColor} tracking-tighter leading-none\`}>
                          {sys.average}<span className={\`\${idx === 0 ? 'text-2xl' : 'text-sm'} opacity-60 font-light\`}>%</span>
                        </span>
                      </div>
                    </div>
                  );
              })}
            </div>
          )}
        </div>
      </div>

      `;

content = content.replace(regex, newMatrix);
fs.writeFileSync(path, content);
