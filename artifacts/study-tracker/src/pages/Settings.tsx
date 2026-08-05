import { Link } from 'wouter';
import {
  AppearanceSection,
  PWASection,
  NotificationsSection,
  SecuritySection,
  DangerZoneSection,
  PresetsSection,
  AccountSection,
  ExamProfileSection,
  LegacyDataSection,
  FirebaseSyncSection
} from './settings';

export default function Settings() {
  return (
    <div className="min-h-full bg-background px-4 pt-10 pb-36 max-w-2xl mx-auto flex flex-col relative animate-in fade-in slide-in-from-bottom-2 duration-300">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Manage your app experience and configure your preferences.
        </p>
      </header>
      <div className="space-y-10 flex-1">
        <AccountSection />
        <ExamProfileSection />
        <FirebaseSyncSection />
        <LegacyDataSection />
        <AppearanceSection />
        <PresetsSection />
        <PWASection />
        <NotificationsSection />
        <SecuritySection />
        <DangerZoneSection />

        <div className="pt-6 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors font-medium">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors font-medium">Terms of Service</Link>
          </div>
          <Link href="/contact" className="text-primary hover:underline font-semibold">Contact Support</Link>
        </div>
      </div>
    </div>
  );
}
