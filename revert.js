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
  // Revert UI Strings script 1
  [/Stop navigating blindly/g, 'Stop studying blindly'],
  [/Start aligning strategically/g, 'Start revising strategically'],
  [/The smart navigation tracker/g, 'The smart medical study tracker'],
  [/algorithmically scheduled waypoints/g, 'intelligently scheduled topics'],
  [/focus your alignment/g, 'focus your revision'],
  [/Smart Alignment/g, 'Smart Revision'],
  [/Unlimited territory tracking/g, 'Unlimited topic tracking'],
  
  [/>Territories</g, '>Subjects<'],
  [/>Territory</g, '>Subject<'],
  [/"New Territory"/g, '"New Subject"'],
  [/>Rename Territory</g, '>Rename Subject<'],
  [/>Delete Territory</g, '>Delete Subject<'],
  [/delete this territory/g, 'delete this subject'],
  [/>Add Territory</g, '>Add Subject<'],
  [/placeholder="Territory name..."/g, 'placeholder="Subject name..."'],
  
  [/>Waypoints</g, '>Systems<'],
  [/>Waypoint</g, '>System<'],
  [/"New Waypoint"/g, '"New System"'],
  [/>Rename Waypoint</g, '>Rename System<'],
  [/>Delete Waypoint</g, '>Delete System<'],
  [/delete this waypoint/g, 'delete this system'],
  [/>Add Waypoint</g, '>Add System<'],
  [/placeholder="Waypoint name..."/g, 'placeholder="System name..."'],
  [/>Add First Waypoint</g, '>Add First System<'],
  [/waypoints complete</g, 'systems complete<'],
  [/waypoints without/g, 'systems without'],
  
  [/>Trials</g, '>QBank<'],
  [/"Trials"/g, '"QBank"'],
  [/>Trials</g, '>Q-Bank<'], // Was Q-Bank
  
  [/>Alignment</g, '>Revision<'],
  [/"Alignment"/g, '"Revision"'],
  [/>Alignments</g, '>Revisions<'],
  [/>Align</g, '>Revise<'],
  [/>Aligning</g, '>Revising<'],
  [/>Active Alignment</g, '>Active Revision<'],
  [/>Daily Alignment</g, '>Daily Revision<'],
  [/due alignments/g, 'due revisions'],
  
  [/>Resonance</g, '>Score<'],
  [/>Resonances</g, '>Scores<'],
  [/"Resonance"/g, '"Score"'],
  [/Log Legacy Resonance/g, 'Log PYQ Score'],
  [/test resonance/g, 'test score'],
  [/No resonance/g, 'No score'],
  
  [/Navigation Tracker/gi, 'Study Tracker'],
  [/Start Structuring Your Territory/g, 'Start Structuring Your Subject'],
  [/Break down (.*) into specific modules or waypoints/g, 'Break down $1 into specific modules or systems'],
  
  [/Territory Progress/g, 'Subject Progress'],
  [/Waypoint Progress/g, 'System Progress'],
  [/Top Strong Waypoints/g, 'Top Strong Systems'],
  [/Top Weak Waypoints/g, 'Top Weak Systems'],
  
  [/Export Logs/g, 'Export Data'],
  
  [/Alignment Timeline/g, 'Revision Timeline'],
  
  // Script 2
  [/label: 'Atlas'/g, "label: 'Navigation'"],
  [/label: 'Compass'/g, "label: 'Home'"],
  [/Atlas Analysis/g, 'Analytics'],
  [/navigation logs/g, 'study logs'],
  [/alignment schedules/g, 'revision schedules'],
  [/past resonances/g, 'past exam scores'],
  [/waypoint updates/g, 'flashcard updates'],
  [/navigation tracker/gi, 'study tracker'],
  [/navigation /gi, 'study '],
  [/Navigation /gi, 'Study '],

  // Script 3
  [/'Select Territory'/g, "'Select Subject'"],
  [/"Select Territory"/g, '"Select Subject"'],
  [/'Select Waypoint'/g, "'Select System'"],
  [/"Select Waypoint"/g, '"Select System"'],
  [/Alignment Resonance/g, 'Revision Score'],
  [/Legacy Resonance/g, 'PYQ Score'],
  [/Log Resonance/g, 'Log Test Score'],
  [/Log Resonance/g, 'Log Score'],
  [/Resonance Logs/g, 'Score Logs'],
  [/>Resonance/g, '>Score'],
  [/>Resonances/g, '>Scores'],
  [/>Waypoint/g, '>System'],
  [/>Waypoints/g, '>Systems'],
  [/>Territory/g, '>Subject'],
  [/>Territories/g, '>Subjects'],
  [/>Alignment/g, '>Revision'],
  [/>Alignments/g, '>Revisions'],
  [/>Trials/g, '>QBank'],
  [/"Trials"/g, '"QBank"'],
  [/'Trials'/g, "'QBank'"],

  [/>Add Territory</g, '>Add Subject<'],
  [/>Rename Territory</g, '>Rename Subject<'],
  [/>Delete Territory</g, '>Delete Subject<'],
  [/>New Territory</g, '>New Subject<'],

  [/>Add Waypoint</g, '>Add System<'],
  [/>Rename Waypoint</g, '>Rename System<'],
  [/>Delete Waypoint</g, '>Delete System<'],
  [/>New Waypoint</g, '>New System<'],

  [/>Active Alignment</g, '>Active Revision<'],
  [/>Daily Alignment</g, '>Daily Revision<'],
  [/>Complete Alignment</g, '>Complete Revision<'],

  [/Territory Portfolio/g, 'Subject Portfolio'],
  [/Add First Territory/g, 'Add First Subject'],
  [/Add Territory/g, 'Add Subject'],
  [/first territory/g, 'first subject'],
  [/Active Alignments/g, 'Active Revisions'],
  [/No Active Alignments/g, 'No Active Revisions'],
  [/Alignment Due/g, 'Revision Due'],
  [/Alignment Overdue/g, 'Revision Overdue'],
  [/Alignment Pipeline/g, 'Revision Pipeline'],
  [/Alignments Due/g, 'Revisions Due'],
  [/Territory:/g, 'Subject:'],

  [/>Territory Portfolio</g, '>Subject Portfolio<'],
  [/>Add First Territory</g, '>Add First Subject<'],
  [/"Add Territory"/g, '"Add Subject"'],
  [/>Active Alignments</g, '>Active Revisions<'],
  [/>No Active Alignments</g, '>No Active Revisions<'],
  [/>Alignment Due</g, '>Revision Due<'],
  [/>Alignment Overdue</g, '>Revision Overdue<'],
  [/>Alignment Pipeline</g, '>Revision Pipeline<'],
  [/>Alignments Due</g, '>Revisions Due<'],
  [/>Daily Alignments</g, '>Daily Revisions<'],
  [/due alignments/g, 'due revisions'],
  [/No Due Alignments/g, 'No Due Revisions'],
  [/alignments overdue/g, 'revisions overdue'],
  [/Strong Waypoints/g, 'Strong Systems'],
  [/Total Waypoints/g, 'Total Systems'],
  [/Waypoints Complete/g, 'Systems Complete'],

  [/Select a Territory/g, 'Select a Subject'],
  [/All Waypoints \/ Overall Territory Alignment/g, 'All Systems / Overall Subject Revision'],
  [/Overall Territory Alignment/g, 'Overall Subject Revision'],
  [/General Territory PYQ/g, 'General Subject PYQ'],
  [/Active Territories/g, 'Active Subjects'],
  [/All Territories/g, 'All Subjects'],
  [/All Waypoints/g, 'All Systems'],
  [/Waypoint Average Comparison/g, 'System Average Comparison'],
  [/Average accuracy per waypoint/g, 'Average accuracy per system'],
  [/No waypoint resonance data available/g, 'No system test data available'],
  [/waypoint mastery performance/g, 'system mastery performance'],
  [/waypoint resonance data/g, 'system test data'],
  [/Territory Filter/g, 'Subject Filter'],
  [/Waypoint Filter/g, 'System Filter'],

  [/Territory:/g, 'Subject:'],
  [/Territory: \$\{customPrimarySubject/g, 'Subject: ${customPrimarySubject'],
  [/Territory: \$\{customSecondarySubject/g, 'Subject: ${customSecondarySubject'],
  [/Active Multi-Day Alignment/g, 'Active Multi-Day Revision'],
  [/suspended due to alignment/g, 'suspended due to revision'],
  [/Log Test \/ Alignment Resonance/g, 'Log Test / Revision Score'],

  // Revert manual global replacements done loosely
  [/Rename Territory/g, 'Rename Subject'],
  [/Delete Territory/g, 'Delete Subject'],
  [/Rename Waypoint/g, 'Rename System'],
  [/Delete Waypoint/g, 'Delete System']
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
      console.log('Reverted in ' + file);
    }
  }
});
