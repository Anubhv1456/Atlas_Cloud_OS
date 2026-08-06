import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { db } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { firestoreDb } from '@/lib/firebase';
import { doc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { Cloud, Loader2, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Migration() {
  const { user, clearFreshLogin } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasLocalData, setHasLocalData] = useState(false);
  const [hasCloudData, setHasCloudData] = useState(false);

  const finishAndNavigate = () => {
    if (user) {
      sessionStorage.setItem(`migration_checked_${user.uid}`, 'true');
    }
    clearFreshLogin();
    setLocation('/');
  };

  useEffect(() => {
    async function checkData() {
      if (!user) return;
      
      const subjectsCount = await db.subjects.count();
      const systemsCount = await db.systems.count();
      
      const localExists = subjectsCount > 0 || systemsCount > 0;
      setHasLocalData(localExists);

      try {
        const cloudSubjects = await getDocs(collection(firestoreDb, `users/${user.uid}/subjects`));
        const cloudExists = !cloudSubjects.empty;
        setHasCloudData(cloudExists);

        if (!localExists && !cloudExists) {
          finishAndNavigate();
        } else if (!localExists && cloudExists) {
          // Auto-download cloud data to local DB
          await pullFromCloud(cloudExists);
        } else {
          setChecking(false);
        }
      } catch (e) {
        console.error(e);
        setChecking(false);
      }
    }
    
    checkData();
  }, [user]);

  const pullFromCloud = async (isAuto = false) => {
    if (!user) return;
    if (!isAuto) setLoading(true);
    try {
      const collections = ['subjects', 'systems', 'history', 'pyqYears', 'scoreLogs', 'uiPreferences'];
      
      for (const col of collections) {
        const snap = await getDocs(collection(firestoreDb, `users/${user.uid}/${col}`));
        const data = snap.docs.map(d => d.data());
        if (data.length > 0) {
          await (db as any)[col].bulkPut(data);
        }
      }
      toast.success('Cloud Data Synced', { description: 'Your data has been restored from the cloud.' });
      finishAndNavigate();
    } catch (e) {
      console.error(e);
      toast.error('Sync Failed');
      if (!isAuto) setLoading(false);
    }
  }

  const pushToCloud = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const subjects = await db.subjects.toArray();
      const systems = await db.systems.toArray();
      const history = await db.history.toArray();
      const pyqYears = await db.pyqYears.toArray();
      const scoreLogs = await db.scoreLogs.toArray();
      const uiPreferences = await db.uiPreferences.toArray();
      
      const chunkArray = (arr: any[], size: number) => {
        return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
          arr.slice(i * size, i * size + size)
        );
      };

      const migrateCollection = async (collectionName: string, data: any[]) => {
        const chunks = chunkArray(data, 450);
        for (const chunk of chunks) {
          const batch = writeBatch(firestoreDb);
          for (const item of chunk) {
            const docRef = doc(firestoreDb, `users/${user.uid}/${collectionName}`, String(item.id || item._id || Math.random().toString(36).substr(2, 9)));
            batch.set(docRef, { ...item });
          }
          await batch.commit();
        }
      };

      await migrateCollection('subjects', subjects);
      await migrateCollection('systems', systems);
      await migrateCollection('history', history);
      await migrateCollection('pyqYears', pyqYears);
      await migrateCollection('scoreLogs', scoreLogs);
      await migrateCollection('uiPreferences', uiPreferences);

      toast.success('Migration Complete', {
        description: 'Your local data has been successfully moved to the cloud.'
      });
      finishAndNavigate();
    } catch (e) {
      console.error(e);
      toast.error('Migration Failed');
      setLoading(false);
    }
  };

  const skipMigration = async () => {
    try {
      await db.delete();
      await db.open();
      finishAndNavigate();
    } catch (e) {
      console.error(e);
      toast.error('Failed to clear local data');
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#030303] text-zinc-100">
        <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
      </div>
    );
  }

  if (!hasLocalData && !hasCloudData) return null;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4 relative">
      <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-5 pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-card border shadow-xl rounded-2xl p-8 z-10 flex flex-col items-center text-center"
      >
        <div className="h-16 w-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
          <Database className="h-8 w-8 text-blue-500" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Data Synchronization</h1>
        
        {hasLocalData && !hasCloudData && (
          <>
            <p className="text-muted-foreground mb-8">
              Offline progress detected. Would you like to sync this data securely to your cloud account?
            </p>
            <div className="w-full space-y-3">
              <Button className="w-full h-14 text-lg" onClick={pushToCloud} disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Cloud className="h-5 w-5 mr-2" />}
                Sync to Cloud
              </Button>
              <Button variant="outline" className="w-full h-14 text-lg text-destructive hover:text-destructive" onClick={skipMigration} disabled={loading}>
                Discard Offline Progress
              </Button>
            </div>
          </>
        )}

        {hasLocalData && hasCloudData && (
          <>
            <p className="text-muted-foreground mb-8">
              Conflict detected between offline progress and cloud storage.
            </p>
            <div className="w-full space-y-3">
              <Button className="w-full h-14 text-lg" onClick={pushToCloud} disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Cloud className="h-5 w-5 mr-2" />}
                Keep Offline Progress
              </Button>
              <Button variant="outline" className="w-full h-14 text-lg" onClick={() => pullFromCloud(false)} disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Cloud className="h-5 w-5 mr-2" />}
                Restore from Cloud
              </Button>
            </div>
          </>
        )}

      </motion.div>
    </div>
  );
}
