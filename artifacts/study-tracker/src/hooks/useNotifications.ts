import { useState, useCallback } from 'react';
import { getNotificationSettings, saveNotificationSettings, NotificationSettings, triggerSpacedRepetitionNotification } from '@/lib/pwaAndNotifications';
import { useToast } from '@/hooks/use-toast';

export function useNotifications() {
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(getNotificationSettings());
  const { toast } = useToast();

  const toggleNotif = useCallback(
    (key: keyof NotificationSettings, value: boolean) => {
      const newSettings = { ...notifSettings, [key]: value };
      setNotifSettings(newSettings);
      saveNotificationSettings(newSettings);
    },
    [notifSettings]
  );

  const testNotification = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast({ title: 'Notifications unavailable', description: 'Web Notifications API is not supported in this browser environment.' });
      return;
    }
    try {
      if (window.Notification.permission === 'default') {
        const p = await window.Notification.requestPermission();
        if (p !== 'granted') {
          toast({ title: 'Permission denied', description: 'Please enable notifications in your browser settings.' });
          return;
        }
      }
    } catch (e) {
      console.warn('Notification permission error:', e);
    }
    triggerSpacedRepetitionNotification(true);
  }, [toast]);

  return { notifSettings, toggleNotif, testNotification };
}
