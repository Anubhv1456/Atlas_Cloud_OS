import { useRole } from './useRole';

/**
 * useAdmin Hook (P2 Performance Optimized)
 * 
 * Thin wrapper around useRole that shares the unified custom claims resolution
 * and in-memory cache, eliminating redundant Firestore reads on admins/{uid} and users/{uid}.
 */
export function useAdmin() {
  const { isAdmin, loading } = useRole();
  return { isAdmin, loading };
}

