import React, { useState } from 'react';
import { Award, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { SettingsRow } from './SettingsLayout';
import { Badge } from '@/components/ui/badge';
import { useAffiliate } from '@/hooks/useAffiliate';
import { AffiliatePartnerModal } from '@/features/affiliate/AffiliatePartnerModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function AffiliateSection() {
  const { isAffiliate, stats } = useAffiliate();
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  if (isAffiliate) {
    return (
      <>
        <SettingsRow
          icon={Award}
          iconBg="bg-indigo-500"
          label={
            <div className="flex items-center gap-2 flex-wrap">
              <span>Partner & Affiliate Hub</span>
              <Badge variant="outline" className="text-xs px-1.5 py-0 border-indigo-500/30 text-indigo-400 font-semibold bg-indigo-500/10">
                {stats.activeSeats > 0 ? `$${stats.earnedCommission} Accrued` : 'Verified Partner'}
              </Badge>
            </div>
          }
          chevron
          onClick={() => setPartnerModalOpen(true)}
        />

        <AffiliatePartnerModal
          open={partnerModalOpen}
          onOpenChange={setPartnerModalOpen}
        />
      </>
    );
  }

  return (
    <>
      <SettingsRow
        icon={Award}
        iconBg="bg-muted text-muted-foreground"
        label={
          <div className="flex items-center gap-2 flex-wrap">
            <span>Ambassador & Affiliate Guild</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground">
              Apply
            </Badge>
          </div>
        }
        chevron
        onClick={() => setInfoModalOpen(true)}
      />

      {/* ── Informational Modal for Candidates Who Wish to Apply ─────── */}
      <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 space-y-5 bg-card border-border/50 text-foreground shadow-2xl">
          <DialogHeader className="space-y-2 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>Campus Ambassador Program</span>
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              Become an Atlas Medical Ambassador
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Represent Atlas OS at your medical college, residency program, or study club.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/50 space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Partner Privileges</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>$50 referral bounty for every enrolled candidate</li>
                <li>Exclusive early access to experimental USMLE/NEET question sets</li>
                <li>Direct liaison channel with the clinical engineering team</li>
              </ul>
            </div>

            <p>
              Affiliate status is granted by administrators to qualified class representatives, medical tutors, and academic society leads.
            </p>
          </div>

          <div className="pt-2">
            <Button
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-10"
              onClick={() => {
                setInfoModalOpen(false);
                window.location.href = 'mailto:team@atlasmedical.app?subject=Atlas%20Medical%20Ambassador%20Application';
              }}
            >
              Contact Administration to Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
