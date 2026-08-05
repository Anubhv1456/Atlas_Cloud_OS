const fs = require('fs');

const files = [
  '/app/applet/artifacts/study-tracker/src/features/dashboard/SubjectsGrid.tsx',
  '/app/applet/artifacts/study-tracker/src/features/dashboard/ActiveRevisions.tsx',
  '/app/applet/artifacts/study-tracker/src/features/dashboard/Home.tsx',
  '/app/applet/artifacts/study-tracker/src/features/subjects/SubjectCard.tsx'
];

for (let file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/>Subject Portfolio</g, '>Territory Portfolio<');
  content = content.replace(/>Add First Subject</g, '>Add First Territory<');
  content = content.replace(/"Add Subject"/g, '"Add Territory"');
  content = content.replace(/first subject/g, 'first territory');
  content = content.replace(/>Active Revisions</g, '>Active Alignments<');
  content = content.replace(/>No Active Revisions</g, '>No Active Alignments<');
  content = content.replace(/>Revision Due</g, '>Alignment Due<');
  content = content.replace(/>Revision Overdue</g, '>Alignment Overdue<');
  content = content.replace(/>Revision Pipeline</g, '>Alignment Pipeline<');
  content = content.replace(/>Revisions Due</g, '>Alignments Due<');
  content = content.replace(/>Daily Revisions</g, '>Daily Alignments<');
  content = content.replace(/due revisions/g, 'due alignments');
  content = content.replace(/No Due Revisions/g, 'No Due Alignments');
  content = content.replace(/revisions overdue/g, 'alignments overdue');
  content = content.replace(/Strong Systems/g, 'Strong Waypoints');
  content = content.replace(/Total Systems/g, 'Total Waypoints');
  content = content.replace(/Systems Complete/g, 'Waypoints Complete');
  content = content.replace(/>Systems</g, '>Waypoints<');
  
  fs.writeFileSync(file, content);
}
