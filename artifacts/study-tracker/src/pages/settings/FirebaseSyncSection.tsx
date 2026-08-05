import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud, DownloadCloud, Activity } from 'lucide-react';
import { syncToFirebase, syncFromFirebase } from '@/lib/firebaseSync';
import { toast } from 'sonner';

export function FirebaseSyncSection() {
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    const time = localStorage.getItem('lastCloudSync');
    if (time) {
      setLastSync(new Date(parseInt(time)).toLocaleString());
    }
    
    // Poll for updates to the last sync time to keep UI fresh
    const interval = setInterval(() => {
       const newTime = localStorage.getItem('lastCloudSync');
       if (newTime) {
         setLastSync(new Date(parseInt(newTime)).toLocaleString());
       }
    }, 10000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleUpload = async () => {
    try {
      setLoading(true);
      await syncToFirebase();
      toast.success('Successfully synced to cloud.');
    } catch (e) {
      console.error(e);
      toast.error('Failed to sync data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const success = await syncFromFirebase();
      if (success) {
        toast.success('Successfully restored data.', { description: 'Please refresh the page to see changes.'});
      } else {
        toast.info('No cloud data found.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to restore data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1 mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cloud Sync Engine</h2>
      </div>
      <div className="bg-card rounded-2xl border shadow-sm p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500 mt-0.5 animate-pulse">
            <Activity className="w-4 h-4" />
          </div>
          <div className="text-xs flex-1">
            <div className="font-semibold text-foreground">Background Sync Active</div>
            <div className="text-muted-foreground mt-0.5 mb-3">
              Your progress is automatically saved to the cloud securely in the background. No manual backups required.
              {lastSync && <div className="mt-1 font-medium text-emerald-500/80">Last synced: {lastSync}</div>}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleUpload}
                disabled={loading}
                className="flex-1 rounded-xl h-10 border-border/50 text-muted-foreground hover:text-foreground"
              >
                <UploadCloud className="w-4 h-4 mr-2" />
                Force Sync
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload}
                disabled={loading}
                className="flex-1 rounded-xl h-10 border-border/50 text-muted-foreground hover:text-foreground"
              >
                <DownloadCloud className="w-4 h-4 mr-2" />
                Force Restore
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
