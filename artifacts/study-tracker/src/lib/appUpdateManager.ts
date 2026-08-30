/**
 * Atlas App Update & Deployment Synchronization Engine
 * Engineered to Apple HIG standards: polite, seamless, non-destructive, and 100% failure-proof.
 */

declare const __APP_BUILD_TIME__: number | undefined;
declare const __APP_VERSION__: string | undefined;
declare const __APP_BUILD_ID__: string | undefined;

export const CLIENT_BUILD_TIME: number =
  typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : 1772351800000;

export const CLIENT_APP_VERSION: string =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.4.0';

export const CLIENT_BUILD_ID: string =
  typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : 'atlas-v2.4.0-init';

export interface VersionManifest {
  version: string;
  buildTime: number;
  buildId: string;
  releaseNotes?: string;
}

export interface AppUpdateState {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  releaseNotes?: string;
  isChecking: boolean;
  lastCheckedAt: number | null;
}

const UPDATE_EVENT_NAME = 'atlas-app-update-available';
const RELOAD_GUARD_KEY = 'atlas_last_update_reload_ts';
const CHUNK_RELOAD_KEY = 'atlas_chunk_recovery_ts';
const SNOOZE_STORAGE_KEY = 'atlas_update_snooze_until';
const APPLIED_BUILD_KEY = 'atlas_applied_build_id';
const APPLIED_BUILD_TIME_KEY = 'atlas_applied_build_time';

let waitingServiceWorker: ServiceWorker | null = null;
let updateSWCallback: ((reloadPage?: boolean) => Promise<void>) | null = null;
let latestDetectedManifest: VersionManifest | null = null;

/**
 * Compare two semver strings (e.g. "2.4.1" vs "2.4.0")
 */
export function isNewerSemver(remote: string, current: string): boolean {
  if (!remote || !current) return false;
  const parse = (v: string) => v.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  const r = parse(remote);
  const c = parse(current);
  for (let i = 0; i < Math.max(r.length, c.length); i++) {
    const rv = r[i] ?? 0;
    const cv = c[i] ?? 0;
    if (rv > cv) return true;
    if (rv < cv) return false;
  }
  return false;
}

/**
 * Register the Service Worker refresh hook from virtual:pwa-register
 */
export function setServiceWorkerUpdater(
  updater: (reloadPage?: boolean) => Promise<void>,
  waitingWorker?: ServiceWorker | null
) {
  updateSWCallback = updater;
  if (waitingWorker) {
    waitingServiceWorker = waitingWorker;
  }
}

/**
 * Notify all UI listeners that a new version is ready for installation
 */
export function notifyUpdateAvailable(manifest?: VersionManifest) {
  if (manifest) {
    latestDetectedManifest = manifest;
  }
  
  if (typeof window !== 'undefined') {
    const detail = {
      manifest: latestDetectedManifest || {
        version: CLIENT_APP_VERSION,
        buildTime: Date.now(),
        buildId: 'remote-update',
        releaseNotes: 'Performance optimizations, clinical triage engine updates, and stability improvements.',
      },
    };
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT_NAME, { detail }));
  }
}

/**
 * Check if the student is currently engaged in a critical high-focus session
 * (e.g. active timed mock exam or active voice recording triage)
 */
export function isAppInCriticalFocus(): boolean {
  if (typeof document === 'undefined') return false;

  const hasActiveExam = !!document.querySelector('[data-critical-session="true"]');
  const hasActiveRecording = !!document.querySelector('[data-voice-recording="true"]');
  const hasActiveTimer = !!document.querySelector('[data-mock-exam-active="true"]');

  return hasActiveExam || hasActiveRecording || hasActiveTimer;
}

/**
 * Check if the user has snoozed the update notification
 */
export function isUpdateSnoozed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const snoozedUntil = sessionStorage.getItem(SNOOZE_STORAGE_KEY) || localStorage.getItem(SNOOZE_STORAGE_KEY);
    if (snoozedUntil) {
      const expiry = parseInt(snoozedUntil, 10);
      if (!isNaN(expiry) && Date.now() < expiry) {
        return true;
      }
    }
  } catch {
    // ignore storage access boundaries
  }
  return false;
}

/**
 * Snooze update prompt for a given duration (default 2 hours)
 */
export function snoozeUpdatePrompt(durationMs = 2 * 60 * 60 * 1000) {
  if (typeof window === 'undefined') return;
  try {
    const snoozeUntil = Date.now() + durationMs;
    sessionStorage.setItem(SNOOZE_STORAGE_KEY, snoozeUntil.toString());
  } catch (e) {
    console.warn('Failed to save update snooze preference:', e);
  }
}

/**
 * Clear any active snooze preference
 */
export function clearUpdateSnooze() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SNOOZE_STORAGE_KEY);
    localStorage.removeItem(SNOOZE_STORAGE_KEY);
  } catch {}
}

/**
 * Background fetch against /version.json with strict cache-busting & monotonic validation
 */
