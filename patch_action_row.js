const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/components/dashboard/NextActionCard.tsx';
let data = fs.readFileSync(file, 'utf8');

const actionRowStart = data.indexOf('{/* Action Row */}');
const fallbackPreviewStart = data.indexOf('{/* Fallback candidate preview */}');

const replacement = `{/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {primary.type === 'topicGap' ? (
                <>
                  <Button
                    onClick={() => handleStartRevision(primary)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none"
                  >
                    <span>Add to Block</span>
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStartRevision(primary)}
                    className="border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl px-3.5 py-2.5 text-xs font-semibold cursor-pointer flex-1 sm:flex-none"
                  >
                    Create New
                  </Button>
                </>
              ) : primary.type === 'systemGap' ? (
                <>
                  <Button
                    onClick={() => handleStartRevision(primary)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none"
                  >
                    <span>Add Topics</span>
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSkip('dismissed_gap')}
                    className="border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl px-3.5 py-2.5 text-xs font-semibold cursor-pointer flex-1 sm:flex-none"
                  >
                    Dismiss for now
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => handleStartRevision(primary)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none"
                  >
                    <span>Start Revision</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl px-3.5 py-2.5 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Skip</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 rounded-xl">
                      <DropdownMenuItem onClick={() => handleSkip('already_studied')} className="cursor-pointer gap-2 py-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <div className="flex flex-col">
                          <span className="font-semibold">Already studied</span>
                          <span className="text-[10px] text-muted-foreground">Hide for 12 hours</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSkip('not_today')} className="cursor-pointer gap-2 py-2">
                        <CalendarX className="w-4 h-4 text-amber-500" />
                        <div className="flex flex-col">
                          <span className="font-semibold">Not today</span>
                          <span className="text-[10px] text-muted-foreground">Show something else</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSkip('too_difficult')} className="cursor-pointer gap-2 py-2">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        <div className="flex flex-col">
                          <span className="font-semibold">Too difficult right now</span>
                          <span className="text-[10px] text-muted-foreground">Needs more time</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSkip('not_relevant')} className="cursor-pointer gap-2 py-2">
                        <ThumbsDown className="w-4 h-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-semibold">Not relevant</span>
                          <span className="text-[10px] text-muted-foreground">Low yield for me</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}

              {skipIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetSkips}
                  className="text-[11px] text-muted-foreground hover:text-primary underline ml-1 cursor-pointer hidden sm:block"
                >
                  Reset ({skipIds.length})
                </button>
              )}
            </div>

            `;

data = data.substring(0, actionRowStart) + replacement + data.substring(fallbackPreviewStart);
fs.writeFileSync(file, data);
