import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { firestoreDb } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function useOnboardingStatus() {
  const { user, loading: authLoading } = useAuth();
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    async function checkStatus() {
      if (!user) {
        setHasOnboarded(false);
        setLoading(false);
        return;
      }
      
      const localStatus = localStorage.getItem(`onboarding_completed_${user.uid}`);
      if (localStatus === 'true') {
        setHasOnboarded(true);
        setLoading(false);
        return;
      }

      if (firestoreDb) {
        try {
          const userRef = doc(firestoreDb, 'users', user.uid);
          const snap = await getDoc(userRef);
          if (snap.exists() && snap.data().onboardingCompleted) {
            localStorage.setItem(`onboarding_completed_${user.uid}`, 'true');
            setHasOnboarded(true);
          } else {
            setHasOnboarded(false);
          }
        } catch (e) {
          console.error("Error checking onboarding status", e);
          setHasOnboarded(false);
        }
      } else {
        setHasOnboarded(false);
      }
      setLoading(false);
    }

    checkStatus();
  }, [user, authLoading]);

  const markOnboarded = async () => {
    if (!user) return;
    
    if (firestoreDb) {
      try {
        const userRef = doc(firestoreDb, 'users', user.uid);
        await setDoc(userRef, { onboardingCompleted: true }, { merge: true });
      } catch (e) {
        console.error("Error granting onboarding status", e);
      }
    }
    localStorage.setItem(`onboarding_completed_${user.uid}`, 'true');
    setHasOnboarded(true);
  };

  return { hasOnboarded, loading, markOnboarded };
}
