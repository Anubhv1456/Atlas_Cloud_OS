import { Link, useLocation } from 'wouter';
import {
  Home,
  Calendar,
  LayoutGrid,
  Settings,
  Sparkles,
  Target,
  ShieldCheck,
  User,
  HardDrive,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useExamProfile } from '@/hooks/useExamProfile';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/hooks/useSidebar';
import { TargetExamModal } from '@/components/TargetExamModal';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState, useEffect, useCallback } from 'react';

export interface BottomNavProps {
  isAssistantOpen?: boolean;
}

export function BottomNav({ isAssistantOpen: propIsAssistantOpen }: BottomNavProps = {}) {
  const [location, setLocation] = useLocation();
  const { profile, isConfigured } = useExamProfile();
  const { user } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isAssistantOpenState, setIsAssistantOpenState] = useState(
    typeof document !== 'undefined' ? document.body?.dataset?.assistantOpen === 'true' : false
  );

  const isAssistantOpen = propIsAssistantOpen ?? isAssistantOpenState;

  useEffect(() => {
    const handleAssistantToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ open?: boolean }>;
      if (typeof customEvent.detail?.open === 'boolean') {
        setIsAssistantOpenState(customEvent.detail.open);
      } else {
        setIsAssistantOpenState(document.body?.dataset?.assistantOpen === 'true');
      }
    };

    window.addEventListener('atlas-assistant-toggle', handleAssistantToggle);
    return () => {
      window.removeEventListener('atlas-assistant-toggle', handleAssistantToggle);
    };
  }, []);

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
          // Ignore if vibration unsupported
        }
      }
    }
  };

  return (
    <>
      <TargetExamModal open={examModalOpen} onOpenChange={setExamModalOpen} />

      {/* ── DESKTOP & TABLET ADAPTIVE SIDEBAR / ICON RAIL (md+ screens) ─────── */}
      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-0 bottom-0 z-40 bg-card/85 dark:bg-card/90 backdrop-blur-2xl border-r border-border/60 flex-col justify-between shadow-sm select-none transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isCollapsed ? "w-[72px] p-2.5 items-center" : "w-64 lg:w-72 p-4 items-stretch"
        )}
      >
        <div className={cn("space-y-5 flex flex-col", isCollapsed ? "items-center w-full" : "w-full")}>
          {/* Header Bar */}
          <div className={cn("flex items-center", isCollapsed ? "justify-center w-full pt-1" : "justify-between px-1.5 py-1")}>
            <Link
              href="/"
              className={cn(
                "flex items-center gap-3 group cursor-pointer",
                isCollapsed && "justify-center"
              )}
            >
              <div className="relative">
                <img
                  src="/emblem.svg"
                  alt="Atlas Logo"
                  className={cn(
                    "rounded-xl shadow-sm border border-border/60 object-contain transition-transform group-hover:scale-105",
                    isCollapsed ? "w-9 h-9" : "w-10 h-10"
                  )}
                />
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card" />
              </div>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
                        ATLAS
                      </span>
                      <span className="text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                        OS
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium">Medical Study OS</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>

            {/* Apple-style Expand / Collapse Toggle Button */}
            {!isCollapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                    aria-label="Collapse sidebar"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>
                  <p className="font-medium text-xs">Retract to Symbols <span className="text-muted-foreground font-mono ml-1">⌘\</span></p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Toggle button when collapsed */}
          {isCollapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="w-10 h-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                  aria-label="Expand sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                <p className="font-medium text-xs">Expand Sidebar <span className="text-muted-foreground font-mono ml-1">⌘\</span></p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Navigation Links */}
          <nav className={cn("space-y-1.5 w-full flex flex-col", isCollapsed && "items-center")}>
            {!isCollapsed && (
              <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                Navigation
              </div>
            )}

            {links.map(({ href, icon: Icon, label, shortcut }) => {
              const active = isPathActive(href);

              if (isCollapsed) {
                return (
                  <Tooltip key={href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={href}
                        onClick={(e) => handleTabClick(href, e)}
                        className={cn(
                          "relative w-11 h-11 rounded-xl flex items-center justify-center transition-all group cursor-pointer select-none touch-manipulation active:scale-95",
                          active
                            ? "text-primary bg-primary/15 border border-primary/30 shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                        aria-label={label}
                      >
                        <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                        {active && (
                          <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={14}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs">{label}</span>
                        {shortcut && (
                          <span className="font-mono text-[10px] bg-background/20 px-1 rounded text-primary-foreground/90">
                            ⌘{shortcut}
                          </span>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              }

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
                    <span
                      className={cn(
                        "text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors z-10",
                        active
                          ? "bg-primary/20 text-primary font-bold"
                          : "text-muted-foreground/60 group-hover:text-muted-foreground"
                      )}
                    >
                      ⌘{shortcut}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / Exam Target & Profile */}
        <div className={cn("space-y-3 pt-4 border-t border-border/50 flex flex-col", isCollapsed ? "items-center w-full" : "w-full")}>
          {/* Target Exam Badge */}
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setExamModalOpen(true)}
                  className="w-11 h-11 rounded-xl bg-card hover:bg-muted/50 border border-border/80 flex items-center justify-center text-primary group active:scale-95 transition-all cursor-pointer"
                  aria-label="Target Exam"
                >
                  <Target className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={14}>
                <p className="font-semibold text-xs">Target Exam: {isConfigured ? profile.targetExam : 'Set Target'}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={() => setExamModalOpen(true)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-card hover:bg-muted/40 border border-border/80 transition-all text-left group cursor-pointer"
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
          )}

          {/* User Profile Mini Footer */}
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs relative cursor-default border border-primary/20">
                  {user?.email ? user.email[0].toUpperCase() : <User className="w-4 h-4" />}
                  <span className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card", isOnline ? "bg-emerald-500" : "bg-teal-400")} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={14}>
                <p className="font-semibold text-xs">{user?.email || 'Medical Scholar'}</p>
                <p className="text-[10px] text-muted-foreground">{isOnline ? 'Cloud Synced' : 'On-Device Storage'}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
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
          )}
        </div>
      </aside>

      {/* ── MOBILE FLOATING DOCK (Visible on small screens < md) ────────────── */}
      <div 
        className={cn(
          "md:hidden fixed left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md h-16 rounded-full border border-border/80 bg-background/85 dark:bg-card/90 backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.2)] dark:shadow-[0_18px_40px_rgba(0,0,0,0.55)] px-2 py-1.5 flex items-center justify-around transition-all duration-300 select-none",
          isAssistantOpen
            ? "translate-y-28 opacity-0 pointer-events-none"
            : "translate-y-0 opacity-100 pointer-events-auto"
        )}
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
