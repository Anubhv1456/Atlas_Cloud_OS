import { Link, useLocation } from 'wouter';
import { Home, CalendarDays, BarChart3, Settings, Search, Sparkles, Target, ShieldCheck, User, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useExamProfile } from '@/hooks/useExamProfile';
import { useAuth } from '@/hooks/useAuth';
import { TargetExamModal } from '@/components/TargetExamModal';
import { useState } from 'react';

export function BottomNav() {
  const [location] = useLocation();
  const { profile, isConfigured } = useExamProfile();
  const { user } = useAuth();
  const [examModalOpen, setExamModalOpen] = useState(false);

  const links = [
    { href: '/',          icon: Home,          label: 'Home',      shortcut: '1' },
    { href: '/timeline',  icon: CalendarDays,  label: 'Timeline',  shortcut: '2' },
    { href: '/mistakes',  icon: ShieldAlert,   label: 'Mistakes',  shortcut: 'M' },
    { href: '/analytics', icon: BarChart3,     label: 'Analytics', shortcut: '3' },
    { href: '/settings',  icon: Settings,      label: 'Settings',  shortcut: '4' },
  ];

    
  return (
    <>
      <TargetExamModal open={examModalOpen} onOpenChange={setExamModalOpen} />

      {/* ── DESKTOP SIDEBAR (Visible on md+ screens) ────────────────────────── */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 lg:w-72 z-40 bg-card/75 backdrop-blur-2xl border-r border-border/60 flex-col justify-between p-4 shadow-sm select-none">
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
              const isActive = location === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer",
                    isActive
                      ? "text-primary font-bold bg-primary/10 dark:bg-primary/15 border border-primary/25 shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3 z-10">
                    <Icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    <span>{label}</span>
                  </div>
                  {shortcut && (
                    <span className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors",
                      isActive ? "bg-primary/20 text-primary" : "text-muted-foreground/60 group-hover:text-muted-foreground"
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
            <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" />
              <span>Synced</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MOBILE FLOATING DOCK (Visible on small screens < md) ────────────── */}
      <div 
        className="md:hidden fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md h-16 rounded-full border border-border/80 bg-background/80 dark:bg-card/85 backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.45)] px-2 py-1.5 flex items-center justify-around transition-all duration-300"
        style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="relative w-full flex items-center justify-around gap-1">
          {links.map(({ href, icon: Icon, label }) => {
            const isActive = location === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex flex-col items-center justify-center h-12 flex-1 group rounded-full py-1 px-2 transition-colors duration-200 cursor-pointer select-none",
                  isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Active Sliding Glowing Pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavPillMobile"
                    className="absolute inset-0 bg-primary/15 dark:bg-primary/22 rounded-full border border-primary/35 shadow-[0_2px_14px_rgba(31,168,155,0.22)]"
                    transition={{
                      type: "spring",
                      stiffness: 520,
                      damping: 38,
                      mass: 0.5
                    }}
                  />
                )}

                <div className="z-10 flex flex-col items-center justify-center gap-0.5">
                  <Icon className={cn(
                    "w-5 h-5 transition-all duration-150",
                    isActive ? "text-primary scale-105" : "text-muted-foreground group-hover:text-foreground"
                  )} />

                  <span className={cn(
                    "text-[10px] font-medium tracking-tight transition-colors duration-150 mt-0.5",
                    isActive ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"
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



