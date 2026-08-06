import { useState } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import {
  AppearanceSection,
  PWASection,
  NotificationsSection,
  SecuritySection,
  DangerZoneSection,
  AccountSection,
  ExamProfileSection,
  LegacyDataSection,
  FirebaseSyncSection,
  ClosedBetaSection,
  FaqSection,
  FeedbackSection,
  AboutSection
} from './settings';

export default function Settings() {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="min-h-full bg-background px-4 pt-8 pb-36 max-w-2xl mx-auto flex flex-col relative animate-in fade-in slide-in-from-bottom-2 duration-300">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1.5 text-xs sm:text-sm leading-relaxed">
          Manage your account, exam target, membership status, and study preferences.
        </p>
      </header>

      <div className="space-y-8 flex-1">
        {/* Tier 1: Identity & Exam Focus */}
        <div className="space-y-6">
          {/* 1. Account */}
          <AccountSection />

          {/* 2. Exam Profile */}
          <ExamProfileSection />

          {/* 3. Membership */}
          <ClosedBetaSection />
        </div>

        {/* Tier 2: Behavior & App Preferences */}
        <div className="space-y-6 pt-4 border-t border-border/40">
          {/* 4. Notifications */}
          <NotificationsSection />

          {/* 5. Appearance */}
          <AppearanceSection />

          {/* 6. Install Atlas */}
          <PWASection />
        </div>

        {/* Tier 3: Support, Legal & Advanced */}
        <div className="space-y-6 pt-4 border-t border-border/40">
          {/* 7. Help & Community */}
          <div className="space-y-6">
            <FaqSection />
            <FeedbackSection />
          </div>

          {/* 8. Privacy & Legal */}
          <AboutSection />

          {/* 9. Advanced Settings (Collapsed) */}
          <section className="pt-2">
            <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden transition-all">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setShowAdvanced(!showAdvanced)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowAdvanced(!showAdvanced);
                  }
                }}
                className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-muted/50 transition-colors text-left focus:outline-none cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 bg-muted rounded-xl text-muted-foreground">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Advanced Settings</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Cloud sync, legacy backups, developer tools & data controls
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center justify-center rounded-xl h-8 px-3 text-xs font-semibold gap-1 shrink-0 bg-secondary/80 text-secondary-foreground hover:bg-secondary">
                  {showAdvanced ? (
                    <>
                      Hide <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Show <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </div>
              </div>

              {showAdvanced && (
                <div className="p-4 sm:p-6 border-t border-border/80 space-y-8 bg-muted/20 animate-in fade-in slide-in-from-top-2 duration-200">
                  <FirebaseSyncSection />
                  <LegacyDataSection />
                  <SecuritySection />
                  <DangerZoneSection />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


