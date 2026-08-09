import { Bell } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useNotifications } from '@/hooks/useNotifications';
import { SettingsRow } from './SettingsLayout';

export function NotificationsSection() {
  const { notifSettings, toggleNotif } = useNotifications();

  return (
    <SettingsRow
      icon={Bell}
      label="Notifications"
      control={<Switch checked={notifSettings.notifyRevisions} onCheckedChange={(val) => toggleNotif('notifyRevisions', val)} />}
      onClick={() => toggleNotif('notifyRevisions', !notifSettings.notifyRevisions)}
    />
  );
}
