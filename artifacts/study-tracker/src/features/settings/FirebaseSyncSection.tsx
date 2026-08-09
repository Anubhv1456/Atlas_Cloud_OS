import { useState, useEffect } from 'react';
import { Cloud, UploadCloud, DownloadCloud } from 'lucide-react';
import { syncToFirebase, syncFromFirebase } from '@/lib/firebaseSync';
import { toast } from 'sonner';
import { SettingsRow } from './SettingsLayout';

export function FirebaseSyncSection() {
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const time = localStorage.getItem('lastCloudSync');
      if (time) {
        const diff = Date.now() - parseInt(time);
        if (diff < 60000) {
          setLastSync('Synced just now');
        } else {
          setLastSync(`Synced ${new Date(parseInt(time)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        }
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleUpload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoading(true);
      await syncToFirebase();
      localStorage.setItem('lastCloudSync', Date.now().toString());
      toast.success('Successfully synced to cloud.');
    } catch (e) {
      console.error(e);
      toast.error('Failed to sync data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoading(true);
      const success = await syncFromFirebase();
      if (success) {
        localStorage.setItem('lastCloudSync', Date.now().toString());
        toast.success('Successfully restored data.', { description: 'Please refresh the page to see changes.'});
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.info('No new cloud data found.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to restore data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsRow
      icon={Cloud}
      label="Cloud Sync"
      value={loading ? 'Syncing...' : lastSync || 'Not synced'}
      control={
        <div className="flex items-center gap-2">
          <button onClick={handleDownload} className="p-2 hover:bg-muted rounded-full transition-colors" title="Download from Cloud">
            <DownloadCloud className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={handleUpload} className="p-2 hover:bg-muted rounded-full transition-colors" title="Upload to Cloud">
            <UploadCloud className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      }
    />
  );
}
