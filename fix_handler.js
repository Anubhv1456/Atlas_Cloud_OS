const fs = require('fs');
const path = '/app/applet/artifacts/study-tracker/src/features/analytics/Analytics.hooks.tsx';
let content = fs.readFileSync(path, 'utf8');

const handler = `
  const handleSetRecommendationAsPrimary = async (system: StudySystem) => {
    try {
      await setFocus(system.id, 'primary');
      sonnerToast.success('Initiated Target Revision');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to set focus', variant: 'destructive' });
    }
  };

  return {`;

content = content.replace(/  return \{/g, handler);
fs.writeFileSync(path, content);
