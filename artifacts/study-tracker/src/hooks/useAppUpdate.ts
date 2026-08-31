import { useState, useEffect, useCallback } from 'react';
import {
  checkForAppUpdate,
  performAppUpdate,
  isAppInCriticalFocus,
  isUpdateSnoozed,
  snoozeUpdatePrompt,
  clearUpdateSnooze,
  CLIENT_APP_VERSION,
  VersionManifest,
} from '@/lib/appUpdateManager';
import { toast } from 'sonner';

export function useAppUpdate() {
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);
  const [latestVersion, setLatestVersion] = useState<string>(CLIENT_APP_VERSION);
  const [releaseNotes, setReleaseNotes] = useState<string>(
    'Performance optimizations, clinical triage engine updates, and spaced repetition improvements.'
  );
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(isUpdateSnoozed());

  const handleUpdateDetected = useCallback((manifest?: VersionManifest) => {
    if (manifest?.version) {
      setLatestVersion(manifest.version);
    }
    if (manifest?.releaseNotes) {
      setReleaseNotes(manifest.releaseNotes);
    }

    // If student is in the middle of a critical session, delay surfacing the UI
    if (isAppInCriticalFocus()) {
      const checkFocusInterval = setInterval(() => {
        if (!isAppInCriticalFocus()) {
          clearInterval(checkFocusInterval);
          if (!isUpdateSnoozed()) {
            setHasUpdate(true);
            setIsDismissed(false);
          }
        }
      }, 5000);
      return;
    }

    if (!isUpdateSnoozed()) {
      setHasUpdate(true);
      setIsDismissed(false);
    }
  }, []);

  useEffect(() => {
    // Listen for update events dispatched by SW or version poller
    const onUpdateEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ manifest?: VersionManifest }>;
      handleUpdateDetected(customEvent.detail?.manifest);
    };

    window.addEventListener('atlas-app-update-available', onUpdateEvent);

    return () => {
      window.removeEventListener('atlas-app-update-available', onUpdateEvent);
    };
  }, [handleUpdateDetected]);

  // Primary action: Apply update immediately
  const applyUpdate = useCallback(async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    toast.loading('Applying Atlas update...', { duration: 3000 });

    try {
      await performAppUpdate();
    } catch (err) {
      console.error('Update execution failed:', err);
      setIsUpdating(false);
      toast.error('Update failed to complete automatically. Refreshing page...');
      window.location.reload();
    }
  }, [isUpdating]);

  // Secondary action: Snooze update prompt
  const dismissUpdate = useCallback(() => {
    setIsDismissed(true);
    setHasUpdate(false);
    snoozeUpdatePrompt(2 * 60 * 60 * 1000); // Snooze for 2 hours
    toast.info('Update deferred. You can update anytime from Settings.', {
      duration: 3500,
    });
  }, []);

  // Manual Check for Updates from Settings
  const checkForUpdatesManually = useCallback(async () => {
    if (isChecking) return;
    setIsChecking(true);
    clearUpdateSnooze();

    const toastId = toast.loading('Checking for updates...');

    try {
      const result = await checkForAppUpdate();
      setIsChecking(false);

      if (result.hasUpdate) {
        setHasUpdate(true);
        setIsDismissed(false);
        if (result.manifest?.version) {
          setLatestVersion(result.manifest.version);
        }
        toast.success(`Atlas Update Available: v${result.manifest?.version || latestVersion}`, {
          id: toastId,
          description: 'A new version with the latest improvements is ready to install.',
          action: {
            label: 'Update Now',
            onClick: () => applyUpdate(),
          },
        });
      } else {
        toast.success('Atlas is Up to Date', {
          id: toastId,
          description: `You are running the latest version (v${CLIENT_APP_VERSION}).`,
        });
      }
    } catch {
      setIsChecking(false);
      toast.error('Could not check for updates. Please check your internet connection.', {
        id: toastId,
      });
    }
  }, [isChecking, applyUpdate]);

  return {
    hasUpdate: hasUpdate && !isDismissed,
    latestVersion,
    currentVersion: CLIENT_APP_VERSION,
    releaseNotes,
    isUpdating,
    isChecking,
    isDismissed,
    applyUpdate,
    dismissUpdate,
    checkForUpdatesManually,
  };
}
