import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { SettingsRow } from './SettingsLayout';
import { ReferralModal } from './ReferralModal';
import { Badge } from '@/components/ui/badge';

export function ReferralSection() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <SettingsRow
        icon={Users}
        iconBg="bg-indigo-500/10"
        iconColor="text-indigo-500"
        label={
          <div className="flex items-center gap-2">
            <span>Batchmate Passes</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-teal-500/30 text-teal-400 font-normal">
              +14d Bonus
            </Badge>
          </div>
        }
        chevron
        onClick={() => setModalOpen(true)}
      />

      <ReferralModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
