import React, { useEffect, useState } from 'react';
import { getAllUsersForAdmin, updateUserBetaAccess, bulkUpdateUserBetaAccess, deleteUserAsAdmin } from '@/lib/admin';
import { useAuth } from '@/hooks/useAuth';
import { firestoreDb } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { formatDistanceToNow, format, differenceInDays, addDays } from 'date-fns';
import { 
  Shield, User, Mail, Calendar, Search, Copy, Check, Clock, 
  UserCheck, UserX, TriangleAlert, Users, RefreshCw, ChevronDown, Sparkles, Trash2,
  GraduationCap, Flame, Award, ArrowUpRight, Zap, Sliders, ShieldCheck, Filter, AlertCircle, Eye, Database
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'active' | 'trial' | 'expiring_soon' | 'expired' | 'locked' | 'flagged';
type ExamFilter = 'all' | 'NEET PG' | 'INICET' | 'FMGE' | 'USMLE';

export const DURATION_PRESETS = [
  { label: '15 Days (Trial Access)', value: 15, tag: '15d Trial', isTrial: true, desc: 'Fast trial evaluation / 15-day testing pass' },
  { label: '30 Days (1 Month)', value: 30, tag: '1 Month', desc: 'Standard single month' },
  { label: '60 Days (2 Months)', value: 60, tag: '2 Months', desc: 'Mid-term accelerated block' },
  { label: '90 Days (3 Months - Cohort Default)', value: 90, tag: '3 Months', desc: 'Official 2026 Cohort standard pass' },
  { label: '180 Days (6 Months)', value: 180, tag: '6 Months', desc: 'Extended residency prep' },
  { label: '365 Days (1 Year)', value: 365, tag: '1 Year', desc: 'Full academic year access' },
  { label: 'Lifetime / Permanent Access', value: null, tag: 'Lifetime', desc: 'Permanent unrestricted access' },
];

const formatTimestamp = (val: any, pattern = 'MMM d, yyyy • p', fallback = 'N/A'): string => {
  if (!val) return fallback;
  try {
    let dateObj: Date | null = null;
    if (typeof val?.toDate === 'function') {
      dateObj = val.toDate();
    } else if (typeof val?.toMillis === 'function') {
      dateObj = new Date(val.toMillis());
    } else if (typeof val?.seconds === 'number') {
      dateObj = new Date(val.seconds * 1000);
    } else if (val instanceof Date) {
      dateObj = val;
    } else if (typeof val === 'number') {
      dateObj = new Date(val);
    } else if (typeof val === 'string') {
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) {
        dateObj = parsed;
      }
    }

    if (dateObj && !isNaN(dateObj.getTime())) {
      return format(dateObj, pattern);
    }
  } catch (e) {
    console.warn('[UsersView] Failed to format timestamp:', val, e);
  }
  return fallback;
};

