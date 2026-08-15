import React from 'react';
import { Mail, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { SettingsRow } from './SettingsLayout';

export function ContactSection() {
  const [, setLocation] = useLocation();

  return (
    <SettingsRow
      icon={Mail}
      label="Contact & Support Desk"
      control={<ChevronRight className="w-4 h-4 text-muted-foreground" />}
      onClick={() => setLocation('/contact')}
    />
  );
}
