const fs = require('fs');

const files = [
  '/app/applet/artifacts/study-tracker/src/features/analytics/ScoreLogModal.tsx',
  '/app/applet/artifacts/study-tracker/src/features/analytics/Analytics.tsx',
  '/app/applet/artifacts/study-tracker/src/features/revision/DailyAnkiCard.tsx',
  '/app/applet/artifacts/study-tracker/src/features/timeline/Timeline.tsx',
  '/app/applet/artifacts/study-tracker/src/features/dashboard/Home.tsx',
  '/app/applet/artifacts/study-tracker/src/features/dashboard/ActiveRevisions.tsx',
  '/app/applet/artifacts/study-tracker/src/features/subjects/SubjectDetail.tsx',
  '/app/applet/artifacts/study-tracker/src/features/subjects/SystemCard.tsx',
  '/app/applet/artifacts/study-tracker/src/features/dashboard/SubjectsGrid.tsx',
];

const replaces = [
  [/Revision Score/g, 'Alignment Resonance'],
  [/PYQ Score/g, 'Legacy Resonance'],
  [/Log Test Score/g, 'Log Resonance'],
  [/Select Subject/g, 'Select Territory'],
  [/Select System/g, 'Select Waypoint'],
  [/Subject/g, 'Territory'],
  [/System /g, 'Waypoint '],
  [/system /g, 'waypoint '],
  [/Revision Timeline/g, 'Alignment Timeline'],
  [/Log Score/g, 'Log Resonance'],
  [/Score Logs/g, 'Resonance Logs'],
  [/>Score</g, '>Resonance<'],
  [/>Scores</g, '>Resonances<'],
  [/>Subject</g, '>Territory<'],
  [/>Subjects</g, '>Territories<'],
  [/>System</g, '>Waypoint<'],
  [/>Systems</g, '>Waypoints<'],
  [/>Revision</g, '>Alignment<'],
  [/>Revisions</g, '>Alignments<'],
  [/>QBank</g, '>Trials<']
];

for (let file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Safe string replacements inside JSX nodes and common strings.
  // We can just use the loose replace for exact casing since we mostly care about UI text.
  content = content.replace(/'Select Subject'/g, "'Select Territory'");
  content = content.replace(/"Select Subject"/g, '"Select Territory"');
  content = content.replace(/'Select System'/g, "'Select Waypoint'");
  content = content.replace(/"Select System"/g, '"Select Waypoint"');
  content = content.replace(/Revision Score/g, 'Alignment Resonance');
  content = content.replace(/PYQ Score/g, 'Legacy Resonance');
  content = content.replace(/Log Test Resonance/g, 'Log Resonance'); // Re-replace in case Score was replaced
  content = content.replace(/Log Score/g, 'Log Resonance');
  content = content.replace(/Score Logs/g, 'Resonance Logs');
  content = content.replace(/System Progress/g, 'Waypoint Progress');
  content = content.replace(/Subject Progress/g, 'Territory Progress');
  content = content.replace(/>Score/g, '>Resonance');
  content = content.replace(/>Scores/g, '>Resonances');
  content = content.replace(/>System/g, '>Waypoint');
  content = content.replace(/>Systems/g, '>Waypoints');
  content = content.replace(/>Subject/g, '>Territory');
  content = content.replace(/>Subjects/g, '>Territories');
  content = content.replace(/>Revision/g, '>Alignment');
  content = content.replace(/>Revisions/g, '>Alignments');
  content = content.replace(/>QBank/g, '>Trials');
  content = content.replace(/"QBank"/g, '"Trials"');
  content = content.replace(/'QBank'/g, "'Trials'");

  // Specific buttons / UI text
  content = content.replace(/>Add Subject</g, '>Add Territory<');
  content = content.replace(/>Rename Subject</g, '>Rename Territory<');
  content = content.replace(/>Delete Subject</g, '>Delete Territory<');
  content = content.replace(/>New Subject</g, '>New Territory<');
  
  content = content.replace(/>Add System</g, '>Add Waypoint<');
  content = content.replace(/>Rename System</g, '>Rename Waypoint<');
  content = content.replace(/>Delete System</g, '>Delete Waypoint<');
  content = content.replace(/>New System</g, '>New Waypoint<');
  
  content = content.replace(/>Active Revision</g, '>Active Alignment<');
  content = content.replace(/>Daily Revision</g, '>Daily Alignment<');
  content = content.replace(/>Complete Revision</g, '>Complete Alignment<');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log("Updated", file);
  }
}
