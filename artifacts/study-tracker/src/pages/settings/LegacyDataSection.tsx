import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Database } from 'lucide-react';
import { db } from '@/db/schema';
import { toast } from 'sonner';
import { syncToFirebase } from '@/lib/firebaseSync';

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
        await db.transaction('rw', db.subjects, db.systems, db.history, db.pyqYears, db.scoreLogs, db.uiPreferences, async () => {
          if (data.subjects) await db.subjects.bulkPut(data.subjects);
          if (data.systems) await db.systems.bulkPut(data.systems);
          if (data.history) await db.history.bulkPut(data.history);
          if (data.pyqYears) await db.pyqYears.bulkPut(data.pyqYears);
          if (data.scoreLogs) await db.scoreLogs.bulkPut(data.scoreLogs);
          if (data.uiPreferences) await db.uiPreferences.bulkPut(data.uiPreferences);
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
    <section>
      <div className="flex items-center justify-between mb-3 px-1 mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legacy Data</h2>
      </div>
      <div className="bg-card rounded-2xl border shadow-sm p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500 mt-0.5">
            <Database className="w-4 h-4" />
          </div>
          <div className="text-xs flex-1">
            <div className="font-semibold text-foreground">Import Previous Data</div>
            <div className="text-muted-foreground mt-0.5 mb-3">
              Restore a manual backup JSON file from a previous version of the app. This will be automatically synced to Firebase.
            </div>
            
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImport}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <Upload className="w-4 h-4 mr-2" />
              {loading ? 'Importing & Syncing...' : 'Upload JSON Backup'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
