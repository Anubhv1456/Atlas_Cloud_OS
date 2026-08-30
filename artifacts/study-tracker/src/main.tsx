import { createRoot } from 'react-dom/client';
import React, { Component, ErrorInfo, ReactNode } from 'react';
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';
import {
  initializeChunkLoadRecovery,
  setServiceWorkerUpdater,
  notifyUpdateAvailable,
} from '@/lib/appUpdateManager';

// Initialize zero-crash chunk load recovery and background update sync
initializeChunkLoadRecovery();

// Suppress ResizeObserver loop limit exceeded error & benign Vite WebSocket rejections
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && (
    event.reason.message?.includes('WebSocket') || 
    String(event.reason).includes('WebSocket')
  )) {
    event.preventDefault();
  }
});

// Suppress benign ResizeObserver notifications
window.addEventListener('error', (e) => {
  if (e.message && e.message.includes('ResizeObserver loop')) {
    e.stopImmediatePropagation();
  }
});

// Register PWA service worker with update lifecycle tracking
if ('serviceWorker' in navigator) {
  try {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.info('[PWA] New version ready in background. Surfacing update prompt.');
        notifyUpdateAvailable();
      },
      onOfflineReady() {
        console.info('[PWA] App is cached and ready for offline operation.');
      },
      onRegisteredSW(swScriptUrl: string, registration: ServiceWorkerRegistration | undefined) {
        console.log('[PWA] Service worker registered at:', swScriptUrl);
        if (registration) {
          // If a new worker is waiting and not yet applied
          if (registration.waiting && navigator.serviceWorker.controller) {
            setServiceWorkerUpdater(updateSW, registration.waiting);
            // Trigger check to ensure it's not a redundant notification
            checkForAppUpdate().catch(() => {});
          }

          // Monitor if a new worker finishes installing and moves to waiting state
          registration.addEventListener('updatefound', () => {
            const installing = registration.installing;
            if (installing) {
              installing.addEventListener('statechange', () => {
                if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                  setServiceWorkerUpdater(updateSW, installing);
                  notifyUpdateAvailable();
                }
              });
            }
          });
        }
      },
      onRegisterError(error: any) {
        console.warn('[PWA] Service worker registration note:', error);
      },
    });

    setServiceWorkerUpdater(updateSW);
  } catch (err) {
    console.warn('[PWA] registerSW call note:', err);
  }
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', fontFamily: 'sans-serif' }}>
          <h2>Application Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
