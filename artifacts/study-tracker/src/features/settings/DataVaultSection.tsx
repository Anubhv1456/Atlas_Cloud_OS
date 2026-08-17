import React, { useState, useRef, useEffect } from 'react';
import { Database, Download, Upload, FileSpreadsheet, HardDrive, Sparkles, RefreshCw, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '@/db/schema';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { useAuth } from '@/hooks/useAuth';
import { exportCompleteVault, restoreCompleteVault, repairAndRehydrateRevisionDates } from '@/lib/vaultSync';
import { toast } from 'sonner';

export function DataVaultSection() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingAction, setLoadingAction] = useState<'export-json' | 'import-json' | 'export-csv' | 'repair-schedules' | null>(null);

  // Live Storage Telemetry Query
  const subjects = useLiveQuery(() => db.subjects.toArray(), []);
  const systems = useLiveQuery(() => db.systems.toArray(), []);
  const curriculumSets = useLiveQuery(() => db.curriculumSets.toArray(), []);
  const scoreLogs = useLiveQuery(() => db.scoreLogs.toArray(), []);
  const history = useLiveQuery(() => db.history.toArray(), []);

  const subjectCount = subjects?.length ?? 0;
  const systemCount = systems?.length ?? 0;
  const setsCount = curriculumSets?.filter(s => !s.deletedAt).length ?? 0;
  const scoreCount = scoreLogs?.length ?? 0;
  const historyCount = history?.length ?? 0;

  // Detect if revision schedules might be out-of-sync or missing
  const completedSystemsCount = systems?.filter(s => !s.deletedAt && (s.contentCompleted || s.qbankDone || s.status === 'Strong' || s.status === 'Weak')).length ?? 0;
  const activeSchedulesCount = (curriculumSets?.filter(s => !s.deletedAt && s.nextRevisionDate).length ?? 0) + (systems?.filter(s => !s.deletedAt && s.nextRevisionDate).length ?? 0);
  const hasPotentialScheduleGap = completedSystemsCount > 0 && activeSchedulesCount === 0;

  // JSON Export Handler with Cryptographic Provenance Stamping
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

      toast.success('Complete Data Vault backup created successfully.', {
        description: 'Includes all study blocks, revision intervals, schedules, and mistake logs.'
      });
    } catch (e) {
      console.error(e);
      toast.error('Failed to create backup file.');
    } finally {
      setLoadingAction(null);
    }
  };

  // JSON Import Handler with Complete Schema Rehydration
  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoadingAction('import-json');
      const text = await file.text();
      const result = await restoreCompleteVault(text, user);

      if (result.success) {
        toast.success('Data Vault restored successfully.', { 
          description: result.message 
        });
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to import backup file.', {
        description: e?.message || 'Invalid or unreadable backup structure.'
      });
    } finally {
      setLoadingAction(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Revision Schedule Repair & Rehydration Tool
  const handleRepairSchedules = async () => {
    try {
      setLoadingAction('repair-schedules');
      const res = await repairAndRehydrateRevisionDates();
      if (res.repairedCount > 0 || res.repairedSetsCount > 0) {
        toast.success('Revision Schedules Rehydrated!', {
          description: res.message
        });
      } else {
        toast.info('Schedules Already Synchronized', {
          description: res.message
        });
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to repair revision schedules.');
    } finally {
      setLoadingAction(null);
    }
  };

  // CSV Progress Export Handler
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
      a.download = `atlas-curriculum-progress-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Spreadsheet exported successfully.');
    } catch (e) {
      console.error(e);
      toast.error('Failed to export CSV data.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Hidden File Input */}
      <input
        type="file"
        accept=".json"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImportJSON}
      />

      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-500 border border-teal-500/20">
            <Database className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Data Vault & Spaced Recall Telemetry
            </h3>
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
              <HardDrive className="w-3 h-3 text-emerald-500" />
              <span>Full IndexedDB & Revision Persistence Active</span>
            </p>
          </div>
        </div>

        <div className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
          Sync Ready
        </div>
      </div>

      {/* Storage Telemetry Banner */}
      <div className="bg-muted/30 border border-border/50 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-muted-foreground flex-wrap">
          <span className="font-medium">
            <strong className="text-foreground font-bold">{subjectCount}</strong> Subjects
          </span>
          <span>•</span>
          <span className="font-medium">
            <strong className="text-foreground font-bold">{systemCount}</strong> Systems
          </span>
          <span>•</span>
          <span className="font-medium flex items-center gap-1 text-teal-600 dark:text-teal-400">
            <Layers className="w-3 h-3" />
            <strong className="font-bold">{setsCount}</strong> Study Blocks
          </span>
          <span>•</span>
          <span className="font-medium">
            <strong className="text-foreground font-bold">{scoreCount}</strong> Scores
          </span>
          <span>•</span>
          <span className="font-medium">
            <strong className="text-foreground font-bold">{historyCount}</strong> Logs
          </span>
        </div>
      </div>

      {/* Revision Schedule Recovery Advisory Banner */}
      {hasPotentialScheduleGap && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Missing Scheduled Revision Dates Detected</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                You have completed curriculum systems whose spaced-recall schedules need rehydration from past logs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRepairSchedules}
            disabled={loadingAction !== null}
            className="px-2.5 py-1 rounded-lg bg-amber-500 text-amber-950 font-bold text-[11px] hover:bg-amber-400 transition-colors shrink-0 cursor-pointer"
          >
            Rehydrate Now
          </button>
        </div>
      )}

      {/* Action Buttons Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleExportJSON}
          disabled={loadingAction !== null}
          className="p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/50 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold text-foreground shadow-xs disabled:opacity-50"
        >
          {loadingAction === 'export-json' ? (
            <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5 text-primary" />
          )}
          <span>Backup JSON</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loadingAction !== null}
          className="p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/50 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold text-foreground shadow-xs disabled:opacity-50"
        >
          {loadingAction === 'import-json' ? (
            <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5 text-teal-500" />
          )}
          <span>Restore JSON</span>
        </button>

        <button
          type="button"
          onClick={handleRepairSchedules}
          disabled={loadingAction !== null}
          className="p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/50 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold text-foreground shadow-xs disabled:opacity-50"
        >
          {loadingAction === 'repair-schedules' ? (
            <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
          )}
          <span>Rehydrate Dates</span>
        </button>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={loadingAction !== null}
          className="p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/50 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold text-foreground shadow-xs disabled:opacity-50"
        >
          {loadingAction === 'export-csv' ? (
            <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
          )}
          <span>Export CSV</span>
        </button>
      </div>
    </div>
  );
}
