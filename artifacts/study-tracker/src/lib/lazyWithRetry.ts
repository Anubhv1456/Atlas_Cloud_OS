import { lazy, ComponentType } from 'react';

/**
 * Robust lazy import with automatic retry and cache invalidation.
 * Recovers seamlessly from network glitches, mobile connectivity drops,
 * and Vite/Vercel chunk hash updates after new deployments.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 3,
  interval = 800
) {
  return lazy(async () => {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
      try {
        return await factory();
      } catch (error: any) {
        lastError = error;
        console.warn(`[DynamicImport] Attempt ${i + 1} failed, retrying...`, error?.message || error);
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, interval * (i + 1)));
        }
      }
    }

    // Check if the error is a classic module script or dynamic chunk fetch failure
    const isChunkOrFetchError =
      lastError?.message?.includes('dynamically imported') ||
      lastError?.message?.includes('Failed to fetch') ||
      lastError?.message?.includes('error loading dynamically imported module') ||
      lastError?.message?.includes('Loading chunk');

    if (isChunkOrFetchError && typeof window !== 'undefined') {
      const reloadSessionKey = 'atlas_dynamic_retry_' + window.location.pathname;
      const lastReload = sessionStorage.getItem(reloadSessionKey);
      
      // Auto-reload once within a 15-second window to clear stale module graph
      if (!lastReload || Date.now() - Number(lastReload) > 15000) {
        sessionStorage.setItem(reloadSessionKey, Date.now().toString());
        console.warn('[DynamicImport] Auto-reloading window to fetch fresh module assets...');
        window.location.reload();
        // Return a promise that never resolves so Suspense stays active while the browser reloads
        return new Promise<{ default: T }>(() => {});
      }
    }

    throw lastError;
  });
}
