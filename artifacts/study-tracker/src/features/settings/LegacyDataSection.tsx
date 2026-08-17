import React, { useState, useRef } from 'react';
import { Database, Download } from 'lucide-react';
import { toast } from 'sonner';
import { SettingsRow } from './SettingsLayout';
import { exportCompleteVault, restoreCompleteVault } from '@/lib/vaultSync';
import { useAuth } from '@/hooks/useAuth';

export function LegacyDataSection() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const { blob, filename } = await exportCompleteVault(user);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Complete data vault exported successfully.');
    } catch (e) {
      console.error(e);
      toast.error('Failed to export data.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const text = await file.text();
      const result = await restoreCompleteVault(text, user);

      if (result.success) {
        toast.success('Data vault imported successfully.', { 
          description: result.message 
        });
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to import backup.', {
        description: e?.message || 'Invalid backup structure.'
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input 
        type="file" 
        accept=".json" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleImport}
      />
      <SettingsRow
        icon={Database}
        label={loading ? 'Restoring & Rehydrating...' : 'Restore JSON Backup'}
        onClick={() => fileInputRef.current?.click()}
      />
      <SettingsRow
        icon={Download}
        label={loading ? "Exporting..." : "Export Complete Vault (JSON)"}
        onClick={handleExport}
      />
    </>
  );
}
