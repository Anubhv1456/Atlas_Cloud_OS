import React from 'react';
import { Moon, Sun, Bell, BellOff, SlidersHorizontal } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

export function SystemPreferencesCard() {
  const { isDark, toggleTheme } = useTheme();
  const { notifSettings, toggleNotif } = useNotifications();

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-border/40">
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          System Preferences
        </h3>
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
          onClick={() => toggleNotif('notifyRevisions', !notifSettings.notifyRevisions)}
          className="p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
              notifSettings.notifyRevisions 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                : "bg-muted border-border text-muted-foreground"
            )}>
              {notifSettings.notifyRevisions ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Revision Alerts</p>
              <p className="text-[11px] text-muted-foreground">
                {notifSettings.notifyRevisions ? 'Active' : 'Disabled'}
              </p>
            </div>
          </div>

          <Switch 
            checked={notifSettings.notifyRevisions} 
            onCheckedChange={(val) => toggleNotif('notifyRevisions', val)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </div>
  );
}
