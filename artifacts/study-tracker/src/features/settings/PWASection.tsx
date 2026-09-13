import { Download } from 'lucide-react';
import { SettingsRow } from './SettingsLayout';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function PWASection() {
  const { isStandalone, isInstallable, promptInstall } = usePWAInstall();

  if (isStandalone) return null;

  return (
    <SettingsRow
      icon={Download}
      iconBg="bg-blue-600 dark:bg-blue-500"
      label="Install App"
      chevron
      onClick={promptInstall}
    />
  );
}
