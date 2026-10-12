/**
 * GenAura AI — INR Wallet & Payout Initial Seed Data
 * ==================================================
 * Realistic Indian Rupee balances, transactions, ledger records,
 * and verified payout accounts for Brand and Creator personas.
 * All amounts are modeled in integer paise (₹1 = 100 paise).
 */

import { Wallet, WalletTransaction, TransactionLedgerEntry, PayoutDestination, WithdrawalRequest } from '@/types/wallet';

export const INITIAL_SEED_WALLETS: Record<string, Wallet> = {
  usr_brand_1: {
    id: 'wall_brand_1',
    userId: 'usr_brand_1',
    userRole: 'brand',
    currency: 'INR',
    availablePaise: 15000000,     // ₹1,50,000.00 available
    pendingPaise: 0,
    reservedPaise: 3500000,       // ₹35,000.00 locked for active campaign commitments
    totalIncomingPaise: 25000000, // ₹2,50,000.00 lifetime deposits
    totalOutgoingPaise: 6500000,  // ₹65,000.00 payments to creators
    totalWithdrawnPaise: 0,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-10-11T14:30:00Z',
  },
  usr_creator_1: {
    id: 'wall_creator_1',
    userId: 'usr_creator_1',
    userRole: 'creator',
    currency: 'INR',
    availablePaise: 6850000,      // ₹68,500.00 available earnings
    pendingPaise: 2500000,        // ₹25,000.00 milestone in review
    reservedPaise: 0,
    totalIncomingPaise: 11850000, // ₹1,18,500.00 gross earnings
    totalOutgoingPaise: 2500000,  // ₹25,000.00 withdrawn
    totalWithdrawnPaise: 2500000, // ₹25,000.00 completed payouts
    createdAt: '2026-02-10T10:30:00Z',
    updatedAt: '2026-10-11T16:00:00Z',
  },
};

export const INITIAL_PAYOUT_DESTINATIONS: PayoutDestination[] = [
  {
    id: 'payout_dest_1',
    userId: 'usr_creator_1',
    type: 'upi',
    accountHolderName: 'Elena Rostova',
    upiId: 'elena.rostova@okhdfcbank',
    isDefault: true,
    isVerified: true,
    verifiedAt: '2026-02-12T14:00:00Z',
    createdAt: '2026-02-12T13:45:00Z',
  },
  {
    id: 'payout_dest_2',
    userId: 'usr_creator_1',
    type: 'bank_account',
    accountHolderName: 'Elena Rostova',
    bankName: 'HDFC Bank Ltd',
    maskedAccountNumber: '•••• •••• 4821',
    ifsc: 'HDFC0001234',
    isDefault: false,
    isVerified: true,
    verifiedAt: '2026-02-15T10:00:00Z',
    createdAt: '2026-02-15T09:20:00Z',
  },
];

export const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'txn_101',
    walletId: 'wall_brand_1',
    userId: 'usr_brand_1',
    type: 'topup',
    amountInPaise: 10000000, // ₹1,00,000.00
    feeInPaise: 0,
    netAmountInPaise: 10000000,
    currency: 'INR',
    status: 'completed',
    description: 'Wallet top-up via UPI / NetBanking Sandbox',
    paymentProviderRef: 'pay_sbx_10928301',
    utr: '429182910394',
    idempotencyKey: 'idemp_topup_101',
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-01T10:00:02Z',
  },
  {
    id: 'txn_102',
    walletId: 'wall_brand_1',
    userId: 'usr_brand_1',
    type: 'transfer_sent',
    amountInPaise: 4000000, // ₹40,000.00
    feeInPaise: 0,
    netAmountInPaise: 4000000,
    currency: 'INR',
    status: 'completed',
    senderId: 'usr_brand_1',
    senderName: 'Sarah Lin (AuraBrand)',
    recipientId: 'usr_creator_1',
    recipientName: 'Elena Rostova',
    description: 'Milestone 1 Payment: 3D Cinematic Reveal Video',
    linkedDealId: 'deal-001',
    linkedDealTitle: 'Neon Dusk Brand Film',
    linkedBriefId: 'brief_1',
    utr: '429183019284',
    idempotencyKey: 'idemp_transfer_102',
    createdAt: '2026-10-05T14:15:00Z',
    updatedAt: '2026-10-05T14:15:05Z',
  },
  {
    id: 'txn_103',
    walletId: 'wall_creator_1',
    userId: 'usr_creator_1',
    type: 'transfer_received',
    amountInPaise: 4000000, // ₹40,000.00
    feeInPaise: 0,
    netAmountInPaise: 4000000,
    currency: 'INR',
    status: 'completed',
    senderId: 'usr_brand_1',
    senderName: 'Sarah Lin (AuraBrand)',
    recipientId: 'usr_creator_1',
    recipientName: 'Elena Rostova',
    description: 'Milestone 1 Payment: 3D Cinematic Reveal Video',
    linkedDealId: 'deal-001',
    linkedDealTitle: 'Neon Dusk Brand Film',
    linkedBriefId: 'brief_1',
    utr: '429183019284',
    idempotencyKey: 'idemp_transfer_102_recv',
    createdAt: '2026-10-05T14:15:05Z',
    updatedAt: '2026-10-05T14:15:05Z',
  },
  {
    id: 'txn_104',
    walletId: 'wall_creator_1',
    userId: 'usr_creator_1',
    type: 'withdrawal',
    amountInPaise: 2500000, // ₹25,000.00
    feeInPaise: 37500,     // ₹375.00 (1.5% withdrawal fee)
    netAmountInPaise: 2462500, // ₹24,625.00 net payout
    currency: 'INR',
    status: 'completed',
    description: 'Direct Payout to UPI: elena.rostova@okhdfcbank',
    linkedPayoutDestinationId: 'payout_dest_1',
    utr: '429199382103',
    idempotencyKey: 'idemp_wd_104',
    createdAt: '2026-10-08T11:00:00Z',
    updatedAt: '2026-10-08T11:15:00Z',
  },
];

export const INITIAL_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: 'wd_104',
    walletId: 'wall_creator_1',
    userId: 'usr_creator_1',
    amountInPaise: 2500000,
    feeInPaise: 37500,
    netPayoutInPaise: 2462500,
    payoutDestination: INITIAL_PAYOUT_DESTINATIONS[0],
    status: 'completed',
    utrReference: '429199382103',
    idempotencyKey: 'idemp_wd_104',
    requestedAt: '2026-10-08T11:00:00Z',
    processedAt: '2026-10-08T11:05:00Z',
    completedAt: '2026-10-08T11:15:00Z',
  },
];

export const INITIAL_LEDGER_ENTRIES: TransactionLedgerEntry[] = [
  {
    id: 'ledg_101',
    transactionId: 'txn_101',
    walletId: 'wall_brand_1',
    entryType: 'credit',
    balanceCategory: 'available',
    amountInPaise: 10000000,
    balanceBeforePaise: 5000000,
    balanceAfterPaise: 15000000,
    currency: 'INR',
    timestamp: '2026-10-01T10:00:00Z',
    notes: 'Gateway Top-up via Razorpay Sandbox',
  },
];
