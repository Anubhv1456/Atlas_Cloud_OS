const fs = require('fs');
const file = '/app/applet/artifacts/study-tracker/src/components/dashboard/NextActionCard.tsx';
let data = fs.readFileSync(file, 'utf8');

// Add DropdownMenu imports
data = data.replace(
  "import { Badge } from '@/components/ui/badge';",
  "import { Badge } from '@/components/ui/badge';\nimport { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';"
);

// Update handleSkip
data = data.replace(
  /  const handleSkip = async \(\) => \{\n    if \(primary\) \{\n      setIsSwapping\(true\);\n      setSkipIds\(prev => \[\.\.\.prev, primary\.id\]\);\n      try \{\n        await db\.recommendationSkips\.add\(\{\n          targetId: primary\.id,\n          skippedAt: new Date\(\),\n          reason: 'default',\n          expiresAt: new Date\(Date\.now\(\) \+ 12 \* 60 \* 60 \* 1000\)\n        \}\);\n      \} catch\(e\) \{\n        console\.warn\('Failed to save skip to db', e\);\n      \}\n      setTimeout\(\(\) => setIsSwapping\(false\), 200\);\n    \}\n  \};/,
  `  const handleSkip = async (reason: 'already_studied' | 'too_difficult' | 'not_today' | 'not_relevant' | 'dismissed_gap' | 'default' = 'default') => {
    if (primary) {
      setIsSwapping(true);
      setSkipIds(prev => [...prev, primary.id]);
      try {
        await db.recommendationSkips.add({
          targetId: primary.id,
          skippedAt: new Date(),
          reason,
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000)
        });
      } catch(e) {
        console.warn('Failed to save skip to db', e);
      }
      setTimeout(() => setIsSwapping(false), 200);
    }
  };`
);

// We need to replace the entire Action Row and Main Content area to properly handle the gap types
// I'll just write a script to generate a completely fresh NextActionCard.tsx since it's cleaner.
