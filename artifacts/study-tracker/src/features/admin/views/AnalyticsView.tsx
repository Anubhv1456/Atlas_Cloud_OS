import React, { useEffect, useState, useCallback } from 'react';
import { 
  BarChart3, Activity, Zap, ShieldCheck, TrendingUp,
  Database, Flame, Layers, Clock, CheckCircle2, AlertTriangle, Users, Brain, RefreshCw
} from 'lucide-react';
import { fetchCohortTelemetryLogs } from '@/lib/telemetry';
import { getAllUsersForAdmin } from '@/lib/admin';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function AnalyticsView() {
  const [data, setData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (force = false) => {
    if (force) setIsRefreshing(true);
    else setLoading(true);
    try {
      const [res, u] = await Promise.all([
        fetchCohortTelemetryLogs(force),
        getAllUsersForAdmin(force)
      ]);
      setData(res);
      setUsers(u);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-24">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- COLUMN A: BEHAVIOR ---
  const studentCandidates = users.filter(u => !u.isAdmin);
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  const activeStudents = studentCandidates.filter(u => {
    if (!u.betaAccess) return false;
    if (!u.betaAccessExpiresAt) return true;
    const expiresAt = typeof u.betaAccessExpiresAt === 'number' ? u.betaAccessExpiresAt : u.betaAccessExpiresAt.toMillis?.();
    return expiresAt && expiresAt > now;
  });

  const recentLogins = studentCandidates.filter(u => {
    const lastLogin = u.lastLoginAt?.toMillis?.() || 0;
    return (now - lastLogin) < (dayMs * 7); // MAU (Weekly/Monthly Active proxy)
  });

  const drillsCleared = data?.drillsCleared ?? 0;
  const drillsTotal = data?.drillsTotal ?? 0;
  const avgSessionDepth = recentLogins.length > 0 ? (drillsCleared / recentLogins.length).toFixed(1) : '0';
  
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-500" />
            Analytics & Telemetry
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Behavior mapping and user retention tracking.</p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition-colors disabled:opacity-50 border border-border/50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
          {isRefreshing ? 'Syncing...' : 'Force Sync'}
        </button>
      </div>

      <div className="max-w-md">
        
        {/* COLUMN A: BEHAVIOR */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" /> User Behavior
          </h2>
          <div className="bg-card/40 border border-border/50 rounded-2xl p-5 space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-muted-foreground font-semibold">Active Seats</div>
                <div className="text-2xl font-bold text-foreground">{activeStudents.length}</div>
              </div>
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
                PROVISIONED
              </Badge>
            </div>
            
            <div className="flex justify-between items-center border-t border-border/40 pt-4">
              <div>
                <div className="text-xs text-muted-foreground font-semibold">7-Day Active (MAU Proxy)</div>
                <div className="text-lg font-bold text-foreground">{recentLogins.length}</div>
              </div>
              <Activity className="w-5 h-5 text-emerald-500" />
            </div>

            <div className="flex justify-between items-center border-t border-border/40 pt-4">
              <div>
                <div className="text-xs text-muted-foreground font-semibold">Avg. Session Depth</div>
                <div className="text-lg font-bold text-foreground">{avgSessionDepth}</div>
              </div>
              <div className="text-[10px] text-muted-foreground text-right">drills / user</div>
            </div>

            <div className="border-t border-border/40 pt-4">
              <div className="text-xs text-muted-foreground font-semibold mb-2">Drop-off Funnel</div>
              <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                <div className="bg-teal-500" style={{ width: '100%' }} title="Signups"></div>
                <div className="bg-indigo-500" style={{ width: '60%' }} title="Started Drill"></div>
                <div className="bg-rose-500" style={{ width: '20%' }} title="Paid"></div>
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 font-mono">
                <span>Signup</span>
                <span>Activation</span>
                <span>Retained</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function BrainIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4 4.5 4.5 0 0 1 3 4 4.5 4.5 0 0 1 3-4Z"/></svg>
  );
}
