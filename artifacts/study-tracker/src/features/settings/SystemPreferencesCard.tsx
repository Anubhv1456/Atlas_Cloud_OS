import React from 'react';
import { Moon, Sun, Bell, BellOff, SlidersHorizontal, Sparkles, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

export function SystemPreferencesCard() {
  const { isDark, toggleTheme, accent, changeAccent } = useTheme();
  const { notifSettings, permissionStatus, isPwa, toggleNotif, testNotification } = useNotifications();

  const isAlertsActive = notifSettings.notifyRevisions && notifSettings.enabled && permissionStatus !== 'denied';

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            System Preferences
          </h3>
        </div>

        {isPwa && (
          <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            PWA Standalone
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Appearance Preference Tile */}
        <div 
          onClick={() => toggleTheme(!isDark)}
          className="p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
              isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-sky-500/10 border-sky-500/20 text-sky-500"
            )}>
              {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Theme Mode</p>
              <p className="text-[11px] text-muted-foreground">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
            </div>
          </div>

          <Switch 
            checked={isDark} 
            onCheckedChange={toggleTheme}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Notifications Preference Tile */}
        <div 
          onClick={() => toggleNotif('notifyRevisions', !isAlertsActive)}
          className="p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
              isAlertsActive 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                : permissionStatus === 'denied'
                ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                : "bg-muted border-border text-muted-foreground"
            )}>
              {isAlertsActive ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Revision Alerts</p>
              <p className="text-[11px] text-muted-foreground">
                {permissionStatus === 'denied'
                  ? 'Blocked in Browser'
                  : isAlertsActive
                  ? 'Active (PWA & Web)'
                  : 'Disabled'}
              </p>
            </div>
          </div>

          <Switch 
            checked={isAlertsActive} 
            onCheckedChange={(val) => toggleNotif('notifyRevisions', val)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      

      {/* Cognitive Modes Preference Tile */}
      <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 flex flex-col gap-4">
        <div>
          <p className="text-xs font-bold text-foreground">Cognitive Mode</p>
          <p className="text-[11px] text-muted-foreground">Select your environmental focus tint</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'atlas', label: 'Atlas (Default)', desc: 'Clarity', ringColor: 'ring-emerald-500', bgClass: 'bg-emerald-500' },
            { id: 'deep-space', label: 'Deep Space', desc: 'Focus', ringColor: 'ring-indigo-500', bgClass: 'bg-indigo-500' },
            { id: 'system-blue', label: 'System Blue', desc: 'Flow', ringColor: 'ring-sky-500', bgClass: 'bg-sky-500' },
            { id: 'graphite', label: 'Graphite', desc: 'Minimal', ringColor: 'ring-zinc-400 dark:ring-zinc-300', bgClass: 'bg-zinc-600 dark:bg-zinc-400' },
            { id: 'amber', label: 'Amber', desc: 'Recall', ringColor: 'ring-amber-500', bgClass: 'bg-amber-500' }
          ].map((theme) => {
            const isActive = accent === theme.id; 
            return (
              <button
                key={theme.id}
                onClick={() => changeAccent(theme.id as any)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer border text-left",
                  isActive 
                    ? `border-primary bg-primary/10 shadow-sm ${theme.ringColor} ring-1 ring-offset-0` 
                    : "border-border/60 bg-background/50 hover:bg-muted/80 hover:border-border"
                )}
              >
                <div className={cn("w-3.5 h-3.5 rounded-full flex shrink-0 items-center justify-center", theme.bgClass)}>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                </div>
                <div className="flex flex-col">
                  <span className={cn("text-[11px] font-semibold", isActive ? "text-primary" : "text-foreground")}>
                    {theme.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Quick Test / Permission Status Footer */}
      {permissionStatus === 'denied' && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Notifications are blocked in your browser or device permissions. To receive daily spaced repetition reminders, enable notifications in your browser's site settings or install Atlas as a PWA.
          </p>
        </div>
      )}

      {isAlertsActive && (
        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
          <span className="text-[11px]">
            Alerts fire daily when spaced recall intervals mature.
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              testNotification();
            }}
            className="h-7 text-[11px] px-2.5 text-primary hover:text-primary hover:bg-primary/10 gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            Send Test Alert
          </Button>
        </div>
      )}
    </div>
  );
}
