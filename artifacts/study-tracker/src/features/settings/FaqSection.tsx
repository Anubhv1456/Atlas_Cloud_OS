import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { SettingsRow } from './SettingsLayout';
import { HelpGuideModal } from '@/components/HelpGuideModal';

export function FaqSection() {
  const [modalOpen, setModalOpen] = useState(false);

  React.useEffect(() => {
    const handleOpenManual = () => setModalOpen(true);
    window.addEventListener('open-masterclass', handleOpenManual);
    window.addEventListener('open-user-manual', handleOpenManual);
    window.addEventListener('open-manual', handleOpenManual);
    return () => {
      window.removeEventListener('open-masterclass', handleOpenManual);
      window.removeEventListener('open-user-manual', handleOpenManual);
      window.removeEventListener('open-manual', handleOpenManual);
    };
  }, []);

  return (
    <>
      <SettingsRow
        icon={BookOpen}
        iconBg="bg-blue-500/10"
        iconColor="text-blue-500"
        label="User Manual and FAQs"
        chevron
        onClick={() => setModalOpen(true)}
      />

      <HelpGuideModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
