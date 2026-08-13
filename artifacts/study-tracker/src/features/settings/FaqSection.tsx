import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import { SettingsRow } from './SettingsLayout';
import { HelpGuideModal } from '@/components/HelpGuideModal';

export function FaqSection() {
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
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
        label="User Manual and FAQs"
        control={<ChevronRight className="w-4 h-4 text-muted-foreground" />}
        onClick={() => setModalOpen(true)}
      />

      <HelpGuideModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}

