const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/subjects/SubjectDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

const missingImports = `import { ProgressBar } from '@/components/ProgressBar';
import { useState, useMemo } from 'react';
import { useParams, Link, useLocation, useSearch } from 'wouter';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  useSubject, useSystemsBySubject, usePYQsBySubject, useScoreLogsBySubject,
  addSystem, updateSubject, deleteSubject, updateSystemsOrder,
  addPYQYear, addPYQYearBatch, updatePYQYear, deletePYQYear, togglePYQYear,
} from '@/db';
import { SystemCard } from '@/features/subjects/SystemCard';
import { EmptyStateGraphic } from '@/components/EmptyStateGraphic';
import { AddDialog } from '@/components/AddDialog';
import { PYQYear } from '@/db';
import { ScoreLogModal } from '@/features/analytics/ScoreLogModal';
`;

content = missingImports + content;

fs.writeFileSync(file, content);
