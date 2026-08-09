import { createRoot } from 'react-dom/client';
import React, { Component, ErrorInfo, ReactNode } from 'react';
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// Suppress ResizeObserver loop limit exceeded error & benign Vite WebSocket rejections
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && (
    event.reason.message?.includes('WebSocket') || 
    String(event.reason).includes('WebSocket')
  )) {
    event.preventDefault();
  }
});

const _ResizeObserver = window.ResizeObserver;
window.ResizeObserver = class ResizeObserver extends _ResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    super((entries, observer) => {
      window.requestAnimationFrame(() => {
        callback(entries, observer);
      });
    });
  }
};

// Register PWA service worker with auto-update in production builds
if (import.meta.env.PROD) {
  try {
    registerSW({
      immediate: true,
      onRegisteredSW(swScriptUrl: string, registration: ServiceWorkerRegistration | undefined) {
        console.log('[PWA] Service worker registered successfully at:', swScriptUrl);
      },
      onRegisterError(error: any) {
        console.warn('[PWA] Service worker registration error:', error);
      },
    });
  } catch (err) {
    console.warn('[PWA] registerSW call failed:', err);
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
