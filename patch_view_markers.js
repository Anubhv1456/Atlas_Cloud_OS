const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/subjects/ViewMarkersModal.tsx', 'utf8');

code = code.replace(
  "import { Marker, MarkerType, getMarkersForSystem, interactWithMarker } from '@/lib/markers';",
  "import { Marker, MarkerType, getMarkersForSystem, getMarkersForTopic, interactWithMarker } from '@/lib/markers';"
);

code = code.replace(
  "  systemId: number | string;\n  systemName: string;\n",
  "  systemId: number | string;\n  systemName: string;\n  topicId?: string;\n  topicName?: string;\n"
);

code = code.replace(
  "export function ViewMarkersModal({ isOpen, onClose, systemId, systemName, onLeaveMarker }: ViewMarkersModalProps) {",
  "export function ViewMarkersModal({ isOpen, onClose, systemId, systemName, topicId, topicName, onLeaveMarker }: ViewMarkersModalProps) {"
);

code = code.replace(
  "      getMarkersForSystem(systemId)\n        .then(setMarkers)",
  "      (topicId ? getMarkersForTopic(topicId) : getMarkersForSystem(systemId))\n        .then(setMarkers)"
);

code = code.replace(
  "            <DialogTitle className=\"text-xl font-semibold flex flex-col gap-1\">\n              <div className=\"flex items-center gap-2\">\n                <Compass className=\"w-5 h-5 text-primary\" />\n                Wayfinder Markers\n              </div>\n              <span className=\"text-sm text-muted-foreground font-normal\">{systemName}</span>\n            </DialogTitle>",
  "            <DialogTitle className=\"text-xl font-semibold flex flex-col gap-1\">\n              <div className=\"flex items-center gap-2\">\n                <Compass className=\"w-5 h-5 text-primary\" />\n                Wayfinder Markers\n              </div>\n              <span className=\"text-sm text-muted-foreground font-normal\">{topicName || systemName}</span>\n            </DialogTitle>"
);

fs.writeFileSync('artifacts/study-tracker/src/features/subjects/ViewMarkersModal.tsx', code);
console.log('ViewMarkersModal patched');
