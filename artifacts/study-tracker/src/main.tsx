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
  checkForAppUpdate,
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
const _setupResizeObserverLoopFix = () => {
  const _windowError = window.onerror;
  window.onerror = function (msg, url, line, col, error) {
    if (typeof msg === 'string' && msg.includes('ResizeObserver loop')) {
      return true;
    }
    if (_windowError) return _windowError(msg, url, line, col, error);
  };
  
  window.addEventListener('error', (e) => {
    if (e.message && e.message.includes('ResizeObserver loop')) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, { capture: true });
};
_setupResizeObserverLoopFix();

// Also suppress it from console.error to avoid React/Vite overlays
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('ResizeObserver loop')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

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
      const isChunkError = this.state.error?.message?.includes('module script') || this.state.error?.message?.includes('dynamically imported');
      
      return (
        <div style={{ padding: 40, fontFamily: 'sans-serif', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
            {isChunkError ? 'App Update Ready' : 'Application Error'}
          </h2>
          <p style={{ color: '#666', marginBottom: 24 }}>
            {isChunkError 
              ? 'A new version of the application has been deployed. Please refresh to load the latest modules.'
              : 'An unexpected error occurred while rendering the application.'}
          </p>
          
          <button 
            onClick={() => {
              // Clear caches before reloading
              if ('caches' in window) {
                caches.keys().then((keys) => {
                  keys.forEach((key) => caches.delete(key));
                }).catch(() => {});
              }
              window.location.href = window.location.pathname;
            }}
            style={{ padding: '10px 20px', background: '#14b8a6', color: 'white', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Reload Application
          </button>
          
          {!isChunkError && (
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, marginTop: 40, textAlign: 'left', background: '#f5f5f5', padding: 16, borderRadius: 8, color: '#ef4444' }}>
              {this.state.error?.toString()}
            </pre>
          )}
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
