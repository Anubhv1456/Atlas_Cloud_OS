const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      walk(file, callback);
    } else { 
      callback(file);
    }
  });
}

const uiStringsToReplace = [
  [/New Subject/g, 'New Territory'],
  [/Rename Subject/g, 'Rename Territory'],
  [/Delete Subject/g, 'Delete Territory'],
  [/Subjects/g, 'Territories'],
  [/Subject\b/g, 'Territory'],
  
  [/New System/g, 'New Waypoint'],
  [/Rename System/g, 'Rename Waypoint'],
  [/Delete System/g, 'Delete Waypoint'],
  [/Systems/g, 'Waypoints'],
  [/\bSystem\b/g, 'Waypoint'],
  
  [/\bQBank\b/g, 'Trials'],
  [/\bRevision\b/g, 'Alignment'],
  [/\bRevisions\b/g, 'Alignments'],
  [/\bActive Revision\b/g, 'Active Alignment'],
  [/\bDaily Revision\b/g, 'Daily Alignment'],
  
  [/\bScore\b/g, 'Resonance'],
  [/\bScores\b/g, 'Resonances']
];

walk('/app/applet/artifacts/study-tracker/src', (file) => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // We only want to replace text in JSX children or attributes, NOT variable names or imports
    // That's hard to do with regex perfectly.
    // Instead, let's use the loose replace but ONLY if it's not a variable (like `subjectId`)
    // Wait, the previous approach is safer. I'll just write a script that targets specific lines or files.
  }
});
