import React, { useEffect, useState } from 'react';
import { Users, Activity, MessageSquare, AlertCircle } from 'lucide-react';
import { getDashboardStats } from '@/lib/admin';

export function DashboardOverview() {
  const [stats, setStats] = useState({ users: 0, signups: 0, pendingMarkers: 0, reportedMarkers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then(s => {
      setStats(s);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Operations Center</h1>
        <p className="text-muted-foreground text-lg">Welcome to the founder console.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl border border-border/50 bg-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg"><Users className="w-5 h-5 text-primary" /></div>
              <h3 className="font-medium">Active Users</h3>
            </div>
            <p className="text-3xl font-bold">{stats.users}</p>
          </div>
          
          <div className="p-6 rounded-2xl border border-border/50 bg-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg"><Activity className="w-5 h-5 text-emerald-500" /></div>
              <h3 className="font-medium">Today's Signups</h3>
            </div>
            <p className="text-3xl font-bold">{stats.signups}</p>
          </div>

          <div className="p-6 rounded-2xl border border-border/50 bg-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg"><MessageSquare className="w-5 h-5 text-primary" /></div>
              <h3 className="font-medium">Pending Markers</h3>
            </div>
            <p className="text-3xl font-bold">{stats.pendingMarkers}</p>
          </div>

          <div className="p-6 rounded-2xl border border-border/50 bg-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/10 rounded-lg"><AlertCircle className="w-5 h-5 text-red-500" /></div>
              <h3 className="font-medium">Reported Markers</h3>
            </div>
            <p className="text-3xl font-bold">{stats.reportedMarkers}</p>
          </div>
        </div>
      )}
    </div>
  );
}
