import React, { useEffect, useState } from 'react';
import { 
  getContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
  ContactMessage,
  getAllMarkersForAdmin,
  updateMarkerStatusAdmin,
  getDashboardStats,
  getPaymentSubmissions,
  approvePayment,
  rejectPayment,
  PaymentSubmission
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
  const [supportMessages, setSupportMessages] = useState<ContactMessage[]>([]);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [paymentSubmissions, setPaymentSubmissions] = useState<PaymentSubmission[]>([]);
  const [stats, setStats] = useState({ users: 0, signups: 0, pendingMarkers: 0, reportedMarkers: 0 });

  // Filters
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('pending');
  const [supportFilter, setSupportFilter] = useState<SupportFilter>('unread');
  const [markerFilter, setMarkerFilter] = useState<MarkerFilter>('reported');

  // Preview Modals & Actions
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PaymentSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);

  // Copied item ID feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAllData = async () => {
    setRefreshing(true);
    try {
      const [supportData, markersData, paymentData] = await Promise.all([
        getContactMessages(),
        getAllMarkersForAdmin(),
        getPaymentSubmissions()
      ]);
      const statsData = await getDashboardStats(markersData);
      setSupportMessages(supportData);
      setMarkers(markersData);
      setStats(statsData);
      setPaymentSubmissions(paymentData);
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

  // Payment Handlers
  const handleApprovePayment = async (payment: PaymentSubmission) => {
    setProcessingPaymentId(payment.id);
    try {
      await approvePayment(payment.id, payment.userId, user?.email || undefined);
      setPaymentSubmissions(prev => prev.map(p => p.id === payment.id ? { 
        ...p, 
        status: 'approved', 
        reviewedAt: new Date(), 
        reviewedBy: user?.email || 'admin' 
      } : p));
      toast.success(`Access granted to ${payment.userEmail}!`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to approve payment');
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    setProcessingPaymentId(rejectTarget.id);
    try {
      const reason = rejectionReason.trim() || 'Verification unsuccessful.';
      await rejectPayment(rejectTarget.id, rejectTarget.userId, reason, user?.email || undefined);
      setPaymentSubmissions(prev => prev.map(p => p.id === rejectTarget.id ? { 
        ...p, 
        status: 'rejected', 
        rejectionNote: reason, 
        reviewedAt: new Date(), 
        reviewedBy: user?.email || 'admin' 
      } : p));
      toast.success(`Payment rejected for ${rejectTarget.userEmail}`);
      setRejectTarget(null);
      setRejectionReason('');
    } catch (e) {
      console.error(e);
      toast.error('Failed to reject payment');
    } finally {
      setProcessingPaymentId(null);
    }
  };

  // Metric counts
  const pendingPayments = paymentSubmissions.filter(p => p.status === 'pending');
  const unreadSupport = supportMessages.filter(m => m.status === 'unread');
  const pendingMarkers = markers.filter(m => m.status === 'pending');
  const reportedMarkers = markers.filter(m => (m.reportedBy || []).length > 0);

  const actionItemsCount = unreadSupport.length + reportedMarkers.length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-zinc-800/40 border border-white/5 rounded-xl">
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

      {/* KPI Highlights Strip (4 Symmetrical Columns) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div 
          onClick={() => { setActiveQueue('action_needed'); }}
          className={cn(
            "p-4 rounded-xl border transition-all cursor-pointer",
            activeQueue === 'action_needed'
              ? "bg-zinc-800/40 border-teal-500/40 ring-1 ring-teal-500/20"
              : "bg-card/50 border-border/50 hover:bg-card"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Action Needed</span>
            <AlertCircle className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-teal-300">{actionItemsCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Pending items needing review</p>
        </div>



        <div 
          onClick={() => { setActiveQueue('support'); setSupportFilter('unread'); }}
          className={cn(
            "p-4 rounded-xl border transition-all cursor-pointer",
            activeQueue === 'support'
              ? "bg-zinc-800/40 border-purple-500/40 ring-1 ring-primary/20"
              : "bg-card/50 border-border/50 hover:bg-card"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Unread Support</span>
            <Inbox className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold mt-2 text-purple-300">{unreadSupport.length}</div>
          <p className="text-xs text-muted-foreground mt-1">Student tickets awaiting response</p>
        </div>

        <div 
          onClick={() => { setActiveQueue('markers'); setMarkerFilter('reported'); }}
          className={cn(
            "p-4 rounded-xl border transition-all cursor-pointer",
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
          <p className="text-xs text-muted-foreground mt-1">{pendingMarkers.length} pending submissions</p>
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
            onClick={() => setActiveQueue('support')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all",
              activeQueue === 'support'
                ? "bg-card text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Inbox className="w-3.5 h-3.5 text-primary" />
            Support Tickets {unreadSupport.length > 0 && <span className="px-1.5 py-0.2 rounded-full bg-purple-500 text-white text-xs font-bold">{unreadSupport.length}</span>}
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
            Community Markers {reportedMarkers.length > 0 && <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-xs font-bold">{reportedMarkers.length}</span>}
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
                <div className="py-16 text-center border border-border/50 rounded-xl bg-card/40 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto" />
                  <h3 className="text-lg font-bold">All Operational Queues Clear!</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    No pending payments, unread support tickets, or reported community markers right now.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">



                  {/* Unread Support Tickets Section */}
                  {unreadSupport.length > 0 && (
                    <div className="bg-card border border-primary/30 rounded-xl p-5 space-y-4">
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
                                <Badge variant="outline" className="text-xs border-primary/30 text-purple-300">
                                  {m.category}
                                </Badge>
                                <span className="font-semibold text-sm">{m.subject}</span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">{m.message}</p>
                              <div className="text-xs text-muted-foreground/70 flex items-center gap-2 pt-1">
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
                                className="px-3 py-1.5 rounded-lg bg-zinc-800/50 text-purple-300 border border-primary/30 hover:bg-purple-500/30 text-xs font-semibold"
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
                    <div className="bg-card border border-rose-500/30 rounded-xl p-5 space-y-4">
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
                              <span className="font-semibold text-rose-400 uppercase text-xs tracking-wider">
                                {marker.type} · Reported by {(marker.reportedBy || []).length} students
                              </span>
                              <Badge variant="outline" className="text-xs">
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
                                className="px-3 py-1 rounded-lg bg-zinc-800/50 text-teal-300 hover:bg-teal-500/30 text-xs font-semibold"
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
                        ? "bg-zinc-800/50 text-purple-300 border border-primary/30"
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
                      ((m.name || '').toLowerCase()).includes(searchQuery.toLowerCase()) ||
                      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      m.subject.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchStatus && matchSearch;
                  })
                  .map(m => (
                    <div key={m.id} className="p-4 rounded-xl border border-border/60 bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs border-primary/30 text-purple-300">
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
                            className="px-3 py-1.5 rounded-lg bg-zinc-800/50 text-purple-300 border border-primary/30 hover:bg-purple-500/30 text-xs font-semibold"
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
                            <Badge className="bg-zinc-800/40 text-teal-400 border-white/5 text-xs uppercase">
                              {m.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">Subject ID: {m.subjectId}</span>
                            {(m.reportedBy || []).length > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {m.reportedBy.length} Reports
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs uppercase">
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


      {/* SUPPORT MESSAGE DETAIL MODAL */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-purple-500/40 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="outline" className="text-xs border-primary/30 text-purple-300">
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
