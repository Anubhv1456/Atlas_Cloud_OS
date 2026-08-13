import React, { useEffect, useState } from 'react';
import { getAllUsersForAdmin, updateUserBetaAccess, bulkUpdateUserBetaAccess, deleteUserAsAdmin } from '@/lib/admin';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import { 
  Shield, User, Mail, Calendar, Search, Copy, Check, Clock, 
  UserCheck, UserX, TriangleAlert, Users, RefreshCw, ChevronDown, Sparkles, Trash2,
  GraduationCap, Flame, Award, ArrowUpRight, Zap
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'active' | 'expired' | 'locked';
type ExamFilter = 'all' | 'NEET PG' | 'INICET' | 'FMGE' | 'USMLE';

const DURATION_OPTIONS = [
  { label: '30 Days (1 Month)', value: 30 },
  { label: '90 Days (3 Months - Default)', value: 90 },
  { label: '180 Days (6 Months)', value: 180 },
  { label: '365 Days (1 Year)', value: 365 },
  { label: 'Lifetime / Permanent', value: null },
];

export function UsersView() {
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
  const [isBulkGrantOpen, setIsBulkGrantOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<any | null>(null);

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
  const getUserBetaStatus = (user: any) => {
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
    return 'active';
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

  const handleGrantAccessWithDuration = async (user: any, days: number | null) => {
    try {
      await updateUserBetaAccess(user.id, true, days);
      setUsers(users.map(u => {
        if (u.id === user.id) {
          const now = Date.now();
          return {
            ...u,
            betaAccess: true,
            betaAccessExpiresAt: days ? now + days * 24 * 60 * 60 * 1000 : null
          };
        }
        return u;
      }));
      toast.success(`Beta access granted to ${user.displayName || 'candidate'} (${days ? `${days} days` : 'Lifetime'})`);
      setGrantingUser(null);
    } catch (error) {
      toast.error('Failed to update beta access.');
    }
  };

  const handleRevokeAccess = async (user: any) => {
    try {
      await updateUserBetaAccess(user.id, false);
      setUsers(users.map(u => u.id === user.id ? { ...u, betaAccess: false, betaAccessExpiresAt: null } : u));
      toast.success(`Beta access revoked for ${user.displayName || 'candidate'}`);
    } catch (error) {
      toast.error('Failed to revoke beta access.');
    }
  };

  const handleBulkGrant = async (days: number | null) => {
    if (selectedUserIds.length === 0) return;
    try {
      await bulkUpdateUserBetaAccess(selectedUserIds, true, days);
      const now = Date.now();
      setUsers(users.map(u => {
        if (selectedUserIds.includes(u.id)) {
          return {
            ...u,
            betaAccess: true,
            betaAccessExpiresAt: days ? now + days * 24 * 60 * 60 * 1000 : null
          };
        }
        return u;
      }));
      toast.success(`Beta access granted to ${selectedUserIds.length} candidates (${days ? `${days} days` : 'Lifetime'})`);
      setSelectedUserIds([]);
      setIsBulkGrantOpen(false);
    } catch (error) {
      toast.error('Failed to apply bulk beta access.');
    }
  };

  const handleBulkRevoke = async () => {
    if (selectedUserIds.length === 0) return;
    if (!confirm(`Are you sure you want to revoke access for ${selectedUserIds.length} candidates?`)) return;
    try {
      await bulkUpdateUserBetaAccess(selectedUserIds, false);
      setUsers(users.map(u => {
        if (selectedUserIds.includes(u.id)) {
          return { ...u, betaAccess: false, betaAccessExpiresAt: null };
        }
        return u;
      }));
      toast.success(`Beta access revoked for ${selectedUserIds.length} candidates`);
      setSelectedUserIds([]);
    } catch (error) {
      toast.error('Failed to revoke bulk access.');
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      await deleteUserAsAdmin(deletingUser.id);
      setUsers(users.filter(u => u.id !== deletingUser.id));
      toast.success(`Deleted record for ${deletingUser.displayName || deletingUser.email}`);
      setDeletingUser(null);
    } catch (e) {
      toast.error('Failed to delete user.');
    }
  };

  // Filtered Users
  const filteredUsers = users.filter(user => {
    const status = getUserBetaStatus(user);
    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'active' ? (status === 'active' || status === 'active_lifetime') :
      activeTab === 'expired' ? status === 'expired' :
      activeTab === 'locked' ? status === 'locked' : true;

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
    total: users.length,
    active: users.filter(u => getUserBetaStatus(u) === 'active' || getUserBetaStatus(u) === 'active_lifetime').length,
    expired: users.filter(u => getUserBetaStatus(u) === 'expired').length,
    locked: users.filter(u => getUserBetaStatus(u) === 'locked').length,
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
                Medical candidates, exam countdowns, study engagement, and beta access lifecycles.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedUserIds.length > 0 && (
            <div className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 p-1 rounded-xl">
              <span className="text-xs font-bold text-teal-300 px-2">{selectedUserIds.length} Selected</span>
              <button
                onClick={() => setIsBulkGrantOpen(true)}
                className="px-3 py-1 bg-teal-500 text-black text-xs font-bold rounded-lg hover:bg-teal-400"
              >
                Grant Beta
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
        </div>
      </div>

      {/* Cohort Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div 
          onClick={() => setActiveTab('all')}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer",
            activeTab === 'all' ? "bg-card border-teal-500/40 ring-1 ring-teal-500/20" : "bg-card/50 border-border/50 hover:bg-card"
          )}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Total Registered Candidates</span>
            <Users className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{stats.total}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Medical aspirants in registry</p>
        </div>

        <div 
          onClick={() => setActiveTab('active')}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer",
            activeTab === 'active' ? "bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20" : "bg-card/50 border-border/50 hover:bg-card"
          )}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <span>Active Beta Members</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-emerald-400">{stats.active}</div>
          <p className="text-[11px] text-emerald-500/80 mt-1 font-medium">Unrestricted study OS access</p>
        </div>

        <div 
          onClick={() => setActiveTab('expired')}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer",
            activeTab === 'expired' ? "bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20" : "bg-card/50 border-border/50 hover:bg-card"
          )}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <span>Expired Access</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-amber-300">{stats.expired}</div>
          <p className="text-[11px] text-amber-500/80 mt-1">Renewal required</p>
        </div>

        <div 
          onClick={() => setActiveTab('locked')}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer",
            activeTab === 'locked' ? "bg-rose-500/10 border-rose-500/40 ring-1 ring-rose-500/20" : "bg-card/50 border-border/50 hover:bg-card"
          )}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-rose-400 uppercase tracking-wider">
            <span>Locked / Pending Beta</span>
            <UserX className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-rose-300">{stats.locked}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Awaiting approval or pass key</p>
        </div>
      </div>

      {/* Filter Tabs & Exam Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="p-1 bg-card border border-border/60 rounded-xl flex items-center gap-1">
            {(['all', 'active', 'expired', 'locked'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap",
                  activeTab === tab
                    ? "bg-teal-500 text-black shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-1 bg-card border border-border/60 rounded-xl flex items-center gap-1">
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
                  <th className="p-4">Beta Access Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredUsers.map(u => {
                  const status = getUserBetaStatus(u);
                  const examInfo = getExamCountdown(u);
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
                          {u.isAdmin && (
                            <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-[9px]">Admin</Badge>
                          )}
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
                      </td>

                      <td className="p-4">
                        <Badge className={cn(
                          "text-[10px] capitalize font-bold",
                          status === 'active' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                          status === 'active_lifetime' && "bg-teal-500/10 text-teal-300 border-teal-500/20",
                          status === 'expired' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                          status === 'locked' && "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        )}>
                          {status === 'active_lifetime' ? 'Active (Lifetime)' : status}
                        </Badge>
                        {u.betaAccessExpiresAt && status === 'active' && (
                          <div className="text-[10px] text-muted-foreground mt-1">
                            Expires {format(u.betaAccessExpiresAt.toDate ? u.betaAccessExpiresAt.toDate() : new Date(u.betaAccessExpiresAt), 'MMM d, yyyy')}
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setGrantingUser(u)}
                          className="px-2.5 py-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 font-semibold text-xs transition-all"
                        >
                          Grant / Extend
                        </button>

                        <button
                          onClick={() => handleGrantAccessWithDuration(u, examInfo.daysLeft)}
                          className="px-2.5 py-1.5 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted text-foreground font-medium text-xs transition-all"
                          title={`Extend access through ${examInfo.examName} date (${examInfo.daysLeft}d)`}
                        >
                          To Exam Date
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GRANT / MODIFY DURATION MODAL */}
      {grantingUser && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-teal-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-foreground">Grant / Extend Beta Access</h3>
            <p className="text-xs text-muted-foreground">
              Candidate: <strong>{grantingUser.displayName || grantingUser.email}</strong>
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Choose Duration</label>
              <div className="grid grid-cols-1 gap-2">
                {DURATION_OPTIONS.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setSelectedDuration(opt.value)}
                    className={cn(
                      "w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all",
                      selectedDuration === opt.value
                        ? "border-teal-500 bg-teal-500/10 text-teal-300"
                        : "border-border/60 bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <span>{opt.label}</span>
                    {selectedDuration === opt.value && <Check className="w-4 h-4 text-teal-400" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setGrantingUser(null)}
                className="px-4 py-2 border border-border/60 rounded-xl text-xs font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => handleGrantAccessWithDuration(grantingUser, selectedDuration)}
                className="px-4 py-2 bg-teal-500 text-black font-bold rounded-xl text-xs hover:bg-teal-400"
              >
                Apply Beta Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK GRANT MODAL */}
      {isBulkGrantOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-teal-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg">Bulk Grant Beta Access</h3>
            <p className="text-xs text-muted-foreground">
              Applying beta access to <strong>{selectedUserIds.length} candidates</strong>.
            </p>

            <div className="space-y-2">
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  onClick={() => handleBulkGrant(opt.value)}
                  className="w-full p-3 rounded-xl border border-border/60 bg-background hover:bg-teal-500/10 hover:border-teal-500 text-left text-xs font-semibold transition-all"
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsBulkGrantOpen(false)}
                className="px-4 py-2 border border-border/60 rounded-xl text-xs font-semibold hover:bg-muted"
              >
                Cancel
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
    </div>
  );
}
