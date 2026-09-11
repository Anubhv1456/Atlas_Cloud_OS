import React, { useEffect, useState, useCallback } from 'react';
import { 
  Users, Award, ShieldCheck, Mail, Search, ChevronDown, CheckCircle2, 
  Trash2, X, MoreVertical, Eye, Lock, Clock, CalendarPlus, Sparkles, RefreshCw
} from 'lucide-react';
import { 
  getAllUsersForAdmin, updateUserBetaAccess, bulkUpdateUserBetaAccess, 
  deleteUserAsAdmin, updateAffiliateStatus 
} from '@/lib/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Tab = 'candidates' | 'affiliates';
type StatusFilter = 'all' | 'active' | 'trial' | 'expired';

export function DirectoryView() {
  const { startImpersonation } = useImpersonation();
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('candidates');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [affiliateFilter, setAffiliateFilter] = useState('all');

  // Batch Grant State
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchEmails, setBatchEmails] = useState('');
  const [batchAffiliate, setBatchAffiliate] = useState('none');
  const [batchPlan, setBatchPlan] = useState<'trial_14' | 'trial_7' | 'trial_30' | 'lifetime'>('trial_14');

  // Custom Trial Modal State
  const [customTrialTarget, setCustomTrialTarget] = useState<any | null>(null);
  const [customDays, setCustomDays] = useState<number>(14);

  const loadUsers = useCallback(async (force = false) => {
    if (force) setIsRefreshing(true);
    else setLoading(true);
    try {
      const data = await getAllUsersForAdmin(force);
      setUsers(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load directory');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleToggleAffiliate = async (userId: string, isAffiliate: boolean) => {
    try {
      await updateAffiliateStatus(userId, isAffiliate);
      setUsers(users.map(u => u.id === userId ? { ...u, isAffiliate, affiliateCode: isAffiliate ? `affiliate_${userId.slice(0, 6)}` : undefined } : u));
      toast.success(`Affiliate status ${isAffiliate ? 'granted' : 'revoked'}`);
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const handleGrantAccess = async (userId: string, days: number | null, isTrial = false) => {
    try {
      await updateUserBetaAccess(userId, true, days, isTrial);
      const now = Date.now();
      const expiresAt = days ? now + days * 24 * 60 * 60 * 1000 : null;
      setUsers(prev => prev.map(u => u.id === userId ? { 
        ...u, betaAccess: true, isTrial, betaAccessExpiresAt: expiresAt 
      } : u));
      toast.success(isTrial ? `${days}-Day Trial Access granted` : 'Lifetime Access granted');
    } catch (e) {
      toast.error('Failed to grant access');
    }
  };

  const handleExtendTrial = async (user: any, additionalDays: number) => {
    try {
      const expTime = typeof user.betaAccessExpiresAt === 'number' ? user.betaAccessExpiresAt : user.betaAccessExpiresAt?.toMillis?.();
      const baseTime = (expTime && expTime > Date.now()) ? expTime : Date.now();
      const newExpiry = baseTime + additionalDays * 24 * 60 * 60 * 1000;
      const totalDays = Math.ceil((newExpiry - Date.now()) / (24 * 60 * 60 * 1000));
      
      await updateUserBetaAccess(user.id, true, totalDays, true);
      setUsers(prev => prev.map(u => u.id === user.id ? {
        ...u,
        betaAccess: true,
        isTrial: true,
        betaAccessExpiresAt: newExpiry
      } : u));
      toast.success(`Trial extended by +${additionalDays} days`);
    } catch (e) {
      toast.error('Failed to extend trial');
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    try {
      await updateUserBetaAccess(userId, false);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, betaAccess: false, isTrial: false, betaAccessExpiresAt: null } : u));
      toast.success('Access revoked');
    } catch (e) {
      toast.error('Failed to revoke access');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      await deleteUserAsAdmin(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User deleted');
    } catch (e) {
      toast.error('Failed to delete user');
    }
  };

  const handleBatchUnlock = async () => {
    const emails = batchEmails.split(',').map(e => e.trim().toLowerCase()).filter(e => e);
    if (!emails.length) return;
    
    const targetIds = users.filter(u => u.email && emails.includes(u.email.toLowerCase()) && !u.isAdmin).map(u => u.id);
    if (!targetIds.length) {
      toast.error('No matching accounts found');
      return;
    }

    const durationDays = batchPlan === 'lifetime' ? null : (batchPlan === 'trial_7' ? 7 : (batchPlan === 'trial_30' ? 30 : 14));
    const isTrial = batchPlan !== 'lifetime';

    try {
      await bulkUpdateUserBetaAccess(targetIds, true, durationDays, isTrial, batchAffiliate !== 'none' ? batchAffiliate : undefined);
      toast.success(`Provisioned ${isTrial ? `${durationDays}-day trials` : 'lifetime access'} for ${targetIds.length} users`);
      setIsBatchOpen(false);
      setBatchEmails('');
      loadUsers();
    } catch (e) {
      toast.error('Batch unlock failed');
    }
  };

  // TODO: Replace client-side impersonation trigger with serverless vault inspection (e.g., /api/admin/inspect-vault)
  // Client-side session override causes authentication and local IndexedDB state collisions with target user records.
  const handleImpersonate = async (_targetUser: any) => {
    toast.warning("Client-side Observer Mode is disabled to prevent auth collisions. Serverless vault inspection is scheduled.");
  };

  const affiliatesList = users.filter(u => u.isAffiliate);
  
  // Filter candidates
  const filteredCandidates = users.filter(u => {
    if (u.isAdmin) return false;
    if (search && !u.email?.toLowerCase().includes(search.toLowerCase()) && !u.displayName?.toLowerCase().includes(search.toLowerCase())) return false;
    
    const exp = typeof u.betaAccessExpiresAt === 'number' ? u.betaAccessExpiresAt : u.betaAccessExpiresAt?.toMillis?.();
    const isExp = exp && exp < Date.now();
    const isActive = Boolean(u.betaAccess && !isExp);

    if (statusFilter === 'active') {
      if (!isActive) return false;
    }
    if (statusFilter === 'trial') {
      if (!isActive || !u.isTrial) return false;
    }
    if (statusFilter === 'expired') {
      if (isActive) return false;
    }
    
    if (affiliateFilter !== 'all' && u.referredBy !== affiliateFilter) return false;
    
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-500" />
            Directory & Access
          </h1>
          <p className="text-muted-foreground text-sm mt-1">CRM for Students, Trial Passes, Licenses, and Affiliates.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => loadUsers(true)}
            disabled={isRefreshing}
            variant="outline" 
            className="border-border/50 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} /> 
            {isRefreshing ? 'Syncing...' : 'Force Sync'}
          </Button>
          <Button onClick={() => setIsBatchOpen(true)} className="bg-teal-500 text-black hover:bg-teal-400 font-bold">
            <Mail className="w-4 h-4 mr-2" /> Email Batch Unlock
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50">
        <button
          onClick={() => setActiveTab('candidates')}
          className={cn("px-6 py-3 text-sm font-semibold border-b-2 transition-colors", activeTab === 'candidates' ? "border-teal-500 text-teal-400" : "border-transparent text-muted-foreground hover:text-foreground")}
        >
          Student Candidates
        </button>
        <button
          onClick={() => setActiveTab('affiliates')}
          className={cn("px-6 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2", activeTab === 'affiliates' ? "border-indigo-500 text-indigo-400" : "border-transparent text-muted-foreground hover:text-foreground")}
        >
          <Award className="w-4 h-4" /> Affiliate Ledger
        </button>
      </div>

      {activeTab === 'candidates' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search email or name..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-card border-border/50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StatusFilter)}
              className="bg-card border border-border/50 rounded-md px-3 py-2 text-sm focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Access (All)</option>
              <option value="trial">Active Trials Only</option>
              <option value="expired">Expired / Locked</option>
            </select>
            <select
              value={affiliateFilter}
              onChange={e => setAffiliateFilter(e.target.value)}
              className="bg-card border border-border/50 rounded-md px-3 py-2 text-sm focus:outline-none"
            >
              <option value="all">All Affiliates</option>
              {affiliatesList.map(a => (
                <option key={a.id} value={a.affiliateCode}>{a.displayName || a.email} ({a.affiliateCode})</option>
              ))}
            </select>
          </div>

          <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
            {loading ? (
               <div className="p-8 text-center text-muted-foreground animate-pulse">Loading directory...</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Candidate</th>
                    <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                    <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Attribution</th>
                    <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredCandidates.slice(0, 100).map(user => {
                    const expTime = typeof user.betaAccessExpiresAt === 'number' ? user.betaAccessExpiresAt : user.betaAccessExpiresAt?.toMillis?.();
                    const isExp = expTime ? expTime < Date.now() : false;
                    const isActive = Boolean(user.betaAccess && !isExp);
                    const daysLeft = expTime ? Math.max(0, Math.ceil((expTime - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
                    
                    return (
                      <tr key={user.id} className="hover:bg-muted/10">
                        <td className="py-3 px-4">
                          <div className="font-medium text-sm text-foreground flex items-center gap-2">
                            {user.displayName || 'Unnamed'}
                            {user.isAffiliate && <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-indigo-500/10 text-indigo-400 border-indigo-500/30">AFFILIATE</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          {isActive ? (
                            user.isTrial ? (
                              <Badge variant="outline" className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-xs flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3" /> Trial ({daysLeft}d left)
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-teal-500/10 text-teal-400 border-teal-500/20 text-xs">
                                Active (Lifetime)
                              </Badge>
                            )
                          ) : (
                            user.isTrial || expTime ? (
                              <Badge variant="outline" className="bg-zinc-800/80 text-zinc-400 border-zinc-700/60 text-xs">
                                Trial Expired
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-xs">
                                Locked
                              </Badge>
                            )
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground font-mono">
                          {user.referredBy || '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 hover:bg-muted rounded-md transition-colors outline-none focus:ring-2 focus:ring-teal-500/50 focus:ring-offset-1 focus:ring-offset-background">
                                <MoreVertical className="w-4 h-4 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-card border-border/50">
                              <DropdownMenuItem 
                                disabled
                                onClick={() => handleImpersonate(user)} 
                                className="text-xs flex items-center justify-between cursor-not-allowed opacity-50 text-muted-foreground focus:bg-transparent"
                              >
                                <span className="flex items-center gap-2">
                                  <Eye className="w-3.5 h-3.5" /> Impersonate View
                                </span>
                                <span className="text-[9px] uppercase font-mono tracking-wider text-amber-400/90 bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20">
                                  Deprecated
                                </span>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="bg-border/50" />
                              
                              {/* Trial Provisioning Controls */}
                              <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                Trial Access
                              </div>
                              
                              <DropdownMenuItem onClick={() => handleGrantAccess(user.id, 7, true)} className="text-xs text-amber-300 focus:text-amber-300 focus:bg-amber-500/10 flex items-center gap-2 cursor-pointer">
                                <Clock className="w-3.5 h-3.5 text-amber-400" /> Grant 7-Day Quick Trial
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem onClick={() => handleGrantAccess(user.id, 14, true)} className="text-xs text-amber-300 focus:text-amber-300 focus:bg-amber-500/10 flex items-center gap-2 cursor-pointer">
                                <Clock className="w-3.5 h-3.5 text-amber-400" /> Grant 14-Day Clinical Trial
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => handleGrantAccess(user.id, 30, true)} className="text-xs text-amber-300 focus:text-amber-300 focus:bg-amber-500/10 flex items-center gap-2 cursor-pointer">
                                <Clock className="w-3.5 h-3.5 text-amber-400" /> Grant 30-Day Evaluation Pass
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => { setCustomTrialTarget(user); setCustomDays(14); }} className="text-xs text-amber-300 focus:text-amber-300 focus:bg-amber-500/10 flex items-center gap-2 cursor-pointer">
                                <CalendarPlus className="w-3.5 h-3.5 text-amber-400" /> Custom Trial Days...
                              </DropdownMenuItem>

                              {user.isTrial && isActive && (
                                <>
                                  <DropdownMenuItem onClick={() => handleExtendTrial(user, 7)} className="text-xs text-emerald-400 focus:text-emerald-400 focus:bg-emerald-500/10 flex items-center gap-2 cursor-pointer">
                                    <Sparkles className="w-3.5 h-3.5" /> Extend Trial +7 Days
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleExtendTrial(user, 14)} className="text-xs text-emerald-400 focus:text-emerald-400 focus:bg-emerald-500/10 flex items-center gap-2 cursor-pointer">
                                    <Sparkles className="w-3.5 h-3.5" /> Extend Trial +14 Days
                                  </DropdownMenuItem>
                                </>
                              )}

                              <DropdownMenuSeparator className="bg-border/50" />

                              <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                Full License & Role
                              </div>

                              <DropdownMenuItem onClick={() => handleGrantAccess(user.id, null, false)} className="text-xs text-teal-400 focus:text-teal-400 focus:bg-teal-500/10 flex items-center gap-2 cursor-pointer">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Grant Lifetime Access
                              </DropdownMenuItem>

                              {!user.isAffiliate ? (
                                <DropdownMenuItem onClick={() => handleToggleAffiliate(user.id, true)} className="text-xs text-indigo-400 focus:text-indigo-400 focus:bg-indigo-500/10 flex items-center gap-2 cursor-pointer">
                                  <Award className="w-3.5 h-3.5" /> Upgrade to Affiliate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleToggleAffiliate(user.id, false)} className="text-xs text-rose-400 focus:text-rose-400 focus:bg-rose-500/10 flex items-center gap-2 cursor-pointer">
                                  <ShieldCheck className="w-3.5 h-3.5" /> Revoke Affiliate
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem onClick={() => handleRevokeAccess(user.id)} className="text-xs text-rose-400 focus:text-rose-400 focus:bg-rose-500/10 flex items-center gap-2 cursor-pointer">
                                <Lock className="w-3.5 h-3.5" /> Revoke Access
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-xs text-rose-500 font-bold focus:text-rose-500 focus:bg-rose-500/20 flex items-center gap-2 cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" /> Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredCandidates.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-muted-foreground text-sm">No matching candidates found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'affiliates' && (
        <div className="space-y-4">
          <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Affiliate Partner</th>
                  <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Code</th>
                  <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase text-center">Seats Provisioned</th>
                  <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase text-center">Active Seats</th>
                  <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase text-right">Attributed Conversions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {affiliatesList.map(aff => {
                  const clients = users.filter(u => 
                    (u.referredBy === aff.affiliateCode || 
                     u.affiliateId === aff.affiliateCode || 
                     u.attribution?.code === aff.affiliateCode || 
                     u.attribution?.referrerUid === aff.id) && 
                    !u.isAdmin && u.id !== aff.id
                  );
                  const activeClients = clients.filter(c => {
                    if (!c.betaAccess) return false;
                    const expiresAt = typeof c.betaAccessExpiresAt === 'number' ? c.betaAccessExpiresAt : c.betaAccessExpiresAt?.toMillis?.();
                    return !expiresAt || expiresAt > Date.now();
                  });
                  const convertedClients = clients.filter(c => 
                    c.attribution?.status === 'converted' || 
                    c.hasPaidAccess || 
                    c.paymentStatus === 'succeeded' || 
                    c.paymentStatus === 'approved'
                  );
                  const conversionsCount = convertedClients.length;

                  return (
                    <tr key={aff.id} className="hover:bg-muted/10">
                      <td className="py-3 px-4 font-medium text-sm text-foreground">
                        <div>{aff.displayName || aff.email}</div>
                        {aff.displayName && <div className="text-xs text-muted-foreground">{aff.email}</div>}
                      </td>
                      <td className="py-3 px-4 text-xs text-indigo-400 font-mono font-semibold">{aff.affiliateCode}</td>
                      <td className="py-3 px-4 text-center font-medium">{clients.length}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline" className="bg-teal-500/10 text-teal-400 border-teal-500/30">
                          {activeClients.length}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-emerald-400 text-sm">
                          {conversionsCount}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1.5 font-normal">
                          {conversionsCount === 1 ? 'Conversion' : 'Conversions'}
                        </span>
                        <div className="text-[11px] text-muted-foreground font-normal">
                          {activeClients.length} Referred Active {activeClients.length === 1 ? 'User' : 'Users'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {affiliatesList.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">No active affiliates. Upgrade users in the Candidates tab.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Custom Trial Duration Modal */}
      {customTrialTarget && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card border border-border/50 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <CalendarPlus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg">Custom Trial Duration</h3>
              </div>
              <button onClick={() => setCustomTrialTarget(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="bg-muted/20 border border-border/30 rounded-xl p-3 text-xs space-y-1">
              <div className="font-semibold text-foreground">{customTrialTarget.displayName || 'Unnamed Student'}</div>
              <div className="text-muted-foreground">{customTrialTarget.email}</div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Trial Length (Days)</label>
              <Input
                type="number"
                min="1"
                max="180"
                value={customDays}
                onChange={e => setCustomDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="bg-background border-border/50"
              />
              <p className="text-[11px] text-muted-foreground">
                The student will receive full access expiring in {customDays} days from now.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button variant="ghost" onClick={() => setCustomTrialTarget(null)}>Cancel</Button>
              <Button 
                onClick={async () => {
                  await handleGrantAccess(customTrialTarget.id, customDays, true);
                  setCustomTrialTarget(null);
                }} 
                className="bg-amber-500 text-black hover:bg-amber-400 font-bold"
              >
                Grant {customDays}-Day Trial
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Email Batch Modal */}
      {isBatchOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card border border-border/50 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Batch Grant Access</h3>
              <button onClick={() => setIsBatchOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5"/></button>
            </div>
            <p className="text-sm text-muted-foreground">Paste comma-separated emails. Matching accounts will be granted the selected access level.</p>
            <textarea 
              value={batchEmails}
              onChange={e => setBatchEmails(e.target.value)}
              placeholder="email1@test.com, email2@test.com"
              className="w-full h-32 bg-background border border-border/50 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Access & License Type</label>
              <select
                value={batchPlan}
                onChange={e => setBatchPlan(e.target.value as any)}
                className="w-full bg-background border border-border/50 rounded-xl px-3 py-2 text-sm focus:outline-none"
              >
                <option value="trial_14">14-Day Clinical Trial (Recommended for Cohorts)</option>
                <option value="trial_7">7-Day Quick Evaluation Trial</option>
                <option value="trial_30">30-Day Intensive Pass</option>
                <option value="lifetime">Lifetime Full Access</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Attribution Tag</label>
              <select
                value={batchAffiliate}
                onChange={e => setBatchAffiliate(e.target.value)}
                className="w-full bg-background border border-border/50 rounded-xl px-3 py-2 text-sm focus:outline-none"
              >
                <option value="none">No Affiliate (Direct Sales)</option>
                {affiliatesList.map(a => (
                  <option key={a.id} value={a.affiliateCode}>{a.displayName || a.email} ({a.affiliateCode})</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setIsBatchOpen(false)}>Cancel</Button>
              <Button onClick={handleBatchUnlock} className="bg-teal-500 text-black hover:bg-teal-400 font-bold">Unlock Accounts</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
