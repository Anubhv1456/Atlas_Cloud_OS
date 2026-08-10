const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/components/dashboard/NextActionCard.tsx';
let data = fs.readFileSync(file, 'utf8');

// replace the handleSkip implementation
data = data.replace(/  const handleSkip = \(\) => \{\n    if \(primary\) \{\n      setIsSwapping\(true\);\n      setSkipIds\(prev => \[\.\.\.prev, primary\.id\]\);\n      setTimeout\(\(\) => setIsSwapping\(false\), 200\);\n    \}\n  \};/, `  const handleSkip = async () => {
    if (primary) {
      setIsSwapping(true);
      setSkipIds(prev => [...prev, primary.id]);
      try {
        await db.recommendationSkips.add({
          targetId: primary.id,
          skippedAt: new Date(),
          reason: 'default',
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000)
        });
      } catch(e) {
        console.warn('Failed to save skip to db', e);
      }
      setTimeout(() => setIsSwapping(false), 200);
    }
  };`);

// If Triage mode is active, display a welcome back message
data = data.replace(
  /        <div className="flex items-center gap-2">/,
  `        <div className="flex items-center gap-2">
          {result?.isTriageMode && (
             <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30">
               Welcome back. We've reorganized your reviews.
             </Badge>
          )}`
);

// If recommendation type is topicGap or systemGap, update button text
data = data.replace(
  /              <Button \n                className="w-full font-semibold"\n                size="lg"\n                onClick=\{\(\) => handleStartRevision\(primary\)\}\n              >\n                <Zap className="w-4 h-4 mr-2" \/>\n                Start \{(primary\.type === 'system' \? 'System ' : '')\}Revision\n              <\/Button>/,
  `              <Button 
                className="w-full font-semibold"
                size="lg"
                onClick={() => handleStartRevision(primary)}
              >
                {primary.type === 'topicGap' || primary.type === 'systemGap' ? (
                  <><Plus className="w-4 h-4 mr-2" /> Organize System</>
                ) : (
                  <><Zap className="w-4 h-4 mr-2" /> Start {(primary.type === 'system' ? 'System ' : '')}Revision</>
                )}
              </Button>`
);

fs.writeFileSync(file, data);
