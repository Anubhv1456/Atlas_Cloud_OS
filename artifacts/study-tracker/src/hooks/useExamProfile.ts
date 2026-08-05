import { useState, useEffect, useCallback } from 'react';
import { 
  ExamProfile, 
  getLocalExamProfile, 
  fetchExamProfile, 
  saveExamProfile as saveProfileLib 
} from '@/lib/examProfile';
import { useAuth } from './useAuth';

const LISTENERS = new Set<() => void>();

function notifyListeners() {
  LISTENERS.forEach(fn => fn());
}

export function useExamProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ExamProfile>(getLocalExamProfile());
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const data = await fetchExamProfile(user?.uid);
    setProfile(data);
    setLoading(false);
  }, [user?.uid]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const handleChange = () => {
      setProfile(getLocalExamProfile());
    };
    LISTENERS.add(handleChange);
    return () => {
      LISTENERS.delete(handleChange);
    };
  }, []);

  const updateProfile = async (newProfile: Partial<ExamProfile>) => {
    const updated = { ...profile, ...newProfile };
    setProfile(updated);
    await saveProfileLib(updated, user?.uid);
    notifyListeners();
  };

  return {
    profile,
    loading,
    updateProfile,
    isConfigured: !!profile.targetExam,
  };
}
