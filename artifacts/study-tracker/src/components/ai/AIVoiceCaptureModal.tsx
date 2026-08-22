import React, { useEffect } from 'react';
import { toast } from 'sonner';

export interface AIVoiceCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPrompt?: string;
  defaultMode?: 'voice' | 'silent';
}

export const AIVoiceCaptureModal: React.FC<AIVoiceCaptureModalProps> = ({
  open,
  onOpenChange,
}) => {
  useEffect(() => {
    if (open) {
      toast.info('Voice capture has been unified into the omnipresent Push-to-Talk AI Co-Pilot bar below.');
      onOpenChange(false);
    }
  }, [open, onOpenChange]);

  return null;
};
