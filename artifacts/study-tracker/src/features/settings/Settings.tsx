import {
  AppearanceSection,
  PWASection,
  NotificationsSection,
  DangerZoneSection,
  AccountSection,
  ExamProfileSection,
  LegacyDataSection,
  FirebaseSyncSection,
  FaqSection,
  FeedbackSection,
  AboutSection
} from '.';
import { SettingsBlock } from './SettingsLayout';

export default function Settings() {
  return (
    <div className="min-h-full bg-background px-4 sm:px-6 lg:px-8 pt-8 pb-32 max-w-2xl mx-auto flex flex-col relative animate-in fade-in slide-in-from-bottom-2 duration-300">
      <header className="mb-8 border-b border-border/40 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Settings</h1>
      </header>

      <div className="space-y-8 flex-1">
        <SettingsBlock title="Profile & Focus">
          <AccountSection />
          <ExamProfileSection />
        </SettingsBlock>

        <SettingsBlock title="Preferences">
          <AppearanceSection />
          <NotificationsSection />
        </SettingsBlock>

        <SettingsBlock title="Data & Sync">
          <FirebaseSyncSection />
          <LegacyDataSection />
          <PWASection />
        </SettingsBlock>

        <SettingsBlock title="Support & Legal">
          <FeedbackSection />
          <FaqSection />
          <AboutSection />
        </SettingsBlock>

        <SettingsBlock title="Danger Zone">
          <DangerZoneSection />
        </SettingsBlock>
      </div>
    </div>
  );
}