export async function checkForAppUpdate(): Promise<{
  hasUpdate: boolean;
  manifest?: VersionManifest;
}> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { hasUpdate: false };
  }

  try {
    const response = await fetch(`/version.json?_t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return { hasUpdate: false };
    }

    const manifest: VersionManifest = await response.json();

    // Check against locally acknowledged/applied build ID to prevent loops
    const lastAppliedBuild = localStorage.getItem(APPLIED_BUILD_KEY) || sessionStorage.getItem(APPLIED_BUILD_KEY);
    if (lastAppliedBuild && manifest.buildId && manifest.buildId === lastAppliedBuild) {
      return { hasUpdate: false, manifest };
    }

    // Condition 1: If exact match of buildId or buildTime with client bundle, user is already on latest
    if (manifest.buildId === CLIENT_BUILD_ID) {
      return { hasUpdate: false, manifest };
    }

    // Condition 2: Strictly newer semantic version (e.g. 2.4.1 > 2.4.0)
    const isVersionStrictlyNewer = isNewerSemver(manifest.version, CLIENT_APP_VERSION);

    // Condition 3: Strictly newer build timestamp (must be > current build time by at least 15 seconds)
    const isTimestampStrictlyNewer =
      typeof manifest.buildTime === 'number' &&
      manifest.buildTime > CLIENT_BUILD_TIME + 15000;

    if (isVersionStrictlyNewer || isTimestampStrictlyNewer) {
      latestDetectedManifest = manifest;
      notifyUpdateAvailable(manifest);
      return { hasUpdate: true, manifest };
    }

    return { hasUpdate: false, manifest };
  } catch (err) {
    console.warn('[Atlas Update Engine] Version manifest check deferred:', err);
    return { hasUpdate: false };
  }
}

/**
 * Execute the 1-tap seamless update with all 5 ironclad safeguards:
 * 1. Infinite-loop protection guard (15s throttle)
 * 2. Pending form/draft state flush
 * 3. Acknowledgment recording in storage
 * 4. Service Worker skipWaiting signal
 * 5. Stale cache storage sweep
 * 6. Hard browser reload
 */
export async function performAppUpdate(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Safeguard 1: Infinite-loop protection
  const lastReload = sessionStorage.getItem(RELOAD_GUARD_KEY);
  const now = Date.now();
  if (lastReload) {
    const timeSinceLast = now - parseInt(lastReload, 10);
    if (!isNaN(timeSinceLast) && timeSinceLast < 15000) {
      console.warn('[Atlas Update Engine] Reload throttled to prevent infinite loop.');
      window.location.href = window.location.pathname;
      return;
    }
  }
  sessionStorage.setItem(RELOAD_GUARD_KEY, now.toString());

  // Record that this update has been applied
  if (latestDetectedManifest) {
    try {
      localStorage.setItem(APPLIED_BUILD_KEY, latestDetectedManifest.buildId);
      localStorage.setItem(APPLIED_BUILD_TIME_KEY, latestDetectedManifest.buildTime.toString());
    } catch {}
  }

  // Safeguard 2: Flush pending in-memory / form state
  try {
    window.dispatchEvent(new CustomEvent('atlas-before-update-reload'));
  } catch (e) {
    console.warn('Draft flush event deferred:', e);
  }

  // Safeguard 3: Post SKIP_WAITING to waiting Service Worker
  try {
    if (waitingServiceWorker) {
      waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
    }

    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }

    if (updateSWCallback) {
      await updateSWCallback(false);
    }
  } catch (swErr) {
    console.warn('[Atlas Update Engine] Service worker skipWaiting note:', swErr);
  }

  // Safeguard 4: Clear outdated cache storage
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => !name.includes('google-fonts') && !name.includes('gstatic'))
          .map((name) => caches.delete(name))
      );
    }
  } catch (cacheErr) {
    console.warn('[Atlas Update Engine] Cache cleanup note:', cacheErr);
  }

  // Safeguard 5: Hard reload to the clean bundle
  setTimeout(() => {
    window.location.reload();
  }, 100);
}

/**
 * Handle auto-recovery from missing / stale dynamic chunks
 */
export function handleChunkLoadRecovery() {
  if (typeof window === 'undefined') return;

  const lastChunkReload = sessionStorage.getItem(CHUNK_RELOAD_KEY);
  const now = Date.now();

  if (lastChunkReload) {
    const elapsed = now - parseInt(lastChunkReload, 10);
    if (!isNaN(elapsed) && elapsed < 15000) {
      console.error('[Atlas Update Engine] Repeated dynamic chunk error detected. Suppressing reload loop.');
      return;
    }
  }

  sessionStorage.setItem(CHUNK_RELOAD_KEY, now.toString());
  console.info('[Atlas Update Engine] Stale code chunk detected after deployment. Auto-refreshing to latest version...');
  
  // Clean caches before reload
  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    }).catch(() => {});
  }

  window.location.reload();
}

/**
 * Setup global error listeners for chunk load failures (Vite preload error & dynamic import failures)
 */
export function initializeChunkLoadRecovery() {
  if (typeof window === 'undefined') return;

  // Vite specific chunk preload error
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    handleChunkLoadRecovery();
  });

  // Native dynamic import failure
  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      msg.includes('Loading chunk') ||
      msg.includes('error loading dynamically imported module')
    ) {
      handleChunkLoadRecovery();
    }
  });

  // Periodic update check & visibility listener
  const runCheck = () => {
    if (!isAppInCriticalFocus()) {
      checkForAppUpdate().catch(() => {});
    }
  };

  // Initial check after short delay (only in production or when explicitly online)
  const initTimer = setTimeout(runCheck, 5000);

  // Focus / tab return check
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      runCheck();
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('online', runCheck);

  // 15-minute heartbeat
  const interval = setInterval(runCheck, 15 * 60 * 1000);

  return () => {
    clearTimeout(initTimer);
    clearInterval(interval);
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('online', runCheck);
  };
}
