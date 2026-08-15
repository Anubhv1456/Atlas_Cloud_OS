import React, { useState, useRef } from 'react';
import { Database, Download, Upload, FileSpreadsheet, HardDrive, ShieldCheck, Sparkles, AlertTriangle } from 'lucide-react';
import { db } from '@/db/schema';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { useAuth } from '@/hooks/useAuth';
import { createSignedVaultBackup, verifyVaultBackupProvenance } from '@/lib/vaultSignature';
import { firestoreDb } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export function DataVaultSection() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingAction, setLoadingAction] = useState<'export-json' | 'import-json' | 'export-csv' | null>(null);

  // Live Storage Telemetry Query
  const subjects = useLiveQuery(() => db.subjects.toArray(), []);
  const systems = useLiveQuery(() => db.systems.toArray(), []);
  const scoreLogs = useLiveQuery(() => db.scoreLogs.toArray(), []);
  const history = useLiveQuery(() => db.history.toArray(), []);

  const subjectCount = subjects?.length ?? 0;
  const systemCount = systems?.length ?? 0;
  const scoreCount = scoreLogs?.length ?? 0;
  const historyCount = history?.length ?? 0;

  // JSON Export Handler with Cryptographic Provenance Stamping
  const handleExportJSON = async () => {
    try {
      setLoadingAction('export-json');
      const rawData = {
        subjects: await db.subjects.toArray(),
        systems: await db.systems.toArray(),
        history: await db.history.toArray(),
        pyqYears: await db.pyqYears.toArray(),
        scoreLogs: await db.scoreLogs.toArray(),
        uiPreferences: await db.uiPreferences.toArray(),
        topicProgress: await db.topicProgress.toArray()
      };

      // Wrap in Cryptographic Atlas Vault Envelope
      const signedEnvelope = await createSignedVaultBackup(rawData, user);

      const blob = new Blob([JSON.stringify(signedEnvelope, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atlas-data-vault-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Signed Data Vault backup created successfully.', {
        description: 'Stamped with origin cryptographic provenance.'
      });
    } catch (e) {
      console.error(e);
      toast.error('Failed to create backup file.');
    } finally {
      setLoadingAction(null);
    }
  };

  // JSON Import Handler with Anti-Sybil & Account-Hopping Interceptor
  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoadingAction('import-json');
      const text = await file.text();
      const parsed = JSON.parse(text);

      // Verify Provenance & Historical Volume
      const result = await verifyVaultBackupProvenance(parsed, user?.uid || null);
      const data = result.payload;

      if (data.subjects || data.systems || data.history) {
        // 1. Restore all local Dexie data safely (Zero Data Loss)
        await db.transaction('rw', [db.subjects, db.systems, db.history, db.pyqYears, db.scoreLogs, db.uiPreferences, db.topicProgress], async () => {
          if (data.subjects) await db.subjects.bulkPut(data.subjects);
          if (data.systems) await db.systems.bulkPut(data.systems);
          if (data.history) await db.history.bulkPut(data.history);
          if (data.pyqYears) await db.pyqYears.bulkPut(data.pyqYears);
          if (data.scoreLogs) await db.scoreLogs.bulkPut(data.scoreLogs);
          if (data.uiPreferences) await db.uiPreferences.bulkPut(data.uiPreferences);
          if (data.topicProgress) await db.topicProgress.bulkPut(data.topicProgress);
        });

        // 2. Intercept Account-Hopping Trial Reset
        if (result.isForeignUid && result.isHighHistoricalVolume) {
          if (user && firestoreDb) {
            const userRef = doc(firestoreDb, 'users', user.uid);
            await setDoc(userRef, {
              vaultActivationRequired: true,
              vaultImportProvenance: {
                foreignOriginUid: result.originUid,
                foreignOriginEmail: result.originEmail || 'unlisted',
                exportTimestamp: result.exportTimestamp,
                metrics: result.metrics,
                importedAt: new Date()
              },
              betaAccess: false,
              updatedAt: new Date()
            }, { merge: true });

            localStorage.removeItem(`beta_access_${user.uid}`);
            localStorage.removeItem(`beta_access_expiry_${user.uid}`);
          }

          toast.warning('Study Vault Restored · Pass Activation Required', {
            description: `Imported ${result.metrics.totalStudyMinutes}m of previous study history. Please activate your Atlas Pass to continue your revision streak with this high-volume vault.`,
            duration: 8000
          });
        } else {
          toast.success('Data Vault restored successfully.', { 
            description: `Restored ${result.metrics.subjectCount || data.subjects?.length || 0} subjects and study logs.` 
          });
        }
      } else {
        toast.error('Invalid backup file structure.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to import backup file.');
    } finally {
      setLoadingAction(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // CSV Progress Export Handler
  const handleExportCSV = async () => {
    try {
      setLoadingAction('export-csv');
      const subs = await db.subjects.toArray();
      const syss = await db.systems.toArray();

      let csvContent = "Subject,System,Status,Order\n";
      syss.forEach(sys => {
        const sub = subs.find(s => s.id === sys.subjectId);
        const subName = sub ? sub.name : 'Unknown';
        csvContent += `"${subName}","${sys.name}","${sys.status || 'Not Started'}","${sys.order || 0}"\n`;
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
              Data Vault & Local Telemetry
            </h3>
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
              <HardDrive className="w-3 h-3 text-emerald-500" />
              <span>IndexedDB Persistence Active</span>
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
          <span className="font-medium">
            <strong className="text-foreground font-bold">{scoreCount}</strong> Scores
          </span>
          <span>•</span>
          <span className="font-medium">
            <strong className="text-foreground font-bold">{historyCount}</strong> Logs
          </span>
        </div>
      </div>

      {/* Action Buttons Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
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
          onClick={handleExportCSV}
          disabled={loadingAction !== null}
          className="p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/50 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold text-foreground shadow-xs disabled:opacity-50"
        >
          {loadingAction === 'export-csv' ? (
            <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
          )}
          <span>Export CSV</span>
        </button>
      </div>
    </div>
  );
}
