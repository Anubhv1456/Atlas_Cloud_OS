import { ShieldCheck, FileText, ExternalLink } from 'lucide-react';
import { SettingsRow } from './SettingsLayout';

export function AboutSection() {
  return (
    <>
      <SettingsRow
        icon={ShieldCheck}
        label="Privacy Policy"
        control={<ExternalLink className="w-4 h-4 text-muted-foreground" />}
        onClick={() => window.open('/privacy', '_blank')}
      />
      <SettingsRow
        icon={FileText}
        label="Terms of Service"
        control={<ExternalLink className="w-4 h-4 text-muted-foreground" />}
        onClick={() => window.open('/terms', '_blank')}
      />
    </>
  );
}
