const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/subjects/TopicList.tsx', 'utf8');

code = code.replace(
  "  systemName: string;\n}",
  "  systemName: string;\n  onViewMarkers?: (topicId: string, topicName: string) => void;\n  onLeaveMarker?: (topicId: string, topicName: string) => void;\n}"
);

code = code.replace(
  "export function TopicList({ topics, subjectId, systemId, subjectName, systemName }: TopicListProps) {",
  "export function TopicList({ topics, subjectId, systemId, subjectName, systemName, onViewMarkers, onLeaveMarker }: TopicListProps) {"
);

const importRegex = /import \{[\s\S]*?\} from 'lucide-react';/;
code = code.replace(importRegex, match => {
  if (!match.includes('MessageSquarePlus')) {
    match = match.replace('CheckCircle2,', 'CheckCircle2, MessageSquarePlus, MessageCircle,');
  }
  return match;
});

const markerButtons = `
              {/* Markers */}
              <div className="flex items-center gap-1 border-l border-border/50 pl-1.5 ml-0.5">
                <button 
                  onClick={() => onViewMarkers?.(topic.id, topic.name)}
                  className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/10"
                  title="View Markers"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => onLeaveMarker?.(topic.id, topic.name)}
                  className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/10"
                  title="Leave Marker"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                </button>
              </div>
`;

code = code.replace(
  "              {/* Weak Marker Toggle */}",
  markerButtons + "\n              {/* Weak Marker Toggle */}"
);

fs.writeFileSync('artifacts/study-tracker/src/features/subjects/TopicList.tsx', code);
console.log('TopicList props patched');
