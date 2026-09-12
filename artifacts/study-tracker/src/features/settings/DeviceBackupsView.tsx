import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Trash2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { localDb } from '@/db/localDb';
import { syncEngine } from '@/db/syncEngine';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SettingsSection, SettingsRow } from './SettingsLayout';

export function DeviceBackupsView({ onBack }: { onBack: () => void }) {
  const [autoBackups, setAutoBackups] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Default to true unless explicitly 'false' in localStorage
  useEffect(() => {
    const val = localStorage.getItem('auto_backups_enabled');
    setAutoBackups(val !== 'false');
  }, []);

  const handleToggleAutoBackups = (checked: boolean) => {
    setAutoBackups(checked);
    localStorage.setItem('auto_backups_enabled', checked ? 'true' : 'false');
    if (checked) {
      toast.success('Automatic device backups enabled');
    } else {
      toast('Automatic device backups paused');
    }
  };

  const snapshots = useLiveQuery(() => localDb.local_snapshots.orderBy('timestamp').reverse().toArray(), []) || [];

  const handleSaveCopyNow = async () => {
    setLoadingAction('save');
    try {
      await syncEngine.captureLocalSnapshot();
      toast.success('Backup copy saved successfully');
    } catch (e: any) {
      toast.error('Failed to save backup: ' + e.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await localDb.local_snapshots.delete(id);
      toast.success('Backup deleted');
    } catch (e: any) {
      toast.error('Failed to delete backup');
    }
  };

  const handleRestore = async (id: number, payload: string) => {
    if (!window.confirm('Are you sure you want to restore this backup? Your current local data will be replaced.')) {
      return;
    }
    
    setLoadingAction(`restore-${id}`);
    const toastId = toast.loading('Rewinding time...');
    
    try {
      const parsed = JSON.parse(payload);
      
      const tablesToRestore = [
        'subjects', 'systems', 'history', 'pyqYears', 'scoreLogs',
        'uiPreferences', 'topicProgress', 'curriculumSets', 'revisionSets',
        'mistakeLogs', 'recommendationSkips', 'operationalModes'
      ];

      const tables = tablesToRestore.map(name => (localDb as any)[name]).filter(Boolean);
      
      await localDb.transaction('rw', tables, async () => {
        // Clear all target tables
        for (const table of tables) {
          await table.clear();
        }
        
        // Bulk add data from snapshot
        for (const tableName of tablesToRestore) {
          const tableData = parsed[tableName];
          if (tableData && tableData.length > 0) {
            const table = (localDb as any)[tableName];
            if (table) {
              await table.bulkAdd(tableData);
            }
          }
        }
      });
      
      toast.success('Backup restored successfully!', { id: toastId });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to restore backup: ' + e.message, { id: toastId });
    } finally {
      setLoadingAction(null);
    }
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    
    const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear();
    
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) return `Today • ${timeStr}`;
    if (isYesterday) return `Yesterday • ${timeStr}`;
    
    return `${d.toLocaleDateString([], { day: 'numeric', month: 'short' })} • ${timeStr}`;
  };

  const parseMetadata = (payload: string) => {
    try {
      const parsed = JSON.parse(payload);
      const subjects = parsed.subjects?.length || 0;
      const topics = parsed.topicProgress?.length || 0;
      const scores = parsed.scoreLogs?.length || 0;
      
      const parts = [];
      if (subjects > 0) parts.push(`${subjects} subject${subjects === 1 ? '' : 's'}`);
      if (topics > 0) parts.push(`${topics} topic${topics === 1 ? '' : 's'}`);
      if (scores > 0) parts.push(`${scores} test score${scores === 1 ? '' : 's'}`);
      
      return parts.length > 0 ? parts.join(' • ') : 'Empty backup';
    } catch {
      return 'Corrupt or unreadable backup';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between border-b border-border/40 shrink-0 mt-2">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="h-8 px-2 text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h2 className="text-sm font-bold tracking-tight text-foreground">Device Backups</h2>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-1 rounded-full text-[10px] font-semibold mr-6">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Active Safeguard</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-card">
        <SettingsSection className="!space-y-0 !rounded-xl !bg-card !border-none !shadow-none !overflow-hidden">
          <SettingsRow
            icon={Sparkles}
            iconBg="bg-teal-900/40 text-teal-400"
            label={<span className="text-sm font-bold text-foreground">Automatic Daily Copies</span>}
            sublabel={<span className="text-xs text-muted-foreground">Saves automatic backup copies on your device twice a day</span>}
            control={<Switch checked={autoBackups} onCheckedChange={handleToggleAutoBackups} />}
            className="py-4 bg-transparent hover:bg-transparent px-2"
            chevron={false}
          />
          <SettingsRow
            icon={RefreshCw}
            iconBg="bg-teal-900/40 text-teal-400"
            label={<span className="text-sm font-bold text-foreground">Save Backup Copy Now</span>}
            sublabel={<span className="text-xs text-muted-foreground">Save an immediate backup copy of your current progress</span>}
            control={
              <Button 
                variant="ghost" 
                size="sm"
                className="text-sm font-bold hover:bg-muted text-foreground cursor-pointer"
                onClick={handleSaveCopyNow}
                disabled={loadingAction === 'save'}
              >
                Save Copy
              </Button>
            }
            isLast
            className="py-4 bg-transparent hover:bg-transparent px-2"
            chevron={false}
          />
        </SettingsSection>

        <div>
          <h3 className="text-sm font-bold text-foreground mb-3 px-1">Saved Device Copies ({snapshots.length}/5)</h3>
          <div className="space-y-2.5">
            {snapshots.length === 0 && (
              <div className="text-center p-6 text-sm text-muted-foreground border border-border/40 rounded-xl bg-card">
                No backup copies saved yet.
              </div>
            )}
            {snapshots.map((snap) => (
              <div key={snap.id} className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/60 shadow-sm">
                <div className="min-w-0">
                  <div className="text-[15px] font-medium text-foreground font-mono tracking-tight">{formatDate(snap.timestamp)}</div>
                  <div className="text-[13px] text-muted-foreground mt-1 truncate">{parseMetadata(snap.payload)}</div>
                </div>
                <div className="flex items-center gap-2 pl-3 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(snap.id!, snap.payload)}
                    disabled={loadingAction !== null}
                    className="h-8 rounded-full border-border/60 bg-transparent text-foreground hover:bg-muted cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", loadingAction === `restore-${snap.id}` && "animate-spin")} />
                    Restore
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleDelete(snap.id!)}
                    disabled={loadingAction !== null}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
