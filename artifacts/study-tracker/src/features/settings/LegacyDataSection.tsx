import { useState, useRef } from 'react';
import { Upload, Database } from 'lucide-react';
import { db } from '@/db/schema';
import { toast } from 'sonner';
import { syncToFirebase } from '@/lib/firebaseSync';
import { SettingsRow } from './SettingsLayout';

export function LegacyDataSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.subjects || data.systems) {
        await db.transaction('rw', [db.subjects, db.systems, db.history, db.pyqYears, db.scoreLogs, db.uiPreferences, db.topicProgress], async () => {
          if (data.subjects) await db.subjects.bulkPut(data.subjects);
          if (data.systems) await db.systems.bulkPut(data.systems);
          if (data.history) await db.history.bulkPut(data.history);
          if (data.pyqYears) await db.pyqYears.bulkPut(data.pyqYears);
          if (data.scoreLogs) await db.scoreLogs.bulkPut(data.scoreLogs);
          if (data.uiPreferences) await db.uiPreferences.bulkPut(data.uiPreferences);
          if (data.topicProgress) await db.topicProgress.bulkPut(data.topicProgress);
        });
        
        toast.info('Syncing imported data to Firebase...');
        await syncToFirebase();
        
        toast.success('Legacy data imported and synced successfully.', { description: 'Refresh the app to see the changes.' });
      } else {
        toast.error('Invalid backup file format.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to import data.');
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
        label={loading ? 'Importing & Syncing...' : 'Restore Legacy JSON'}
        onClick={() => fileInputRef.current?.click()}
      />
    </>
  );
}
