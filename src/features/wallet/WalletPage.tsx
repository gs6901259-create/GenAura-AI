/**
 * GenAura AI — INR Wallet & Payments Dashboard
 * ============================================
 * Production-ready Indian Rupee (₹, INR) wallet system for Brands & Creators.
 * Features:
 * - Exact integer-paise accounting (1 INR = 100 paise)
 * - Distinct Available, Pending, and Reserved balances
 * - Sandbox Gateway Add Funds (UPI, NetBanking, Cards)
 * - Brand-to-Creator instant transfers with deal & campaign linkage
 * - Creator withdrawal workflow (REQUESTED -> PROCESSING -> COMPLETED)
 * - Payout destination management (Masked UPI IDs & Bank Accounts)
 * - Auditable transaction history & digital receipt export
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { walletService } from '@/services/walletService';
import {
  formatINR,
  paiseToRupees,
  rupeesToPaise,
  maskFinancialIdentifier,
  numberToIndianWords,
  calculateGst,
} from '@/services/currencyService';
import { Wallet, WalletTransaction, PayoutDestination, WithdrawalRequest } from '@/types/wallet';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  PlusCircle,
  Send,
  Building,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Download,
  Search,
  Filter,
  X,
  CreditCard,
  Handshake,
  ExternalLink,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function WalletPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialAction = searchParams.get('action');
  const targetRecipientId = searchParams.get('recipient');
  const targetDealId = searchParams.get('deal');

  const authUser = useAppStore((s) => s.authUser);
  const currentPersona = useAppStore((s) => s.currentPersona);
  const currentUserId = authUser?.id || (currentPersona === 'brand' ? 'usr_brand_1' : 'usr_creator_1');
  const userRole = (authUser?.role || currentPersona) as 'brand' | 'creator';

  const [wallet, setWallet] = useState<Wallet>(() => walletService.getWallet(currentUserId, userRole));
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [payoutDestinations, setPayoutDestinations] = useState<PayoutDestination[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);

  // Modals
  const [showAddFunds, setShowAddFunds] = useState(initialAction === 'topup');
  const [showSendPayment, setShowSendPayment] = useState(initialAction === 'send');
  const [showWithdraw, setShowWithdraw] = useState(initialAction === 'withdraw');
  const [showPayoutMgmt, setShowPayoutMgmt] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<WalletTransaction | null>(null);

  // Filters & Feedback
  const [txnSearch, setTxnSearch] = useState('');
  const [txnFilterType, setTxnFilterType] = useState<string>('all');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Reload data
  const refreshWalletData = () => {
    const updatedWallet = walletService.getWallet(currentUserId, userRole);
    setWallet(updatedWallet);
    setTransactions(walletService.getTransactions(currentUserId));
    setPayoutDestinations(walletService.getPayoutDestinations(currentUserId));
    setWithdrawals(walletService.getWithdrawalRequests(currentUserId));
  };

  useEffect(() => {
    refreshWalletData();
  }, [currentUserId, userRole]);

  // Handle URL pre-fill
  useEffect(() => {
    if (initialAction === 'send') setShowSendPayment(true);
    if (initialAction === 'topup') setShowAddFunds(true);
    if (initialAction === 'withdraw') setShowWithdraw(true);
  }, [initialAction]);

  const filteredTransactions = transactions.filter((t) => {
    if (txnFilterType !== 'all' && t.type !== txnFilterType) return false;
    if (txnSearch) {
      const q = txnSearch.toLowerCase();
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchUtr = t.utr?.toLowerCase().includes(q);
      const matchRecipient = t.recipientName?.toLowerCase().includes(q);
      if (!matchDesc && !matchUtr && !matchRecipient) return false;
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['Transaction ID', 'Date', 'Type', 'Amount (INR)', 'Fee (INR)', 'Status', 'Description', 'UTR Reference'];
    const rows = transactions.map((t) => [
      t.id,
      t.createdAt,
      t.type,
      (t.amountInPaise / 100).toFixed(2),
      (t.feeInPaise / 100).toFixed(2),
      t.status,
      `"${t.description.replace(/"/g, '""')}"`,
      t.utr || '',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `genaura_wallet_${currentUserId}_transactions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-navy-50">INR Wallet & Earnings</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
              {userRole === 'brand' ? 'Brand Wallet' : 'Creator Wallet'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              INR (₹)
            </span>
          </div>
          <p className="text-xs text-navy-400 mt-1">
            Authoritative, exact-paise balance management for brand campaign payments and creator earnings.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {userRole === 'brand' && (
            <button
              type="button"
              onClick={() => setShowAddFunds(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-navy-800 text-navy-100 hover:text-white border border-navy-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <PlusCircle size={14} className="text-emerald-400" />
              <span>Add Funds</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowSendPayment(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold gradient-brand text-white shadow-glow-violet hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            <Send size={14} />
            <span>Send Payment</span>
          </button>

          <button
            type="button"
            onClick={() => setShowWithdraw(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-navy-800 text-navy-100 hover:text-white border border-navy-700 transition-all flex items-center gap-1.5"
          >
            <ArrowUpRight size={14} className="text-violet-400" />
            <span>Withdraw</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPayoutMgmt(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-navy-900 text-navy-300 hover:text-white border border-navy-800 transition-all"
            title="Manage UPI & Bank Accounts"
          >
            <Building size={14} />
          </button>
        </div>
      </div>

      {/* Success / Error Feedback Alert */}
      {successBanner && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successBanner}</span>
          </div>
          <button type="button" onClick={() => setSuccessBanner(null)} className="text-emerald-400 hover:text-emerald-200">
            <X size={14} />
          </button>
        </div>
      )}
      {errorBanner && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{errorBanner}</span>
          </div>
          <button type="button" onClick={() => setErrorBanner(null)} className="text-rose-400 hover:text-rose-200">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Balance Metric Cards (Exact Integer Paise) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Available Balance */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-950 border border-violet-500/30 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-navy-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-navy-300">Available Balance</span>
            <span className="p-1.5 rounded-lg bg-violet-600/20 text-violet-300">
              <WalletIcon size={16} />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-navy-50 tracking-tight">
            {formatINR(wallet.availablePaise)}
          </div>
          <p className="text-[11px] text-navy-400 mt-2 flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Ready for transfer or instant payout</span>
          </p>
        </div>

        {/* Pending Balance */}
        <div className="p-5 rounded-2xl bg-navy-950 border border-navy-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-navy-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Pending Balance</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock size={16} />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 tracking-tight">
            {formatINR(wallet.pendingPaise)}
          </div>
          <p className="text-[11px] text-navy-500 mt-2">Milestone disbursements in verification</p>
        </div>

        {/* Reserved Balance (Campaign Escrow Hold) */}
        <div className="p-5 rounded-2xl bg-navy-950 border border-navy-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-navy-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Reserved for Campaigns</span>
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Lock size={16} />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300 tracking-tight">
            {formatINR(wallet.reservedPaise)}
          </div>
          <p className="text-[11px] text-navy-500 mt-2">Locked for accepted campaign milestones</p>
        </div>
      </div>

      {/* Lifetime Financial Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-navy-900/60 border border-navy-800 text-xs">
        <div className="flex items-center justify-between p-2 rounded-lg bg-navy-950/40">
          <span className="text-navy-400">Total Inflows (Deposits/Earnings):</span>
          <span className="font-bold text-emerald-400">{formatINR(wallet.totalIncomingPaise)}</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-navy-950/40">
          <span className="text-navy-400">Total Outflows (Payments):</span>
          <span className="font-bold text-violet-300">{formatINR(wallet.totalOutgoingPaise)}</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-navy-950/40">
          <span className="text-navy-400">Completed Withdrawals:</span>
          <span className="font-bold text-navy-200">{formatINR(wallet.totalWithdrawnPaise)}</span>
        </div>
      </div>

      {/* Active Withdrawals Tracker (if any pending) */}
      {withdrawals.filter((w) => w.status === 'requested' || w.status === 'processing').length > 0 && (
        <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-violet-200 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} className="text-violet-400 animate-spin" />
              <span>Pending Withdrawal Requests in Transit</span>
            </h3>
            <span className="text-[11px] text-violet-300">Processing via Razorpay Payouts Sandbox</span>
          </div>
          <div className="divide-y divide-violet-900/40">
            {withdrawals
              .filter((w) => w.status === 'requested' || w.status === 'processing')
              .map((w) => (
                <div key={w.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-navy-100">
                      {formatINR(w.netPayoutInPaise)} net payout ({w.payoutDestination.type === 'upi' ? w.payoutDestination.upiId : w.payoutDestination.bankName})
                    </div>
                    <div className="text-[11px] text-navy-400">
                      Requested {new Date(w.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Fee: {formatINR(w.feeInPaise)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {w.status.toUpperCase()}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        walletService.updateWithdrawalStatus(w.id, 'completed');
                        refreshWalletData();
                        setSuccessBanner(`Withdrawal of ${formatINR(w.netPayoutInPaise)} completed successfully.`);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-all"
                    >
                      Complete Sandbox Payout
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Transaction History Section */}
      <div className="p-5 rounded-2xl bg-navy-950 border border-navy-800 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-navy-50">Transaction History & Ledger</h2>
            <p className="text-xs text-navy-400 mt-0.5">
              Auditable records of all top-ups, creator payouts, and campaign milestone disbursements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCSV}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-navy-900 text-navy-200 hover:text-white border border-navy-800 hover:border-navy-700 transition-all flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              type="text"
              value={txnSearch}
              onChange={(e) => setTxnSearch(e.target.value)}
              placeholder="Search by recipient, description, or UTR..."
              className="w-full pl-9 pr-3.5 py-2 bg-navy-900 border border-navy-800 rounded-xl text-xs text-navy-100 placeholder:text-navy-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
            {['all', 'topup', 'transfer_sent', 'transfer_received', 'withdrawal'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setTxnFilterType(f)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all shrink-0 capitalize',
                  txnFilterType === f
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-navy-400 hover:text-navy-200 hover:bg-navy-900'
                )}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="border border-navy-800 rounded-xl overflow-hidden divide-y divide-navy-900">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-navy-400 space-y-2">
              <CreditCard size={28} className="mx-auto text-navy-600 opacity-60" />
              <p className="text-xs font-medium text-navy-300">No transactions recorded</p>
              <p className="text-[11px] text-navy-500">
                {txnSearch ? 'Try clearing your search query.' : 'Add funds or complete a campaign milestone to generate activity.'}
              </p>
            </div>
          ) : (
            filteredTransactions.map((txn) => {
              const isCredit = txn.type === 'topup' || txn.type === 'transfer_received' || txn.type === 'refund';

              return (
                <div
                  key={txn.id}
                  onClick={() => setSelectedTxn(txn)}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-navy-900/60 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Icon */}
                    <div
                      className={cn(
                        'h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border',
                        isCredit
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                      )}
                    >
                      {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>

                    {/* Description & Metadata */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-navy-100 truncate">{txn.description}</span>
                        {txn.linkedDealTitle && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-navy-800 text-violet-400 truncate max-w-xs flex items-center gap-0.5">
                            <Handshake size={10} />
                            {txn.linkedDealTitle}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-navy-400 flex items-center gap-2 mt-0.5">
                        <span>{new Date(txn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span>•</span>
                        <span>UTR: {txn.utr || 'Pending'}</span>
                        {txn.recipientName && <span>• To: {txn.recipientName}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Amount & Status */}
                  <div className="text-right shrink-0">
                    <div
                      className={cn(
                        'text-sm font-bold',
                        isCredit ? 'text-emerald-400' : 'text-navy-100'
                      )}
                    >
                      {isCredit ? '+' : '-'}{formatINR(txn.amountInPaise)}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-semibold uppercase',
                        txn.status === 'completed'
                          ? 'text-emerald-400'
                          : txn.status === 'pending'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      )}
                    >
                      {txn.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: ADD FUNDS (TOP-UP VIA RAZORPAY SANDBOX) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showAddFunds && (
        <AddFundsModal
          onClose={() => setShowAddFunds(false)}
          onSuccess={(amountPaise) => {
            setShowAddFunds(false);
            refreshWalletData();
            setSuccessBanner(`Successfully added ${formatINR(amountPaise)} to your available balance.`);
          }}
          userId={currentUserId}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: SEND PAYMENT (BRAND TO CREATOR) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showSendPayment && (
        <SendPaymentModal
          onClose={() => setShowSendPayment(false)}
          onSuccess={(amountPaise, recipientName) => {
            setShowSendPayment(false);
            refreshWalletData();
            setSuccessBanner(`Payment of ${formatINR(amountPaise)} successfully sent to ${recipientName}.`);
          }}
          senderId={currentUserId}
          senderRole={userRole}
          availablePaise={wallet.availablePaise}
          prefillRecipientId={targetRecipientId}
          prefillDealId={targetDealId}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: WITHDRAW FUNDS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showWithdraw && (
        <WithdrawFundsModal
          onClose={() => setShowWithdraw(false)}
          onSuccess={(netPayoutPaise) => {
            setShowWithdraw(false);
            refreshWalletData();
            setSuccessBanner(`Withdrawal request of ${formatINR(netPayoutPaise)} net payout submitted.`);
          }}
          userId={currentUserId}
          availablePaise={wallet.availablePaise}
          payoutDestinations={payoutDestinations}
          onManageDestinations={() => {
            setShowWithdraw(false);
            setShowPayoutMgmt(true);
          }}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 4: PAYOUT ACCOUNTS MANAGEMENT */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showPayoutMgmt && (
        <PayoutAccountsModal
          onClose={() => setShowPayoutMgmt(false)}
          userId={currentUserId}
          destinations={payoutDestinations}
          onUpdated={refreshWalletData}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 5: TRANSACTION DIGITAL RECEIPT */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedTxn && (
        <TransactionReceiptModal txn={selectedTxn} onClose={() => setSelectedTxn(null)} />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: ADD FUNDS MODAL
// ────────────────────────────────────────────────────────────────────────────
function AddFundsModal({
  userId,
  onClose,
  onSuccess,
}: {
  userId: string;
  onClose: () => void;
  onSuccess: (amountPaise: number) => void;
}) {
  const [amountRupees, setAmountRupees] = useState<number>(5000);
  const [method, setMethod] = useState<'upi' | 'netbanking' | 'card'>('upi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets = [1000, 5000, 10000, 25000, 50000, 100000];

  const handleDeposit = async () => {
    if (amountRupees <= 0) {
      setError('Please enter a positive amount in Rupees.');
      return;
    }
    const amountPaise = rupeesToPaise(amountRupees);
    setLoading(true);
    setError(null);

    try {
      // Simulate Razorpay Gateway order & verification
      const idempotencyKey = `topup_${userId}_${Date.now()}`;
      walletService.addFunds({
        userId,
        amountInPaise: amountPaise,
        paymentMethod: method,
        idempotencyKey,
        paymentRef: `pay_sbx_${Date.now()}`,
      });

      setTimeout(() => {
        setLoading(false);
        onSuccess(amountPaise);
      }, 600);
    } catch (e: any) {
      setLoading(false);
      setError(e.message || 'Payment processing failed.');
    }
  };

  return (
    <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-scaleUp">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle size={20} className="text-emerald-400" />
            <h3 className="text-base font-bold text-navy-50">Add Funds to INR Wallet</h3>
          </div>
          <button type="button" onClick={onClose} className="text-navy-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Sandbox Notice Banner */}
        <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-500/30 text-[11px] text-violet-300 flex items-center gap-2">
          <ShieldCheck size={16} className="text-violet-400 shrink-0" />
          <span>Razorpay India Sandbox Gateway — Verified simulation mode. No real bank debits occur.</span>
        </div>

        {error && <div className="p-2.5 rounded-lg bg-rose-500/15 text-rose-300 text-xs">{error}</div>}

        {/* Amount Input & Preset Chips */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-navy-200">Amount to Deposit (INR ₹)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-navy-400">₹</span>
            <input
              type="number"
              min={100}
              value={amountRupees}
              onChange={(e) => setAmountRupees(Number(e.target.value))}
              className="w-full pl-8 pr-4 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-base font-bold text-navy-100 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {presets.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmountRupees(amt)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
                  amountRupees === amt
                    ? 'bg-violet-600 text-white'
                    : 'bg-navy-950 border border-navy-800 text-navy-300 hover:text-white'
                )}
              >
                ₹{amt.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-navy-200">Payment Rails</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'upi', label: 'UPI / QR', icon: Smartphone },
              { id: 'netbanking', label: 'NetBanking', icon: Building },
              { id: 'card', label: 'Cards', icon: CreditCard },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id as any)}
                className={cn(
                  'p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5',
                  method === m.id
                    ? 'border-violet-500 bg-violet-600/15 text-white'
                    : 'border-navy-800 bg-navy-950 text-navy-400 hover:text-navy-200'
                )}
              >
                <m.icon size={18} />
                <span className="text-[11px] font-semibold">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={handleDeposit}
            className="w-full py-2.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-glow-violet disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw size={15} className="animate-spin" /> : <span>Deposit ₹{amountRupees.toLocaleString('en-IN')}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: SEND PAYMENT MODAL
// ────────────────────────────────────────────────────────────────────────────
function SendPaymentModal({
  senderId,
  senderRole,
  availablePaise,
  onClose,
  onSuccess,
  prefillRecipientId,
  prefillDealId,
}: {
  senderId: string;
  senderRole: 'brand' | 'creator';
  availablePaise: number;
  onClose: () => void;
  onSuccess: (amountPaise: number, recipientName: string) => void;
  prefillRecipientId?: string | null;
  prefillDealId?: string | null;
}) {
  const store = useAppStore.getState();
  const creators = store.creators;

  const [recipientId, setRecipientId] = useState(prefillRecipientId || (creators[0]?.id || 'usr_creator_1'));
  const [amountRupees, setAmountRupees] = useState<number>(25000);
  const [description, setDescription] = useState('Campaign Deliverable Milestone Payment');
  const [linkedDealId, setLinkedDealId] = useState(prefillDealId || '');
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRecipient =
    creators.find((c) => c.id === recipientId) || { name: 'Elena Rostova', handle: '@elenacreates' };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!recipientId) {
      setError('Please select an eligible recipient.');
      return;
    }
    if (recipientId === senderId) {
      setError('Cannot transfer funds to yourself.');
      return;
    }
    const amountPaise = rupeesToPaise(amountRupees);
    if (amountPaise <= 0) {
      setError('Transfer amount must be positive.');
      return;
    }
    if (amountPaise > availablePaise) {
      setError(`Insufficient available balance. You have ${formatINR(availablePaise)} available.`);
      return;
    }
    setStep('confirm');
  };

  const handleConfirmTransfer = async () => {
    setLoading(true);
    setError(null);
    const amountPaise = rupeesToPaise(amountRupees);

    try {
      const idempotencyKey = `transfer_${senderId}_${recipientId}_${Date.now()}`;
      walletService.transferFunds({
        senderId,
        recipientId,
        amountInPaise: amountPaise,
        description,
        senderName: store.authUser?.name || 'AuraBrand',
        recipientName: selectedRecipient.name,
        linkedDealId: linkedDealId || undefined,
        linkedDealTitle: linkedDealId ? 'Neon Dusk Brand Film' : undefined,
        idempotencyKey,
      });

      setTimeout(() => {
        setLoading(false);
        onSuccess(amountPaise, selectedRecipient.name);
      }, 500);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Transfer failed.');
    }
  };

  return (
    <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-scaleUp">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send size={18} className="text-violet-400" />
            <h3 className="text-base font-bold text-navy-50">
              {step === 'form' ? 'Send INR Collaboration Payment' : 'Confirm Payout Authorization'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-navy-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {error && <div className="p-2.5 rounded-lg bg-rose-500/15 text-rose-300 text-xs">{error}</div>}

        {step === 'form' ? (
          <form onSubmit={handleNext} className="space-y-4">
            {/* Recipient Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-navy-200">Select Recipient Creator</label>
              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 focus:outline-none focus:border-violet-500"
              >
                <option value="usr_creator_1">Elena Rostova (@elenacreates) — Verified Pro</option>
                {creators
                  .filter((c) => c.id !== senderId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.handle}) {c.verified ? '✓' : ''}
                    </option>
                  ))}
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-navy-200">Amount (INR ₹)</span>
                <span className="text-navy-400">Available: {formatINR(availablePaise)}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-navy-400">₹</span>
                <input
                  type="number"
                  min={1}
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2 bg-navy-950 border border-navy-700 rounded-xl text-sm font-bold text-navy-100 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            {/* Linked Deal Optional */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-navy-200">Link to Smart Deal (Optional)</label>
              <select
                value={linkedDealId}
                onChange={(e) => setLinkedDealId(e.target.value)}
                className="w-full px-3.5 py-2 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 focus:outline-none focus:border-violet-500"
              >
                <option value="">None (Direct Wallet Transfer)</option>
                <option value="deal-001">Deal: Neon Dusk Brand Film (₹85,000.00)</option>
                <option value="deal-003">Deal: Chronicles of Aether RPG (₹65,000.00)</option>
              </select>
            </div>

            {/* Description / Memo */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-navy-200">Payment Description / Memo</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-navy-800 text-navy-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl gradient-brand text-white font-bold text-xs shadow-glow-violet"
              >
                Review Transfer
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Confirmation Summary Card */}
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-navy-400">Recipient:</span>
                <span className="font-bold text-navy-100">{selectedRecipient.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-400">Transfer Amount:</span>
                <span className="font-extrabold text-emerald-400 text-sm">₹{amountRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-400">Platform Transfer Fee:</span>
                <span className="font-semibold text-navy-300">₹0.00 (Free for Collaborators)</span>
              </div>
              <div className="pt-2 border-t border-navy-800 flex justify-between">
                <span className="font-bold text-navy-200">Total Debited:</span>
                <span className="font-bold text-navy-50">₹{amountRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <p className="text-[11px] text-navy-400">
              By authorizing this transaction, funds will be immediately debited from your available balance and credited to the recipient's wallet ledger.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-navy-800 text-navy-300 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmTransfer}
                className="px-5 py-2 rounded-xl gradient-brand text-white font-bold text-xs shadow-glow-violet disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <span>Authorize Transfer</span>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: WITHDRAW FUNDS MODAL
// ────────────────────────────────────────────────────────────────────────────
function WithdrawFundsModal({
  userId,
  availablePaise,
  payoutDestinations,
  onClose,
  onSuccess,
  onManageDestinations,
}: {
  userId: string;
  availablePaise: number;
  payoutDestinations: PayoutDestination[];
  onClose: () => void;
  onSuccess: (netPayoutPaise: number) => void;
  onManageDestinations: () => void;
}) {
  const verifiedDestinations = payoutDestinations.filter((d) => d.isVerified);
  const defaultDest = verifiedDestinations.find((d) => d.isDefault) || verifiedDestinations[0];

  const [destinationId, setDestinationId] = useState(defaultDest?.id || '');
  const [amountRupees, setAmountRupees] = useState<number>(10000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountPaise = rupeesToPaise(amountRupees);
  const feePaise = Math.max(1000, Math.round((amountPaise * 1.5) / 100)); // 1.5% fee min ₹10
  const netPayoutPaise = Math.max(0, amountPaise - feePaise);

  const handleWithdraw = () => {
    setError(null);
    if (!destinationId) {
      setError('Please select a verified payout destination.');
      return;
    }
    if (amountRupees < 100) {
      setError('Minimum withdrawal limit is ₹100.00.');
      return;
    }
    if (amountPaise > availablePaise) {
      setError(`Cannot withdraw more than available balance (${formatINR(availablePaise)}).`);
      return;
    }

    setLoading(true);
    try {
      const idempotencyKey = `wd_${userId}_${Date.now()}`;
      walletService.requestWithdrawal({
        userId,
        amountInPaise: amountPaise,
        payoutDestinationId: destinationId,
        idempotencyKey,
      });

      setTimeout(() => {
        setLoading(false);
        onSuccess(netPayoutPaise);
      }, 500);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Withdrawal request failed.');
    }
  };

  return (
    <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-scaleUp">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpRight size={18} className="text-violet-400" />
            <h3 className="text-base font-bold text-navy-50">Request INR Withdrawal</h3>
          </div>
          <button type="button" onClick={onClose} className="text-navy-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {error && <div className="p-2.5 rounded-lg bg-rose-500/15 text-rose-300 text-xs">{error}</div>}

        {verifiedDestinations.length === 0 ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <AlertTriangle size={16} />
              <span>No Verified Payout Destination Linked</span>
            </div>
            <p className="text-navy-300">
              Please link and verify a UPI ID or Indian Bank Account before requesting funds withdrawal.
            </p>
            <button
              type="button"
              onClick={onManageDestinations}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-navy-950 hover:bg-amber-400 transition-all"
            >
              Link Payout Destination Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Payout Destination Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-navy-200">Payout Destination</span>
                <button type="button" onClick={onManageDestinations} className="text-violet-400 hover:underline">
                  + Manage Accounts
                </button>
              </div>
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 focus:outline-none focus:border-violet-500"
              >
                {verifiedDestinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.type === 'upi' ? `UPI: ${d.upiId}` : `Bank: ${d.bankName} (${d.maskedAccountNumber})`}{' '}
                    {d.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Withdrawal Amount */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-navy-200">Amount (INR ₹)</span>
                <span className="text-navy-400">Available: {formatINR(availablePaise)}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-navy-400">₹</span>
                <input
                  type="number"
                  min={100}
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2 bg-navy-950 border border-navy-700 rounded-xl text-sm font-bold text-navy-100 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            {/* Fee & Net Payout Summary Card */}
            <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 text-xs space-y-2">
              <div className="flex justify-between text-navy-400">
                <span>Gross Withdrawal:</span>
                <span className="font-semibold text-navy-200">{formatINR(amountPaise)}</span>
              </div>
              <div className="flex justify-between text-navy-400">
                <span>Processing Fee (1.5%):</span>
                <span className="font-semibold text-rose-300">-{formatINR(feePaise)}</span>
              </div>
              <div className="pt-2 border-t border-navy-800 flex justify-between font-bold">
                <span className="text-navy-200">Net Estimated Payout:</span>
                <span className="text-emerald-400 text-sm">{formatINR(netPayoutPaise)}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-navy-800 text-navy-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleWithdraw}
                className="px-5 py-2 rounded-xl gradient-brand text-white font-bold text-xs shadow-glow-violet disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <span>Confirm Withdrawal</span>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: PAYOUT ACCOUNTS MANAGEMENT MODAL
// ────────────────────────────────────────────────────────────────────────────
function PayoutAccountsModal({
  userId,
  destinations,
  onClose,
  onUpdated,
}: {
  userId: string;
  destinations: PayoutDestination[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [tab, setTab] = useState<'list' | 'add_upi' | 'add_bank'>('list');
  const [upiId, setUpiId] = useState('');
  const [accountName, setAccountName] = useState('Elena Rostova');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNum, setAccountNum] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddUpi = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const created = walletService.addPayoutDestination(userId, {
        type: 'upi',
        accountHolderName: accountName,
        upiId,
      });
      // Auto-verify in sandbox
      walletService.verifyPayoutDestination(userId, created.id);
      onUpdated();
      setTab('list');
      setUpiId('');
    } catch (err: any) {
      setError(err.message || 'Failed to add UPI ID.');
    }
  };

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const created = walletService.addPayoutDestination(userId, {
        type: 'bank_account',
        accountHolderName: accountName,
        bankName,
        accountNumber: accountNum,
        ifsc,
      });
      // Auto-verify in sandbox
      walletService.verifyPayoutDestination(userId, created.id);
      onUpdated();
      setTab('list');
      setAccountNum('');
      setIfsc('');
    } catch (err: any) {
      setError(err.message || 'Failed to add Bank Account.');
    }
  };

  return (
    <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scaleUp">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building size={18} className="text-violet-400" />
            <h3 className="text-base font-bold text-navy-50">Payout Accounts Management</h3>
          </div>
          <button type="button" onClick={onClose} className="text-navy-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {error && <div className="p-2.5 rounded-lg bg-rose-500/15 text-rose-300 text-xs">{error}</div>}

        {tab === 'list' && (
          <div className="space-y-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {destinations.length === 0 ? (
                <p className="text-xs text-navy-400 text-center py-4">No payout destinations registered yet.</p>
              ) : (
                destinations.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-xl bg-navy-950 border border-navy-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-navy-100">
                          {d.type === 'upi' ? d.upiId : `${d.bankName} (${d.maskedAccountNumber})`}
                        </span>
                        {d.isVerified && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            Verified
                          </span>
                        )}
                        {d.isDefault && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-violet-500/20 text-violet-300">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-navy-500 mt-0.5">
                        Holder: {d.accountHolderName} {d.ifsc ? `• IFSC: ${d.ifsc}` : ''}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        try {
                          walletService.removePayoutDestination(userId, d.id);
                          onUpdated();
                        } catch (err: any) {
                          setError(err.message);
                        }
                      }}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-navy-800">
              <button
                type="button"
                onClick={() => setTab('add_upi')}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-navy-800 hover:bg-navy-700 text-navy-100 transition-all"
              >
                + Add UPI ID
              </button>
              <button
                type="button"
                onClick={() => setTab('add_bank')}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-navy-800 hover:bg-navy-700 text-navy-100 transition-all"
              >
                + Add Bank Account
              </button>
            </div>
          </div>
        )}

        {tab === 'add_upi' && (
          <form onSubmit={handleAddUpi} className="space-y-3 text-xs">
            <h4 className="font-bold text-navy-200">Link Virtual Payment Address (UPI)</h4>
            <div>
              <label className="text-navy-400">Account Holder Name</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-navy-100 mt-1"
              />
            </div>
            <div>
              <label className="text-navy-400">UPI ID (e.g. username@okhdfcbank)</label>
              <input
                type="text"
                placeholder="creator@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-navy-100 mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setTab('list')} className="px-3 py-1.5 rounded-lg text-navy-400">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 rounded-lg gradient-brand text-white font-bold">
                Verify & Save
              </button>
            </div>
          </form>
        )}

        {tab === 'add_bank' && (
          <form onSubmit={handleAddBank} className="space-y-3 text-xs">
            <h4 className="font-bold text-navy-200">Link Indian Bank Account</h4>
            <div>
              <label className="text-navy-400">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-navy-100 mt-1"
              />
            </div>
            <div>
              <label className="text-navy-400">Account Number (9-18 digits)</label>
              <input
                type="text"
                placeholder="123456789012"
                value={accountNum}
                onChange={(e) => setAccountNum(e.target.value)}
                required
                className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-navy-100 mt-1"
              />
            </div>
            <div>
              <label className="text-navy-400">IFSC Code (11 alphanumeric, e.g. HDFC0001234)</label>
              <input
                type="text"
                placeholder="HDFC0001234"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                required
                className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-navy-100 mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setTab('list')} className="px-3 py-1.5 rounded-lg text-navy-400">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 rounded-lg gradient-brand text-white font-bold">
                Verify & Save
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: DIGITAL TRANSACTION RECEIPT MODAL
// ────────────────────────────────────────────────────────────────────────────
function TransactionReceiptModal({ txn, onClose }: { txn: WalletTransaction; onClose: () => void }) {
  const isCredit = txn.type === 'topup' || txn.type === 'transfer_received' || txn.type === 'refund';
  const invoiceNumber = `GA-2026-${txn.id.slice(-6).toUpperCase()}`;
  const amountRupees = paiseToRupees(txn.amountInPaise);
  const words = numberToIndianWords(amountRupees);
  const gst = calculateGst(txn.amountInPaise, 18, txn.type === 'topup');

  return (
    <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scaleUp">
        <div className="flex items-center justify-between border-b border-navy-800 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-navy-50">Transaction Digital Receipt</h3>
              <p className="text-[10px] font-mono text-navy-400">Invoice: {invoiceNumber}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-navy-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="text-center py-2 space-y-1">
          <div className="text-2xl font-extrabold text-navy-50">
            {isCredit ? '+' : '-'}{formatINR(txn.amountInPaise)}
          </div>
          <p className="text-[11px] text-cyan-300 font-medium italic px-4">
            {words}
          </p>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            {txn.status}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-navy-400">Transaction ID:</span>
            <span className="font-mono text-navy-200">{txn.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-navy-400">Bank UTR Reference:</span>
            <span className="font-mono text-navy-200">{txn.utr || 'Simulated'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-navy-400">Date & Time:</span>
            <span className="text-navy-200">{new Date(txn.createdAt).toLocaleString('en-IN')}</span>
          </div>
          {txn.senderName && (
            <div className="flex justify-between">
              <span className="text-navy-400">Sender:</span>
              <span className="text-navy-200">{txn.senderName}</span>
            </div>
          )}
          {txn.recipientName && (
            <div className="flex justify-between">
              <span className="text-navy-400">Recipient:</span>
              <span className="text-navy-200">{txn.recipientName}</span>
            </div>
          )}
          {txn.linkedDealTitle && (
            <div className="flex justify-between">
              <span className="text-navy-400">Linked Deal:</span>
              <span className="text-violet-300">{txn.linkedDealTitle}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-navy-400">Platform Processing Fee:</span>
            <span className="text-navy-200 font-mono">{formatINR(txn.feeInPaise)} (1.5%)</span>
          </div>
          <div className="flex justify-between border-t border-navy-850 pt-1.5">
            <span className="text-navy-400">GST (18% applicable):</span>
            <span className="text-navy-200 font-mono">
              {gst.isGstExempt ? 'Exempt (Wallet Top-up)' : formatINR(gst.gstPaise)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-navy-400">Ledger Entry Type:</span>
            <span className="text-navy-200 capitalize">{txn.type.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center gap-1.5 shadow-md"
          >
            <Download size={13} />
            <span>Print / Save Receipt</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-navy-800 hover:bg-navy-700 text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
