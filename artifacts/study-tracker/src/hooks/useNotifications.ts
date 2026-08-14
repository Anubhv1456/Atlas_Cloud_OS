import { useState, useEffect, useCallback } from 'react';
import {
  getNotificationSettings,
  saveNotificationSettings,
  NotificationSettings,
  NotificationPermissionState,
  getNotificationPermissionStatus,
  requestNotificationPermission,
  triggerSpacedRepetitionNotification,
  isStandalonePwa,
} from '@/lib/pwaAndNotifications';
import { toast } from 'sonner';

export function useNotifications() {
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionState>(getNotificationPermissionStatus());
  const [isPwa] = useState<boolean>(isStandalonePwa());

  // Keep state in sync with localStorage and other components
  useEffect(() => {
    const handleUpdate = (e: CustomEvent<NotificationSettings>) => {
      if (e.detail) {
        setNotifSettings(e.detail);
      }
      setPermissionStatus(getNotificationPermissionStatus());
    };

    window.addEventListener('notification-settings-updated', handleUpdate as EventListener);
    return () => {
      window.removeEventListener('notification-settings-updated', handleUpdate as EventListener);
    };
  }, []);

  const toggleNotif = useCallback(
    async (key: keyof NotificationSettings, value: boolean) => {
      const currentPerm = getNotificationPermissionStatus();

      // If enabling notifications, request browser/PWA permission
      if (value === true && (key === 'notifyRevisions' || key === 'enabled')) {
        if (currentPerm === 'unsupported') {
          toast.error('Notifications Unavailable', {
            description: 'Web Notifications API is not supported in this browser or iframe context.',
          });
          return;
        }

        if (currentPerm === 'denied') {
          toast.error('Permission Blocked', {
            description: 'Notifications are blocked in your browser site settings. Please allow notifications for Atlas.',
          });
          return;
        }

        if (currentPerm === 'default') {
          const newPerm = await requestNotificationPermission();
          setPermissionStatus(newPerm);
          if (newPerm !== 'granted') {
            toast.error('Permission Not Granted', {
              description: 'Notifications were not enabled. You can enable them anytime from browser settings.',
            });
            const reverted: NotificationSettings = { ...notifSettings, enabled: false, notifyRevisions: false };
            setNotifSettings(reverted);
            saveNotificationSettings(reverted);
            return;
          }
        }
      }

      let newSettings: NotificationSettings;
      if (key === 'notifyRevisions') {
        newSettings = {
          ...notifSettings,
          notifyRevisions: value,
          enabled: value,
        };
      } else if (key === 'enabled') {
        newSettings = {
          ...notifSettings,
          enabled: value,
          notifyRevisions: value,
        };
      } else {
        newSettings = { ...notifSettings, [key]: value };
      }

      setNotifSettings(newSettings);
      saveNotificationSettings(newSettings);
      setPermissionStatus(getNotificationPermissionStatus());

      if (value) {
        toast.success('Revision Alerts Active', {
          description: 'Atlas will alert you via PWA notifications when spaced repetition intervals mature.',
        });
      } else {
        toast.info('Revision Alerts Paused');
      }
    },
    [notifSettings]
  );

  const testNotification = useCallback(async () => {
    const currentPerm = getNotificationPermissionStatus();
    if (currentPerm === 'unsupported') {
      toast.error('Notifications Unavailable', {
        description: 'Web Notifications API is not supported in this environment.',
      });
      return;
    }

    if (currentPerm === 'denied') {
      toast.error('Permission Blocked', {
        description: 'Notifications are blocked. Please enable notifications in your browser or PWA settings.',
      });
      return;
    }

    if (currentPerm === 'default') {
      const requested = await requestNotificationPermission();
      setPermissionStatus(requested);
      if (requested !== 'granted') {
        toast.error('Permission Required', {
          description: 'Please allow notifications when prompted.',
        });
        return;
      }
    }

    // Ensure settings are enabled for test
    const updated = saveNotificationSettings({ enabled: true, notifyRevisions: true });
    setNotifSettings(updated);

    const sent = await triggerSpacedRepetitionNotification(true);
    if (sent) {
      toast.success('Test Alert Dispatched', {
        description: 'Check your notification shade or system banner.',
      });
    } else {
      toast.info('Test Alert Queued', {
        description: 'If running inside an iframe, open Atlas in a standalone tab or install the PWA.',
      });
    }
  }, []);

  return {
    notifSettings,
    permissionStatus,
    isPwa,
    toggleNotif,
    testNotification,
  };
}
