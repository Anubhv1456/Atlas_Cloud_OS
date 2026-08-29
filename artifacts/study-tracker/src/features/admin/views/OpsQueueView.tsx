import React, { useEffect, useState } from 'react';
import { 
  getPaymentSubmissions, 
  approvePayment, 
  rejectPayment, 
  PaymentSubmission,
  getContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
  ContactMessage,
  getAllMarkersForAdmin,
  updateMarkerStatusAdmin,
  getDashboardStats
} from '@/lib/admin';
import { Marker, MarkerStatus } from '@/lib/markers';
import { useAuth } from '@/hooks/useAuth';
import { 
  CreditCard, Check, X, Search, RefreshCw, Eye, Copy, 
  Clock, CheckCircle2, XCircle, AlertCircle, Sparkles, ExternalLink, ShieldCheck,
  Inbox, Mail, Trash2, Bug, Lightbulb, MessageSquare, Filter, Shield, AlertTriangle,
  ChevronRight, ArrowRight, Activity, Users, User
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

type QueueTab = 'action_needed' | 'payments' | 'support' | 'markers';
type PaymentFilter = 'all' | 'pending' | 'approved' | 'rejected';
type SupportFilter = 'all' | 'unread' | 'read' | 'archived';
type MarkerFilter = 'all' | 'pending' | 'reported' | 'published';

export function OpsQueueView() {
  const { user } = useAuth();
  const [activeQueue, setActiveQueue] = useState<QueueTab>('action_needed');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Data collections
  const [payments, setPayments] = useState<PaymentSubmission[]>([]);
  const [supportMessages, setSupportMessages] = useState<ContactMessage[]>([]);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [stats, setStats] = useState({ users: 0, signups: 0, pendingMarkers: 0, reportedMarkers: 0 });

  // Filters
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('pending');
  const [supportFilter, setSupportFilter] = useState<SupportFilter>('unread');
  const [markerFilter, setMarkerFilter] = useState<MarkerFilter>('reported');

  // Preview Modals
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rejectingPayment, setRejectingPayment] = useState<PaymentSubmission | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [approvalDuration, setApprovalDuration] = useState<number>(90);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  // Copied item ID feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAllData = async () => {
    setRefreshing(true);
    try {
      const [paymentsData, supportData, markersData, statsData] = await Promise.all([
        getPaymentSubmissions(),
        getContactMessages(),
        getAllMarkersForAdmin(),
        getDashboardStats()
      ]);
      setPayments(paymentsData);
      setSupportMessages(supportData);
      setMarkers(markersData);
      setStats(statsData);
    } catch (e) {
      console.error('OpsQueue load error:', e);
      toast.error('Failed to sync live ops data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Payment Handlers
  const handleApprovePayment = async (payment: PaymentSubmission) => {
    try {
      await approvePayment(payment.id, payment.userId, user?.email || undefined, approvalDuration);
      toast.success(`Payment approved! ${approvalDuration}-Day Beta granted to ${payment.userEmail}`);
      setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, status: 'approved', reviewedAt: new Date() } : p));
    } catch (e) {
      console.error(e);
      toast.error('Failed to approve payment');
    }
  };

  const handleConfirmRejectPayment = async () => {
    if (!rejectingPayment) return;
    try {
      await rejectPayment(rejectingPayment.id, rejectingPayment.userId, rejectionNote, user?.email || undefined);
      toast.success(`Payment rejected for ${rejectingPayment.userEmail}`);
      setPayments(prev => prev.map(p => p.id === rejectingPayment.id ? { ...p, status: 'rejected', rejectionNote, reviewedAt: new Date() } : p));
      setRejectingPayment(null);
      setRejectionNote('');
    } catch (e) {
      console.error(e);
      toast.error('Failed to reject payment');
    }
  };

  // Support Handlers
  const handleMessageStatus = async (id: string, status: ContactMessage['status']) => {
    try {
      await updateContactMessageStatus(id, status);
      setSupportMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
      if (selectedMessage?.id === id) {
        setSelectedMessage(prev => prev ? { ...prev, status } : null);
      }
      toast.success(`Marked as ${status}`);
    } catch (e) {
      toast.error('Failed to update message status.');
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Permanently delete this support message?')) return;
    try {
      await deleteContactMessage(id);
      setSupportMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMessage?.id === id) setSelectedMessage(null);
      toast.success('Message deleted.');
    } catch (e) {
      toast.error('Failed to delete message.');
    }
  };

  // Marker Handlers
  const handleMarkerStatus = async (markerId: string, status: MarkerStatus) => {
    try {
      await updateMarkerStatusAdmin(markerId, status);
      setMarkers(prev => prev.map(m => m.id === markerId ? { ...m, status } : m));
      toast.success(`Marker updated to ${status}`);
    } catch (e) {
      toast.error('Failed to update marker.');
    }
  };

  // Metric counts
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const unreadSupport = supportMessages.filter(m => m.status === 'unread');
  const pendingMarkers = markers.filter(m => m.status === 'pending');
  const reportedMarkers = markers.filter(m => (m.reportedBy || []).length > 0);

  const actionItemsCount = pendingPayments.length + unreadSupport.length + reportedMarkers.length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/10 border border-teal-500/20 rounded-xl">
              <Activity className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Live Ops Triage
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                Founder queue for payment verification, support tickets, and community moderation.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchAllData}
          disabled={refreshing}
          className="px-4 py-2 rounded-xl border border-border/60 bg-card hover:bg-muted text-xs font-semibold flex items-center gap-2 self-start md:self-auto transition-all active:scale-95"
        >
          <RefreshCw className={cn("w-3.5 h-3.5 text-teal-400", refreshing && "animate-spin")} />
          <span>Sync Operations</span>
        </button>
      </div>

      {/* KPI Highlights Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div 
          onClick={() => { setActiveQueue('action_needed'); }}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer",
            activeQueue === 'action_needed'
              ? "bg-teal-500/10 border-teal-500/40 ring-1 ring-teal-500/20"
              : "bg-card/50 border-border/50 hover:bg-card"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Action Needed</span>
            <AlertCircle className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-teal-300">{actionItemsCount}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Pending items needing review</p>
        </div>

        <div 
          onClick={() => { setActiveQueue('payments'); setPaymentFilter('pending'); }}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer",
            activeQueue === 'payments'
              ? "bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20"
              : "bg-card/50 border-border/50 hover:bg-card"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Pending Payments</span>
            <CreditCard className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-amber-300">{pendingPayments.length}</div>
          <p className="text-[11px] text-amber-500/80 mt-1 font-medium">₹{(pendingPayments.length * 499).toLocaleString()} pending verification</p>
        </div>

        <div 
          onClick={() => { setActiveQueue('support'); setSupportFilter('unread'); }}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer",
            activeQueue === 'support'
              ? "bg-primary/10 border-purple-500/40 ring-1 ring-primary/20"
              : "bg-card/50 border-border/50 hover:bg-card"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Unread Support</span>
            <Inbox className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold mt-2 text-purple-300">{unreadSupport.length}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Student tickets awaiting response</p>
        </div>

        <div 
          onClick={() => { setActiveQueue('markers'); setMarkerFilter('reported'); }}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer",
            activeQueue === 'markers'
              ? "bg-rose-500/10 border-rose-500/40 ring-1 ring-rose-500/20"
              : "bg-card/50 border-border/50 hover:bg-card"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Reported Markers</span>
            <Shield className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-rose-300">{reportedMarkers.length}</div>
          <p className="text-[11px] text-muted-foreground mt-1">{pendingMarkers.length} pending submissions</p>
        </div>
      </div>

      {/* Main Queue Segment Selector & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div className="p-1 bg-card border border-border/60 rounded-xl flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveQueue('action_needed')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all",
              activeQueue === 'action_needed'
                ? "bg-teal-500 text-black shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            🔥 Priority Stream {actionItemsCount > 0 && <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-xs">{actionItemsCount}</span>}
          </button>

          <button
            onClick={() => setActiveQueue('payments')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all",
              activeQueue === 'payments'
                ? "bg-card text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            Payments Queue {pendingPayments.length > 0 && <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-bold">{pendingPayments.length}</span>}
          </button>

          <button
            onClick={() => setActiveQueue('support')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all",
              activeQueue === 'support'
                ? "bg-card text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Inbox className="w-3.5 h-3.5 text-primary" />
            Support Tickets {unreadSupport.length > 0 && <span className="px-1.5 py-0.2 rounded-full bg-purple-500 text-white text-[10px] font-bold">{unreadSupport.length}</span>}
          </button>

          <button
            onClick={() => setActiveQueue('markers')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all",
              activeQueue === 'markers'
                ? "bg-card text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
            Community Markers {reportedMarkers.length > 0 && <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">{reportedMarkers.length}</span>}
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search email, ref, or subject..."
            className="pl-9 text-xs rounded-xl bg-card border-border/60"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Syncing live operations queue...</p>
        </div>
      ) : (
        <>
          {/* QUEUE 1: PRIORITY STREAM */}
          {activeQueue === 'action_needed' && (
            <div className="space-y-6">
              {actionItemsCount === 0 ? (
                <div className="py-16 text-center border border-border/50 rounded-2xl bg-card/40 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto" />
                  <h3 className="text-lg font-bold">All Operational Queues Clear!</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    No pending payments, unread support tickets, or reported community markers right now.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Pending Payments Section */}
                  {pendingPayments.length > 0 && (
                    <div className="bg-card border border-amber-500/30 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-border/50">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                          <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                            Pending Payment Verification ({pendingPayments.length})
                          </h3>
                        </div>
                        <button
                          onClick={() => { setActiveQueue('payments'); setPaymentFilter('pending'); }}
                          className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          View All Payments <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {pendingPayments.slice(0, 4).map(p => (
                          <div key={p.id} className="p-4 rounded-xl border border-border/60 bg-background/60 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-semibold text-sm">{p.userName || p.userEmail}</div>
                                <div className="text-xs text-muted-foreground font-mono mt-0.5">{p.userEmail}</div>
                              </div>
                              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                                ₹{p.amount} · {p.plan}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between text-xs bg-muted/40 p-2 rounded-lg font-mono text-muted-foreground">
                              <span>UPI Ref: <strong className="text-foreground">{p.upiReference}</strong></span>
                              <button
                                onClick={() => copyToClipboard(p.upiReference, p.id)}
                                className="text-teal-400 hover:text-teal-300 text-[10px] uppercase font-bold"
                              >
                                {copiedId === p.id ? 'Copied!' : 'Copy'}
                              </button>
                            </div>

                            <div className="flex items-center justify-between pt-1 gap-2">
                              {p.proofUrl && (
                                <button
                                  onClick={() => setPreviewImage(p.proofUrl)}
                                  className="px-2.5 py-1 rounded-lg border border-border/60 text-[11px] font-medium flex items-center gap-1 hover:bg-muted"
                                >
                                  <Eye className="w-3 h-3 text-teal-400" /> Proof Screenshot
                                </button>
                              )}
                              <div className="flex items-center gap-2 ml-auto">
                                <button
                                  onClick={() => setRejectingPayment(p)}
                                  className="px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" /> Reject
                                </button>
                                <button
                                  onClick={() => handleApprovePayment(p)}
                                  className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-black text-xs font-bold flex items-center gap-1 transition-all"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve Beta
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unread Support Tickets Section */}
                  {unreadSupport.length > 0 && (
                    <div className="bg-card border border-primary/30 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-border/50">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                          <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">
                            Unread Support Tickets ({unreadSupport.length})
                          </h3>
                        </div>
                        <button
                          onClick={() => { setActiveQueue('support'); setSupportFilter('unread'); }}
                          className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                        >
                          View Support Inbox <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {unreadSupport.slice(0, 3).map(m => (
                          <div key={m.id} className="p-4 rounded-xl border border-border/60 bg-background/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] border-primary/30 text-purple-300">
                                  {m.category}
                                </Badge>
                                <span className="font-semibold text-sm">{m.subject}</span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">{m.message}</p>
                              <div className="text-[10px] text-muted-foreground/70 flex items-center gap-2 pt-1">
                                <span>From: {m.name} ({m.email})</span>
                                <span>•</span>
                                <span>{m.createdAt?.toDate ? formatDistanceToNow(m.createdAt.toDate(), { addSuffix: true }) : 'Recently'}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => setSelectedMessage(m)}
                                className="px-3 py-1.5 rounded-lg border border-border/60 text-xs font-semibold hover:bg-muted"
                              >
                                View Ticket
                              </button>
                              <button
                                onClick={() => handleMessageStatus(m.id, 'read')}
                                className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-primary/30 hover:bg-purple-500/30 text-xs font-semibold"
                              >
                                Mark Read
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reported Markers Section */}
                  {reportedMarkers.length > 0 && (
                    <div className="bg-card border border-rose-500/30 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-border/50">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
                          <h3 className="text-sm font-bold text-rose-300 uppercase tracking-wider">
                            Reported Community Markers ({reportedMarkers.length})
                          </h3>
                        </div>
                        <button
                          onClick={() => { setActiveQueue('markers'); setMarkerFilter('reported'); }}
                          className="text-xs text-rose-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          View Community Queue <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {reportedMarkers.slice(0, 4).map(marker => (
                          <div key={marker.id} className="p-4 rounded-xl border border-border/60 bg-background/60 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-rose-400 uppercase text-[10px] tracking-wider">
                                {marker.type} · Reported by {(marker.reportedBy || []).length} students
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {marker.subjectId}
                              </Badge>
                            </div>
                            <p className="text-xs text-foreground font-medium line-clamp-2">{marker.content}</p>
                            <div className="flex items-center justify-end gap-2 pt-2">
                              <button
                                onClick={() => handleMarkerStatus(marker.id, 'low_quality')}
                                className="px-3 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold"
                              >
                                Reject / Hide
                              </button>
                              <button
                                onClick={() => handleMarkerStatus(marker.id, 'published')}
                                className="px-3 py-1 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 text-xs font-semibold"
                              >
                                Dismiss Report
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* QUEUE 2: PAYMENTS QUEUE */}
          {activeQueue === 'payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(['pending', 'approved', 'rejected', 'all'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setPaymentFilter(tab)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                        paymentFilter === tab
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {tab} ({tab === 'all' ? payments.length : payments.filter(p => p.status === tab).length})
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Approval Duration:</span>
                  <select 
                    value={approvalDuration}
                    onChange={(e) => setApprovalDuration(Number(e.target.value))}
                    className="bg-card border border-border/60 rounded-lg px-2 py-1 text-foreground text-xs"
                  >
                    <option value={30}>30 Days (1 Month)</option>
                    <option value={90}>90 Days (3 Months - Default)</option>
                    <option value={180}>180 Days (6 Months)</option>
                    <option value={365}>365 Days (1 Year)</option>
                    <option value={9999}>Permanent / Lifetime</option>
                  </select>
                </div>
              </div>

              {/* Payments List */}
              <div className="grid grid-cols-1 gap-3">
                {payments
                  .filter(p => {
                    const matchStatus = paymentFilter === 'all' || p.status === paymentFilter;
                    const matchSearch = !searchQuery || 
                      p.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.upiReference?.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchStatus && matchSearch;
                  })
                  .map(p => (
                    <div key={p.id} className="p-4 rounded-xl border border-border/60 bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{p.userName || 'Medical Student'}</span>
                          <span className="text-xs text-muted-foreground font-mono">({p.userEmail})</span>
                          <Badge className={cn(
                            "text-[10px] capitalize",
                            p.status === 'pending' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                            p.status === 'approved' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                            p.status === 'rejected' && "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          )}>
                            {p.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>UPI Ref: <strong className="text-foreground font-mono">{p.upiReference}</strong></span>
                          <span>Amount: <strong className="text-teal-400 font-mono">₹{p.amount || 499}</strong></span>
                          <span>Plan: <strong>{p.plan || 'Closed Beta'}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {p.proofUrl && (
                          <button
                            onClick={() => setPreviewImage(p.proofUrl)}
                            className="px-3 py-1.5 rounded-lg border border-border/60 text-xs font-semibold flex items-center gap-1 hover:bg-muted"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-400" /> Proof
                          </button>
                        )}
                        {p.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setRejectingPayment(p)}
                              className="px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApprovePayment(p)}
                              className="px-3 py-1.5 rounded-lg bg-teal-500 text-black font-bold hover:bg-teal-400 text-xs flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve Beta
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* QUEUE 3: SUPPORT TICKETS */}
          {activeQueue === 'support' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {(['unread', 'read', 'archived', 'all'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSupportFilter(tab)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                      supportFilter === tab
                        ? "bg-purple-500/20 text-purple-300 border border-primary/30"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {tab} ({tab === 'all' ? supportMessages.length : supportMessages.filter(m => m.status === tab).length})
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {supportMessages
                  .filter(m => {
                    const matchStatus = supportFilter === 'all' || m.status === supportFilter;
                    const matchSearch = !searchQuery || 
                      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      m.subject.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchStatus && matchSearch;
                  })
                  .map(m => (
                    <div key={m.id} className="p-4 rounded-xl border border-border/60 bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] border-primary/30 text-purple-300">
                            {m.category}
                          </Badge>
                          <span className="font-bold text-sm">{m.subject}</span>
                          <span className="text-xs text-muted-foreground font-mono">({m.email})</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{m.message}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setSelectedMessage(m)}
                          className="px-3 py-1.5 rounded-lg border border-border/60 text-xs font-semibold hover:bg-muted"
                        >
                          Inspect
                        </button>
                        {m.status === 'unread' ? (
                          <button
                            onClick={() => handleMessageStatus(m.id, 'read')}
                            className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-primary/30 hover:bg-purple-500/30 text-xs font-semibold"
                          >
                            Mark Read
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMessageStatus(m.id, 'archived')}
                            className="px-3 py-1.5 rounded-lg border border-border/60 text-xs font-semibold text-muted-foreground"
                          >
                            Archive
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMessage(m.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* QUEUE 4: COMMUNITY MARKERS */}
          {activeQueue === 'markers' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {(['reported', 'pending', 'published', 'all'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setMarkerFilter(tab)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                      markerFilter === tab
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {tab} ({
                      tab === 'all' 
                        ? markers.length 
                        : tab === 'reported' 
                        ? markers.filter(m => (m.reportedBy || []).length > 0).length
                        : markers.filter(m => m.status === tab).length
                    })
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {markers
                  .filter(m => {
                    if (markerFilter === 'reported') return (m.reportedBy || []).length > 0;
                    if (markerFilter === 'all') return true;
                    return m.status === markerFilter;
                  })
                  .map(m => (
                    <div key={m.id} className="p-4 rounded-xl border border-border/60 bg-card space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/20 text-[10px] uppercase">
                              {m.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">Subject ID: {m.subjectId}</span>
                            {(m.reportedBy || []).length > 0 && (
                              <Badge variant="destructive" className="text-[10px]">
                                {m.reportedBy.length} Reports
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          Status: {m.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-foreground font-medium">{m.content}</p>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                        <button
                          onClick={() => handleMarkerStatus(m.id, 'low_quality')}
                          className="px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold"
                        >
                          Reject / Low Quality
                        </button>
                        <button
                          onClick={() => handleMarkerStatus(m.id, 'published')}
                          className="px-3 py-1.5 rounded-lg bg-teal-500 text-black font-bold hover:bg-teal-400 text-xs"
                        >
                          Approve & Publish
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* PROOF PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-border/60 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">UPI Payment Proof Screenshot</h3>
              <button onClick={() => setPreviewImage(null)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-border/50 bg-black/40 flex items-center justify-center p-2">
              <img src={previewImage} alt="Proof" className="max-w-full h-auto rounded-lg object-contain" />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON DIALOG */}
      {rejectingPayment && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-rose-400">Reject Payment Submission</h3>
              <button onClick={() => setRejectingPayment(null)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Provide a clear reason for rejecting the UPI payment from <strong>{rejectingPayment.userEmail}</strong>.
            </p>

            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="e.g. Invalid UPI Transaction Reference number or unverified screenshot."
              className="w-full bg-background border border-border/60 rounded-xl p-3 text-xs focus:ring-2 focus:ring-rose-500/50 min-h-[90px]"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingPayment(null)}
                className="px-4 py-2 border border-border/60 rounded-xl text-xs font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejectPayment}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPPORT MESSAGE DETAIL MODAL */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-purple-500/40 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-purple-300">
                  {selectedMessage.category}
                </Badge>
                <h3 className="font-bold text-lg mt-1">{selectedMessage.subject}</h3>
              </div>
              <button onClick={() => setSelectedMessage(null)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-background border border-border/50 text-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground border-b border-border/40 pb-2">
                <span>From: <strong>{selectedMessage.name}</strong> ({selectedMessage.email})</span>
                <span>{selectedMessage.createdAt?.toDate ? format(selectedMessage.createdAt.toDate(), 'PPP p') : 'Recent'}</span>
              </div>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap pt-1">{selectedMessage.message}</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={`mailto:${selectedMessage.email}?subject=Re: Atlas Support - ${encodeURIComponent(selectedMessage.subject)}`}
                className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-primary text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" /> Reply via Email
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleMessageStatus(selectedMessage.id, 'archived')}
                  className="px-3 py-2 rounded-xl border border-border/60 text-xs font-semibold hover:bg-muted"
                >
                  Archive Ticket
                </button>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
