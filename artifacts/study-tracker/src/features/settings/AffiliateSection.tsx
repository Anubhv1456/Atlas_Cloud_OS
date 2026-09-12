import React, { useState, useEffect } from 'react';
import { Award, Sparkles, ExternalLink, ShieldCheck, CheckCircle2, Loader2, Clock } from 'lucide-react';
import { SettingsRow } from './SettingsLayout';
import { Badge } from '@/components/ui/badge';
import { useAffiliate } from '@/hooks/useAffiliate';
import { useAuth } from '@/hooks/useAuth';
import { firestoreDb } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, limit, serverTimestamp } from 'firebase/firestore';
import { AffiliatePartnerModal } from '@/features/affiliate/AffiliatePartnerModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function AffiliateSection() {
  const { user } = useAuth();
  const { isAffiliate, stats, config } = useAffiliate();
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  
  const [applicationStatus, setApplicationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [checkingStatus, setCheckingStatus] = useState(true);
  
  const [institution, setInstitution] = useState('');
  const [role, setRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !firestoreDb) {
      setCheckingStatus(false);
      return;
    }
    
    if (isAffiliate) {
      setApplicationStatus('approved');
      setCheckingStatus(false);
      return;
    }

    const checkApp = async () => {
      try {
        const q = query(
          collection(firestoreDb, 'ambassador_applications'),
          where('userId', '==', user.uid),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const doc = snap.docs[0];
          setApplicationStatus(doc.data().status || 'pending');
        } else {
          setApplicationStatus('none');
        }
      } catch (err) {
        console.error('Failed to check application status:', err);
      } finally {
        setCheckingStatus(false);
      }
    };
    checkApp();
  }, [user, isAffiliate]);

  const handleSubmitApplication = async () => {
    if (!user || !firestoreDb) return;
    if (!institution.trim() || !role.trim()) {
      toast.error('Please fill out all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestoreDb, 'ambassador_applications'), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || 'Unknown',
        institution: institution.trim(),
        role: role.trim(),
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setApplicationStatus('pending');
      toast.success('Application submitted successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAffiliate) {
    return (
      <>
        <SettingsRow
          icon={Award}
          iconBg="bg-indigo-500"
          label={
            <div className="flex items-center gap-2 flex-wrap">
              <span>Partner & Ambassador Hub</span>
              <Badge variant="outline" className="text-xs px-1.5 py-0 border-indigo-500/30 text-indigo-400 font-semibold bg-indigo-500/10">
                'Verified Partner'
              </Badge>
            </div>
          }
          chevron
          onClick={() => setPartnerModalOpen(true)}
        />

        <AffiliatePartnerModal
          open={partnerModalOpen}
          onOpenChange={setPartnerModalOpen}
        />
      </>
    );
  }

  return (
    <>
      <SettingsRow
        icon={Award}
        iconBg="bg-muted text-muted-foreground"
        label={
          <div className="flex items-center gap-2 flex-wrap">
            <span>Medical Ambassador Program</span>
            {applicationStatus === 'pending' ? (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/30 text-amber-500 bg-amber-500/10">
                Pending Review
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground">
                Apply
              </Badge>
            )}
          </div>
        }
        chevron
        onClick={() => setInfoModalOpen(true)}
      />

      <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen}>
        <DialogContent className="max-w-md rounded-xl p-6 space-y-5 bg-card border-border/50 text-foreground shadow-2xl">
          <DialogHeader className="space-y-2 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>Campus Ambassador Program</span>
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              Become an Atlas Medical Ambassador
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Represent Atlas OS at your medical college, residency program, or study club.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Partner Privileges</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>Free lifetime premium access for you and selected peers</li>
                <li>Exclusive early access to experimental USMLE/NEET question sets</li>
                <li>Direct liaison channel with the clinical engineering team</li>
                <li>Official resume-building experience and certificate of contribution</li>
              </ul>
            </div>

            <p>
              Ambassador status is granted by administrators to qualified class representatives, medical tutors, and academic society leads.
            </p>
          </div>

          <div className="pt-2">
            {checkingStatus ? (
               <Button disabled className="w-full rounded-xl bg-muted text-muted-foreground h-10">
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking Status...
               </Button>
            ) : applicationStatus === 'pending' ? (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 flex items-center justify-center gap-2 text-sm font-semibold">
                <Clock className="w-4 h-4" /> Application Under Review
              </div>
            ) : applicationStatus === 'approved' ? (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center justify-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" /> You are an Ambassador
              </div>
            ) : (
              <div className="space-y-4 pt-2 border-t border-border/40">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="institution" className="text-xs font-semibold">Medical Institution / Program</Label>
                    <Input 
                      id="institution" 
                      placeholder="e.g. Harvard Medical School" 
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="bg-background text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="role" className="text-xs font-semibold">Your Role / Title</Label>
                    <Input 
                      id="role" 
                      placeholder="e.g. Class Representative, MS2" 
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="bg-background text-xs"
                    />
                  </div>
                </div>
                <Button
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-10"
                  onClick={handleSubmitApplication}
                  disabled={isSubmitting || !institution.trim() || !role.trim()}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Submit Application'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
