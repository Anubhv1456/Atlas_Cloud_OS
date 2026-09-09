import React, { useState } from 'react';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useLocation } from 'wouter';
import { Eye, ShieldAlert, LogOut, Info, RefreshCw, CheckCircle2, XCircle, Clock, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedUser, exitImpersonation, refreshCandidateProfile } = useImpersonation();
  const [, setLocation] = useLocation();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (!isImpersonating || !impersonatedUser) {
    return null;
  }

  const handleExit = async () => {
    await exitImpersonation();
    setLocation('/admin');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshCandidateProfile();
    setRefreshing(false);
  };

  const rawExp = impersonatedUser.betaAccessExpiresAt;
  const exp = typeof rawExp === 'number' ? rawExp : rawExp?.toMillis ? rawExp.toMillis() : rawExp ? new Date(rawExp).getTime() : null;
  const isExpired = exp ? exp < Date.now() : false;
  const hasActiveAccess = Boolean(impersonatedUser.betaAccess && !isExpired);

  return (
    <>
      <div 
        id="impersonation-hud-banner"
        className="sticky top-0 z-[100] w-full bg-zinc-950/95 border-b border-amber-500/40 px-3.5 py-2 backdrop-blur-md shadow-md text-zinc-100 flex flex-wrap items-center justify-between gap-3 text-xs"
      >
        {/* Left Status Area */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider text-[10px] shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <Eye className="w-3.5 h-3.5" />
            Observer Mode
          </div>

          <div className="flex items-center gap-2 truncate">
            <span className="text-zinc-400 hidden sm:inline">Viewing candidate:</span>
            <span className="font-bold text-zinc-100 truncate">
              {impersonatedUser.displayName || impersonatedUser.email}
            </span>
            <span className="text-zinc-500 hidden md:inline font-mono text-[11px]">
              ({impersonatedUser.email})
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-400 border-rose-500/30 font-semibold">
              <ShieldAlert className="w-3 h-3 mr-1" />
              Read-Only
            </Badge>

            {hasActiveAccess ? (
              <Badge variant="outline" className="text-[10px] bg-teal-500/10 text-teal-400 border-teal-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Unlocked
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] bg-zinc-800 text-zinc-400 border-zinc-700">
                <XCircle className="w-3 h-3 mr-1" />
                Locked
              </Badge>
            )}

            {impersonatedUser.referredBy && (
              <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-400 border-indigo-500/30 font-mono">
                Ref: {impersonatedUser.referredBy}
              </Badge>
            )}

            {impersonatedUser.isAffiliate && (
              <Badge 
                variant="outline" 
                onClick={() => setLocation('/partner')}
                className="text-[10px] bg-indigo-500/15 text-indigo-300 border-indigo-500/40 font-mono cursor-pointer hover:bg-indigo-500/25 flex items-center gap-1"
                title="Click to view candidate's Partner Hub"
              >
                <Award className="w-3 h-3 text-indigo-400" />
                Affiliate Hub ↗
              </Badge>
            )}
          </div>
        </div>

        {/* Right Actions Area */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            id="impersonation-inspect-btn"
            variant="ghost"
            size="sm"
            onClick={() => setShowInfoModal(true)}
            className="h-7 px-2.5 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg"
          >
            <Info className="w-3.5 h-3.5 mr-1 text-teal-400" />
            Candidate Telemetry
          </Button>

          <Button
            id="impersonation-exit-btn"
            variant="destructive"
            size="sm"
            onClick={handleExit}
            className="h-7 px-3 text-xs bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-lg shadow transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Exit to Admin Console
          </Button>
        </div>
      </div>

      {/* Candidate Inspector Dialog */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-zinc-100">
              <Eye className="w-4 h-4 text-amber-400" />
              Candidate Profile Snapshot
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Live metadata from cloud directory for debugging and verification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Full Name</span>
                <span className="font-semibold text-zinc-200">{impersonatedUser.displayName || 'None provided'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Email Address</span>
                <span className="font-mono text-zinc-200">{impersonatedUser.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">User UID</span>
                <span className="font-mono text-zinc-400 text-[11px] select-all">{impersonatedUser.id}</span>
              </div>
            </div>

            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Beta Access</span>
                <span>
                  {hasActiveAccess ? (
                    <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/20 text-[11px]">Active Access</Badge>
                  ) : (
                    <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[11px]">No Access / Expired</Badge>
                  )}
                </span>
              </div>
              {exp && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Expires</span>
                  <span className="text-zinc-300 font-mono text-[11px]">
                    {format(new Date(exp), 'dd MMM yyyy, HH:mm')}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Trial Mode</span>
                <span className="text-zinc-300">{impersonatedUser.isTrial ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Affiliate Partner Status</span>
                <span className="text-zinc-300">
                  {impersonatedUser.isAffiliate ? `Yes (${impersonatedUser.affiliateCode || 'Active'})` : 'Standard Candidate'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Referred By Code</span>
                <span className="font-mono text-indigo-400">{impersonatedUser.referredBy || 'Organic / None'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Session: Read-Only Observer Mode
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-6 px-2 text-[11px] text-zinc-400 hover:text-zinc-100"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh State
              </Button>
            </div>

            {impersonatedUser.isAffiliate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowInfoModal(false);
                  setLocation('/partner');
                }}
                className="w-full text-xs border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/15 bg-indigo-500/10 h-8.5 gap-1.5 font-semibold"
              >
                <Award className="w-3.5 h-3.5 text-indigo-400" />
                Open Candidate's Partner Portal (/partner)
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInfoModal(false)}
              className="w-full bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
            >
              Dismiss
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
