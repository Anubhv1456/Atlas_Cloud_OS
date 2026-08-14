import { Bell } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useNotifications } from '@/hooks/useNotifications';
import { SettingsRow } from './SettingsLayout';

export function NotificationsSection() {
  const { notifSettings, permissionStatus, toggleNotif } = useNotifications();
  const isAlertsActive = notifSettings.notifyRevisions && notifSettings.enabled && permissionStatus !== 'denied';

  return (
    <SettingsRow
      icon={Bell}
      label="Revision Notifications"
      control={
        <Switch
          checked={isAlertsActive}
          onCheckedChange={(val) => toggleNotif('notifyRevisions', val)}
          onClick={(e) => e.stopPropagation()}
        />
      }
      onClick={() => toggleNotif('notifyRevisions', !isAlertsActive)}
    />
  );
}
