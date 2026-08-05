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
  // Landing
  [/Stop studying blindly/g, 'Stop navigating blindly'],
  [/Start revising strategically/g, 'Start aligning strategically'],
  [/The smart medical study tracker/g, 'The smart navigation tracker'],
  [/intelligently scheduled topics/g, 'algorithmically scheduled waypoints'],
  [/focus your revision/g, 'focus your alignment'],
  [/Smart Revision/g, 'Smart Alignment'],
  [/Unlimited topic tracking/g, 'Unlimited territory tracking'],
  
  // Home
  [/>Subjects</g, '>Territories<'],
  [/>Subject</g, '>Territory<'],
  [/"New Subject"/g, '"New Territory"'],
  [/>Rename Subject</g, '>Rename Territory<'],
  [/>Delete Subject</g, '>Delete Territory<'],
  [/delete this subject/g, 'delete this territory'],
  [/>Add Subject</g, '>Add Territory<'],
  [/placeholder="Subject name..."/g, 'placeholder="Territory name..."'],
  
  [/>Systems</g, '>Waypoints<'],
  [/>System</g, '>Waypoint<'],
  [/"New System"/g, '"New Waypoint"'],
  [/>Rename System</g, '>Rename Waypoint<'],
  [/>Delete System</g, '>Delete Waypoint<'],
  [/delete this system/g, 'delete this waypoint'],
  [/>Add System</g, '>Add Waypoint<'],
  [/placeholder="System name..."/g, 'placeholder="Waypoint name..."'],
  [/>Add First System</g, '>Add First Waypoint<'],
  [/systems complete</g, 'waypoints complete<'],
  [/systems without/g, 'waypoints without'],
  
  [/>QBank</g, '>Trials<'],
  [/"QBank"/g, '"Trials"'],
  [/>Q-Bank</g, '>Trials<'],
  
  [/>Revision</g, '>Alignment<'],
  [/"Revision"/g, '"Alignment"'],
  [/>Revisions</g, '>Alignments<'],
  [/>Revise</g, '>Align<'],
  [/>Revising</g, '>Aligning<'],
  [/>Active Revision</g, '>Active Alignment<'],
  [/>Daily Revision</g, '>Daily Alignment<'],
  [/due revisions/g, 'due alignments'],
  
  [/>Score</g, '>Resonance<'],
  [/>Scores</g, '>Resonances<'],
  [/"Score"/g, '"Resonance"'],
  [/Log PYQ Score/g, 'Log Legacy Resonance'],
  [/test score/g, 'resonance'],
  [/No score/g, 'No resonance'],
  
  [/Study Tracker/gi, 'Navigation Tracker'],
  [/Start Structuring Your Subject/g, 'Start Structuring Your Territory'],
  [/Break down (.*) into specific modules or systems/g, 'Break down $1 into specific modules or waypoints'],
  
  // Analytics
  [/Subject Progress/g, 'Territory Progress'],
  [/System Progress/g, 'Waypoint Progress'],
  [/Top Strong Systems/g, 'Top Strong Waypoints'],
  [/Top Weak Systems/g, 'Top Weak Waypoints'],
  
  // Settings
  [/Export Data/g, 'Export Logs'],
  
  // Timeline
  [/Revision Timeline/g, 'Alignment Timeline']
];

walk('/app/applet/artifacts/study-tracker/src', (file) => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    for (let [regex, replacement] of uiStringsToReplace) {
       content = content.replace(regex, replacement);
    }

    if (content !== original) {
      fs.writeFileSync(file, content);
      console.log('Updated ' + file);
    }
  }
});
