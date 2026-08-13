const fs = require('fs');
const path = '/app/applet/artifacts/study-tracker/src/features/analytics/Analytics.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<Tooltip[\s\S]*?content=\{[^}]*?=>\s*\{[\s\S]*?return null;\s*\}\s*\}\s*\/>/m;

const newTooltip = `<Tooltip
                    wrapperStyle={{ outline: 'none', zIndex: 50 }}
                    allowEscapeViewBox={{ x: false, y: false }}
                    cursor={{ stroke: 'currentColor', strokeWidth: 1, strokeOpacity: 0.1, strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        
                        if (!data.isRealPoint) {
                          return (
                            <div className="bg-background/95 backdrop-blur-xl border border-border/40 p-3 rounded-2xl shadow-xl text-xs space-y-1.5 max-w-[200px]">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Estimated Decay</span>
                                <div className="flex items-baseline gap-2">
                                  <span className="font-mono font-bold text-2xl tracking-tighter text-rose-500/80 leading-none">
                                    {data.percentage}%
                                  </span>
                                </div>
                              </div>
                              <div className="text-[10px] text-muted-foreground pt-1 flex items-center justify-between">
                                 <span>{data.fullDate}</span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="bg-background/95 backdrop-blur-xl border border-border/40 p-3 rounded-2xl shadow-xl text-xs space-y-1.5 max-w-[240px]">
                            <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-2">
                              <span className="font-bold text-foreground truncate">{data.title}</span>
                            </div>
                            <div className="flex flex-col gap-1 pt-1">
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Retention</span>
                              <span className="font-mono font-bold text-2xl tracking-tighter text-primary leading-none">
                                {data.percentage}%
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground pt-1 flex items-center justify-between">
                               <span>{data.fullDate}</span>
                               <span className="opacity-70">{data.type}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />`;

content = content.replace(regex, newTooltip);
fs.writeFileSync(path, content);
