const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/components/dashboard/NextActionCard.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
  /              <Button\n                onClick=\{\(\) => handleStartRevision\(primary\)\}\n                className="bg-primary text-primary-foreground hover:bg-primary\/90 font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none"\n              >\n                \{isGap \? \(\n                  <>\n                    <span>\{primary\.type === 'topicGap' \? 'Add to Block' : 'Add Topics'\}<\/span>\n                    <Plus className="w-4 h-4" \/>\n                  <\/>\n                \) : \(\n                  <>\n                    <span>Start Revision<\/span>\n                    <ArrowRight className="w-4 h-4" \/>\n                  <\/>\n                \)\}\n              <\/Button>\n              \n              \{isGap \? \(\n                <Button\n                  variant="outline"\n                  onClick=\{\(\) => handleSkip\('dismissed_gap'\)\}\n                  className="border-border\/80 text-muted-foreground hover:text-foreground hover:bg-muted\/50 rounded-xl px-3.5 py-2.5 text-xs font-semibold cursor-pointer"\n                >\n                  Dismiss for now\n                <\/Button>\n              \)/,
  `              {primary.type === 'topicGap' ? (
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
                <Button
                  onClick={() => handleStartRevision(primary)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none"
                >
                  <span>Start Revision</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}`
);

fs.writeFileSync(file, data);
