const fs = require('fs');
const path = '/app/applet/artifacts/study-tracker/src/features/analytics/Analytics.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\{\/\* Actionable Priority Recommendation Banner \*\/\}.*?\{\/\* Main Charts Section \*\/\}/s;

const newBanner = `{/* Actionable Priority Recommendation Banner - Clinical Apex Alert */}
      {studyRecommendation && (
        <div className={\`border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8 transition-colors \${studyRecommendation.isCritical ? 'bg-rose-500/5 border-rose-500/20' : 'bg-primary/5 border-primary/20'}\`}>
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded border flex items-center gap-1.5 bg-background text-foreground border-border/80 shadow-xs">
                <Sparkles className="w-3 h-3" /> Apex Directive
              </span>
              <span className={\`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded border \${studyRecommendation.badgeColor}\`}>
                {studyRecommendation.badge}
              </span>
            </div>
            <h3 className={\`text-lg font-bold tracking-tight \${studyRecommendation.isCritical ? 'text-rose-600 dark:text-rose-500' : 'text-foreground'}\`}>
              {studyRecommendation.title} <span className="text-xs font-normal opacity-60 uppercase tracking-widest ml-1">({studyRecommendation.subjectName})</span>
            </h3>
            <p className="text-sm text-muted-foreground/80 leading-relaxed font-medium max-w-xl">
              {studyRecommendation.reason}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 pt-3 md:pt-0">
            <Button
              size="lg"
              onClick={() => handleSetRecommendationAsPrimary(studyRecommendation.system)}
              className={\`rounded-xl font-bold text-xs shadow-md transition-all \${studyRecommendation.isCritical ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-foreground text-background hover:bg-foreground/90'}\`}
            >
              <Target className="w-4 h-4 mr-2" />
              Initiate Target Revision
            </Button>
          </div>
        </div>
      )}

      {/* Main Charts Section */}`;

content = content.replace(regex, newBanner);
fs.writeFileSync(path, content);
