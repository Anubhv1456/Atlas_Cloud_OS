const fs = require('fs');
let code = fs.readFileSync('artifacts/study-tracker/src/features/timeline/Timeline.tsx', 'utf8');

code = code.replace(
  "import { ChevronLeft, ChevronRight, BookOpen, Layers, CalendarDays, Clock, AlertCircle, CheckCircle2, Sparkles, Filter, Activity, TrendingUp, Flame, RotateCcw } from 'lucide-react';",
  "import { ChevronLeft, ChevronRight, BookOpen, Layers, CalendarDays, Clock, AlertCircle, CheckCircle2, Sparkles, Filter, Activity, TrendingUp, Flame, RotateCcw, AlertTriangle } from 'lucide-react';"
);

fs.writeFileSync('artifacts/study-tracker/src/features/timeline/Timeline.tsx', code);
console.log('Timeline.tsx patched');
