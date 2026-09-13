const fs = require('fs');
const file = 'artifacts/study-tracker/src/features/settings/DataVaultSection.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove duplicate imports & variables
code = code.replace(/import \{ findDuplicateSubjectGroups, mergeAndDeduplicateAllSubjects, DuplicateSubjectGroup \} from '@\/lib\/subjectDeduplication';\n/, '');
code = code.replace(/const \[duplicateGroups, setDuplicateGroups\] = useState<DuplicateSubjectGroup\[\]>\(\[\]\);\n/, '');

// 2. Remove duplicate finding useEffect
const effectRegex = /useEffect\(\(\) => \{[\s\S]*?findDuplicateSubjectGroups\(\)\.then\(groups => \{[\s\S]*?\}\);\s*\}, \[\]\);\n/g;
code = code.replace(effectRegex, '');

// 3. Remove handleMergeAllDuplicates function
const mergeFuncRegex = /const handleMergeAllDuplicates = async \(\) => \{[\s\S]*?finally \{\s*setLoadingAction\(null\);\s*\}\s*\};\n/g;
code = code.replace(mergeFuncRegex, '');

// 4. Remove handleRepairSchedules function
const repairFuncRegex = /const handleRepairSchedules = async \(\) => \{[\s\S]*?setDiagnosticOpen\(true\);\s*\};\n/g;
code = code.replace(repairFuncRegex, '');

// 5. Remove handleSyncOntology function
const syncFuncRegex = /const handleSyncOntology = async \(\) => \{[\s\S]*?finally \{\s*setLoadingAction\(null\);\s*\}\s*\};\n/g;
code = code.replace(syncFuncRegex, '');
code = code.replace(/import \{ loadUniversalOntology \} from '@\/lib\/exam-presets';\n/, '');

// 6. Remove the UI banner block for duplicates
const bannerRegex = /\{\s*duplicateGroups\.length > 0 && \([\s\S]*?<\/Button>\s*<\/div>\s*\)\s*\}/g;
code = code.replace(bannerRegex, '');

// 7. Update the UI Grid. Remove Rehydrate Schedules, Export CSV, Sync Blueprint. Add System Diagnostics at top.
const gridRegex = /<div className="grid grid-cols-2 gap-2\.5">[\s\S]*?<\/div>\s*<\/div>/g;

const newGrid = `<div className="grid grid-cols-1 gap-2.5 mb-2.5">
              <button
                type="button"
                onClick={() => setDiagnosticOpen(true)}
                disabled={loadingAction !== null}
                className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 group"
              >
                <div className="p-2 rounded-full bg-rose-500/20 text-rose-500 group-hover:scale-110 transition-transform">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-rose-600 dark:text-rose-400">System Diagnostics</div>
                  <div className="text-xs text-rose-600/70 dark:text-rose-400/70">Scan and repair data anomalies</div>
                </div>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleExportJSON}
                disabled={loadingAction !== null}
                className="p-3 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Backup JSON</span>
                <span className="text-xs text-muted-foreground">Export encrypted vault</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loadingAction !== null}
                className="p-3 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-4 h-4 text-zinc-300" />
                <span className="text-xs font-semibold text-foreground">Restore JSON</span>
                <span className="text-xs text-muted-foreground">Import vault backup</span>
              </button>
            </div>
          </div>`;

code = code.replace(gridRegex, newGrid);

// 8. Remove FileSpreadsheet, RefreshCw, BookOpen, Merge from lucide imports
code = code.replace(/FileSpreadsheet,\s*/, '');
code = code.replace(/RefreshCw,\s*/, '');
code = code.replace(/BookOpen,\s*/, '');
code = code.replace(/Merge,\s*/, '');

fs.writeFileSync(file, code);
console.log("Patched DataVaultSection.tsx");
