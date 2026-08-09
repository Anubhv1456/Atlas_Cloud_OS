const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/subjects/SystemCard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update destructuring
content = content.replace(
  "handleStatusChange, handleNotesChange, handleDelete, handleDeleteConfirm,",
  "localNotes, handleStatusChange, handleNotesChange, handleDelete, handleDeleteConfirm,"
);

// Update value={system.weakAreas} to value={localNotes}
content = content.replace(
  "<Textarea value={system.weakAreas} onChange={handleNotesChange}",
  "<Textarea value={localNotes} onChange={handleNotesChange}"
);

// Fix Contrast Ratios
// Currently:
// statusColors: Record<SystemStatus, string> = {
//   Strong:  'bg-muted/30 text-[hsl(var(--gold))] border-[hsl(var(--gold))]/50',
//   Average: 'bg-muted/50 text-muted-foreground border-transparent',
//   Weak:    'bg-muted/30 text-destructive border-destructive/50',
// };
// Update to standard text colors for better contrast
content = content.replace(
  "Strong:  'bg-muted/30 text-[hsl(var(--gold))] border-[hsl(var(--gold))]/50',",
  "Strong:  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',"
);
content = content.replace(
  "Average: 'bg-muted/50 text-muted-foreground border-transparent',",
  "Average: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',"
);
content = content.replace(
  "Weak:    'bg-muted/30 text-destructive border-destructive/50',",
  "Weak:    'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',"
);

// Fix Due Date banner contrast
// Searching for bg-destructive/10 text-destructive border-destructive/20 etc
// The user noted: "Update status and due date banner text colors to pass WCAG AA contrast standards."
// text-destructive in light mode is red-500 usually, which might not be accessible. 
// dark:text-red-400 / dark:text-rose-400 or use standard classes text-destructive
content = content.replace(
  "bg-destructive/10 text-destructive border-destructive/20",
  "bg-destructive/10 text-red-600 dark:text-red-400 border-destructive/20"
);
content = content.replace(
  "bg-amber-500/10 text-amber-500 border-amber-500/20",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
);

// Add Header Progress Line
// Add a mini progress bar line to collapsed System Cards for instant visual progress telemetry.
// Let's add it right below the header when it's collapsed.
// <div className={cn("p-4 transition-colors flex items-center justify-between gap-3 group/header"...

// Wait, the progress is calculated as:
// const progress = calculateSystemProgress(system.id!); // inside useSystemCardLogic
// We have `contentPct` which is already returned by the hook (const contentPct = progress.contentPercentage;)

const headerDivOpen = `<div className={cn("p-4 transition-colors flex items-center justify-between gap-3 group/header", 
            isExpanded ? "bg-muted/30" : "hover:bg-muted/30")}
          onClick={() => setIsExpanded(!isExpanded)}>`;

const progressLine = `          {/* Header Progress Line */}
          {!isExpanded && (
            <div className="absolute bottom-0 left-0 h-[2px] bg-primary/20" style={{ width: '100%' }}>
              <div className="h-full bg-primary transition-all duration-500" style={{ width: \`\${contentPct}%\` }} />
            </div>
          )}`;

content = content.replace(
  headerDivOpen,
  headerDivOpen.replace("onClick={() => setIsExpanded(!isExpanded)}>", "onClick={() => setIsExpanded(!isExpanded)}>\n" + progressLine)
);

// Decay Calibration Explanations
// "Add helper text explaining interval scaling (e.g. 1.5x = 33% faster reviews)."
// In the sliders section:
content = content.replace(
  `<label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Decay Calibration</label>`,
  `<div className="mb-2"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Decay Calibration</label><span className="text-[10px] text-muted-foreground/70">1.5x = 33% faster reviews, 0.8x = 20% slower</span></div>`
);

fs.writeFileSync(file, content);
console.log('SystemCard.tsx patched.');
