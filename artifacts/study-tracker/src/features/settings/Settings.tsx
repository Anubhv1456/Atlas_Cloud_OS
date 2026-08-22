import React from 'react';
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
import { SettingsBlock } from './SettingsLayout';

export default function Settings() {
  return (
    <div className="w-full flex-1 min-h-dvh bg-background px-4 sm:px-6 lg:px-8 pt-6 pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] md:pb-16 max-w-3xl mx-auto flex flex-col relative animate-in fade-in duration-200">
      <header className="mb-6 border-b border-border/40 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Manage your student profile, exam target, preferences, AI assistant, and data backup.
        </p>
      </header>

      <div className="space-y-6 flex-1">
        {/* 1. Student Profile */}
        <section>
          <AccountSection />
        </section>

        {/* 2. Exam Target & Schedule */}
        <section>
          <ExamProfileSection />
        </section>

        {/* 3. System Preferences */}
        <section>
          <SystemPreferencesCard />
        </section>

        {/* 4. Clinical AI & Voice Assistant (Optional Free BYOK) */}
        <section>
          <AIAssistantSection />
        </section>

        {/* 4B. Device Permissions & Audio Diagnostics */}
        <section>
          <PermissionsDiagnosticsSection />
        </section>

        {/* 5. Storage & Backup */}
        <section>
          <DataVaultSection />
        </section>

        {/* 5. Study Circle, Support & Legal */}
        <SettingsBlock title="Study Circle & Support">
          <ReferralSection />
          <PWASection />
          <FaqSection />
          <FeedbackSection />
          <ContactSection />
          <AboutSection />
        </SettingsBlock>

        {/* 6. Reset Options */}
        <SettingsBlock title="Reset Options">
          <DangerZoneSection />
        </SettingsBlock>
      </div>
    </div>
  );
}
