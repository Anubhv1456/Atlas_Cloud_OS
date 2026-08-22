import React from 'react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import ManualAnalytics from './ManualAnalytics';
import AuditorAnalytics from './AuditorAnalytics';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function AnalyticsRouter() {
  const { flags } = useFeatureFlags();
  const isAiEnabled = flags?.isAiEnabled ?? false;

  return isAiEnabled ? (
    <ErrorBoundary fallback={<div className="p-8 text-center text-muted-foreground">Unable to load AI diagnostics.</div>}>
      <AuditorAnalytics />
    </ErrorBoundary>
  ) : <ManualAnalytics />;
}
