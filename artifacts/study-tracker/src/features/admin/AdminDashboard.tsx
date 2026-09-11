import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  Users, ShieldCheck, LogOut, LayoutDashboard, Sparkles, ArrowLeft, BarChart3, Sliders
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

import { OpsQueueView } from './views/OpsQueueView';
import { DirectoryView } from './views/DirectoryView';
import { SettingsView } from './views/SettingsView';
import { AmbassadorApplicationsView } from './views/AmbassadorApplicationsView';
import { AnalyticsView } from './views/AnalyticsView';

type ViewType = 'analytics' | 'directory' | 'ops' | 'ambassadors' | 'settings';

const navItems = [
  { 
    id: 'analytics' as const, 
    label: 'Analytics & Quota', 
    subtitle: 'Behavior & Infrastructure', 
    icon: BarChart3 
  },
  { 
    id: 'directory' as const, 
    label: 'Directory', 
    subtitle: 'Students & Affiliates', 
    icon: Users 
  },
  { 
    id: 'ops' as const, 
    label: 'Live Ops Triage', 
    subtitle: 'Support & Markers', 
    icon: ShieldCheck 
  },
  { 
     id: 'ambassadors' as const, 
     label: 'Ambassadors', 
     subtitle: 'Applications', 
     icon: Sparkles 
   },
   { 
     id: 'settings' as const, 
     label: 'Settings', 
     subtitle: 'Flags & Pricing', 
     icon: Sliders 
   }
];

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { signOut } = useAuth();
  
  const [activeView, setActiveView] = useState<ViewType>('analytics');

  const renderContent = () => {
    switch (activeView) {
      case 'analytics': return <AnalyticsView />;
      case 'directory': return <DirectoryView />;
      case 'ops': return <OpsQueueView />;
      case 'ambassadors': return <AmbassadorApplicationsView />;
      case 'settings': return <SettingsView />;
      default: return <AnalyticsView />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-foreground selection:bg-teal-500/30">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-72 bg-card/30 border-r border-border/40 flex flex-col flex-shrink-0 relative overflow-hidden backdrop-blur-xl">
        <div className="p-6 pb-4 relative z-10">
          <div className="flex items-center gap-3 text-teal-500 mb-6 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setLocation('/')}>
            <LayoutDashboard className="w-6 h-6" />
            <h2 className="font-bold text-lg tracking-tight">Admin Console</h2>
          </div>
          
          <div className="space-y-1 mt-6">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-2">
              Command Modules
            </div>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative overflow-hidden text-left",
                    isActive 
                      ? "bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent"
                  )}
                >
                  <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0 transition-colors", isActive ? "text-teal-400" : "group-hover:text-foreground")} />
                  <div>
                    <div className={cn("font-bold", isActive && "text-teal-400")}>{item.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{item.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-border/40 space-y-2 relative z-10 bg-card/50">
          <button 
            onClick={() => setLocation('/')}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit Console
          </button>
          
          <button 
            onClick={() => signOut()}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-rose-500/80 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Secure Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative bg-background/50">
        {renderContent()}
      </div>
      
    </div>
  );
}
