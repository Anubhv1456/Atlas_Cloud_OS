const fs = require('fs');
const path = '/app/applet/artifacts/study-tracker/src/features/analytics/Analytics.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<AreaChart[\s\S]*?<\/AreaChart>/;

const newChart = `<AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/20" />
                  
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-muted-foreground/60"
                  />
                  <YAxis hide domain={[0, 100]} />
                  
                  <Tooltip
                    wrapperStyle={{ outline: 'none', zIndex: 50 }}
                    allowEscapeViewBox={{ x: false, y: false }}
                    cursor={{ stroke: 'currentColor', strokeWidth: 1, strokeOpacity: 0.1, strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
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
                  />
                  
                  <Area
                    type="monotoneX"
                    dataKey="percentage"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#scoreAreaGrad)"
                    dot={false}
                    activeDot={{ r: 6, fill: '#3b82f6', stroke: 'var(--background)', strokeWidth: 3 }}
                  />
                </AreaChart>`;

content = content.replace(regex, newChart);

// Also remove CartesianGrid, YAxis imports if not used? They are still used here.
fs.writeFileSync(path, content);
