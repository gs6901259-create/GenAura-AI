/**
 * GenAura AI — INR Wallet & Ledger Data Contracts
 * =================================================
 * Exact integer-paise financial modeling (₹1 = 100 paise).
 * Guarantees zero floating point error, immutable audit trails,
 * user-scoped balances, withdrawal lifecycles, and gateway abstractions.
 */

export type CurrencyCode = 'INR';

export type TransactionType =
  | 'topup'              // Brand deposits INR into wallet
  | 'transfer_sent'      // Brand pays Creator
  | 'transfer_received'  // Creator receives payment from Brand
  | 'withdrawal'         // Creator/Brand withdraws to Bank/UPI
  | 'fee'                // Platform or gateway processing fee
  | 'refund'             // Reversal/refund of prior payment
  | 'campaign_hold'      // Funds reserved for active deal/milestone
  | 'milestone_release'; // Reserved funds credited to recipient

export type TransactionStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'reversed';

export type WithdrawalStatus =
  | 'requested'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'reversed';

export type PayoutDestinationType = 'upi' | 'bank_account';

export interface PayoutDestination {
  id: string;
  userId: string;
  type: PayoutDestinationType;
  accountHolderName: string;
  upiId?: string;                    // e.g. 'elena@okhdfcbank'
  bankName?: string;                 // e.g. 'HDFC Bank'
  maskedAccountNumber?: string;      // e.g. '•••• •••• 4821'
  ifsc?: string;                     // e.g. 'HDFC0001234'
  isDefault: boolean;
  isVerified: boolean;
  verifiedAt?: string;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  userRole: 'brand' | 'creator' | 'admin';
  currency: 'INR';
  availablePaise: number;       // Spendable / withdrawable integer paise
  pendingPaise: number;         // Settling incoming transfers
  reservedPaise: number;        // Escrow-style locked funds for campaigns / pending payouts
  totalIncomingPaise: number;   // Lifetime gross credited
  totalOutgoingPaise: number;   // Lifetime gross debited
  totalWithdrawnPaise: number;  // Lifetime completed payouts
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  type: TransactionType;
  amountInPaise: number;        // Primary amount (positive integer paise)
  feeInPaise: number;           // Processing fee (integer paise)
  netAmountInPaise: number;     // Amount credited or debited
  currency: 'INR';
  status: TransactionStatus;
  senderId?: string;
  senderName?: string;
  recipientId?: string;
  recipientName?: string;
  description: string;
  linkedDealId?: string;
  linkedDealTitle?: string;
  linkedBriefId?: string;
  linkedPayoutDestinationId?: string;
  paymentProviderRef?: string;  // Gateway order/payment ID (e.g. 'pay_sandbox_12345')
  utr?: string;                 // Bank/UPI reference number (e.g. '429182910394')
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionLedgerEntry {
  id: string;
  transactionId: string;
  walletId: string;
  entryType: 'debit' | 'credit';
  balanceCategory: 'available' | 'pending' | 'reserved';
  amountInPaise: number;
  balanceBeforePaise: number;
  balanceAfterPaise: number;
  currency: 'INR';
  timestamp: string;
  notes?: string;
}

export interface WithdrawalRequest {
  id: string;
  walletId: string;
  userId: string;
  amountInPaise: number;
  feeInPaise: number;
  netPayoutInPaise: number;
  payoutDestination: PayoutDestination;
  status: WithdrawalStatus;
  utrReference?: string;
  failureReason?: string;
  idempotencyKey: string;
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
}

export interface AddFundsRequest {
  amountInPaise: number;
  paymentMethod: 'upi' | 'netbanking' | 'card';
  idempotencyKey: string;
  isSimulated?: boolean;
}

export interface SendPaymentRequest {
  recipientId: string;
  amountInPaise: number;
  description: string;
  linkedDealId?: string;
  linkedDealTitle?: string;
  idempotencyKey: string;
  requireAuthConfirmation?: boolean;
}

export interface PayoutDestinationInput {
  type: PayoutDestinationType;
  accountHolderName: string;
  upiId?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
}

export interface PaymentGatewayOrder {
  orderId: string;
  amountInPaise: number;
  currency: 'INR';
  status: 'created' | 'attempted' | 'paid';
  provider: 'razorpay_sandbox' | 'razorpay_live';
  notes?: Record<string, string>;
  createdAt: string;
}
