import React, { useEffect, useState } from 'react';
import { getAllUsersForAdmin, updateUserBetaAccess, bulkUpdateUserBetaAccess, deleteUserAsAdmin } from '@/lib/admin';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  Shield, User, Mail, Calendar, Search, Copy, Check, Clock, 
  UserCheck, UserX, TriangleAlert, Users, RefreshCw, ChevronDown, Sparkles, Trash2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

type FilterTab = 'all' | 'active' | 'expired' | 'locked';

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
  
  // Selection state for bulk actions
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal / Popover state for Granting / Duration picker
  const [grantingUser, setGrantingUser] = useState<any | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(90); // default 90 days
  const [customDays, setCustomDays] = useState<string>('90');
  const [isBulkGrantOpen, setIsBulkGrantOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<any | null>(null);

  const fetchUsers = async () => {
    setRefreshing(true);
    try {
      const u = await getAllUsersForAdmin();
      setUsers(u);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load users');
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

  // Helper to determine status
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
      toast.success(`Beta access granted to ${user.displayName || 'user'} (${days ? `${days} days` : 'Lifetime'})`);
      setGrantingUser(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to grant beta access');
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    try {
      await updateUserBetaAccess(userId, false);
      setUsers(users.map(u => u.id === userId ? { ...u, betaAccess: false, betaAccessExpiresAt: null } : u));
      toast.success('Beta access revoked');
    } catch (error) {
      console.error(error);
      toast.error('Failed to revoke access');
    }
  };

  const handleToggleBetaAccess = async (user: any) => {
    const status = getUserBetaStatus(user);
    if (status === 'active' || status === 'active_lifetime') {
      await handleRevokeAccess(user.id);
    } else {
      // Open duration picker
      setGrantingUser(user);
      setSelectedDuration(90);
      setCustomDays('90');
    }
  };

  const handleExtendAccess = async (user: any, extraDays: number = 30) => {
    try {
      const currentExpiry = user.betaAccessExpiresAt?.toMillis 
        ? user.betaAccessExpiresAt.toMillis() 
        : typeof user.betaAccessExpiresAt === 'number' 
        ? user.betaAccessExpiresAt 
        : Date.now();
      
      const newExpiry = Math.max(Date.now(), currentExpiry) + extraDays * 24 * 60 * 60 * 1000;
      const daysFromNow = Math.round((newExpiry - Date.now()) / (24 * 60 * 60 * 1000));
      
      await updateUserBetaAccess(user.id, true, daysFromNow);
      setUsers(users.map(u => u.id === user.id ? { ...u, betaAccess: true, betaAccessExpiresAt: newExpiry } : u));
      toast.success(`Extended access by ${extraDays} days`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to extend access');
    }
  };

  // Bulk actions
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
      toast.success(`Beta access granted to ${selectedUserIds.length} user(s)`);
      setSelectedUserIds([]);
      setIsBulkGrantOpen(false);
    } catch (e) {
      console.error(e);
      toast.error('Failed bulk grant action');
    }
  };

  const handleBulkRevoke = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      await bulkUpdateUserBetaAccess(selectedUserIds, false);
      setUsers(users.map(u => {
        if (selectedUserIds.includes(u.id)) {
          return { ...u, betaAccess: false, betaAccessExpiresAt: null };
        }
        return u;
      }));
      toast.success(`Access revoked for ${selectedUserIds.length} user(s)`);
      setSelectedUserIds([]);
    } catch (e) {
      console.error(e);
      toast.error('Failed bulk revoke action');
    }
  };

    const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      await deleteUserAsAdmin(deletingUser.id);
      setUsers(users.filter(u => u.id !== deletingUser.id));
      toast.success("User deleted successfully");
      setDeletingUser(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete user");
    }
  };

  // Filter users based on search and active tab
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.targetExam || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const status = getUserBetaStatus(u);
    if (activeTab === 'active') return status === 'active' || status === 'active_lifetime';
    if (activeTab === 'expired') return status === 'expired';
    if (activeTab === 'locked') return status === 'locked';
    return true;
  });

  // Stats computation
  const stats = {
    total: users.length,
    active: users.filter(u => getUserBetaStatus(u) === 'active' || getUserBetaStatus(u) === 'active_lifetime').length,
    expired: users.filter(u => getUserBetaStatus(u) === 'expired').length,
    locked: users.filter(u => getUserBetaStatus(u) === 'locked').length,
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const toggleSelectUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter(i => i !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Users & Beta Access
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage Closed Beta duration, invitations, and moderator permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl border border-border/60 bg-card hover:bg-muted text-xs font-medium flex items-center gap-2 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div 
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'all' 
              ? 'bg-card border-primary/40 ring-1 ring-primary/20 shadow-lg shadow-primary/5' 
              : 'bg-card/50 border-border/50 hover:bg-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Users</span>
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-semibold mt-2 text-foreground">{stats.total}</div>
        </div>

        <div 
          onClick={() => setActiveTab('active')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'active' 
              ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20' 
              : 'bg-card/50 border-border/50 hover:bg-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-400">Active Beta</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-semibold mt-2 text-emerald-400">{stats.active}</div>
        </div>

        <div 
          onClick={() => setActiveTab('expired')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'expired' 
              ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20' 
              : 'bg-card/50 border-border/50 hover:bg-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-400">Expired Beta</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-semibold mt-2 text-amber-400">{stats.expired}</div>
        </div>

        <div 
          onClick={() => setActiveTab('locked')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'locked' 
              ? 'bg-zinc-500/10 border-zinc-500/40 ring-1 ring-zinc-500/20' 
              : 'bg-card/50 border-border/50 hover:bg-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Locked / Non-Beta</span>
            <UserX className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-semibold mt-2 text-zinc-300">{stats.locked}</div>
        </div>
      </div>

      {/* Quick Filters Bar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
        {/* Tabs */}
        <div className="flex items-center p-1 bg-muted/40 border border-border/40 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'all' 
                ? 'bg-card text-foreground shadow-sm border border-border/50' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Users ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'active' 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Active Beta ({stats.active})
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'expired' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Expired Beta ({stats.expired})
          </button>
          <button
            onClick={() => setActiveTab('locked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'locked' 
                ? 'bg-zinc-800 text-zinc-200 border border-zinc-700' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Locked Users ({stats.locked})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search name, email, UID, exam..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card border-border/50 rounded-xl text-xs h-9"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Floating Bulk Action Bar when items selected */}
      {selectedUserIds.length > 0 && (
        <div className="sticky top-4 z-20 p-3 px-5 rounded-2xl bg-zinc-900 border border-teal-500/30 shadow-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 font-bold text-xs flex items-center justify-center">
              {selectedUserIds.length}
            </span>
            <span className="text-xs font-medium text-zinc-200">User(s) selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkGrantOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Grant Access...
            </button>

            <button
              onClick={handleBulkRevoke}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 font-medium text-xs transition-all"
            >
              Revoke Access
            </button>

            <button
              onClick={() => setSelectedUserIds([])}
              className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border/40">
                <tr>
                  <th className="p-4 pl-5 w-10">
                    <input
                      type="checkbox"
                      checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                      onChange={handleSelectAll}
                      className="rounded border-border/60 text-teal-500 focus:ring-teal-500/30"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">User & UID</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Target Exam</th>
                  <th className="px-4 py-3 font-medium">Beta Status</th>
                  <th className="px-4 py-3 font-medium">Expires / Remaining</th>
                  <th className="px-4 py-3 font-medium text-right pr-6">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredUsers.map(user => {
                  const status = getUserBetaStatus(user);
                  const isSelected = selectedUserIds.includes(user.id);

                  let expiryText = '—';
                  let statusBadge = null;

                  if (status === 'active_lifetime') {
                    expiryText = 'Lifetime Access';
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active (Lifetime)
                      </span>
                    );
                  } else if (status === 'active') {
                    const expiresAt = user.betaAccessExpiresAt?.toMillis 
                      ? user.betaAccessExpiresAt.toMillis() 
                      : user.betaAccessExpiresAt;
                    const daysLeft = Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
                    expiryText = `${daysLeft} day${daysLeft === 1 ? '' : 's'} left (${format(new Date(expiresAt), 'dd MMM yyyy')})`;
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Active ({daysLeft}d left)
                      </span>
                    );
                  } else if (status === 'expired') {
                    const expiresAt = user.betaAccessExpiresAt?.toMillis 
                      ? user.betaAccessExpiresAt.toMillis() 
                      : user.betaAccessExpiresAt;
                    expiryText = `Expired on ${format(new Date(expiresAt), 'dd MMM yyyy')}`;
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="w-3 h-3" />
                        Expired
                      </span>
                    );
                  } else {
                    expiryText = 'No beta access';
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                        <UserX className="w-3 h-3" />
                        Locked
                      </span>
                    );
                  }

                  return (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-muted/30 transition-colors ${isSelected ? 'bg-teal-500/5' : ''}`}
                    >
                      <td className="p-4 pl-5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectUser(user.id)}
                          className="rounded border-border/60 text-teal-500 focus:ring-teal-500/30"
                        />
                      </td>

                      {/* User Info */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center font-semibold text-xs border border-teal-500/20 shrink-0">
                            {user.displayName?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate">{user.displayName || 'Anonymous Aspirant'}</div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono mt-0.5">
                              <span className="truncate max-w-[120px]">{user.id}</span>
                              <button 
                                onClick={() => copyToClipboard(user.id, `uid-${user.id}`)}
                                title="Copy UID"
                                className="hover:text-foreground p-0.5"
                              >
                                {copiedId === `uid-${user.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[160px]">{user.email || '—'}</span>
                          {user.email && (
                            <button 
                              onClick={() => copyToClipboard(user.email, `email-${user.id}`)}
                              title="Copy Email"
                              className="hover:text-foreground p-0.5"
                            >
                              {copiedId === `email-${user.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 shrink-0" />}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Target Exam */}
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted/60 text-muted-foreground border border-border/40">
                          {user.targetExam || 'NEET PG'}
                        </span>
                      </td>

                      {/* Beta Status Badge */}
                      <td className="px-4 py-3.5">
                        {statusBadge}
                      </td>

                      {/* Remaining / Expiry */}
                      <td className="px-4 py-3.5 text-muted-foreground text-[11px]">
                        {expiryText}
                      </td>

                      {/* Quick Actions */}
                      <td className="px-4 py-3.5 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {(status === 'active' || status === 'active_lifetime' || status === 'expired') && (
                            <button
                              onClick={() => handleExtendAccess(user, 30)}
                              className="px-2 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 text-[11px] font-medium transition-all"
                              title="Extend access by +30 days"
                            >
                              +30 Days
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setGrantingUser(user);
                              setSelectedDuration(90);
                              setCustomDays('90');
                            }}
                            className="px-2 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border/50 text-[11px] font-medium transition-all"
                          >
                            Set Duration
                          </button>

                          <Switch
                            checked={status === 'active' || status === 'active_lifetime'}
                            onCheckedChange={() => handleToggleBetaAccess(user)}
                          />
                          <button
                            onClick={() => setDeletingUser(user)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all ml-2"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No users found matching filter settings or query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Single User Duration Modal */}
      {grantingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-zinc-100">Grant Closed Beta Access</h3>
                <p className="text-xs text-zinc-400 mt-1">Select valid access duration for <span className="text-teal-400 font-medium">{grantingUser.displayName || grantingUser.email || grantingUser.id}</span></p>
              </div>
              <button 
                onClick={() => setGrantingUser(null)}
                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-300">Presets</label>
              <div className="grid grid-cols-1 gap-2">
                {DURATION_OPTIONS.map(opt => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      setSelectedDuration(opt.value);
                      if (opt.value) setCustomDays(opt.value.toString());
                    }}
                    className={`p-3 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition-all ${
                      selectedDuration === opt.value 
                        ? 'bg-teal-500/10 border-teal-500/40 text-teal-300 ring-1 ring-teal-500/30' 
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selectedDuration === opt.value && <Check className="w-4 h-4 text-teal-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom duration */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-zinc-400">Custom Duration (in Days)</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="3650"
                  value={customDays}
                  onChange={(e) => {
                    setCustomDays(e.target.value);
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val > 0) {
                      setSelectedDuration(val);
                    }
                  }}
                  className="bg-zinc-900 border-zinc-800 text-zinc-100 text-xs h-10 rounded-xl"
                  placeholder="e.g. 45"
                />
                <span className="text-xs text-zinc-500 shrink-0">Days</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setGrantingUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleGrantAccessWithDuration(grantingUser, selectedDuration)}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs shadow-lg shadow-teal-500/10 transition-all"
              >
                Confirm Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Grant Modal */}
      {isBulkGrantOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-zinc-100">Bulk Grant Closed Beta</h3>
                <p className="text-xs text-zinc-400 mt-1">Applying duration to <span className="text-teal-400 font-medium">{selectedUserIds.length} users</span></p>
              </div>
              <button 
                onClick={() => setIsBulkGrantOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-300">Select Duration</label>
              <div className="grid grid-cols-1 gap-2">
                {DURATION_OPTIONS.map(opt => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setSelectedDuration(opt.value)}
                    className={`p-3 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition-all ${
                      selectedDuration === opt.value 
                        ? 'bg-teal-500/10 border-teal-500/40 text-teal-300 ring-1 ring-teal-500/30' 
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selectedDuration === opt.value && <Check className="w-4 h-4 text-teal-400" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsBulkGrantOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleBulkGrant(selectedDuration)}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs shadow-lg shadow-teal-500/10 transition-all"
              >
                Apply to {selectedUserIds.length} User(s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-red-500">Delete User Account</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  You are about to permanently delete <span className="text-red-400 font-medium">{deletingUser.displayName || deletingUser.email || deletingUser.id}</span>.
                </p>
              </div>
              <button 
                onClick={() => setDeletingUser(null)}
                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-xs text-red-400 leading-relaxed">
                This action cannot be undone. All user data, progress, and settings will be permanently removed from the database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow-lg shadow-red-500/10 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Yes, Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
