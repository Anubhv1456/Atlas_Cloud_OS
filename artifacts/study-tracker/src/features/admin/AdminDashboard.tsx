import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  CreditCard, 
  BarChart3, 
  ToggleLeft, 
  Megaphone, 
  Settings, 
  History,
  LogOut,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardOverview } from './views/DashboardOverview';
import { CommunityView } from './views/CommunityView';
import { UsersView } from './views/UsersView';
import { FeatureFlagsView } from './views/FeatureFlagsView';
import { AnnouncementsView } from './views/AnnouncementsView';
import { SupportMessagesView } from './views/SupportMessagesView';
import { SocialLinksView } from './views/SocialLinksView';
import { Inbox, Share2 } from 'lucide-react';

// Placeholder Views
const ComingSoonView = ({ title, description, icon: Icon }: { title: string, description: string, icon: any }) => (
  <div className="p-8 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div className="w-20 h-20 bg-muted/30 rounded-3xl flex items-center justify-center mb-6 border border-border/50">
      <Icon className="w-10 h-10 text-muted-foreground/50" />
    </div>
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-semibold uppercase tracking-wider mb-4">
      <Sparkles className="w-3.5 h-3.5" />
      Coming Soon
    </span>
    <h2 className="text-3xl font-bold tracking-tight mb-3">{title}</h2>
    <p className="text-muted-foreground max-w-md text-lg">{description}</p>
  </div>
);

const PaymentsView = () => <ComingSoonView title="Payments" description="Track revenue, subscriptions, and manage invites." icon={CreditCard} />;
const AnalyticsView = () => <ComingSoonView title="Analytics" description="Deep dive into learning outcomes and platform usage across the student base." icon={BarChart3} />;
const SettingsView = () => <ComingSoonView title="Console Settings" description="Configure global application parameters and access control." icon={Settings} />;
const AuditLogView = () => <ComingSoonView title="Audit Log" description="Review a secure history of all administrative actions and security events." icon={History} />;

type ViewType = 'dashboard' | 'support' | 'socials' | 'users' | 'community' | 'payments' | 'analytics' | 'flags' | 'announcements' | 'settings' | 'audit';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'support', label: 'Support Inbox', icon: Inbox },
  { id: 'socials', label: 'Social Channels', icon: Share2 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'community', label: 'Community', icon: MessageSquare },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'flags', label: 'Feature Flags', icon: ToggleLeft },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'audit', label: 'Audit Log', icon: History },
] as const;

import { useFeatureFlags } from '@/hooks/useFeatureFlags';

export default function AdminDashboard() {
  const { flags, loading: flagsLoading } = useFeatureFlags();
  const { isAdmin, loading } = useAdmin();
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  
  const filteredNavItems = navItems.filter(item => {
    if (item.id === 'community' && !flags.communityMarkers) return false;
    if (item.id === 'payments' && !flags.payments) return false;
    return true;
  });

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
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardOverview />;
      case 'support': return <SupportMessagesView />;
      case 'socials': return <SocialLinksView />;
      case 'users': return <UsersView />;
      case 'community': return <CommunityView />;
      case 'payments': return <PaymentsView />;
      case 'analytics': return <AnalyticsView />;
      case 'flags': return <FeatureFlagsView />;
      case 'announcements': return <AnnouncementsView />;
      case 'settings': return <SettingsView />;
      case 'audit': return <AuditLogView />;
      default: return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex overflow-hidden w-full max-w-full">
      {/* Sidebar */}
      <div className="w-64 border-r border-border/50 bg-card/30 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <span className="font-bold text-lg tracking-tight">Founder Console</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                activeView === item.id 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-border/50 space-y-2">
          <button
            onClick={() => setLocation('/')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Back to App
          </button>
          <button
            onClick={() => { logout(); setLocation('/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-background/50">
        {renderView()}
      </div>
    </div>
  );
}
