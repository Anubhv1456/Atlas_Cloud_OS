const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/components/TargetExamModal.tsx', 'utf8');

// Use a more specific replacement based on the exact string contents
const toReplace = `              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dailyGoal" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    Daily QBank Target
                  </Label>
                  <span className="text-xs text-muted-foreground font-medium">MCQs/day</span>
                </div>
                <Input
                  id="dailyGoal"
                  type="number"
                  min={5}
                  max={300}
                  value={dailyQuestionGoal}
                  onChange={(e) => setDailyQuestionGoal(Number(e.target.value))}
                  className="rounded-xl h-10 px-3 text-xs sm:text-sm bg-background border-border/60 focus-visible:ring-primary/20 font-medium"
                  required
                />
              </div>`;

code = code.replace(toReplace, '');
fs.writeFileSync('artifacts/study-tracker/src/components/TargetExamModal.tsx', code);
