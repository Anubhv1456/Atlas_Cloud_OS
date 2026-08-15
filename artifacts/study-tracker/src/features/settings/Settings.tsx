import React from 'react';
import {
  AccountSection,
  ExamProfileSection,
  SystemPreferencesCard,
  DataVaultSection,
  PWASection,
  FaqSection,
  FeedbackSection,
  ContactSection,
  AboutSection,
  DangerZoneSection,
} from '.';
import { SettingsBlock } from './SettingsLayout';
import { ShieldCheck, Sparkles } from 'lucide-react';

export default function Settings() {
  return (
    <div className="min-h-full bg-background px-4 sm:px-6 lg:px-8 pt-6 pb-28 md:pb-10 max-w-3xl mx-auto flex flex-col relative animate-in fade-in slide-in-from-bottom-2 duration-200">
      <header className="mb-6 border-b border-border/40 pb-4">
        <div className="flex items-center gap-1.5 text-primary text-[11px] font-bold uppercase tracking-wider mb-0.5">
          <Sparkles className="w-3.5 h-3.5" /> OS Control Center
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Manage your medical profile, exam target calibration, preferences, and local data vault.
        </p>
      </header>

      <div className="space-y-6 flex-1">
        {/* 1. Medical Student Profile Hero Card */}
        <section>
          <AccountSection />
        </section>

        {/* 2. Academic Calibration Card */}
        <section>
          <ExamProfileSection />
        </section>

        {/* 3. System Preferences Matrix */}
        <section>
          <SystemPreferencesCard />
        </section>

        {/* 4. Data Vault & Telemetry */}
        <section>
          <DataVaultSection />
        </section>

        {/* 5. Support & Legal */}
        <SettingsBlock title="Support & Legal">
          <PWASection />
          <FaqSection />
          <FeedbackSection />
          <ContactSection />
          <AboutSection />
        </SettingsBlock>

        {/* 6. Danger Zone */}
        <SettingsBlock title="Danger Zone">
          <DangerZoneSection />
        </SettingsBlock>
      </div>
    </div>
  );
}
