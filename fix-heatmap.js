const fs = require('fs');
const file = './artifacts/study-tracker/src/features/timeline/Timeline.tsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = '{/* ── Month-on-Month Heatmap Calendar ──────────────────────────────── */}';
const endStr = '{/* Selected date filter banner */}';

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

const before = content.slice(0, startIdx);
const after = content.slice(endIdx);

const newHeatmap = `        {/* ── Month-on-Month Heatmap Calendar ──────────────────────────────── */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm mb-8 overflow-hidden w-[60%] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <CalendarDays className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                {format(calDate, 'MMM yyyy')} Activity
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCalDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors border border-border/50 bg-background shadow-sm">
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button onClick={() => setCalDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                disabled={calDate >= startOfMonth(now)}
                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors border border-border/50 bg-background shadow-sm disabled:opacity-30 disabled:pointer-events-none">
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1.5">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
              <div key={d} className="text-center text-[9px] font-semibold uppercase tracking-wider text-muted-foreground py-0.5">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {blanks.map((_, i) => <div key={\`b-\${i}\`} />)}
            {days.map(day => {
              const key        = format(day, 'yyyy-MM-dd');
              const isTdy      = isSameDay(day, now);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const count      = activityByDay.get(key) || 0;
              const isFuture   = day > now && !isSameDay(day, now);

              let bgClass = 'bg-transparent text-foreground hover:bg-muted/40'; 
              if (count === 1) bgClass = 'bg-primary/20 text-foreground hover:bg-primary/30';
              if (count === 2) bgClass = 'bg-primary/40 text-foreground hover:bg-primary/50';
              if (count === 3) bgClass = 'bg-primary/70 text-primary-foreground font-medium hover:bg-primary/80';
              if (count >= 4)  bgClass = 'bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90';

              if (count === 0 && isTdy) { 
                 bgClass = 'bg-transparent text-primary font-semibold ring-1 ring-primary ring-inset';
              } else if (isTdy) { 
                 bgClass += ' ring-2 ring-primary ring-offset-2 ring-offset-card';
              }
              
              if (isSelected) { 
                 bgClass += ' ring-2 ring-ring ring-offset-2 ring-offset-background font-bold scale-105 z-10';
              }

              if (isFuture) { 
                 bgClass = 'bg-transparent text-muted-foreground/30 pointer-events-none';
              }

              return (
                <button
                  key={key}
                  disabled={isFuture}
                  onClick={() => setSelectedDate(prev => prev && isSameDay(prev, day) ? null : day)}
                  className={cn(
                    'aspect-square flex items-center justify-center rounded-md text-[10px] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    bgClass
                  )}
                  title={\`\${format(day, 'MMM d, yyyy')}: \${count} task\${count !== 1 ? 's' : ''} completed\`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
        `;

fs.writeFileSync(file, before + newHeatmap + after);
