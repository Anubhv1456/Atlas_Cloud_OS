const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/subjects/SystemCard.tsx', 'utf8');

code = code.replace(
  "    showInsightDialog, setShowInsightDialog, showViewMarkersDialog, setShowViewMarkersDialog, insightContent, setInsightContent,",
  "    showInsightDialog, setShowInsightDialog, showViewMarkersDialog, setShowViewMarkersDialog, selectedTopicId, setSelectedTopicId, selectedTopicName, setSelectedTopicName, insightContent, setInsightContent,"
);

code = code.replace(
  "<TopicList topics={topics} subjectId={system.subjectId} systemId={system.id!} subjectName={subjectName} systemName={system.name} />",
  "<TopicList topics={topics} subjectId={system.subjectId} systemId={system.id!} subjectName={subjectName} systemName={system.name} onViewMarkers={(id, name) => { setSelectedTopicId(id); setSelectedTopicName(name); setShowViewMarkersDialog(true); }} onLeaveMarker={(id, name) => { setSelectedTopicId(id); setSelectedTopicName(name); setShowInsightDialog(true); }} />"
);

code = code.replace(
  "<ViewMarkersModal \n        isOpen={showViewMarkersDialog}",
  "<ViewMarkersModal \n        isOpen={showViewMarkersDialog}"
);

// We need to pass topicId and topicName to ViewMarkersModal
code = code.replace(
  "        systemId={system.id!}\n        systemName={system.name}\n        onLeaveMarker={() => setShowInsightDialog(true)}",
  "        systemId={system.id!}\n        systemName={system.name}\n        topicId={selectedTopicId}\n        topicName={selectedTopicName}\n        onLeaveMarker={() => setShowInsightDialog(true)}"
);

code = code.replace(
  "              <Compass className=\"w-5 h-5 text-primary\" />\n              Leave a Marker\n            </DialogTitle>",
  "              <Compass className=\"w-5 h-5 text-primary\" />\n              Leave a Marker {selectedTopicName ? `for ${selectedTopicName}` : ''}\n            </DialogTitle>"
);

fs.writeFileSync('artifacts/study-tracker/src/features/subjects/SystemCard.tsx', code);
console.log('SystemCard.tsx ui patched');
