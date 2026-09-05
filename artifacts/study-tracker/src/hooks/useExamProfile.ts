import { useState, useEffect, useCallback } from 'react';
import { 
  ExamProfile, 
  getLocalExamProfile, 
  fetchExamProfile, 
  saveExamProfile as saveProfileLib 
} from '@/lib/examProfile';
import { useAuth } from './useAuth';
import { db } from '@/db';

const LISTENERS = new Set<() => void>();

function notifyListeners() {
  LISTENERS.forEach(fn => fn());
}

export function useExamProfile() {
  const { user } = useAuth();
  const local = getLocalExamProfile();
  if (local.targetExam) db.switchWorkspace(local.targetExam);
  const [profile, setProfile] = useState<ExamProfile>(local);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const data = await fetchExamProfile(user?.uid);
    setProfile(data);
    if (data.targetExam) db.switchWorkspace(data.targetExam);
    setLoading(false);
  }, [user?.uid]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const handleChange = () => {
      const p = getLocalExamProfile();
      if (p.targetExam) db.switchWorkspace(p.targetExam);
      setProfile(p);
    };
    LISTENERS.add(handleChange);
    return () => {
      LISTENERS.delete(handleChange);
    };
  }, []);

  const updateProfile = async (newProfile: Partial<ExamProfile>) => {
    const updated = { ...profile, ...newProfile };
    setProfile(updated);
    if (updated.targetExam) db.switchWorkspace(updated.targetExam);
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
