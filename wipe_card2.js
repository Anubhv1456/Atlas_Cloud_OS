const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/subjects/SubjectCard.tsx', 'utf8');

const regex = /^[\s\S]*?(export function SubjectCard)/;
const imports = `import { Link } from 'wouter';
import { ChevronRight, MoreVertical, PencilLine, Trash2 } from 'lucide-react';
import { Subject, StudySystem, db } from '@/db';
import { ALL_SYSTEMS } from '@/data/ontology';
import { useLiveQuery } from 'dexie-react-hooks';
import { calculateCompletedTopicTasks, calculateTopicsProgressPercentage } from '@/lib/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';

interface SubjectCardProps {
  subject: Subject;
  systems: StudySystem[];
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  onDelete?: (subject: Subject) => void;
  onRename?: (subject: Subject) => void;
}

`;

code = code.replace(regex, imports + "$1");
fs.writeFileSync('artifacts/study-tracker/src/features/subjects/SubjectCard.tsx', code);
