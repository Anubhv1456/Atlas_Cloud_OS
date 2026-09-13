import { useState, useEffect, useCallback } from 'react';

const COOLDOWN_DAYS = 7;
const COOLDOWN_KEY = 'pwa_prompt_dismissed_at';

export type Platform = 'ios' | 'ipados' | 'android' | 'desktop' | 'unknown';

// Global state for deferred prompt so multiple hook instances share it
let globalDeferredPrompt: any = null;

export function usePWAInstall() {
  const [isStandalone, setIsStandalone] = useState(true);
  const [isInstallable, setIsInstallable] = useState(false);
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [isWebView, setIsWebView] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkStandalone = () => {
      const matchMediaStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const navigatorStandalone = (window.navigator as any).standalone === true;
      setIsStandalone(matchMediaStandalone || navigatorStandalone);
    };
    checkStandalone();

    const ua = navigator.userAgent;
    const isIos = /iPhone|iPod/.test(ua);
    const isIpad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    
    if (isIos) setPlatform('ios');
    else if (isIpad) setPlatform('ipados');
    else if (isAndroid) setPlatform('android');
    else setPlatform('desktop');

    const isWebViewDetect = 
      /FBAV|Instagram|Line|Snapchat|WhatsApp|Telegram/i.test(ua) ||
      ((window as any).navigator?.standalone === false && !/Safari/.test(ua) && (isIos || isIpad));
    
    setIsWebView(isWebViewDetect);

    if ((isIos || isIpad) && !isWebViewDetect && !isStandalone) {
      setIsInstallable(true);
    } else if (globalDeferredPrompt) {
      setIsInstallable(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      globalDeferredPrompt = null;
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  const dismissPrompt = useCallback(() => {
    localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
  }, []);

  const promptInstall = useCallback(async () => {
    if (globalDeferredPrompt && !isWebView && platform !== 'ios' && platform !== 'ipados') {
      try {
        globalDeferredPrompt.prompt();
        const { outcome } = await globalDeferredPrompt.userChoice;
        if (outcome === 'accepted') {
          globalDeferredPrompt = null;
        }
      } catch (e) {
        console.warn('Install prompt failed', e);
        window.dispatchEvent(new CustomEvent('show-pwa-install-modal'));
      }
    } else {
      window.dispatchEvent(new CustomEvent('show-pwa-install-modal'));
    }
  }, [platform, isWebView]);

  const checkCanShowMilestonePrompt = useCallback(() => {
    if (isStandalone || !isInstallable) return false;
    
    const lastDismissed = localStorage.getItem(COOLDOWN_KEY);
    if (lastDismissed) {
      const daysSince = (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < COOLDOWN_DAYS) {
        return false;
      }
    }
    return true;
  }, [isStandalone, isInstallable]);

  return {
    isStandalone,
    isInstallable,
    platform,
    isWebView,
    promptInstall,
    dismissPrompt,
    checkCanShowMilestonePrompt
  };
}
