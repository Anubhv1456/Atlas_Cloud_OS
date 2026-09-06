import React, { useState, useRef, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  RefreshCw, 
  CopyPlus, 
  Merge,
  BookOpen
} from 'lucide-react';
import { db } from '@/db/schema';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { useAuth } from '@/hooks/useAuth';
import { exportCompleteVault, restoreCompleteVault, repairAndRehydrateRevisionDates } from '@/lib/vaultSync';
import { findDuplicateSubjectGroups, mergeAndDeduplicateAllSubjects, DuplicateSubjectGroup } from '@/lib/subjectDeduplication';
import { SettingsRow } from './SettingsLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useExamProfile } from '@/hooks/useExamProfile';
import { loadUniversalOntology } from '@/lib/exam-presets';
import { toast } from 'sonner';

export function DataVaultSection() {
  const { user } = useAuth();
  const { profile } = useExamProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateSubjectGroup[]>([]);

  // Live Storage Telemetry
  const subjects = useLiveQuery(() => db.subjects.toArray(), []);
  const systems = useLiveQuery(() => db.systems.toArray(), []);
  const curriculumSets = useLiveQuery(() => db.curriculumSets.toArray(), []);
  const scoreLogs = useLiveQuery(() => db.scoreLogs.toArray(), []);
  const history = useLiveQuery(() => db.history.toArray(), []);

  const subjectCount = subjects?.filter(s => !s.deletedAt)?.length ?? 0;
  const systemCount = systems?.filter(s => !s.deletedAt)?.length ?? 0;
  const setsCount = curriculumSets?.filter(s => !s.deletedAt)?.length ?? 0;
  const scoreCount = scoreLogs?.filter(s => !s.deletedAt)?.length ?? 0;
  const historyCount = history?.filter(h => !h.deletedAt)?.length ?? 0;

  useEffect(() => {
    let isMounted = true;
    findDuplicateSubjectGroups().then(groups => {
      if (isMounted) setDuplicateGroups(groups);
    }).catch(console.error);
    return () => { isMounted = false; };
  }, [subjects, systems, curriculumSets, history]);

  const handleMergeAllDuplicates = async () => {
    try {
      setLoadingAction('merge-duplicates');
      const result = await mergeAndDeduplicateAllSubjects();
      if (result.mergedSubjectsCount > 0) {
        toast.success(`Merged ${result.mergedSubjectsCount} duplicate subjects safely`);
        const fresh = await findDuplicateSubjectGroups();
        setDuplicateGroups(fresh);
      } else {
        toast.info('No duplicate subjects found');
      }
    } catch {
      toast.error('Failed to merge duplicate subjects.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportJSON = async () => {
    try {
      setLoadingAction('export-json');
      const { blob, filename } = await exportCompleteVault(user);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Backup JSON created successfully');
    } catch {
      toast.error('Failed to create backup.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoadingAction('import-json');
      const text = await file.text();
      const result = await restoreCompleteVault(text, user);
      if (result.success) {
        toast.success('Data Vault restored successfully');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to restore backup.');
    } finally {
      setLoadingAction(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRepairSchedules = async () => {
    try {
      setLoadingAction('repair-schedules');
      const res = await repairAndRehydrateRevisionDates();
      toast.success(res.message || 'Schedules synchronized');
    } catch {
      toast.error('Failed to rehydrate revision schedules.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportCSV = async () => {
    try {
      setLoadingAction('export-csv');
      const subs = await db.subjects.toArray();
      const syss = await db.systems.toArray();
      const sets = await db.curriculumSets.toArray();

      let csvContent = "Subject,System,Study Block,Status,Next Revision Date,Revision Count\n";
      syss.forEach(sys => {
        const sub = subs.find(s => s.id === sys.subjectId);
        const subName = sub ? sub.name : 'General';
        const matchingSets = sets.filter(s => s.systemId === sys.id && !s.deletedAt);

        if (matchingSets.length > 0) {
          matchingSets.forEach(set => {
            const nextDateStr = set.nextRevisionDate ? new Date(set.nextRevisionDate).toISOString().slice(0, 10) : 'None';
            csvContent += `"${subName}","${sys.name}","${set.name}","${sys.status || 'Average'}","${nextDateStr}","${set.revisionCount || 0}"\n`;
          });
        } else {
          const nextDateStr = sys.nextRevisionDate ? new Date(sys.nextRevisionDate).toISOString().slice(0, 10) : 'None';
          csvContent += `"${subName}","${sys.name}","Core","${sys.status || 'Average'}","${nextDateStr}","${sys.revisionCount || 0}"\n`;
        }
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atlas-progress-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Spreadsheet exported');
    } catch {
      toast.error('Failed to export CSV.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSyncOntology = async () => {
    try {
      setLoadingAction('sync-ontology');
      const res = await loadUniversalOntology({
        targetExam: profile.targetExam || 'USMLE Step 1',
        force: false,
        showToast: false
      });
      toast.success('Curriculum Blueprint Synchronized', {
        description: `Successfully reconciled ${res.count} subjects and organ systems.`
      });
    } catch (e) {
      toast.error('Failed to sync ontology: ' + String(e));
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      <input
        type="file"
        accept=".json"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImportJSON}
      />

      <SettingsRow
        icon={Database}
        iconBg="bg-teal-600 dark:bg-teal-500"
        label="Storage & Data Vault"
        sublabel={`${subjectCount} Subjects • ${setsCount} Blocks • ${scoreCount} Scores`}
        value="Synchronized"
        chevron
        onClick={() => setModalOpen(true)}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border/80 text-foreground rounded-3xl p-6 shadow-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Database className="w-4.5 h-4.5 text-teal-500" />
              Storage, Backup & Vault Tools
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Encrypted local storage with cloud synchronization and offline backup tools.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Telemetry Summary */}
            <div className="p-3.5 bg-muted/20 border border-border/60 rounded-2xl flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
              <span><strong>{subjectCount}</strong> Subjects</span>
              <span>•</span>
              <span><strong>{systemCount}</strong> Systems</span>
              <span>•</span>
              <span><strong>{setsCount}</strong> Study Blocks</span>
              <span>•</span>
              <span><strong>{historyCount}</strong> Study Logs</span>
            </div>

            {/* Duplicates Advisory */}
            {duplicateGroups.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-primary">
                  <CopyPlus className="w-4 h-4 shrink-0" />
                  <span>{duplicateGroups.length} duplicate subject group(s) detected</span>
                </div>
                <Button
                  size="sm"
                  onClick={handleMergeAllDuplicates}
                  disabled={loadingAction !== null}
                  className="h-7 text-xs px-2.5 rounded-lg"
                >
                  <Merge className="w-3 h-3 mr-1" />
                  Consolidate
                </Button>
              </div>
            )}

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleExportJSON}
                disabled={loadingAction !== null}
                className="p-3 rounded-2xl border border-border/60 bg-card hover:bg-muted/30 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Backup JSON</span>
                <span className="text-xs text-muted-foreground">Export encrypted vault</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loadingAction !== null}
                className="p-3 rounded-2xl border border-border/60 bg-card hover:bg-muted/30 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-4 h-4 text-teal-500" />
                <span className="text-xs font-semibold text-foreground">Restore JSON</span>
                <span className="text-xs text-muted-foreground">Import vault backup</span>
              </button>

              <button
                type="button"
                onClick={handleRepairSchedules}
                disabled={loadingAction !== null}
                className="p-3 rounded-2xl border border-border/60 bg-card hover:bg-muted/30 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-foreground">Rehydrate Schedules</span>
                <span className="text-xs text-muted-foreground">Sync revision dates</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                disabled={loadingAction !== null}
                className="p-3 rounded-2xl border border-border/60 bg-card hover:bg-muted/30 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold text-foreground">Export CSV</span>
                <span className="text-xs text-muted-foreground">Spreadsheet table</span>
              </button>

              <button
                type="button"
                onClick={handleSyncOntology}
                disabled={loadingAction !== null}
                className="p-3 rounded-2xl border border-border/60 bg-card hover:bg-muted/30 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer disabled:opacity-50 col-span-2 sm:col-span-1"
              >
                <BookOpen className="w-4 h-4 text-teal-500" />
                <span className="text-xs font-semibold text-foreground">Sync Blueprint</span>
                <span className="text-xs text-muted-foreground">Update medical ontology</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
