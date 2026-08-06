import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Cloud, ChevronDown, ChevronUp, UploadCloud, DownloadCloud, Activity } from 'lucide-react';
import { syncToFirebase, syncFromFirebase } from '@/lib/firebaseSync';
import { toast } from 'sonner';

export function FirebaseSyncSection() {
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const time = localStorage.getItem('lastCloudSync');
    if (time) {
      setLastSync(new Date(parseInt(time)).toLocaleString());
    }
    
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
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Cloud className="w-3.5 h-3.5 text-emerald-400" />
          Cloud Status
        </h2>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground flex items-center gap-2">
                Synced
              </div>
              <div className="text-[11px] text-muted-foreground">
                {lastSync ? `Last synced ${lastSync}` : 'Automatic background sync active'}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs font-semibold h-8 px-2.5 rounded-xl text-muted-foreground hover:text-foreground gap-1"
          >
            Details
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
        </div>

        {showDetails && (
          <div className="pt-3 border-t border-border/50 space-y-3 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="p-3 bg-muted/20 rounded-xl space-y-1.5 border border-border/40">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Background Synchronization Engine
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Your study progress, bookmarks, and logs are continuously synced to cloud storage. No manual intervention required.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleUpload}
                disabled={loading}
                className="flex-1 rounded-xl h-9 text-xs border-border/60 text-muted-foreground hover:text-foreground"
              >
                <UploadCloud className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Force Sync
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload}
                disabled={loading}
                className="flex-1 rounded-xl h-9 text-xs border-border/60 text-muted-foreground hover:text-foreground"
              >
                <DownloadCloud className="w-3.5 h-3.5 mr-1.5 text-sky-400" />
                Force Restore
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

