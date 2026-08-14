import { db } from '@/db';

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: string; // e.g. "09:00"
  notifyRevisions: boolean;
  notifyDailyGoal?: boolean;
  lastNotifiedDate?: string; // YYYY-MM-DD
}

const SETTINGS_KEY = 'atlas_notification_settings_v1';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  reminderTime: '09:00',
  notifyRevisions: true,
  notifyDailyGoal: true,
};

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * Returns current browser notification permission state
 */
export function getNotificationPermissionStatus(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return window.Notification.permission as NotificationPermissionState;
}

/**
 * Requests browser notification permission in response to a user gesture
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await window.Notification.requestPermission();
    return permission as NotificationPermissionState;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return window.Notification.permission as NotificationPermissionState;
  }
}

/**
 * Checks whether the app is currently running in standalone PWA mode
 */
export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function getNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to parse notification settings:', e);
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
}

export function saveNotificationSettings(settings: Partial<NotificationSettings>): NotificationSettings {
  const current = getNotificationSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('notification-settings-updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to save notification settings:', e);
  }
  return updated;
}

/**
 * Queries pending spaced repetition tasks (due system and topic revisions)
 */
export async function getDueSpacedRepetitionTasks(): Promise<{
  dueRevisionsCount: number;
  dueRevisionNames: string[];
}> {
  const now = new Date();
  const dueNames: string[] = [];

  try {
    // 1. Check Curriculum Sets / Revision Sets table
    const table = db.curriculumSets || db.revisionSets;
    if (table) {
      const sets = await table.filter(s => !s.deletedAt).toArray();
      for (const s of sets) {
        if (s.nextRevisionDate && new Date(s.nextRevisionDate) <= now) {
          dueNames.push(s.name);
        }
      }
    }

    // 2. Check System level records if any have nextRevisionDate
    if (db.systems) {
      const sysList = await db.systems.filter((sys: any) => !sys.deletedAt && !!sys.nextRevisionDate).toArray();
      for (const sys of sysList) {
        if (sys.nextRevisionDate && new Date(sys.nextRevisionDate) <= now) {
          if (!dueNames.includes(sys.name)) {
            dueNames.push(sys.name);
          }
        }
      }
    }
  } catch (e) {
    console.warn('Error querying due spaced repetition tasks:', e);
  }

  return {
    dueRevisionsCount: dueNames.length,
    dueRevisionNames: dueNames.slice(0, 3),
  };
}

/**
 * Helper to dispatch a single browser / SW notification
 */
async function dispatchLocalNotification(title: string, options: NotificationOptions): Promise<boolean> {
  // 1. Primary approach for PWA / Mobile Chrome / Android / Desktop SW
  if ('serviceWorker' in navigator) {
    try {
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 1500)),
        ]);
      }

      if (!registration) {
        try {
          registration = await navigator.serviceWorker.register('/sw.js');
        } catch (regErr) {
          console.warn('Fallback SW registration note:', regErr);
        }
      }

      if (registration && registration.showNotification) {
        try {
          await registration.showNotification(title, options);
          return true;
        } catch (iconError) {
          console.warn('showNotification failed with custom options, retrying with basic options:', iconError);
          const { icon, badge, ...simplified } = options as any;
          await registration.showNotification(title, simplified);
          return true;
        }
      }
    } catch (e) {
      console.warn('Service worker showNotification note:', e);
    }
  }

  // 2. Fallback for Desktop browsers where new Notification() constructor is allowed
  try {
    if (typeof window !== 'undefined' && 'Notification' in window && typeof window.Notification === 'function') {
      const notif = new window.Notification(title, options);
      notif.onclick = () => {
        window.focus();
        const targetUrl = (options.data as any)?.url || '/timeline';
        if (window.location.pathname !== targetUrl) {
          window.location.href = targetUrl;
        }
      };
      return true;
    }
  } catch (e) {
    console.warn('Direct Notification constructor unavailable or restricted in this context:', e);
  }
  return false;
}

/**
 * Triggers local browser / PWA notifications for scheduled system revisions.
 */
export async function triggerSpacedRepetitionNotification(force = false): Promise<boolean> {
  const perm = getNotificationPermissionStatus();
  if (perm === 'unsupported' || perm === 'denied') {
    return false;
  }

  if (perm !== 'granted') {
    if (!force) return false;
    const requested = await requestNotificationPermission();
    if (requested !== 'granted') return false;
  }

  const settings = getNotificationSettings();
  const isEnabled = settings.enabled && settings.notifyRevisions;
  if (!isEnabled && !force) {
    return false;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  if (settings.lastNotifiedDate === todayStr && !force) {
    return false;
  }

  const tasks = await getDueSpacedRepetitionTasks();

  const notificationsToSend: Array<{ title: string; body: string; tag: string; url: string }> = [];

  if (tasks.dueRevisionsCount > 0) {
    const topicList = tasks.dueRevisionNames.join(', ');
    const count = tasks.dueRevisionsCount;
    notificationsToSend.push({
      title: 'Atlas · Spaced Repetition Due',
      body: `${count} topic revision${count > 1 ? 's' : ''} require active recall today: ${topicList}${count > 3 ? '...' : ''}. Tap to review!`,
      tag: 'atlas-revisions-due',
      url: '/timeline',
    });
  } else if (force) {
    notificationsToSend.push({
      title: 'Atlas · Notifications Calibrated',
      body: 'All spaced repetition topics are currently retained. You will be alerted when active recall intervals mature.',
      tag: 'atlas-test-notification',
      url: '/timeline',
    });
  }

  if (notificationsToSend.length === 0) {
    return false;
  }

  let sentCount = 0;
  for (const notif of notificationsToSend) {
    const sent = await dispatchLocalNotification(notif.title, {
      body: notif.body,
      tag: notif.tag,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200],
      data: {
        url: notif.url,
      },
    } as NotificationOptions);
    if (sent) sentCount++;
  }

  if (sentCount > 0 && !force) {
    saveNotificationSettings({ lastNotifiedDate: todayStr });
  }

  return sentCount > 0;
}

/**
 * PWA Install Prompt store & listeners
 */
let deferredPromptEvent: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPromptEvent = e;
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  });
}

export function isPwaInstallable(): boolean {
  return !!deferredPromptEvent;
}

export async function promptPwaInstall(): Promise<boolean> {
  if (!deferredPromptEvent) return false;
  deferredPromptEvent.prompt();
  const choiceResult = await deferredPromptEvent.userChoice;
  deferredPromptEvent = null;
  window.dispatchEvent(new CustomEvent('pwa-install-completed'));
  return choiceResult.outcome === 'accepted';
}
