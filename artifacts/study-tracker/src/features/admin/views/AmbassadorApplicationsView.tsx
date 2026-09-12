import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, XCircle, Search, RefreshCw, X, Loader2 } from 'lucide-react';
import { firestoreDb } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { approveAmbassadorApplication, rejectAmbassadorApplication } from '@/lib/admin';

interface AmbassadorApplication {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  institution: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

export function AmbassadorApplicationsView() {
  const [applications, setApplications] = useState<AmbassadorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchApps = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const q = query(
        collection(firestoreDb, 'ambassador_applications'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const apps = snap.docs.map(d => ({ id: d.id, ...d.data() } as AmbassadorApplication));
      setApplications(apps);
    } catch (e) {
      console.error(e);
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleApprove = async (app: AmbassadorApplication) => {
    try {
      await approveAmbassadorApplication(app.id, app.userId);
      toast.success(`Approved Dr. ${app.userName} as Ambassador! Access granted.`);
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'approved' } : a));
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to approve application');
    }
  };

  const handleReject = async (appId: string) => {
    try {
      await rejectAmbassadorApplication(appId);
      toast.success('Application rejected');
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'rejected' } : a));
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to reject application');
    }
  };

  const handleDelete = async (appId: string) => {
    try {
      await deleteDoc(doc(firestoreDb, 'ambassador_applications', appId));
      setApplications(prev => prev.filter(a => a.id !== appId));
      toast.success('Application deleted');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete application');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
        <p className="text-muted-foreground text-sm">Loading applications...</p>
      </div>
    );
  }

  const pendingCount = applications.filter(a => a.status === 'pending').length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" /> Ambassador Applications
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review and manage incoming ambassador requests. ({pendingCount} pending)
          </p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => fetchApps(true)} 
          disabled={refreshing}
          className="bg-card text-foreground gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-muted/10">
                <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Candidate</th>
                <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Institution</th>
                <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Role</th>
                <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">
                    No applications found in the system.
                  </td>
                </tr>
              ) : (
                applications.map(app => (
                  <tr key={app.id} className="hover:bg-muted/10">
                    <td className="py-3 px-4">
                      <div className="font-medium text-sm text-foreground">{app.userName}</div>
                      <div className="text-xs text-muted-foreground">{app.userEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-sm">{app.institution}</td>
                    <td className="py-3 px-4 text-sm">{app.role}</td>
                    <td className="py-3 px-4">
                      {app.status === 'pending' && <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">Pending</Badge>}
                      {app.status === 'approved' && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Approved</Badge>}
                      {app.status === 'rejected' && <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/30">Rejected</Badge>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {app.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border-emerald-500/30" onClick={() => handleApprove(app)}>
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/30" onClick={() => handleReject(app.id)}>
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10" onClick={() => handleDelete(app.id)}>
                          <X className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
