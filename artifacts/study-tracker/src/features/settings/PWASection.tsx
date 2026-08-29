import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { SettingsRow } from './SettingsLayout';
import { isPwaInstallable, promptPwaInstall } from '@/lib/pwaAndNotifications';
import { toast } from 'sonner';

export function PWASection() {
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone);
    
    // Also listen to the event to know when install becomes available
    const handleAvailable = () => {
       setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone);
    };
    window.addEventListener('pwa-install-available', handleAvailable);
    return () => window.removeEventListener('pwa-install-available', handleAvailable);
  }, []);

  const handlePwaInstallClick = async () => {
    if (isPwaInstallable()) {
      await promptPwaInstall();
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        toast.info("To install on iOS: tap 'Share' then 'Add to Home Screen'");
      } else {
        toast.info("Install prompt not available. Try adding from your browser menu.");
      }
    }
  };

  if (isStandalone) return null;

  return (
    <SettingsRow
      icon={Download}
      iconBg="bg-primary/10"
      iconColor="text-primary"
      label="Install App"
      chevron
      onClick={handlePwaInstallClick}
    />
  );
}
