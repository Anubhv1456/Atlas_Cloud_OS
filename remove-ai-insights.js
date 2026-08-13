const fs = require('fs');
const path = require('path');

// 1. Clean Home.hooks.tsx
const homeHooksPath = '/app/applet/artifacts/study-tracker/src/features/dashboard/Home.hooks.tsx';
let homeHooks = fs.readFileSync(homeHooksPath, 'utf8');
homeHooks = homeHooks.replace("import { useAIInsights } from '@/hooks/useAIInsights';\n", '');
fs.writeFileSync(homeHooksPath, homeHooks);

// 2. Clean Analytics.tsx
const analyticsPath = '/app/applet/artifacts/study-tracker/src/features/analytics/Analytics.tsx';
let analytics = fs.readFileSync(analyticsPath, 'utf8');
analytics = analytics.replace("import { useAIInsights } from '@/hooks/useAIInsights';\n", '');
analytics = analytics.replace("const { data: aiData } = useAIInsights(subjects, systems);\n", '');

// Find and replace the UI block
const uiBlockRegex = /[ \t]*\{\/\* AI Insights & Interpretations Banner \*\/\}.*?\{\/\* Filter Bar \*\/\}/s;
analytics = analytics.replace(uiBlockRegex, '{/* Filter Bar */}');

fs.writeFileSync(analyticsPath, analytics);

// 3. Delete the hook file
const hookPath = '/app/applet/artifacts/study-tracker/src/hooks/useAIInsights.ts';
if (fs.existsSync(hookPath)) {
    fs.unlinkSync(hookPath);
}

console.log("Cleanup complete");
