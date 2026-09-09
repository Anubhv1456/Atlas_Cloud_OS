import React, { useEffect, useState } from 'react';
import { 
  Users, Award, ShieldCheck, Mail, Search, ChevronDown, CheckCircle2, 
  Trash2, X, MoreVertical, Eye, Lock
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
  const [activeTab, setActiveTab] = useState<Tab>('candidates');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [affiliateFilter, setAffiliateFilter] = useState('all');

  // Batch Grant State
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchEmails, setBatchEmails] = useState('');
  const [batchAffiliate, setBatchAffiliate] = useState('none');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsersForAdmin();
      setUsers(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load directory');
    } finally {
      setLoading(false);
    }
  };

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
      setUsers(users.map(u => u.id === userId ? { 
        ...u, betaAccess: true, isTrial, betaAccessExpiresAt: days ? now + days * 24 * 60 * 60 * 1000 : null 
      } : u));
      toast.success('Access granted');
    } catch (e) {
      toast.error('Failed to grant access');
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    try {
      await updateUserBetaAccess(userId, false);
      setUsers(users.map(u => u.id === userId ? { ...u, betaAccess: false, isTrial: false, betaAccessExpiresAt: null } : u));
      toast.success('Access revoked');
    } catch (e) {
      toast.error('Failed to revoke access');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      await deleteUserAsAdmin(userId);
      setUsers(users.filter(u => u.id !== userId));
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

    try {
      await bulkUpdateUserBetaAccess(targetIds, true, null, false, batchAffiliate !== 'none' ? batchAffiliate : undefined);
      toast.success(`Unlocked ${targetIds.length} users`);
      setIsBatchOpen(false);
      setBatchEmails('');
      loadUsers(); // reload to get fresh states
    } catch (e) {
      toast.error('Batch unlock failed');
    }
  };

  const handleImpersonate = async (targetUser: any) => {
    await startImpersonation({
      id: targetUser.id,
      email: targetUser.email,
      displayName: targetUser.displayName,
      betaAccess: targetUser.betaAccess,
      betaAccessExpiresAt: targetUser.betaAccessExpiresAt,
      isTrial: targetUser.isTrial,
      referredBy: targetUser.referredBy,
      paymentStatus: targetUser.paymentStatus,
      createdAt: targetUser.createdAt,
      lastLoginAt: targetUser.lastLoginAt,
      isAffiliate: targetUser.isAffiliate,
      affiliateCode: targetUser.affiliateCode
    });
    setLocation('/');
  };

  const affiliatesList = users.filter(u => u.isAffiliate);
  
  // Filter candidates
  const filteredCandidates = users.filter(u => {
    if (u.isAdmin) return false;
    if (search && !u.email?.toLowerCase().includes(search.toLowerCase()) && !u.displayName?.toLowerCase().includes(search.toLowerCase())) return false;
    
    if (statusFilter === 'active') {
      if (!u.betaAccess) return false;
      const exp = typeof u.betaAccessExpiresAt === 'number' ? u.betaAccessExpiresAt : u.betaAccessExpiresAt?.toMillis?.();
      if (exp && exp < Date.now()) return false;
    }
    if (statusFilter === 'expired') {
      const exp = typeof u.betaAccessExpiresAt === 'number' ? u.betaAccessExpiresAt : u.betaAccessExpiresAt?.toMillis?.();
      if (!u.betaAccess || (exp && exp < Date.now())) return true;
      return false;
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
          <p className="text-muted-foreground text-sm mt-1">CRM for Students, Licenses, and Affiliates.</p>
        </div>
        <div className="flex items-center gap-2">
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
              <option value="active">Active Access</option>
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
                    const isExp = typeof user.betaAccessExpiresAt === 'number' ? user.betaAccessExpiresAt < Date.now() : user.betaAccessExpiresAt?.toMillis?.() < Date.now();
                    const isActive = user.betaAccess && !isExp;
                    
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
                            <Badge variant="outline" className="bg-teal-500/10 text-teal-400 border-teal-500/20 text-xs">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-xs">Locked</Badge>
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
                            <DropdownMenuContent align="end" className="w-48 bg-card border-border/50">
                              <DropdownMenuItem onClick={() => handleImpersonate(user)} className="text-xs flex items-center gap-2 cursor-pointer text-amber-400 focus:text-amber-400 focus:bg-amber-500/10">
                                <Eye className="w-3.5 h-3.5" /> Impersonate View
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border/50" />
                              {!user.isAffiliate ? (
                                <DropdownMenuItem onClick={() => handleToggleAffiliate(user.id, true)} className="text-xs text-indigo-400 focus:text-indigo-400 focus:bg-indigo-500/10 flex items-center gap-2 cursor-pointer">
                                  <Award className="w-3.5 h-3.5" /> Upgrade to Affiliate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleToggleAffiliate(user.id, false)} className="text-xs text-rose-400 focus:text-rose-400 focus:bg-rose-500/10 flex items-center gap-2 cursor-pointer">
                                  <ShieldCheck className="w-3.5 h-3.5" /> Revoke Affiliate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator className="bg-border/50" />
                              <DropdownMenuItem onClick={() => handleGrantAccess(user.id, null)} className="text-xs text-teal-400 focus:text-teal-400 focus:bg-teal-500/10 flex items-center gap-2 cursor-pointer">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Grant Lifetime Access
                              </DropdownMenuItem>
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
                  <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase text-right">Est. Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {affiliatesList.map(aff => {
                  const clients = users.filter(u => (u.referredBy === aff.affiliateCode || u.affiliateId === aff.affiliateCode) && !u.isAdmin && u.id !== aff.id);
                  const activeClients = clients.filter(c => {
                    if (!c.betaAccess) return false;
                    const expiresAt = typeof c.betaAccessExpiresAt === 'number' ? c.betaAccessExpiresAt : c.betaAccessExpiresAt?.toMillis?.();
                    return !expiresAt || expiresAt > Date.now();
                  });
                  return (
                    <tr key={aff.id} className="hover:bg-muted/10">
                      <td className="py-3 px-4 font-medium text-sm text-foreground">{aff.displayName || aff.email}</td>
                      <td className="py-3 px-4 text-xs text-indigo-400 font-mono">{aff.affiliateCode}</td>
                      <td className="py-3 px-4 text-center font-medium">{clients.length}</td>
                      <td className="py-3 px-4 text-center"><Badge variant="outline" className="bg-teal-500/10 text-teal-400">{activeClients.length}</Badge></td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">${activeClients.length * 50}</td>
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

      {/* Email Batch Modal */}
      {isBatchOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card border border-border/50 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Batch Grant Access</h3>
              <button onClick={() => setIsBatchOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5"/></button>
            </div>
            <p className="text-sm text-muted-foreground">Paste comma-separated emails. Matching accounts will be granted lifetime access.</p>
            <textarea 
              value={batchEmails}
              onChange={e => setBatchEmails(e.target.value)}
              placeholder="email1@test.com, email2@test.com"
              className="w-full h-32 bg-background border border-border/50 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
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
