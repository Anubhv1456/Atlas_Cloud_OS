import { useState, useEffect, useCallback } from 'react';
import { isPwaInstallable, promptPwaInstall } from '@/lib/pwaAndNotifications';

export function usePWA() {
  const [canInstallPwa, setCanInstallPwa] = useState<boolean>(isPwaInstallable());
  const [showInstallGuideModal, setShowInstallGuideModal] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(
    typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true)
  );

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  const isAndroid = typeof window !== 'undefined' && /android/i.test(navigator.userAgent);
  const isIOS = typeof window !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    const handlePwaAvail = () => setCanInstallPwa(true);
    window.addEventListener('pwa-install-available', handlePwaAvail);
    return () => window.removeEventListener('pwa-install-available', handlePwaAvail);
  }, []);

  const handlePwaInstallClick = useCallback(async () => {
    if (canInstallPwa) {
      await promptPwaInstall();
    } else {
      setShowInstallGuideModal(true);
    }
  }, [canInstallPwa]);

  const openInNewTab = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    }
  }, []);

  return { 
    canInstallPwa, 
    showInstallGuideModal, 
    setShowInstallGuideModal, 
    isStandalone, 
    isInIframe,
    isAndroid,
    isIOS,
    handlePwaInstallClick,
    openInNewTab
  };
}

