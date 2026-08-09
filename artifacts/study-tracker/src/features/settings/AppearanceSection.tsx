import { Moon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/hooks/useTheme';
import { SettingsRow } from './SettingsLayout';

export function AppearanceSection() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <SettingsRow
      icon={Moon}
      label="Dark Mode"
      control={<Switch checked={isDark} onCheckedChange={toggleTheme} />}
      onClick={() => toggleTheme(!isDark)}
    />
  );
}
