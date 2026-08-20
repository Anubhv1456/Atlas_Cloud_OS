import { Link, useLocation } from 'wouter';
import { Home, Calendar, LayoutGrid, Settings, Sparkles, Target, ShieldCheck, User, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useExamProfile } from '@/hooks/useExamProfile';
import { useAuth } from '@/hooks/useAuth';
import { TargetExamModal } from '@/components/TargetExamModal';
import { useState, useEffect, useCallback } from 'react';

export function BottomNav() {
  const [location, setLocation] = useLocation();
  const { profile, isConfigured } = useExamProfile();
  const { user } = useAuth();
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const links = [
    { href: '/',          icon: Home,        label: 'Home',        shortcut: '1' },
    { href: '/timeline',  icon: Calendar,    label: 'Schedule',    shortcut: '2' },
    { href: '/radar',     icon: LayoutGrid,  label: 'Curriculum',  shortcut: '3' },
    { href: '/settings',  icon: Settings,    label: 'Settings',    shortcut: '4' },
  ];

  // Robust path matching supporting subroutes (e.g. /subjects/:id, /analytics)
  const isPathActive = useCallback((href: string) => {
    if (href === '/') {
      return location === '/' || location.startsWith('/subjects');
    }
    if (href === '/radar') {
      return location === '/radar' || location === '/analytics' || location.startsWith('/radar') || location.startsWith('/analytics');
    }
    return location === href || location.startsWith(href + '/') || location.startsWith(href + '?');
  }, [location]);

  // Keyboard shortcut listener (⌘1, ⌘2, ⌘3, ⌘4 or Alt+1...)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.getAttribute('role') === 'textbox')
      ) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) {
        const key = e.key.toUpperCase();
        if (key === '1') {
          e.preventDefault();
          setLocation('/');
        } else if (key === '2') {
          e.preventDefault();
          setLocation('/timeline');
        } else if (key === '3' || key === 'R') {
          e.preventDefault();
          setLocation('/radar');
        } else if (key === '4') {
          e.preventDefault();
          setLocation('/settings');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setLocation]);

  // Handle tap/click: Scroll to top if re-clicking active tab, plus tactile haptics
  const handleTabClick = (href: string, e: React.MouseEvent) => {
    if (isPathActive(href)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(8);
        } catch {
          // Ignore if vibration unsupported or restricted
        }
      }
    }
  };

  return (
    <>
      <TargetExamModal open={examModalOpen} onOpenChange={setExamModalOpen} />

      {/* ── DESKTOP SIDEBAR (Visible on md+ screens) ────────────────────────── */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 lg:w-72 z-40 bg-card/80 backdrop-blur-2xl border-r border-border/60 flex-col justify-between p-4 shadow-sm select-none">
        <div className="space-y-6">
          {/* Brand Header */}
          <Link href="/" className="flex items-center gap-3 px-2 py-1.5 group cursor-pointer">
            <div className="relative">
              <img src="/emblem.svg" alt="Atlas Logo" className="w-10 h-10 rounded-xl shadow-sm border border-border/60 object-contain transition-transform group-hover:scale-105" />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">ATLAS</span>
                <span className="text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">OS</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">Medical Study OS</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Navigation</div>
            {links.map(({ href, icon: Icon, label, shortcut }) => {
              const active = isPathActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={(e) => handleTabClick(href, e)}
                  className={cn(
                    "relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer select-none",
                    active
                      ? "text-primary font-bold bg-primary/10 dark:bg-primary/15 border border-primary/25 shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3 z-10">
                    <Icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    <span>{label}</span>
                  </div>
                  {shortcut && (
                    <span className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors z-10",
                      active ? "bg-primary/20 text-primary font-bold" : "text-muted-foreground/60 group-hover:text-muted-foreground"
                    )}>
                      ⌘{shortcut}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / Exam Target & Profile */}
        <div className="space-y-3 pt-4 border-t border-border/50">
          {/* Target Exam Badge */}
          <button
            onClick={() => setExamModalOpen(true)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-card hover:bg-muted/40 border border-border/80 transition-all text-left group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 text-primary">
                <Target className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Target Exam</p>
                <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                  {isConfigured ? profile.targetExam : 'Set Target Exam'}
                </p>
              </div>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0" />
          </button>

          {/* User Profile Mini Footer */}
          <div className="flex items-center justify-between px-2 py-1 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2 truncate">
              <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-[10px] shrink-0">
                {user?.email ? user.email[0].toUpperCase() : <User className="w-3 h-3" />}
              </div>
              <span className="truncate max-w-[120px] font-medium text-foreground">{user?.email || 'Medical Scholar'}</span>
            </div>
            {isOnline ? (
              <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                <span>Synced</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[10px] font-medium text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20" title="All data stored safely in local device storage">
                <HardDrive className="w-3 h-3" />
                <span>On Device</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── MOBILE FLOATING DOCK (Visible on small screens < md) ────────────── */}
      <div 
        className="md:hidden fixed left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md h-16 rounded-full border border-border/80 bg-background/85 dark:bg-card/90 backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.2)] dark:shadow-[0_18px_40px_rgba(0,0,0,0.55)] px-2 py-1.5 flex items-center justify-around transition-all duration-300 pointer-events-auto select-none"
        style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="relative w-full flex items-center justify-around gap-1 h-full">
          {links.map(({ href, icon: Icon, label }) => {
            const active = isPathActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={(e) => handleTabClick(href, e)}
                className={cn(
                  "relative flex flex-col items-center justify-center h-full flex-1 group rounded-full py-1 px-1 transition-colors duration-200 cursor-pointer select-none touch-manipulation active:scale-95 overflow-hidden",
                  active ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Active Sliding Glowing Pill */}
                {active && (
                  <motion.div
                    layoutId="activeNavPillMobile"
                    className="absolute inset-0 bg-primary/15 dark:bg-primary/22 rounded-full border border-primary/35 shadow-[0_2px_12px_rgba(31,168,155,0.2)]"
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 32,
                      mass: 0.6
                    }}
                  />
                )}

                <div className="z-10 flex flex-col items-center justify-center gap-0.5">
                  <Icon className={cn(
                    "w-5 h-5 transition-all duration-150",
                    active ? "text-primary scale-110" : "text-muted-foreground group-hover:text-foreground"
                  )} />

                  <span className={cn(
                    "text-[10px] tracking-tight transition-colors duration-150 mt-0.5",
                    active ? "text-primary font-bold" : "text-muted-foreground font-medium group-hover:text-foreground"
                  )}>
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}




