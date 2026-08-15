import React, { useState } from 'react';
import { Users, ChevronRight, Sparkles } from 'lucide-react';
import { SettingsRow } from './SettingsLayout';
import { ReferralModal } from './ReferralModal';
import { Badge } from '@/components/ui/badge';

export function ReferralSection() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <SettingsRow
        icon={Users}
        label={
          <div className="flex items-center gap-2">
            <span>Batchmate Passes</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-teal-500/30 text-teal-400 font-normal">
              +14d Bonus
            </Badge>
          </div>
        }
        control={<ChevronRight className="w-4 h-4 text-muted-foreground" />}
        onClick={() => setModalOpen(true)}
      />

      <ReferralModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
