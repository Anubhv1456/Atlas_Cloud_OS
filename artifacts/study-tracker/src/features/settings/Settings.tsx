import React from 'react';

declare const __APP_VERSION__: string;
import {
  AccountSection,
  ExamProfileSection,
  SystemPreferencesCard,
  AIAssistantSection,
  PermissionsDiagnosticsSection,
  DataVaultSection,
  PWASection,
  FaqSection,
  FeedbackSection,
  ContactSection,
  ReferralSection,
  AboutSection,
  DangerZoneSection,
} from '.';
import { SettingsSection, SettingsRow } from './SettingsLayout';
import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';

export default function Settings() {
  const { user, logout } = useAuth();

  return (
    <div className="w-full flex-1 min-h-dvh bg-background px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] md:pb-16 max-w-2xl mx-auto flex flex-col relative animate-in fade-in duration-200 space-y-6 overflow-x-hidden">
      {/* ── Apple-Grade Large Title Header ───────────────────────────────── */}
      <header className="px-1 pt-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
      </header>

      {/* ── Section 1: Apple Profile & Medical Identity ─────────────────── */}
      <SettingsSection>
        <AccountSection />
      </SettingsSection>

      {/* ── Section 2: Study Plan & Pacing ───────────────────────────────── */}
      <SettingsSection title="Academic Target & Regimen">
        <ExamProfileSection />
      </SettingsSection>

      {/* ── Section 3: General System Preferences ─────────────────────────── */}
      <SettingsSection title="General">
        <SystemPreferencesCard />
      </SettingsSection>

      {/* ── Section 4: Intelligence & Hardware ───────────────────────────── */}
      <SettingsSection title="Intelligence & Diagnostics">
        <AIAssistantSection />
        <PermissionsDiagnosticsSection />
      </SettingsSection>

      {/* ── Section 5: Data Vault & Sync ─────────────────────────────────── */}
      <SettingsSection title="Storage & Backup">
        <DataVaultSection />
      </SettingsSection>

      {/* ── Section 6: Community & Support ───────────────────────────────── */}
      <SettingsSection title="Community & Support">
        <ReferralSection />
        <PWASection />
        <FaqSection />
        <FeedbackSection />
        <ContactSection />
        <AboutSection />
      </SettingsSection>

      {/* ── Section 7: Account Actions & Reset ────────────────────────────── */}
      <SettingsSection title="Account & Reset">
        {user && (
          <SettingsRow
            icon={LogOut}
            iconBg="bg-rose-500/10"
            iconColor="text-rose-500"
            label="Sign Out of Atlas"
            destructive
            onClick={logout}
          />
        )}
        <DangerZoneSection />
      </SettingsSection>

      {/* ── Footer Attribution ────────────────────────────────────────────── */}
      <footer className="text-center text-xs text-muted-foreground/60 py-4 select-none">
        Atlas Medical Operating System • Version {typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.1.0"}
      </footer>
    </div>
  );
}