export function UsersView() {
  const { user: currentAuthUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [examFilter, setExamFilter] = useState<ExamFilter>('all');
  
  // Selection state for bulk actions
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal / Popover state for Granting / Duration picker
  const [grantingUser, setGrantingUser] = useState<any | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(90);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customDays, setCustomDays] = useState<number>(15);
  const [customDate, setCustomDate] = useState<string>(format(addDays(new Date(), 15), 'yyyy-MM-dd'));
  
  const [isBulkGrantOpen, setIsBulkGrantOpen] = useState(false);
  const [bulkCustomMode, setBulkCustomMode] = useState(false);
  const [bulkCustomDays, setBulkCustomDays] = useState<number>(15);
  const [selectedBulkDuration, setSelectedBulkDuration] = useState<number | null>(90);

  const [deletingUser, setDeletingUser] = useState<any | null>(null);
  const [inspectingUser, setInspectingUser] = useState<any | null>(null);

  const fetchUsers = async () => {
    setRefreshing(true);
    try {
      const u = await getAllUsersForAdmin();
      setUsers(u);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load candidate registry');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Status helper
  const getUserBetaStatus = (user: any): 'active' | 'active_lifetime' | 'trial' | 'expiring_soon' | 'expired' | 'locked' => {
    if (!user.betaAccess) return 'locked';
    
    const expiresAt = user.betaAccessExpiresAt?.toMillis 
      ? user.betaAccessExpiresAt.toMillis() 
      : typeof user.betaAccessExpiresAt === 'number' 
      ? user.betaAccessExpiresAt 
      : null;

    if (!expiresAt) return 'active_lifetime';

    const now = Date.now();
    if (now > expiresAt) {
      return 'expired';
    }

    const daysRemaining = Math.max(0, Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000)));

    if (daysRemaining <= 7) {
      return 'expiring_soon';
    }

    if (user.isTrial || daysRemaining <= 15) {
      return 'trial';
    }

    return 'active';
  };

  const getDaysRemaining = (user: any): number | null => {
    const expiresAt = user.betaAccessExpiresAt?.toMillis 
      ? user.betaAccessExpiresAt.toMillis() 
      : typeof user.betaAccessExpiresAt === 'number' 
      ? user.betaAccessExpiresAt 
      : null;

    if (!expiresAt) return null;
    const now = Date.now();
    return Math.max(0, Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000)));
  };

  // Target Exam Date Calculator
  const getExamCountdown = (user: any) => {
    const targetExam = user.targetExam || user.examTarget || 'NEET PG';
    let examDate: Date;

    if (user.targetExamDate?.toDate) {
      examDate = user.targetExamDate.toDate();
    } else if (targetExam.includes('INICET')) {
      examDate = new Date('2026-11-15');
    } else if (targetExam.includes('FMGE')) {
      examDate = new Date('2026-06-30');
    } else {
      // Default NEET PG March / July 2026
      examDate = new Date('2026-03-31');
    }

    const daysLeft = differenceInDays(examDate, new Date());
    return {
      examName: targetExam,
      daysLeft: daysLeft > 0 ? daysLeft : 0,
      examDate
    };
  };

  const openGrantModal = (user: any) => {
    setGrantingUser(user);
    setIsCustomMode(false);
    setSelectedDuration(90);
    setCustomDays(15);
    setCustomDate(format(addDays(new Date(), 15), 'yyyy-MM-dd'));
  };

  const handleGrantAccessWithDuration = async (user: any, days: number | null, isTrialParam?: boolean) => {
    try {
      const isTrial = isTrialParam ?? (days !== null && days <= 15);
      await updateUserBetaAccess(user.id, true, days, isTrial);
      setUsers(users.map(u => {
        if (u.id === user.id) {
          const now = Date.now();
          return {
            ...u,
            betaAccess: true,
            isTrial,
            betaAccessExpiresAt: days ? now + days * 24 * 60 * 60 * 1000 : null
          };
        }
        return u;
      }));
      const label = days === 15 ? '15-Day Trial Access' : days ? `${days} Days` : 'Lifetime Permanent';
      toast.success(`Beta access (${label}) granted to ${user.displayName || 'candidate'}`);
      setGrantingUser(null);
    } catch (error) {
      toast.error('Failed to update beta access.');
    }
  };

  const handleRevokeAccess = async (user: any) => {
    try {
      await updateUserBetaAccess(user.id, false);
      setUsers(users.map(u => u.id === user.id ? { ...u, betaAccess: false, betaAccessExpiresAt: null, isTrial: false } : u));
      toast.success(`Beta access revoked for ${user.displayName || 'candidate'}`);
    } catch (error) {
      toast.error('Failed to revoke beta access.');
    }
  };

  const handleBulkGrant = async (days: number | null, isTrialParam?: boolean) => {
    // Only target true student candidates for safety
    const targetIds = selectedUserIds.filter(id => {
      const u = users.find(user => user.id === id);
      return u && !u.isAdmin && id !== currentAuthUser?.uid;
    });
    if (targetIds.length === 0) return;
    try {
      const isTrial = isTrialParam ?? (days !== null && days <= 15);
      await bulkUpdateUserBetaAccess(targetIds, true, days, isTrial);
      const now = Date.now();
      setUsers(users.map(u => {
        if (targetIds.includes(u.id)) {
          return {
            ...u,
            betaAccess: true,
            isTrial,
            betaAccessExpiresAt: days ? now + days * 24 * 60 * 60 * 1000 : null
          };
        }
        return u;
      }));
      const label = days === 15 ? '15-Day Trial' : days ? `${days} Days` : 'Lifetime';
      toast.success(`Beta access (${label}) granted to ${targetIds.length} candidates`);
      setSelectedUserIds([]);
      setIsBulkGrantOpen(false);
    } catch (error) {
      toast.error('Failed to apply bulk beta access.');
    }
  };

  const handleBulkRevoke = async () => {
    // Only target true student candidates for safety
    const targetIds = selectedUserIds.filter(id => {
      const u = users.find(user => user.id === id);
      return u && !u.isAdmin && id !== currentAuthUser?.uid;
    });
    if (targetIds.length === 0) return;
    if (!confirm(`Are you sure you want to revoke access for ${targetIds.length} candidates?`)) return;
    try {
      await bulkUpdateUserBetaAccess(targetIds, false);
      setUsers(users.map(u => {
        if (targetIds.includes(u.id)) {
          return { ...u, betaAccess: false, betaAccessExpiresAt: null, isTrial: false };
        }
        return u;
      }));
      toast.success(`Beta access revoked for ${targetIds.length} candidates`);
      setSelectedUserIds([]);
    } catch (error) {
      toast.error('Failed to revoke bulk access.');
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    if (deletingUser.isAdmin || deletingUser.id === currentAuthUser?.uid) {
      toast.error('Cannot delete administrative operator profile.');
      setDeletingUser(null);
      return;
    }
    try {
      await deleteUserAsAdmin(deletingUser.id);
      setUsers(users.filter(u => u.id !== deletingUser.id));
      toast.success(`Deleted record for ${deletingUser.displayName || deletingUser.email}`);
      setDeletingUser(null);
    } catch (e) {
      toast.error('Failed to delete user.');
    }
  };

  // Anti-Sybil / Provenance Admin Handlers
  const handleApproveAmbassador = async (targetUser: any, days = 90) => {
    try {
      await updateUserBetaAccess(targetUser.id, true, days, false);
      if (firestoreDb) {
        const userRef = doc(firestoreDb, 'users', targetUser.id);
        await setDoc(userRef, {
          vaultActivationRequired: false,
          vaultApprovedByAdmin: true,
          vaultApprovedAt: new Date(),
          updatedAt: new Date()
        }, { merge: true });
      }
      const now = Date.now();
      setUsers(users.map(u => u.id === targetUser.id ? {
        ...u,
        betaAccess: true,
        isTrial: false,
        vaultActivationRequired: false,
        vaultApprovedByAdmin: true,
        betaAccessExpiresAt: now + days * 24 * 60 * 60 * 1000
      } : u));
      toast.success(`Approved Ambassador Pass (${days}d) & cleared vault flag for ${targetUser.displayName || targetUser.email}`);
      if (inspectingUser?.id === targetUser.id) setInspectingUser(null);
    } catch (e) {
      console.error(e);
      toast.error('Failed to approve ambassador access');
    }
  };

  const handleClearVaultFlag = async (targetUser: any) => {
    try {
      if (firestoreDb) {
        const userRef = doc(firestoreDb, 'users', targetUser.id);
        await setDoc(userRef, {
          vaultActivationRequired: false,
          updatedAt: new Date()
        }, { merge: true });
      }
      setUsers(users.map(u => u.id === targetUser.id ? { ...u, vaultActivationRequired: false } : u));
      toast.success(`Cleared vault activation requirement for ${targetUser.displayName || targetUser.email}`);
      if (inspectingUser?.id === targetUser.id) setInspectingUser(null);
    } catch (e) {
      console.error(e);
      toast.error('Failed to clear vault flag');
    }
  };

  const handleRevokeFraudulentBonus = async (targetUser: any) => {
    try {
      if (firestoreDb) {
        const userRef = doc(firestoreDb, 'users', targetUser.id);
        await setDoc(userRef, {
          betaAccess: false,
          betaAccessExpiresAt: null,
          isTrial: false,
          referralBonusRevoked: true,
          updatedAt: new Date()
        }, { merge: true });
      }
      setUsers(users.map(u => u.id === targetUser.id ? {
        ...u,
        betaAccess: false,
        betaAccessExpiresAt: null,
        isTrial: false,
        referralBonusRevoked: true
      } : u));
      toast.success(`Revoked bonus access & locked trial hopping for ${targetUser.displayName || targetUser.email}`);
      if (inspectingUser?.id === targetUser.id) setInspectingUser(null);
    } catch (e) {
      console.error(e);
      toast.error('Failed to revoke bonus access');
    }
  };

  // Strictly isolate student candidates: filter out admin/operator accounts from directory & stats
  const studentCandidates = users.filter(user => {
    const isUserAdmin = Boolean(user.isAdmin) || user.role === 'admin';
    const isCurrentOperator = Boolean(currentAuthUser && (user.id === currentAuthUser.uid || user.email === currentAuthUser.email));
    return !isUserAdmin && !isCurrentOperator;
  });

  const hiddenAdminCount = users.length - studentCandidates.length;

  // Filtered Candidate Roster
  const filteredUsers = studentCandidates.filter(user => {
    const status = getUserBetaStatus(user);
    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'active' ? (status === 'active' || status === 'active_lifetime' || status === 'trial' || status === 'expiring_soon') :
      activeTab === 'trial' ? status === 'trial' :
      activeTab === 'expiring_soon' ? status === 'expiring_soon' :
      activeTab === 'expired' ? status === 'expired' :
      activeTab === 'locked' ? status === 'locked' :
      activeTab === 'flagged' ? (Boolean(user.vaultActivationRequired) || Boolean(user.vaultImportProvenance)) : true;

    const targetExam = (user.targetExam || user.examTarget || 'NEET PG').toUpperCase();
    const matchesExam = 
      examFilter === 'all' ? true :
      targetExam.includes(examFilter);

    const matchesSearch = 
      (user.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.id || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTab && matchesExam && matchesSearch;
  });

  const stats = {
    total: studentCandidates.length,
    active: studentCandidates.filter(u => {
      const s = getUserBetaStatus(u);
      return s === 'active' || s === 'active_lifetime' || s === 'trial' || s === 'expiring_soon';
    }).length,
    trials: studentCandidates.filter(u => getUserBetaStatus(u) === 'trial').length,
    expiringSoon: studentCandidates.filter(u => getUserBetaStatus(u) === 'expiring_soon').length,
    expired: studentCandidates.filter(u => getUserBetaStatus(u) === 'expired').length,
    locked: studentCandidates.filter(u => getUserBetaStatus(u) === 'locked').length,
    flagged: studentCandidates.filter(u => Boolean(u.vaultActivationRequired) || Boolean(u.vaultImportProvenance)).length,
  };

  // Helper to handle custom date selection in modal
  const handleDateChange = (dateStr: string) => {
    setCustomDate(dateStr);
    const selected = new Date(dateStr);
    const diff = differenceInDays(selected, new Date());
    setCustomDays(Math.max(1, diff));
  };

  const handleCustomDaysChange = (daysVal: number) => {
    const d = Math.max(1, daysVal);
    setCustomDays(d);
    setCustomDate(format(addDays(new Date(), d), 'yyyy-MM-dd'));
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/10 border border-teal-500/20 rounded-xl">
              <GraduationCap className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Student Cohort Directory
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                Medical candidates, custom duration lifecycle management, 15-day trial grants, and exam countdowns.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedUserIds.length > 0 && (
            <div className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 p-1 rounded-xl">
              <span className="text-xs font-bold text-teal-300 px-2">{selectedUserIds.length} Selected</span>
              <button
                onClick={() => {
                  setSelectedBulkDuration(90);
                  setBulkCustomMode(false);
                  setBulkCustomDays(15);
                  setIsBulkGrantOpen(true);
                }}
                className="px-3 py-1 bg-teal-500 text-black text-xs font-bold rounded-lg hover:bg-teal-400 flex items-center gap-1"
              >
                <Zap className="w-3.5 h-3.5" />
                Grant Access
              </button>
              <button
                onClick={handleBulkRevoke}
                className="px-3 py-1 bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-lg hover:bg-rose-500/30"
              >
                Revoke
              </button>
            </div>
          )}

          <button
            onClick={fetchUsers}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl border border-border/60 bg-card hover:bg-muted text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-teal-400", refreshing && "animate-spin")} />
            <span>Sync Candidates</span>
          </button>

          {hiddenAdminCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-medium" title="Administrative operator accounts are hidden from student cohort metrics and directory">
              <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>{hiddenAdminCount} Admin profile{hiddenAdminCount > 1 ? 's' : ''} hidden</span>
            </div>
          )}
        </div>
      </div>

      {/* Cohort Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3">
        <div 
          onClick={() => setActiveTab('all')}
          className={cn(
            "p-3.5 rounded-2xl border transition-all cursor-pointer",
            activeTab === 'all' ? "bg-card border-teal-500/40 ring-1 ring-teal-500/20" : "bg-card/50 border-border/50 hover:bg-card"
          )}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Total</span>
            <Users className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">{stats.total}</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">All candidates</p>
        </div>

        <div 
          onClick={() => setActiveTab('active')}
          className={cn(
            "p-3.5 rounded-2xl border transition-all cursor-pointer",
            activeTab === 'active' ? "bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20" : "bg-card/50 border-border/50 hover:bg-card"
          )}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            <span>Active</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold mt-1 text-emerald-400">{stats.active}</div>
          <p className="text-[10px] text-emerald-500/80 mt-0.5 font-medium">Cohort active</p>
        </div>

        <div 
          onClick={() => setActiveTab('trial')}
          className={cn(
            "p-3.5 rounded-2xl border transition-all cursor-pointer",
            activeTab === 'trial' ? "bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20" : "bg-card/50 border-border/50 hover:bg-card"
          )}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
            <span>15d Trial</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold mt-1 text-amber-300">{stats.trials}</div>
          <p className="text-[10px] text-amber-500/80 mt-0.5 font-medium">Trial evaluation</p>
        </div>

        <div 
          onClick={() => setActiveTab('expiring_soon')}
          className={cn(
            "p-3.5 rounded-2xl border transition-all cursor-pointer",
            activeTab === 'expiring_soon' ? "bg-orange-500/10 border-orange-500/40 ring-1 ring-orange-500/20" : "bg-card/50 border-border/50 hover:bg-card"
          )}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-orange-400 uppercase tracking-wider">
            <span>Expiring ≤7d</span>
            <Clock className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="text-xl font-bold mt-1 text-orange-300">{stats.expiringSoon}</div>
          <p className="text-[10px] text-orange-500/80 mt-0.5">Need renewal</p>
        </div>

        <div 
          onClick={() => setActiveTab('expired')}
          className={cn(
            "p-3.5 rounded-2xl border transition-all cursor-pointer",
            activeTab === 'expired' ? "bg-rose-500/10 border-rose-500/40 ring-1 ring-rose-500/20" : "bg-card/50 border-border/50 hover:bg-card"
          )}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
            <span>Expired</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold mt-1 text-rose-300">{stats.expired}</div>
          <p className="text-[10px] text-rose-500/80 mt-0.5">Pass ended</p>
        </div>

        <div 
          onClick={() => setActiveTab('locked')}
          className={cn(
            "p-3.5 rounded-2xl border transition-all cursor-pointer",
            activeTab === 'locked' ? "bg-zinc-800 border-zinc-600 ring-1 ring-zinc-500/20" : "bg-card/50 border-border/50 hover:bg-card"
          )}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            <span>Locked</span>
            <UserX className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-xl font-bold mt-1 text-zinc-300">{stats.locked}</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">Awaiting access</p>
        </div>

        <div 
          onClick={() => setActiveTab('flagged')}
          className={cn(
            "p-3.5 rounded-2xl border transition-all cursor-pointer",
            activeTab === 'flagged' ? "bg-amber-500/15 border-amber-500/50 ring-1 ring-amber-500/30" : "bg-card/50 border-border/50 hover:bg-card"
          )}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
            <span>Flagged / Vault</span>
            <TriangleAlert className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold mt-1 text-amber-300">{stats.flagged}</div>
          <p className="text-[10px] text-amber-500/90 mt-0.5 font-medium">Provenance / Sybil</p>
        </div>
      </div>

      {/* Filter Tabs & Exam Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Status Filter Tabs */}
          <div className="p-1 bg-card border border-border/60 rounded-xl flex items-center gap-1 shrink-0">
            {([
              { id: 'all', label: `All (${stats.total})` },
              { id: 'active', label: `Active (${stats.active})` },
              { id: 'trial', label: `15d Trial (${stats.trials})` },
              { id: 'expiring_soon', label: `Expiring ≤7d (${stats.expiringSoon})` },
              { id: 'expired', label: `Expired (${stats.expired})` },
              { id: 'locked', label: `Locked (${stats.locked})` },
              { id: 'flagged', label: `Flagged (${stats.flagged})` }
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FilterTab)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-teal-500 text-black shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Exam Filter */}
          <div className="p-1 bg-card border border-border/60 rounded-xl flex items-center gap-1 shrink-0">
            {(['all', 'NEET PG', 'INICET', 'FMGE', 'USMLE'] as const).map(exam => (
              <button
                key={exam}
                onClick={() => setExamFilter(exam as ExamFilter)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                  examFilter === exam
                    ? "bg-muted text-foreground border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {exam}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate name or email..."
            className="pl-9 text-xs rounded-xl bg-card border-border/60"
          />
        </div>
      </div>

      {/* Candidates List / Table */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Loading medical candidate registry...</p>
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-4 w-10">
                    <input 
                      type="checkbox"
                      checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedUserIds(filteredUsers.map(u => u.id));
                        else setSelectedUserIds([]);
                      }}
                      className="rounded border-border/60 bg-background text-teal-500 focus:ring-teal-500"
                    />
                  </th>
                  <th className="p-4">Candidate Profile</th>
                  <th className="p-4">Target Exam Cohort</th>
                  <th className="p-4">Study Engagement</th>
                  <th className="p-4">Beta Access & Expiry</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <GraduationCap className="w-8 h-8 text-muted-foreground/30" />
                        <p className="font-semibold text-sm text-foreground">No candidate accounts found</p>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          {searchTerm || activeTab !== 'all' || examFilter !== 'all' 
                            ? "No medical candidates match the active search query or filter." 
                            : "No student candidates registered yet. Operator and team profiles are filtered out from this directory."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => {
                    const status = getUserBetaStatus(u);
                    const examInfo = getExamCountdown(u);
                    const daysRemaining = getDaysRemaining(u);
                    const isSelected = selectedUserIds.includes(u.id);

                    return (
                      <tr key={u.id} className={cn("hover:bg-muted/30 transition-colors", isSelected && "bg-teal-500/5")}>
                        <td className="p-4">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedUserIds([...selectedUserIds, u.id]);
                              else setSelectedUserIds(selectedUserIds.filter(id => id !== u.id));
                            }}
                            className="rounded border-border/60 bg-background text-teal-500 focus:ring-teal-500"
                          />
                        </td>

                        <td className="p-4 space-y-0.5">
                          <div className="font-bold text-foreground text-sm flex items-center gap-2">
                            {u.displayName || 'Medical Aspirant'}
                          </div>
                          <div className="text-muted-foreground font-mono flex items-center gap-1.5">
                            <span>{u.email}</span>
                            <button
                              onClick={() => copyToClipboard(u.email, u.id)}
                              className="text-muted-foreground hover:text-teal-400"
                              title="Copy Email"
                            >
                              {copiedId === u.id ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>

                          {(u.vaultActivationRequired || u.vaultImportProvenance) && (
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <button
                                onClick={() => setInspectingUser(u)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-[10px] hover:bg-amber-500/25 transition-all cursor-pointer"
                                title="Foreign High-Volume Vault Restored — Click to inspect provenance"
                              >
                                <TriangleAlert className="w-3 h-3 text-amber-400" />
                                <span>Imported Vault</span>
                              </button>
                              {u.vaultApprovedByAdmin && (
                                <Badge className="text-[9px] bg-teal-500/10 text-teal-300 border-teal-500/30 font-semibold">
                                  Ambassador
                                </Badge>
                              )}
                              {u.referralBonusRevoked && (
                                <Badge className="text-[9px] bg-rose-500/10 text-rose-300 border-rose-500/30 font-semibold">
                                  Bonus Revoked
                                </Badge>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-[10px] font-bold border-teal-500/30 text-teal-300 bg-teal-500/5">
                              {examInfo.examName}
                            </Badge>
                            <div className="text-[11px] text-muted-foreground font-medium">
                              ⏱️ {examInfo.daysLeft} days to exam
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                            <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{u.studyStreak || u.streak || 0}-day streak</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Registered {u.createdAt?.toDate ? formatDistanceToNow(u.createdAt.toDate(), { addSuffix: true }) : 'Recently'}
                          </div>
                          {u.referredBy && (
                            <div className="text-[10px] text-teal-400/80 font-mono mt-0.5 truncate max-w-[140px]" title={`Referred by ${u.referredBy}`}>
                              Ref: {u.referredBy}
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="space-y-1">
                            {u.vaultActivationRequired ? (
                              <Badge className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border-amber-500/40 flex items-center gap-1 w-fit">
                                <Database className="w-3 h-3 text-amber-400" /> Pass Req. (Vault)
                              </Badge>
                            ) : status === 'active_lifetime' ? (
                              <Badge className="text-[10px] font-bold bg-teal-500/10 text-teal-300 border-teal-500/30 flex items-center gap-1 w-fit">
                                <ShieldCheck className="w-3 h-3" /> Lifetime Access
                              </Badge>
                            ) : status === 'trial' ? (
                              <Badge className="text-[10px] font-bold bg-amber-500/15 text-amber-300 border-amber-500/30 flex items-center gap-1 w-fit">
                                <Sparkles className="w-3 h-3 text-amber-400" /> 15d Trial ({daysRemaining}d left)
                              </Badge>
                            ) : status === 'expiring_soon' ? (
                              <Badge className="text-[10px] font-bold bg-orange-500/20 text-orange-300 border-orange-500/40 animate-pulse flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3 text-orange-400" /> Expiring in {daysRemaining}d
                              </Badge>
                            ) : status === 'active' ? (
                              <Badge className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1 w-fit">
                                <Check className="w-3 h-3" /> Active ({daysRemaining}d left)
                              </Badge>
                            ) : status === 'expired' ? (
                              <Badge className="text-[10px] font-bold bg-rose-500/10 text-rose-400 border-rose-500/20 w-fit">
                                Expired Pass
                              </Badge>
                            ) : (
                              <Badge className="text-[10px] font-semibold bg-zinc-800 text-zinc-400 border-zinc-700 w-fit">
                                Locked / Pending
                              </Badge>
                            )}

                            {u.betaAccessExpiresAt && !u.vaultActivationRequired && (status === 'active' || status === 'trial' || status === 'expiring_soon') && (
                              <div className="text-[10px] text-muted-foreground">
                                Expires {formatTimestamp(u.betaAccessExpiresAt, 'MMM d, yyyy', '')}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* If Vault flag present, show Approve Vault button */}
                            {u.vaultActivationRequired ? (
                              <button
                                onClick={() => handleApproveAmbassador(u, 90)}
                                className="px-2.5 py-1.5 rounded-lg border border-teal-500/40 bg-teal-500/15 text-teal-300 hover:bg-teal-500/25 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                                title="Approve Ambassador Access (90d) & Clear Vault Flag"
                              >
                                <ShieldCheck className="w-3 h-3 text-teal-400" />
                                <span>Approve (90d)</span>
                              </button>
                            ) : (
                              /* 15-Day Trial Quick Button */
                              <button
                                onClick={() => handleGrantAccessWithDuration(u, 15, true)}
                                className="px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 font-semibold text-xs transition-all flex items-center gap-1"
                                title="Grant 15-Day Trial Access immediately"
                              >
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                <span>15d Trial</span>
                              </button>
                            )}

                            {/* Full Duration / Custom Picker Modal Trigger */}
                            <button
                              onClick={() => openGrantModal(u)}
                              className="px-2.5 py-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 font-semibold text-xs transition-all"
                              title="Open custom duration and presets selector"
                            >
                              <Sliders className="w-3 h-3 inline mr-1" />
                              Grant / Extend
                            </button>

                            {/* Inspect Vault Anomaly Details */}
                            {(u.vaultActivationRequired || u.vaultImportProvenance) && (
                              <button
                                onClick={() => setInspectingUser(u)}
                                className="p-1.5 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted text-amber-400 hover:text-amber-300 transition-all"
                                title="Inspect Vault Provenance & Anti-Sybil Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Contextual To Exam Date */}
                            <button
                              onClick={() => handleGrantAccessWithDuration(u, examInfo.daysLeft)}
                              className="px-2.5 py-1.5 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted text-foreground font-medium text-xs transition-all hidden lg:inline-flex items-center"
                              title={`Extend access through ${examInfo.examName} date (${examInfo.daysLeft}d)`}
                            >
                              To Exam ({examInfo.daysLeft}d)
                            </button>

                            {u.betaAccess && (
                              <button
                                onClick={() => handleRevokeAccess(u)}
                                className="px-2 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs font-semibold"
                              >
                                Revoke
                              </button>
                            )}

                            <button
                              onClick={() => setDeletingUser(u)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                              title="Delete Candidate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GRANT / MODIFY DURATION MODAL */}
      {grantingUser && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-teal-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div>
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-teal-400" />
                  Grant & Customize Beta Access
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Candidate: <strong className="text-foreground">{grantingUser.displayName || grantingUser.email}</strong>
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-teal-500/30 text-teal-400">
                {grantingUser.targetExam || 'Medical Candidate'}
              </Badge>
            </div>

            {/* Mode Toggle: Preset vs Custom Duration */}
            <div className="flex p-1 bg-muted/50 border border-border/60 rounded-xl">
              <button
                type="button"
                onClick={() => setIsCustomMode(false)}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center",
                  !isCustomMode ? "bg-teal-500 text-black font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Duration Presets & 15-Day Trial
              </button>
              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-1.5",
                  isCustomMode ? "bg-teal-500 text-black font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sliders className="w-3.5 h-3.5" />
                Custom Duration & Date
              </button>
            </div>

            {!isCustomMode ? (
              /* PRESETS LIST */
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {DURATION_PRESETS.map(opt => {
                  const isSelected = selectedDuration === opt.value;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setSelectedDuration(opt.value)}
                      className={cn(
                        "w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all group",
                        isSelected
                          ? "border-teal-500 bg-teal-500/10 text-teal-300 shadow-xs"
                          : "border-border/60 bg-background text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={cn("font-bold", isSelected ? "text-teal-200" : "text-foreground")}>
                            {opt.label}
                          </span>
                          {opt.isTrial && (
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px] font-bold">
                              Trial
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-[10px] font-mono", isSelected ? "border-teal-400 text-teal-300" : "border-border text-muted-foreground")}>
                          {opt.tag}
                        </Badge>
                        {isSelected && <Check className="w-4 h-4 text-teal-400 shrink-0" />}
                      </div>
                    </button>
                  );
                })}

                {/* Exam Target Date Preset */}
                {(() => {
                  const exam = getExamCountdown(grantingUser);
                  const isSelected = selectedDuration === exam.daysLeft;
                  return (
                    <button
                      type="button"
                      onClick={() => setSelectedDuration(exam.daysLeft)}
                      className={cn(
                        "w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all",
                        isSelected
                          ? "border-teal-500 bg-teal-500/10 text-teal-300 shadow-xs"
                          : "border-border/60 bg-background text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={cn("font-bold", isSelected ? "text-teal-200" : "text-foreground")}>
                            Until {exam.examName} Target Date ({exam.daysLeft} Days)
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Expires on exam day ({format(exam.examDate, 'MMM d, yyyy')})</p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-teal-400 shrink-0" />}
                    </button>
                  );
                })()}
              </div>
            ) : (
              /* CUSTOM DURATION CONTROLS */
              <div className="space-y-4 p-4 rounded-xl bg-background/60 border border-border/60">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
                    <span>Number of Days Access</span>
                    <span className="text-teal-400 font-mono font-bold text-xs">{customDays} Days</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number"
                      min="1"
                      value={customDays}
                      onChange={(e) => handleCustomDaysChange(parseInt(e.target.value) || 1)}
                      className="text-xs font-mono font-bold h-10 rounded-xl bg-background"
                      placeholder="e.g. 15, 45, 60"
                    />
                    {/* Quick Step Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {[7, 15, 30, 45, 60, 120].map(step => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => handleCustomDaysChange(step)}
                          className={cn(
                            "px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all",
                            customDays === step 
                              ? "bg-teal-500 text-black border-teal-500" 
                              : "bg-muted/50 border-border/50 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {step}d
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/40">
                  <label className="text-xs font-semibold text-muted-foreground uppercase block">
                    Or Pick Expiration Date
                  </label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="date"
                      min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                      value={customDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="text-xs h-10 rounded-xl bg-background"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Calculated Expiry Preview Box */}
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 space-y-1">
              <div className="text-[11px] font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Live Expiry Simulation
              </div>
              <p className="text-xs text-foreground font-medium">
                {!isCustomMode ? (
                  selectedDuration === null ? (
                    <span className="text-emerald-300 font-semibold">Permanent Lifetime Access (Never Expires)</span>
                  ) : selectedDuration === 15 ? (
                    <span>
                      <strong className="text-amber-300">15-Day Trial Pass:</strong> Expires on {format(addDays(new Date(), 15), 'EEEE, MMM d, yyyy')}
                    </span>
                  ) : (
                    <span>
                      Expires on <strong>{format(addDays(new Date(), selectedDuration), 'EEEE, MMM d, yyyy')}</strong> ({selectedDuration} days from now)
                    </span>
                  )
                ) : (
                  <span>
                    Expires on <strong>{format(addDays(new Date(), customDays), 'EEEE, MMM d, yyyy')}</strong> ({customDays} days duration • {customDays <= 15 ? 'Marked as Trial' : 'Cohort Membership'})
                  </span>
                )}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => setGrantingUser(null)}
                className="px-4 py-2 border border-border/60 rounded-xl text-xs font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const daysToApply = isCustomMode ? customDays : selectedDuration;
                  const isTrial = isCustomMode ? customDays <= 15 : selectedDuration === 15;
                  handleGrantAccessWithDuration(grantingUser, daysToApply, isTrial);
                }}
                className="px-5 py-2 bg-teal-500 text-black font-bold rounded-xl text-xs hover:bg-teal-400 shadow-md shadow-teal-950/20 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Confirm & Apply Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK GRANT MODAL */}
      {isBulkGrantOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-teal-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div>
                <h3 className="font-bold text-lg text-foreground">Bulk Grant Beta Access</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Applying access to <strong className="text-teal-400">{selectedUserIds.length} selected candidates</strong>.
                </p>
              </div>
            </div>

            {/* Mode Switch */}
            <div className="flex p-1 bg-muted/50 border border-border/60 rounded-xl">
              <button
                type="button"
                onClick={() => setBulkCustomMode(false)}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center",
                  !bulkCustomMode ? "bg-teal-500 text-black font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Presets & 15-Day Trial
              </button>
              <button
                type="button"
                onClick={() => setBulkCustomMode(true)}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-1.5",
                  bulkCustomMode ? "bg-teal-500 text-black font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sliders className="w-3.5 h-3.5" />
                Custom Days
              </button>
            </div>

            {!bulkCustomMode ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {DURATION_PRESETS.map(opt => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setSelectedBulkDuration(opt.value)}
                    className={cn(
                      "w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all",
                      selectedBulkDuration === opt.value
                        ? "border-teal-500 bg-teal-500/10 text-teal-300"
                        : "border-border/60 bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span>{opt.label}</span>
                      {opt.isTrial && (
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px]">
                          Trial
                        </Badge>
                      )}
                    </div>
                    {selectedBulkDuration === opt.value && <Check className="w-4 h-4 text-teal-400" />}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3 p-4 rounded-xl bg-background/60 border border-border/60">
                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
                  <span>Custom Duration for all selected candidates</span>
                  <span className="text-teal-400 font-mono font-bold">{bulkCustomDays} Days</span>
                </label>
                <Input 
                  type="number"
                  min="1"
                  value={bulkCustomDays}
                  onChange={(e) => setBulkCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-xs font-mono font-bold h-10 rounded-xl"
                  placeholder="e.g. 15, 45, 60"
                />
                <div className="flex items-center gap-1.5 pt-1">
                  {[7, 15, 30, 45, 60, 90, 180].map(step => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setBulkCustomDays(step)}
                      className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-mono font-bold border",
                        bulkCustomDays === step ? "bg-teal-500 text-black border-teal-500" : "bg-muted/50 text-muted-foreground border-border/40"
                      )}
                    >
                      {step}d
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => setIsBulkGrantOpen(false)}
                className="px-4 py-2 border border-border/60 rounded-xl text-xs font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const days = bulkCustomMode ? bulkCustomDays : selectedBulkDuration;
                  const isTrial = bulkCustomMode ? bulkCustomDays <= 15 : selectedBulkDuration === 15;
                  handleBulkGrant(days, isTrial);
                }}
                className="px-5 py-2 bg-teal-500 text-black font-bold rounded-xl text-xs hover:bg-teal-400 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Apply to {selectedUserIds.length} Candidates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-rose-400">Delete Candidate Record</h3>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete <strong>{deletingUser.displayName || deletingUser.email}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 border border-border/60 rounded-xl text-xs font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROVENANCE & ANTI-SYBIL INSPECTION MODAL */}
      {inspectingUser && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Vault Provenance & Sybil Inspection</h3>
                  <p className="text-[11px] text-muted-foreground">Cryptographic provenance envelope and account hopping verification</p>
                </div>
              </div>
            </div>

            {/* Target Candidate Overview */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Candidate Account</span>
                <span className="font-bold text-foreground">{inspectingUser.displayName || 'Medical Aspirant'}</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-muted-foreground">Candidate Email</span>
                <span className="text-teal-300">{inspectingUser.email}</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="text-muted-foreground">Account UID</span>
                <span className="text-muted-foreground truncate max-w-[220px]">{inspectingUser.id}</span>
              </div>
              {inspectingUser.referredBy && (
                <div className="flex items-center justify-between text-[11px] border-t border-border/40 pt-1.5 mt-1.5">
                  <span className="text-muted-foreground">Referred By Code</span>
                  <span className="font-mono text-teal-400 font-bold">{inspectingUser.referredBy}</span>
                </div>
              )}
            </div>

            {/* Provenance Origin Analysis */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>Restored Cryptographic Envelope Metadata</span>
              </h4>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Original Origin UID</span>
                  <span className="font-mono text-[11px] text-amber-300 font-bold truncate max-w-[220px]">
                    {inspectingUser.vaultImportProvenance?.foreignOriginUid || 'Self / Unknown UID'}
                  </span>
                </div>

                {inspectingUser.vaultImportProvenance?.foreignOriginEmail && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Original Origin Email</span>
                    <span className="font-mono text-[11px] text-amber-200">
                      {inspectingUser.vaultImportProvenance.foreignOriginEmail}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Export Timestamp</span>
                  <span className="text-foreground">
                    {formatTimestamp(inspectingUser.vaultImportProvenance?.exportTimestamp, 'MMM d, yyyy • p', 'N/A')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Import Timestamp</span>
                  <span className="text-foreground">
                    {formatTimestamp(inspectingUser.vaultImportProvenance?.importedAt, 'MMM d, yyyy • p', 'Recently')}
                  </span>
                </div>
              </div>
            </div>

            {/* Historical Telemetry Signature Snapshot */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Telemetry Signature Metrics (At Export Time)
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-background border border-border/60">
                  <div className="text-[10px] text-muted-foreground uppercase">Historical Study Time</div>
                  <div className="text-base font-bold text-teal-400 font-mono mt-0.5">
                    {inspectingUser.vaultImportProvenance?.metrics?.totalStudyMinutes || 0} min
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-background border border-border/60">
                  <div className="text-[10px] text-muted-foreground uppercase">Completed Topics</div>
                  <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                    {inspectingUser.vaultImportProvenance?.metrics?.completedTopics || 0}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-background border border-border/60">
                  <div className="text-[10px] text-muted-foreground uppercase">Mistake Log Entries</div>
                  <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
                    {inspectingUser.vaultImportProvenance?.metrics?.mistakeLogsCount || 0}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-background border border-border/60">
                  <div className="text-[10px] text-muted-foreground uppercase">Subjects in Vault</div>
                  <div className="text-base font-bold text-purple-400 font-mono mt-0.5">
                    {inspectingUser.vaultImportProvenance?.metrics?.subjectCount || 19}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-border/50">
              <button
                type="button"
                onClick={() => setInspectingUser(null)}
                className="w-full sm:w-auto px-4 py-2 border border-border/60 rounded-xl text-xs font-semibold hover:bg-muted"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => handleRevokeFraudulentBonus(inspectingUser)}
                className="w-full sm:w-auto px-3 py-2 border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 rounded-xl text-xs font-semibold transition-all"
                title="Revoke bonus access and lock trial hopping"
              >
                Revoke Bonus / Lock
              </button>

              <button
                type="button"
                onClick={() => handleClearVaultFlag(inspectingUser)}
                className="w-full sm:w-auto px-3 py-2 border border-border/60 bg-muted/60 hover:bg-muted text-foreground rounded-xl text-xs font-semibold transition-all"
                title="Clear flag without changing pass duration"
              >
                Clear Flag Only
              </button>

              <button
                type="button"
                onClick={() => handleApproveAmbassador(inspectingUser, 90)}
                className="w-full sm:w-auto px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black rounded-xl text-xs font-bold shadow-md shadow-teal-950/20 flex items-center justify-center gap-1.5"
                title="Grant 90-Day Ambassador Cohort Pass & clear vault flag"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Approve Ambassador (90d)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
