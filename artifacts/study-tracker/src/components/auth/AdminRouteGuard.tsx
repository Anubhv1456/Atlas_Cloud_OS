import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAdmin } from '@/hooks/useAdmin';
import { AtlasLoadingScreen } from '@/components/AtlasLoadingScreen';

interface AdminRouteGuardProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

export function AdminRouteGuard({ children, fallbackPath = '/' }: AdminRouteGuardProps) {
  const { isAdmin, loading } = useAdmin();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !isAdmin) {
      setLocation(fallbackPath, { replace: true });
    }
  }, [loading, isAdmin, fallbackPath, setLocation]);

  if (loading) {
    return <AtlasLoadingScreen fullScreen message="Verifying authorization..." />;
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}

export default AdminRouteGuard;
