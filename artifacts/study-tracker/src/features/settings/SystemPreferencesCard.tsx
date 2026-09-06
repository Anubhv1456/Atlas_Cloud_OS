import React, { useState } from 'react';
import { Moon, Sun, Bell, Palette, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { SettingsRow } from './SettingsLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const TINT_THEMES = [
  { id: 'atlas', label: 'Atlas (Default)', desc: 'Clarity & balanced emerald', bgClass: 'bg-emerald-500' },
  { id: 'deep-space', label: 'Deep Space', desc: 'Focus & indigo depth', bgClass: 'bg-indigo-500' },
  { id: 'system-blue', label: 'System Blue', desc: 'Flow & calm sky', bgClass: 'bg-sky-500' },
  { id: 'graphite', label: 'Graphite', desc: 'Minimal & pure grayscale', bgClass: 'bg-zinc-500 dark:bg-zinc-400' },
  { id: 'amber', label: 'Amber', desc: 'Recall & warm tone', bgClass: 'bg-amber-500' }
] as const;

export function SystemPreferencesCard() {
  const { isDark, toggleTheme, accent, changeAccent } = useTheme();
  const { notifSettings, permissionStatus, toggleNotif, testNotification } = useNotifications();
  const [tintModalOpen, setTintModalOpen] = useState(false);

  const isAlertsActive = notifSettings.notifyRevisions && notifSettings.enabled && permissionStatus !== 'denied';
  const activeTintLabel = TINT_THEMES.find(t => t.id === accent)?.label.split(' ')[0] || 'Atlas';

  return (
    <>
      <SettingsRow
        icon={isDark ? Moon : Sun}
        iconBg={isDark ? "bg-amber-500" : "bg-sky-500"}
        label="Appearance"
        sublabel={isDark ? 'Dark Mode (OLED pitch)' : 'Light Mode (Porcelain)'}
        control={
          <Switch 
            checked={isDark} 
            onCheckedChange={toggleTheme}
          />
        }
      />

      <SettingsRow
        icon={Palette}
        iconBg="bg-purple-500"
        label="Cognitive Tint"
        sublabel="Environmental workspace accent"
        value={activeTintLabel}
        chevron
        onClick={() => setTintModalOpen(true)}
      />

      <SettingsRow
        icon={Bell}
        iconBg="bg-rose-500"
        label="Revision Reminders"
        sublabel={
          permissionStatus === 'denied'
            ? 'Notifications blocked by browser'
            : isAlertsActive
            ? 'Daily spaced repetition cues'
            : 'Turn on for daily study alerts'
        }
        control={
          <div className="flex items-center gap-2">
            {isAlertsActive && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  testNotification();
                }}
                className="text-xs font-semibold text-primary hover:underline px-1 py-0.5 cursor-pointer"
              >
                Test
              </button>
            )}
            <Switch 
              checked={isAlertsActive} 
              onCheckedChange={(val) => toggleNotif('notifyRevisions', val)}
            />
          </div>
        }
      />

      {/* Cognitive Tint Modal Sheet */}
      <Dialog open={tintModalOpen} onOpenChange={setTintModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/80 text-foreground rounded-3xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Palette className="w-4.5 h-4.5 text-purple-500" />
              Cognitive Focus Tint
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Adjust the environmental accent color for focused studying sessions.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-card border border-border/70 rounded-2xl overflow-hidden divide-y divide-border/30 my-2">
            {TINT_THEMES.map((theme) => {
              const isSelected = accent === theme.id;
              return (
                <div
                  key={theme.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    changeAccent(theme.id as any);
                    setTintModalOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      changeAccent(theme.id as any);
                      setTintModalOpen(false);
                    }
                  }}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-4 h-4 rounded-full shadow-2xs", theme.bgClass)} />
                    <div>
                      <p className="text-[13px] font-medium text-foreground">{theme.label}</p>
                      <p className="text-xs text-muted-foreground">{theme.desc}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
