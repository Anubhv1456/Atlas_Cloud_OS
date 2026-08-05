const fs = require('fs');

// Fix BottomNav
const bottomNavFile = './artifacts/study-tracker/src/components/BottomNav.tsx';
let navContent = fs.readFileSync(bottomNavFile, 'utf8');
navContent = navContent.replace("label: 'Navigation'", "label: 'Analytics'");
fs.writeFileSync(bottomNavFile, navContent);

// Fix Analytics wording
const analyticsFile = './artifacts/study-tracker/src/features/analytics/Analytics.tsx';
let anContent = fs.readFileSync(analyticsFile, 'utf8');
anContent = anContent.replace('study Report', 'Analytics');
anContent = anContent.replace('Track resonance trends, PYQ accuracy, and system mastery performance over time.', 'Track retention trends, accuracy, and topic mastery over time.');
fs.writeFileSync(analyticsFile, anContent);
