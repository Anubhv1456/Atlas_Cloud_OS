import { useState } from 'react';
import { ShieldCheck, FileText, ExternalLink, AlertTriangle, ShieldAlert } from 'lucide-react';
import { SettingsRow } from './SettingsLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function AboutSection() {
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);

  return (
    <>
      <SettingsRow
        icon={AlertTriangle}
        iconBg="bg-amber-500"
        label="Medical & Educational Disclaimer"
        value="View Terms"
        chevron
        onClick={() => setIsDisclaimerOpen(true)}
      />
      <SettingsRow
        icon={ShieldCheck}
        iconBg="bg-emerald-600 dark:bg-emerald-500"
        label="Privacy Policy"
        control={<ExternalLink className="w-4 h-4 text-muted-foreground/50" />}
        onClick={() => window.open('/privacy', '_blank')}
      />
      <SettingsRow
        icon={FileText}
        iconBg="bg-blue-600 dark:bg-blue-500"
        label="Terms of Service"
        isLast
        control={<ExternalLink className="w-4 h-4 text-muted-foreground/50" />}
        onClick={() => window.open('/terms', '_blank')}
      />

      <Dialog open={isDisclaimerOpen} onOpenChange={setIsDisclaimerOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-6 bg-card border-border/80 shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              Statutory Medical & Educational Disclaimer
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Please review the statutory terms governing the academic use of Atlas Medical Operating System.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed max-h-[55vh] overflow-y-auto pr-2 my-2 border-y border-border/40 py-3">
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-medium space-y-1">
              <p className="font-bold uppercase tracking-wider text-[11px]">Strictly for Medical Education & Licensing Prep</p>
              <p>Atlas is not a certified medical device and must never be utilized as a substitute for professional clinical judgment, diagnosis, or patient management.</p>
            </div>

            <section className="space-y-1.5">
              <h4 className="font-bold text-foreground">1. Academic & Revision Scope</h4>
              <p>
                Atlas is designed solely as an academic revision aid, spaced-decay routine calculator, and performance analytics tool for medical students and postgraduate candidates preparing for competitive medical examinations (including NEET PG, INI-CET, FMGE, USMLE, and MBBS professional exams).
              </p>
            </section>

            <section className="space-y-1.5">
              <h4 className="font-bold text-foreground">2. No Doctor-Patient Relationship</h4>
              <p>
                Use of this application, including its clinical quizzing algorithms, high-yield mistake ledgers, drug guidelines, and conversational AI assistant, does not establish a doctor-patient relationship or constitute clinical advice.
              </p>
            </section>

            <section className="space-y-1.5">
              <h4 className="font-bold text-foreground">3. AI & Clinical Pharmacology Guidance</h4>
              <p>
                All drug choices, diagnostic criteria, dosing heuristics, and mnemonic algorithms presented by the AI assistant or community ontology reflect standard board-exam high-yield conventions. Medical knowledge evolves rapidly; practitioners and students must always verify against official institutional guidelines, prescribing compendia, and clinical hospital protocols.
              </p>
            </section>

            <section className="space-y-1.5">
              <h4 className="font-bold text-foreground">4. Limitation of Liability</h4>
              <p>
                Under no circumstances shall Atlas, its authors, or contributors be held liable for any clinical decisions, therapeutic interventions, or medical errors arising from information reviewed within this application.
              </p>
            </section>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => setIsDisclaimerOpen(false)}
              className="rounded-xl px-5 font-semibold text-xs h-9 cursor-pointer"
            >
              I Understand & Acknowledge
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
