import React, { useEffect, useState, useCallback } from 'react';
import { 
  ShieldCheck, ShieldAlert, KeyRound, UserPlus, RefreshCw, Search,
  CheckCircle2, AlertTriangle, Crown, Stethoscope, Shield, LifeBuoy,
  History, Clock, Check, MoreVertical, Trash2, ArrowUpRight, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';
import { 
  listStaffUsersAdmin, setStaffRoleAdmin, reconcileAdminAccessAdmin, listAdminAuditLogs 
} from '@/lib/admin';
import type { StaffRole, StaffUserEntity, AdminAuditLogEntry } from '@/types/admin';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ROLE_METADATA: Record<StaffRole | 'admin', { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string }> = {
  superadmin: {
    label: 'Superadmin',
    icon: Crown,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  admin: {
    label: 'Superadmin',
    icon: Crown,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  clinical_lead: {
    label: 'Clinical Lead',
    icon: Stethoscope,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
  },
  moderator: {
    label: 'Moderator',
    icon: Shield,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  support: {
    label: 'Support',
    icon: LifeBuoy,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  student: {
    label: 'Standard Student',
    icon: ShieldAlert,
    color: 'text-muted-foreground',
    bg: 'bg-muted/40',
    border: 'border-border/40',
  },
};

export function AdminsView() {
  const { user } = useAuth();

  const [staff, setStaff] = useState<StaffUserEntity[]>([]);
  const [logs, setLogs] = useState<AdminAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | StaffRole>('all');
  const [activeTab, setActiveTab] = useState<'directory' | 'audit'>('directory');

  // Assign Role Dialog State
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignEmail, setAssignEmail] = useState('');
  const [assignUid, setAssignUid] = useState('');
  const [assignRole, setAssignRole] = useState<StaffRole>('moderator');
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  // Self privilege check - default true for admin dashboard viewers
  const [isSuperadmin, setIsSuperadmin] = useState(true);

  const loadData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    else setLoading(true);

    try {
      const [staffData, logData] = await Promise.all([
        listStaffUsersAdmin().catch(err => {
          console.error('Failed to list staff:', err);
          toast.error('Failed to load staff directory.');
          return [];
        }),
        listAdminAuditLogs().catch(err => {
          console.warn('Failed to fetch audit logs:', err);
          return [];
        }),
      ]);

      setStaff(staffData);
      setLogs(logData);

      // Check caller's role in the directory or via claims
      if (user) {
        const callerRecord = staffData.find((s: StaffUserEntity) => s.uid === user.uid);
        if (callerRecord?.role === 'superadmin' || callerRecord?.role === 'admin' || callerRecord?.isAdmin) {
          setIsSuperadmin(true);
        } else {
          // Check claims
          user.getIdTokenResult().then(res => {
            const claims = res.claims || {};
            if (claims.role === 'superadmin' || claims.admin === true || claims.isAdmin === true || claims.role === 'admin' || !claims.role) {
              setIsSuperadmin(true);
            }
          }).catch(() => {});
        }
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to initialize staff directory');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Role Assignment
  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignEmail.trim() && !assignUid.trim()) {
      toast.error('Please enter a target user email address or UID.');
      return;
    }

    setIsSubmittingRole(true);
    try {
      await setStaffRoleAdmin(assignUid.trim(), assignRole, assignEmail.trim());
      toast.success(`Role '${ROLE_METADATA[assignRole].label}' successfully assigned.`);
      setIsAssignOpen(false);
      setAssignEmail('');
      setAssignUid('');
      loadData(true);
    } catch (err: any) {
      console.error('Role assignment error:', err);
      toast.error(err.message || 'Failed to update user role.');
    } finally {
      setIsSubmittingRole(false);
    }
  };

  // Handle Quick Role Change
  const handleQuickRoleChange = async (targetUid: string, targetEmail: string, newRole: StaffRole) => {
    try {
      await setStaffRoleAdmin(targetUid, newRole, targetEmail);
      toast.success(`Role updated to '${ROLE_METADATA[newRole].label}'`);
      setStaff(prev => prev.map(s => s.uid === targetUid ? { ...s, role: newRole, isAdmin: newRole !== 'student' } : s));
      loadData(true);
    } catch (err: any) {
      console.error('Quick role change error:', err);
      toast.error(err.message || 'Failed to update role.');
    }
  };

  // Handle Reconcile Access Self-Repair
  const handleReconcileAccess = async () => {
    setIsReconciling(true);
    try {
      await reconcileAdminAccessAdmin();
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true); // Force JWT refresh
      }
      toast.success('Admin permissions and claims refreshed!');
      window.location.reload();
    } catch (err: any) {
      console.error('Reconcile access error:', err);
      toast.error(err.message || 'Failed to reconcile administrator access.');
    } finally {
      setIsReconciling(false);
    }
  };

  // Filtered staff records
  const filteredStaff = staff.filter(s => {
    const matchesSearch = 
      (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
      s.uid.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === 'all' || s.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      
      {/* ── Header & Action Controls ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Staff Access Control Directory
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage administrative privilege boundaries, custom claims, and staff roles without client-side mutations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReconcileAccess}
            disabled={isReconciling}
            className="border-border/60 hover:bg-teal-500/10 hover:border-teal-500/40 text-xs font-mono"
            title="Idempotently re-syncs administrator privileges and clears trial expirations"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', isReconciling && 'animate-spin text-teal-400')} />
            {isReconciling ? 'Reconciling...' : 'Reconcile Access'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={isRefreshing || loading}
            className="text-xs font-mono"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>

          {isSuperadmin && (
            <Button
              size="sm"
              onClick={() => setIsAssignOpen(true)}
              className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Assign Role
            </Button>
          )}
        </div>
      </div>

      {/* ── Status & Privilege Indicator ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card/40 border border-border/50 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wider font-mono text-muted-foreground">Total Staff Members</div>
            <div className="text-2xl font-bold text-foreground">{staff.length}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Crown className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card/40 border border-border/50 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wider font-mono text-muted-foreground">Current Operator Authority</div>
            <div className="text-sm font-semibold flex items-center gap-1.5">
              {isSuperadmin ? (
                <span className="text-purple-400 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" /> Superadmin
                </span>
              ) : (
                <span className="text-teal-400 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Staff Operator
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground">
            <KeyRound className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card/40 border border-border/50 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wider font-mono text-muted-foreground">Security Mode</div>
            <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Server-Authoritative (9 Fns)
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Main Tab Navigation ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-2">
        <button
          onClick={() => setActiveTab('directory')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-colors',
            activeTab === 'directory' 
              ? 'bg-secondary text-secondary-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          Staff Directory ({staff.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-colors',
            activeTab === 'audit' 
              ? 'bg-secondary text-secondary-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          Audit Trail ({logs.length})
        </button>
      </div>

      {activeTab === 'directory' ? (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search staff by email, name, or UID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'superadmin', 'clinical_lead', 'moderator', 'support'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap',
                    roleFilter === r
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'bg-card/40 text-muted-foreground hover:text-foreground border border-border/40'
                  )}
                >
                  {r === 'all' ? 'All Roles' : ROLE_METADATA[r]?.label || r}
                </button>
              ))}
            </div>
          </div>

          {/* Directory Table */}
          <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden backdrop-blur-sm relative">
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none z-10 sm:hidden" />
            <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full text-left text-xs min-w-[700px] whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-mono uppercase tracking-wider">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Privilege Level</th>
                    <th className="py-3 px-4">Assigned Info</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground font-mono">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-400" />
                        Querying staff directory from serverless boundary...
                      </td>
                    </tr>
                  ) : filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        No staff members found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((member) => {
                      const roleMeta = ROLE_METADATA[member.role as StaffRole] || ROLE_METADATA.student;
                      const RoleIcon = roleMeta.icon;

                      return (
                        <tr key={member.uid} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-foreground text-sm">
                              {member.displayName || 'Staff Member'}
                            </div>
                            <div className="text-muted-foreground text-[11px] font-mono">
                              {member.email || 'No email associated'}
                            </div>
                            <div className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
                              UID: {member.uid}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border',
                              roleMeta.bg, roleMeta.color, roleMeta.border
                            )}>
                              <RoleIcon className="w-3 h-3" />
                              {roleMeta.label}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Permanent Bypass
                            </span>
                            <div className="text-[10px] text-muted-foreground">
                              Exempt from trial expiration
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-muted-foreground text-[11px] font-mono">
                            {member.assignedAt ? (
                              typeof member.assignedAt === 'object' && member.assignedAt?._seconds ? (
                                new Date(member.assignedAt._seconds * 1000).toLocaleDateString()
                              ) : (
                                new Date(member.assignedAt).toLocaleDateString()
                              )
                            ) : (
                              'System Default'
                            )}
                            {member.assignedByUid && (
                              <div className="text-[10px] text-muted-foreground/60 truncate max-w-[140px]">
                                by: {member.assignedByUid}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {isSuperadmin ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 text-xs font-mono">
                                  <DropdownMenuLabel>Reassign Role</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleQuickRoleChange(member.uid, member.email, 'superadmin')}
                                    className="text-purple-400 cursor-pointer"
                                  >
                                    <Crown className="w-3.5 h-3.5 mr-2" /> Make Superadmin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleQuickRoleChange(member.uid, member.email, 'clinical_lead')}
                                    className="text-teal-400 cursor-pointer"
                                  >
                                    <Stethoscope className="w-3.5 h-3.5 mr-2" /> Make Clinical Lead
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleQuickRoleChange(member.uid, member.email, 'moderator')}
                                    className="text-sky-400 cursor-pointer"
                                  >
                                    <Shield className="w-3.5 h-3.5 mr-2" /> Make Moderator
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleQuickRoleChange(member.uid, member.email, 'support')}
                                    className="text-amber-400 cursor-pointer"
                                  >
                                    <LifeBuoy className="w-3.5 h-3.5 mr-2" /> Make Support
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleQuickRoleChange(member.uid, member.email, 'student')}
                                    className="text-destructive cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Demote to Student
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <span className="text-[11px] text-muted-foreground/60 italic">Read-only</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ── Audit Trail Tab ───────────────────────────────────────────────── */
        <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden backdrop-blur-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-teal-400" />
              <h3 className="font-bold text-sm text-foreground">Immutable Privilege Audit Log</h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground">Showing last 25 events</span>
          </div>

          {logs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs font-mono">
              No audit log entries recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {logs.map((log: any) => (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded text-[10px]">
                        {log.action}
                      </span>
                      <span className="text-muted-foreground font-mono text-[11px]">
                        by {log.adminEmail || log.adminId}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-[11px]">
                      Target UID: <span className="font-mono text-foreground">{log.targetId}</span>
                      {log.details?.newRole && (
                        <span> • New Role: <span className="font-semibold text-foreground">{log.details.newRole}</span></span>
                      )}
                      {log.details?.targetEmail && (
                        <span> • Email: <span className="font-mono text-foreground">{log.details.targetEmail}</span></span>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-muted-foreground/70 shrink-0">
                    {log.timestamp?._seconds ? (
                      new Date(log.timestamp._seconds * 1000).toLocaleString()
                    ) : log.timestamp ? (
                      new Date(log.timestamp).toLocaleString()
                    ) : (
                      'Recent'
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Assign Staff Role Dialog ────────────────────────────────────────── */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-teal-400" />
              Assign Staff Role
            </DialogTitle>
            <DialogDescription>
              Grant elevated privileges and custom claims to a registered account. This immediately sets server-side claims and updates the database.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignRole} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted-foreground">User Email Address</label>
              <Input
                placeholder="doctor@example.com"
                type="email"
                value={assignEmail}
                onChange={(e) => setAssignEmail(e.target.value)}
                className="text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Resolves the user automatically via Firebase Auth if UID is blank.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted-foreground">Or Target User UID (Optional)</label>
              <Input
                placeholder="uX92...vK2"
                value={assignUid}
                onChange={(e) => setAssignUid(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted-foreground">Select Privileged Role</label>
              <div className="grid grid-cols-2 gap-2">
                {(['superadmin', 'clinical_lead', 'moderator', 'support'] as StaffRole[]).map((r) => {
                  const meta = ROLE_METADATA[r];
                  const Icon = meta.icon;
                  const isSelected = assignRole === r;

                  return (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setAssignRole(r)}
                      className={cn(
                        'p-2.5 rounded-lg border text-left flex items-start gap-2 transition-all',
                        isSelected 
                          ? 'border-teal-500/50 bg-teal-500/10 text-foreground ring-1 ring-teal-500/30' 
                          : 'border-border/40 bg-card/40 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', meta.color)} />
                      <div>
                        <div className="text-xs font-medium leading-none mb-1">{meta.label}</div>
                        <div className="text-[10px] text-muted-foreground leading-tight">
                          {r === 'superadmin' ? 'Full administrative sovereignty' :
                           r === 'clinical_lead' ? 'Content & ontology review' :
                           r === 'moderator' ? 'Community & triage queue' :
                           'User support & inquiries'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAssignOpen(false)}
                disabled={isSubmittingRole}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                size="sm" 
                disabled={isSubmittingRole}
                className="bg-teal-600 hover:bg-teal-500 text-white"
              >
                {isSubmittingRole ? 'Assigning Role...' : 'Assign Role & Claims'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
