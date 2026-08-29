import React from 'react';
import { Mail } from 'lucide-react';
import { useLocation } from 'wouter';
import { SettingsRow } from './SettingsLayout';

export function ContactSection() {
  const [, setLocation] = useLocation();

  return (
    <SettingsRow
      icon={Mail}
      iconBg="bg-sky-500/10"
      iconColor="text-sky-500"
      label="Contact & Support Desk"
      chevron
      onClick={() => setLocation('/contact')}
    />
  );
}
