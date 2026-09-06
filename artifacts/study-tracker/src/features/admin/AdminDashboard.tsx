import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  Activity, 
  GraduationCap, 
  ShieldCheck, 
  LogOut, 
  LayoutDashboard,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { AtlasLoadingScreen } from '@/components/AtlasLoadingScreen';
import { OpsQueueView } from './views/OpsQueueView';
import { UsersView } from './views/UsersView';
import { SystemControlView } from './views/SystemControlView';
import { CohortTelemetryView } from './views/CohortTelemetryView';

type ViewType = 'ops' | 'users' | 'telemetry' | 'system';

const navItems = [
  { 
    id: 'ops' as const, 
    label: 'Live Ops Triage', 
    subtitle: 'Payments, Support & Markers', 
    icon: Activity 
  },
  { 
    id: 'telemetry' as const, 
    label: 'Cohort Telemetry', 
    subtitle: 'Engine Accuracy & Velocity', 
    icon: Sparkles 
  },
  { 
    id: 'users' as const, 
    label: 'Student Directory', 
    subtitle: 'Cohorts & Beta Access', 
    icon: GraduationCap 
  },
  { 
    id: 'system' as const, 
    label: 'System Control', 
    subtitle: 'Flags, Banners & Pricing', 
    icon: ShieldCheck 
  },
] as const;

export default function AdminDashboard() {
  const { flags, loading: flagsLoading } = useFeatureFlags();
  const { isAdmin, loading } = useAdmin();
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('ops');

  useEffect(() => {
    if (!loading && !flagsLoading) {
      if (!user) {
        setLocation('/login');
      } else if (!isAdmin) {
        setLocation('/');
      }
    }
  }, [user, isAdmin, loading, flagsLoading, setLocation]);

  if (loading || flagsLoading || !user || !isAdmin) {
    return <AtlasLoadingScreen fullScreen message="Authenticating system console..." />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'ops': return <OpsQueueView />;
      case 'telemetry': return <CohortTelemetryView />;
      case 'users': return <UsersView />;
      case 'system': return <SystemControlView />;
      default: return <OpsQueueView />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex overflow-hidden w-full max-w-full font-sans antialiased">
      {/* Sidebar Navigation */}
      <div className="w-72 border-r border-border/50 bg-card/40 backdrop-blur-md flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="h-18 flex items-center px-6 border-b border-border/50 justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-foreground block leading-none">
                Atlas Command
              </span>
              <span className="text-xs text-teal-400 font-mono font-semibold uppercase tracking-wider">
                Founder Console
              </span>
            </div>
          </div>
        </div>
        
        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5">
          <div className="px-3 pb-2 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground/70">
            Navigation Wings
          </div>

          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={cn(
                  "w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left transition-all group relative",
                  isActive 
                    ? "bg-teal-500/10 border border-teal-500/30 text-teal-300 shadow-sm" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg transition-colors shrink-0",
                  isActive ? "bg-teal-500/20 text-teal-300" : "bg-muted/50 text-muted-foreground group-hover:text-foreground"
                )}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold tracking-tight block text-foreground">
                    {item.label}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {item.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* User Footer Actions */}
        <div className="p-4 border-t border-border/50 space-y-2 bg-background/40">
          <button
            onClick={() => setLocation('/')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-teal-400" />
            Return to Study OS
          </button>

          <button
            onClick={() => { logout(); setLocation('/login'); }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out Console
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 overflow-y-auto bg-background/30">
        {renderView()}
      </div>
    </div>
  );
}
