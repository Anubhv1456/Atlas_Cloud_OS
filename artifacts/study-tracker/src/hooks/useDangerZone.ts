import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { purgeCompleteDataVault, PurgeVaultResult } from '@/lib/vaultSync';
import { toast } from 'sonner';

export function useDangerZone() {
  const { user } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCompletionCard, setShowCompletionCard] = useState(false);
  const [resetResult, setResetResult] = useState<PurgeVaultResult | null>(null);

  const handleDeleteAll = useCallback(async () => {
    try {
      setIsDeleting(true);
      const result = await purgeCompleteDataVault(user);
      setResetResult(result);
      setShowDeleteConfirm(false);
      setShowCompletionCard(true);
      toast.success('Workspace and Data Vault reset to clean starting state.');
    } catch (err: any) {
      console.error('[DangerZone] Purge failed:', err);
      toast.error('Failed to reset data vault', {
        description: err?.message || 'An unexpected error occurred while purging workspace records.'
      });
    } finally {
      setIsDeleting(false);
    }
  }, [user]);

  return {
    showDeleteConfirm,
    setShowDeleteConfirm,
    isDeleting,
    showCompletionCard,
    setShowCompletionCard,
    resetResult,
    handleDeleteAll
  };
}

