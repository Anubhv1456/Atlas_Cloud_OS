import React, { useEffect, useState, useRef } from 'react';
import { 
  getPaymentSubmissions, 
  approvePayment, 
  rejectPayment, 
  PaymentSubmission,
  getPaymentConfig,
  savePaymentConfig,
  PaymentConfig,
  DEFAULT_PAYMENT_CONFIG
} from '@/lib/admin';
import { useAuth } from '@/hooks/useAuth';
import { 
  CreditCard, Check, X, Search, RefreshCw, Eye, Copy, 
  Clock, CheckCircle2, XCircle, AlertCircle, Sparkles, ExternalLink, ShieldCheck,
  Settings, QrCode, Link as LinkIcon, Save, Plus, Trash2, Upload, FileText
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';

type ViewMode = 'submissions' | 'settings';
type FilterTab = 'all' | 'pending' | 'approved' | 'rejected';

export function PaymentsView() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('submissions');
  const [payments, setPayments] = useState<PaymentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('pending');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Payment Config State
  const [config, setConfig] = useState<PaymentConfig>(DEFAULT_PAYMENT_CONFIG);
  const [savingConfig, setSavingConfig] = useState(false);
  const [newBenefit, setNewBenefit] = useState('');

  // Modal for previewing screenshot proof
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Rejection Dialog state
  const [rejectingPayment, setRejectingPayment] = useState<PaymentSubmission | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');

  // Duration for Approval (Default 90 days / 3 months)
  const [approvalDuration, setApprovalDuration] = useState<number>(90);

  const qrInputRef = useRef<HTMLInputElement>(null);

  const fetchPaymentsAndConfig = async () => {
    setRefreshing(true);
    try {
      const [submissionsData, configData] = await Promise.all([
        getPaymentSubmissions(),
        getPaymentConfig()
      ]);
      setPayments(submissionsData);
      setConfig(configData);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPaymentsAndConfig();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = async (payment: PaymentSubmission) => {
    try {
      await approvePayment(payment.id, payment.userId, user?.email || undefined, approvalDuration);
      toast.success(`Payment approved! ${approvalDuration}-Day Beta granted to ${payment.userEmail}`);
      setPayments(payments.map(p => p.id === payment.id ? { ...p, status: 'approved', reviewedAt: new Date() } : p));
    } catch (e) {
      console.error(e);
      toast.error('Failed to approve payment');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingPayment) return;
    try {
      await rejectPayment(rejectingPayment.id, rejectingPayment.userId, rejectionNote, user?.email || undefined);
      toast.success(`Payment rejected for ${rejectingPayment.userEmail}`);
      setPayments(payments.map(p => p.id === rejectingPayment.id ? { ...p, status: 'rejected', rejectionNote, reviewedAt: new Date() } : p));
      setRejectingPayment(null);
      setRejectionNote('');
    } catch (e) {
      console.error(e);
      toast.error('Failed to reject payment');
    }
  };

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingConfig(true);
    try {
      await savePaymentConfig(config);
      toast.success('Payment methods and pricing settings saved successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to save payment configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  // Image Upload for Custom QR Code
  const handleQrUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setConfig(prev => ({ ...prev, upiQrUrl: result }));
      toast.success('Custom QR code image attached');
    };
    reader.readAsDataURL(file);
  };

  const addBenefit = () => {
    if (!newBenefit.trim()) return;
    setConfig(prev => ({
      ...prev,
      benefits: [...prev.benefits, newBenefit.trim()]
    }));
    setNewBenefit('');
  };

  const removeBenefit = (index: number) => {
    setConfig(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  // Filter logic
  const filteredPayments = payments.filter(p => {
    const matchesTab = activeTab === 'all' || p.status === activeTab;
    const matchesSearch = 
      (p.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.upiReference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.userId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    approved: payments.filter(p => p.status === 'approved').length,
    rejected: payments.filter(p => p.status === 'rejected').length,
    revenue: payments.filter(p => p.status === 'approved').reduce((acc, p) => acc + (p.amount || config.price), 0),
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-teal-400" />
            Beta Payments & Verification
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage UPI payment verification, custom QR codes, pricing, and external payment links.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className="p-1 bg-muted/50 border border-border/50 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('submissions')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                viewMode === 'submissions'
                  ? 'bg-card text-foreground shadow-sm border border-border/60'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Submissions {stats.pending > 0 && <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-bold">{stats.pending}</span>}
            </button>
            <button
              onClick={() => setViewMode('settings')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                viewMode === 'settings'
                  ? 'bg-card text-foreground shadow-sm border border-border/60'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Configure Methods
            </button>
          </div>

          <button
            onClick={fetchPaymentsAndConfig}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl border border-border/60 bg-card hover:bg-muted text-xs font-medium flex items-center gap-2 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: SUBMISSIONS TABLE */}
      {viewMode === 'submissions' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div 
              onClick={() => setActiveTab('pending')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                activeTab === 'pending' 
                  ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20 shadow-lg shadow-amber-500/5' 
                  : 'bg-card/50 border-border/50 hover:bg-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Pending Review</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold mt-2 text-amber-400">{stats.pending}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Awaiting manual verification</p>
            </div>

            <div 
              onClick={() => setActiveTab('approved')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                activeTab === 'approved' 
                  ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-500/5' 
                  : 'bg-card/50 border-border/50 hover:bg-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Approved Members</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold mt-2 text-emerald-400">{stats.approved}</div>
              <p className="text-[11px] text-emerald-500/80 mt-1 font-medium">₹{stats.revenue.toLocaleString()} total revenue</p>
            </div>

            <div 
              onClick={() => setActiveTab('rejected')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                activeTab === 'rejected' 
                  ? 'bg-rose-500/10 border-rose-500/40 ring-1 ring-rose-500/20' 
                  : 'bg-card/50 border-border/50 hover:bg-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Rejected</span>
                <XCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold mt-2 text-rose-400">{stats.rejected}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Invalid reference or proof</p>
            </div>

            <div 
              onClick={() => setActiveTab('all')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                activeTab === 'all' 
                  ? 'bg-card border-primary/40 ring-1 ring-primary/20' 
                  : 'bg-card/50 border-border/50 hover:bg-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Submissions</span>
                <CreditCard className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold mt-2 text-foreground">{stats.total}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Current Plan: ₹{config.price} ({config.durationText})</p>
            </div>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center p-1 bg-muted/40 border border-border/40 rounded-xl overflow-x-auto">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'pending' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Pending ({stats.pending})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'approved' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Approved ({stats.approved})
              </button>
              <button
                onClick={() => setActiveTab('rejected')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'rejected' 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Rejected ({stats.rejected})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'all' 
                    ? 'bg-card text-foreground shadow-sm border border-border/50' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({stats.total})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search email, name, UPI ref..." 
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

          {/* Submissions List / Table */}
          {loading ? (
            <div className="flex items-center justify-center p-16">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="bg-card border border-border/50 rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto text-muted-foreground">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No Submissions Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {activeTab === 'pending' 
                  ? 'All payment submissions have been reviewed! You are up to date.' 
                  : 'No payment submissions match the current filter or search criteria.'}
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground border-b border-border/40 font-medium">
                    <tr>
                      <th className="p-4 pl-5">User</th>
                      <th className="px-4 py-3">UPI Ref / UTR</th>
                      <th className="px-4 py-3">Screenshot Proof</th>
                      <th className="px-4 py-3">Plan & Amount</th>
                      <th className="px-4 py-3">Submitted At</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right pr-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredPayments.map((payment) => {
                      const createdAtDate = payment.createdAt?.toDate ? payment.createdAt.toDate() : new Date(payment.createdAt || Date.now());

                      return (
                        <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                          {/* User Info */}
                          <td className="p-4 pl-5">
                            <div>
                              <div className="font-semibold text-foreground">{payment.userName || 'Aspirant'}</div>
                              <div className="text-muted-foreground flex items-center gap-1 mt-0.5">
                                <span className="truncate max-w-[180px]">{payment.userEmail}</span>
                                <button 
                                  onClick={() => copyToClipboard(payment.userEmail, `email-${payment.id}`)}
                                  className="hover:text-foreground p-0.5"
                                  title="Copy email"
                                >
                                  {copiedId === `email-${payment.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* UPI Ref / UTR */}
                          <td className="px-4 py-3 font-mono font-medium text-teal-400">
                            <div className="flex items-center gap-1.5">
                              <span>{payment.upiReference || 'N/A'}</span>
                              {payment.upiReference && (
                                <button 
                                  onClick={() => copyToClipboard(payment.upiReference, `upi-${payment.id}`)}
                                  className="hover:text-foreground text-muted-foreground p-0.5"
                                  title="Copy UTR Ref"
                                >
                                  {copiedId === `upi-${payment.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Screenshot Proof */}
                          <td className="px-4 py-3">
                            {payment.proofUrl ? (
                              <button
                                onClick={() => setPreviewImage(payment.proofUrl)}
                                className="group relative w-12 h-12 rounded-xl border border-border/60 overflow-hidden bg-muted flex items-center justify-center hover:ring-2 hover:ring-teal-500/50 transition-all shrink-0"
                              >
                                <img 
                                  src={payment.proofUrl} 
                                  alt="Payment Proof" 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                  <Eye className="w-4 h-4" />
                                </div>
                              </button>
                            ) : (
                              <span className="text-muted-foreground italic text-[11px]">No proof uploaded</span>
                            )}
                          </td>

                          {/* Plan & Amount */}
                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground">₹{payment.amount || config.price}</div>
                            <div className="text-[11px] text-muted-foreground">{payment.plan || config.planTitle}</div>
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3 text-muted-foreground">
                            <div>{format(createdAtDate, 'dd MMM yyyy')}</div>
                            <div className="text-[10px] text-muted-foreground/70">{format(createdAtDate, 'hh:mm a')}</div>
                          </td>

                          {/* Status Badge */}
                          <td className="px-4 py-3">
                            {payment.status === 'pending' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                            {payment.status === 'approved' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" />
                                Approved
                              </span>
                            )}
                            {payment.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20" title={payment.rejectionNote}>
                                <XCircle className="w-3 h-3" />
                                Rejected
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right pr-6">
                            <div className="flex items-center justify-end gap-2">
                              {payment.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(payment)}
                                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center gap-1 transition-all shadow-sm"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Approve
                                  </button>

                                  <button
                                    onClick={() => {
                                      setRejectingPayment(payment);
                                      setRejectionNote('');
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 font-semibold text-xs transition-all"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {payment.status === 'approved' && (
                                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Beta Access Active
                                </span>
                              )}

                              {payment.status === 'rejected' && (
                                <button
                                  onClick={() => handleApprove(payment)}
                                  className="px-2.5 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-[11px] font-medium border border-border/50"
                                >
                                  Re-Approve
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* VIEW MODE 2: CONFIGURE PAYMENT METHODS & PRICING */}
      {viewMode === 'settings' && (
        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 space-y-8 shadow-sm">
            {/* Title & Save Bar */}
            <div className="flex items-center justify-between pb-6 border-b border-border/40">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Settings className="w-5 h-5 text-teal-400" />
                  Customize Payment Methods & Invitation Pricing
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Update your UPI ID, custom QR Code, payment link, pricing, and plan benefits shown on the Closed Beta checkout screen.
                </p>
              </div>

              <button
                type="submit"
                disabled={savingConfig}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md shadow-teal-950/20 disabled:opacity-50"
              >
                {savingConfig ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Payment Settings
                  </>
                )}
              </button>
            </div>

            {/* Section 1: Plan & Pricing Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider text-teal-400">
                1. Plan Title & Pricing
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Plan Title</label>
                  <Input 
                    value={config.planTitle}
                    onChange={(e) => setConfig({ ...config, planTitle: e.target.value })}
                    placeholder="Closed Beta Membership"
                    className="bg-muted/40 border-border/50 text-xs h-10 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Price (Amount)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                      {config.currencySymbol || '₹'}
                    </span>
                    <Input 
                      type="number"
                      value={config.price}
                      onChange={(e) => setConfig({ ...config, price: parseFloat(e.target.value) || 0 })}
                      className="pl-7 bg-muted/40 border-border/50 text-xs h-10 rounded-xl font-semibold text-teal-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Duration Label</label>
                  <Input 
                    value={config.durationText}
                    onChange={(e) => setConfig({ ...config, durationText: e.target.value })}
                    placeholder="3 Months"
                    className="bg-muted/40 border-border/50 text-xs h-10 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Access Granted (Days)</label>
                  <Input 
                    type="number"
                    value={config.durationDays}
                    onChange={(e) => setConfig({ ...config, durationDays: parseInt(e.target.value) || 90 })}
                    placeholder="90"
                    className="bg-muted/40 border-border/50 text-xs h-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-muted-foreground">Invitation Instructions Header Text</label>
                <textarea 
                  rows={2}
                  value={config.instructionsText}
                  onChange={(e) => setConfig({ ...config, instructionsText: e.target.value })}
                  placeholder="You're one step away from joining Atlas Closed Beta..."
                  className="w-full p-3 rounded-xl bg-muted/40 border border-border/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500/50 resize-none"
                />
              </div>
            </div>

            {/* Section 2: Payment Methods Configuration */}
            <div className="space-y-6 pt-4 border-t border-border/40">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider text-teal-400">
                2. Active Payment Methods & Instructions
              </h3>

              {/* Method Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* UPI ID Method */}
                <div className={`p-4 rounded-2xl border transition-all ${config.enableUpiTab ? 'bg-card border-teal-500/30' : 'bg-muted/20 border-border/40 opacity-70'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-teal-400" />
                      UPI VPA / ID
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={config.enableUpiTab} 
                        onChange={(e) => setConfig({ ...config, enableUpiTab: e.target.checked })}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] text-muted-foreground">UPI ID / VPA Address</label>
                    <Input 
                      value={config.upiId}
                      onChange={(e) => setConfig({ ...config, upiId: e.target.value })}
                      placeholder="atlas@upi"
                      className="bg-muted/40 border-border/50 font-mono text-xs h-9 rounded-xl text-teal-400"
                    />
                    <p className="text-[10px] text-muted-foreground">Users click one button to copy this ID to their clipboard.</p>
                  </div>
                </div>

                {/* UPI QR Code Method */}
                <div className={`p-4 rounded-2xl border transition-all ${config.enableQrTab ? 'bg-card border-teal-500/30' : 'bg-muted/20 border-border/40 opacity-70'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-teal-400" />
                      UPI QR Code
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={config.enableQrTab} 
                        onChange={(e) => setConfig({ ...config, enableQrTab: e.target.checked })}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] text-muted-foreground">Custom QR Image (Optional)</label>
                    <input 
                      type="file" 
                      ref={qrInputRef} 
                      onChange={(e) => e.target.files?.[0] && handleQrUpload(e.target.files[0])} 
                      accept="image/*" 
                      className="hidden" 
                    />

                    {config.upiQrUrl ? (
                      <div className="flex items-center justify-between p-2 bg-muted/40 rounded-xl border border-border/50">
                        <img src={config.upiQrUrl} alt="Custom QR" className="w-8 h-8 object-contain rounded bg-white p-0.5" />
                        <span className="text-[10px] text-teal-400 font-medium">Custom QR Attached</span>
                        <button 
                          type="button" 
                          onClick={() => setConfig({ ...config, upiQrUrl: '' })}
                          className="text-[11px] text-rose-400 hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => qrInputRef.current?.click()}
                        className="w-full py-2 border border-dashed border-border/60 rounded-xl text-xs text-muted-foreground hover:bg-muted/30 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5 text-teal-400" />
                        <span>Upload Custom QR Image</span>
                      </button>
                    )}
                    <p className="text-[10px] text-muted-foreground">If omitted, an auto-generated vector QR for `{config.upiId}` is shown.</p>
                  </div>
                </div>

                {/* External Link / Razorpay Method */}
                <div className={`p-4 rounded-2xl border transition-all ${config.enableLinkTab ? 'bg-card border-teal-500/30' : 'bg-muted/20 border-border/40 opacity-70'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <LinkIcon className="w-4 h-4 text-teal-400" />
                      Razorpay / External Payment Link
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={config.enableLinkTab} 
                        onChange={(e) => setConfig({ ...config, enableLinkTab: e.target.checked })}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] text-muted-foreground">Payment Link URL</label>
                    <Input 
                      value={config.paymentLinkUrl}
                      onChange={(e) => setConfig({ ...config, paymentLinkUrl: e.target.value })}
                      placeholder="https://rzp.io/l/YOUR_LINK"
                      className="bg-muted/40 border-border/50 font-mono text-xs h-9 rounded-xl"
                    />
                    <p className="text-[10px] text-muted-foreground">If set, users can click to pay via Razorpay Payment Link or Netbanking.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Benefits Checklist */}
            <div className="space-y-4 pt-4 border-t border-border/40">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider text-teal-400">
                3. Membership Benefits Checklist
              </h3>

              <div className="space-y-2 max-w-lg">
                {config.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 bg-muted/30 border border-border/40 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400" />
                      <span className="text-foreground font-medium">{benefit}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBenefit(index)}
                      className="text-muted-foreground hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-2 pt-2">
                  <Input 
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    placeholder="Add a new benefit line..."
                    className="bg-muted/40 border-border/50 text-xs h-9 rounded-xl flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addBenefit();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addBenefit}
                    className="px-3 py-2 rounded-xl bg-teal-600/20 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center gap-1 hover:bg-teal-600/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Submit CTA */}
            <div className="pt-6 border-t border-border/40 flex items-center justify-end">
              <button
                type="submit"
                disabled={savingConfig}
                className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md shadow-teal-950/20 disabled:opacity-50"
              >
                {savingConfig ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Payment Configuration
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Image Preview Lightbox Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-2xl w-full bg-[#0a0a0a] border border-zinc-800 rounded-3xl p-4 overflow-hidden shadow-2xl space-y-3 cursor-default"
          >
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-semibold text-zinc-300">UPI Payment Proof Screenshot</span>
              <button 
                onClick={() => setPreviewImage(null)}
                className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-sm"
              >
                ×
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden max-h-[75vh] flex items-center justify-center bg-zinc-950/80 border border-zinc-800">
              <img src={previewImage} alt="Full Proof" className="max-h-[70vh] w-auto object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Rejection Note Modal */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-100">Reject Payment Submission</h3>
              <button 
                onClick={() => setRejectingPayment(null)}
                className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Rejecting payment for <span className="text-zinc-200 font-semibold">{rejectingPayment.userEmail}</span> (UPI Ref: {rejectingPayment.upiReference}). You can provide a brief reason:
            </p>

            <Input 
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="e.g. UTR reference not found in bank statement"
              className="bg-zinc-900 border-zinc-800 text-zinc-100 text-xs h-10 rounded-xl"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingPayment(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-500/10 transition-all"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
