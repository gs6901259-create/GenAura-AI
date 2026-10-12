/**
 * GenAura AI — INR Wallet & Ledger Service
 * ========================================
 * Authoritative financial engine managing user-scoped wallets,
 * immutable transaction ledgers, exact integer-paise math,
 * gateway order simulation, and withdrawal workflows.
 */

import {
  Wallet,
  WalletTransaction,
  TransactionLedgerEntry,
  WithdrawalRequest,
  PayoutDestination,
  PayoutDestinationInput,
  TransactionType,
  TransactionStatus,
  WithdrawalStatus,
} from '@/types/wallet';
import {
  INITIAL_SEED_WALLETS,
  INITIAL_PAYOUT_DESTINATIONS,
  INITIAL_TRANSACTIONS,
  INITIAL_WITHDRAWALS,
  INITIAL_LEDGER_ENTRIES,
} from '@/data/walletSeedData';
import { calculateProcessingFee, isValidPaiseAmount, maskFinancialIdentifier } from './currencyService';
import { useAppStore } from '@/lib/store';

const STORAGE_KEY = 'genaura_wallet_data_v1';

interface StoredWalletData {
  wallets: Record<string, Wallet>;
  payoutDestinations: PayoutDestination[];
  transactions: WalletTransaction[];
  withdrawals: WithdrawalRequest[];
  ledgerEntries: TransactionLedgerEntry[];
  processedIdempotencyKeys: string[];
}

class WalletService {
  private data: StoredWalletData;

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): StoredWalletData {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return this.getInitialState();
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initial = this.getInitialState();
        this.saveToStorage(initial);
        return initial;
      }
      const parsed = JSON.parse(raw);
      return {
        wallets: parsed.wallets || INITIAL_SEED_WALLETS,
        payoutDestinations: parsed.payoutDestinations || INITIAL_PAYOUT_DESTINATIONS,
        transactions: parsed.transactions || INITIAL_TRANSACTIONS,
        withdrawals: parsed.withdrawals || INITIAL_WITHDRAWALS,
        ledgerEntries: parsed.ledgerEntries || INITIAL_LEDGER_ENTRIES,
        processedIdempotencyKeys: parsed.processedIdempotencyKeys || [],
      };
    } catch {
      return this.getInitialState();
    }
  }

  private getInitialState(): StoredWalletData {
    return {
      wallets: { ...INITIAL_SEED_WALLETS },
      payoutDestinations: [...INITIAL_PAYOUT_DESTINATIONS],
      transactions: [...INITIAL_TRANSACTIONS],
      withdrawals: [...INITIAL_WITHDRAWALS],
      ledgerEntries: [...INITIAL_LEDGER_ENTRIES],
      processedIdempotencyKeys: [],
    };
  }

  private saveToStorage(data: StoredWalletData = this.data): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.error('Failed to persist wallet data', e);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 1. WALLET RETRIEVAL & INITIALIZATION
  // ────────────────────────────────────────────────────────────────────────────
  public getWallet(userId: string, userRole: 'brand' | 'creator' | 'admin' = 'brand'): Wallet {
    if (!userId) {
      throw new Error('User ID is required to access wallet.');
    }

    if (!this.data.wallets[userId]) {
      const newWallet: Wallet = {
        id: `wall_${userId}`,
        userId,
        userRole,
        currency: 'INR',
        availablePaise: 0,
        pendingPaise: 0,
        reservedPaise: 0,
        totalIncomingPaise: 0,
        totalOutgoingPaise: 0,
        totalWithdrawnPaise: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.wallets[userId] = newWallet;
      this.saveToStorage();
    }

    return { ...this.data.wallets[userId] };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 2. ADD FUNDS (TOP-UP VIA GATEWAY SANDBOX)
  // ────────────────────────────────────────────────────────────────────────────
  public addFunds(params: {
    userId: string;
    amountInPaise: number;
    paymentMethod: 'upi' | 'netbanking' | 'card';
    idempotencyKey: string;
    paymentRef?: string;
  }): { success: boolean; transaction: WalletTransaction; newBalancePaise: number } {
    const { userId, amountInPaise, paymentMethod, idempotencyKey, paymentRef } = params;

    if (!isValidPaiseAmount(amountInPaise)) {
      throw new Error('Invalid top-up amount. Must be a positive integer in paise.');
    }

    // Idempotency check
    if (this.data.processedIdempotencyKeys.includes(idempotencyKey)) {
      const existing = this.data.transactions.find((t) => t.idempotencyKey === idempotencyKey);
      if (existing) {
        const wallet = this.getWallet(userId);
        return { success: true, transaction: existing, newBalancePaise: wallet.availablePaise };
      }
    }

    const wallet = this.getWallet(userId);
    const txnId = `txn_topup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const utr = Math.floor(100000000000 + Math.random() * 900000000000).toString();

    const balanceBefore = wallet.availablePaise;
    const balanceAfter = balanceBefore + amountInPaise;

    // Mutate wallet state atomically
    wallet.availablePaise = balanceAfter;
    wallet.totalIncomingPaise += amountInPaise;
    wallet.updatedAt = new Date().toISOString();
    this.data.wallets[userId] = wallet;

    const transaction: WalletTransaction = {
      id: txnId,
      walletId: wallet.id,
      userId,
      type: 'topup',
      amountInPaise,
      feeInPaise: 0,
      netAmountInPaise: amountInPaise,
      currency: 'INR',
      status: 'completed',
      description: `Wallet top-up via ${paymentMethod.toUpperCase()} (Sandbox Verified)`,
      paymentProviderRef: paymentRef || `pay_sbx_${Date.now()}`,
      utr,
      idempotencyKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ledgerEntry: TransactionLedgerEntry = {
      id: `ledg_${txnId}`,
      transactionId: txnId,
      walletId: wallet.id,
      entryType: 'credit',
      balanceCategory: 'available',
      amountInPaise,
      balanceBeforePaise: balanceBefore,
      balanceAfterPaise: balanceAfter,
      currency: 'INR',
      timestamp: new Date().toISOString(),
      notes: `Top-up credited via ${paymentMethod}`,
    };

    this.data.transactions.unshift(transaction);
    this.data.ledgerEntries.unshift(ledgerEntry);
    this.data.processedIdempotencyKeys.push(idempotencyKey);
    this.saveToStorage();

    // Trigger in-app notification
    try {
      useAppStore.getState().addNotification({
        id: `notif_topup_${Date.now()}`,
        title: 'INR Wallet Top-up Successful',
        message: `₹${(amountInPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })} has been credited to your available balance.`,
        type: 'system',
        timestamp: 'Just now',
        read: false,
        linkTo: '/wallet',
      });
    } catch {
      // Store notification fallback in tests
    }

    return { success: true, transaction, newBalancePaise: balanceAfter };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 3. TRANSFER FUNDS (BRAND TO CREATOR)
  // ────────────────────────────────────────────────────────────────────────────
  public transferFunds(params: {
    senderId: string;
    recipientId: string;
    amountInPaise: number;
    description: string;
    senderName?: string;
    recipientName?: string;
    linkedDealId?: string;
    linkedDealTitle?: string;
    linkedBriefId?: string;
    idempotencyKey: string;
  }): { success: boolean; senderTransaction: WalletTransaction; recipientTransaction: WalletTransaction } {
    const {
      senderId,
      recipientId,
      amountInPaise,
      description,
      senderName = 'Brand Partner',
      recipientName = 'Creator Partner',
      linkedDealId,
      linkedDealTitle,
      linkedBriefId,
      idempotencyKey,
    } = params;

    // 1. Validation: Authentication & IDs
    if (!senderId || !recipientId) {
      throw new Error('Both sender and recipient IDs are required.');
    }

    // 2. Self-transfer restriction
    if (senderId === recipientId) {
      throw new Error('Cannot transfer funds to yourself.');
    }

    // 3. Valid positive amount
    if (!isValidPaiseAmount(amountInPaise)) {
      throw new Error('Transfer amount must be a positive integer in paise.');
    }

    // 4. Idempotency duplicate check
    if (this.data.processedIdempotencyKeys.includes(idempotencyKey)) {
      const existingSenderTxn = this.data.transactions.find((t) => t.idempotencyKey === idempotencyKey);
      const existingRecvTxn = this.data.transactions.find((t) => t.idempotencyKey === `${idempotencyKey}_recv`);
      if (existingSenderTxn && existingRecvTxn) {
        return {
          success: true,
          senderTransaction: existingSenderTxn,
          recipientTransaction: existingRecvTxn,
        };
      }
    }

    // 5. Sufficient funds check on authoritative sender balance
    const senderWallet = this.getWallet(senderId, 'brand');
    if (senderWallet.availablePaise < amountInPaise) {
      throw new Error(
        `Insufficient available balance. Required: ₹${(amountInPaise / 100).toFixed(2)}, Available: ₹${(senderWallet.availablePaise / 100).toFixed(2)}.`
      );
    }

    const recipientWallet = this.getWallet(recipientId, 'creator');
    const utr = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    const timestamp = new Date().toISOString();

    // SENDER ATOMIC MUTATION
    const senderBefore = senderWallet.availablePaise;
    const senderAfter = senderBefore - amountInPaise;
    senderWallet.availablePaise = senderAfter;
    senderWallet.totalOutgoingPaise += amountInPaise;
    senderWallet.updatedAt = timestamp;
    this.data.wallets[senderId] = senderWallet;

    // RECIPIENT ATOMIC MUTATION
    const recipientBefore = recipientWallet.availablePaise;
    const recipientAfter = recipientBefore + amountInPaise;
    recipientWallet.availablePaise = recipientAfter;
    recipientWallet.totalIncomingPaise += amountInPaise;
    recipientWallet.updatedAt = timestamp;
    this.data.wallets[recipientId] = recipientWallet;

    // TRANSACTIONS
    const senderTxnId = `txn_out_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const senderTransaction: WalletTransaction = {
      id: senderTxnId,
      walletId: senderWallet.id,
      userId: senderId,
      type: 'transfer_sent',
      amountInPaise,
      feeInPaise: 0,
      netAmountInPaise: amountInPaise,
      currency: 'INR',
      status: 'completed',
      senderId,
      senderName,
      recipientId,
      recipientName,
      description,
      linkedDealId,
      linkedDealTitle,
      linkedBriefId,
      utr,
      idempotencyKey,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const recipientTxnId = `txn_in_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const recipientTransaction: WalletTransaction = {
      id: recipientTxnId,
      walletId: recipientWallet.id,
      userId: recipientId,
      type: 'transfer_received',
      amountInPaise,
      feeInPaise: 0,
      netAmountInPaise: amountInPaise,
      currency: 'INR',
      status: 'completed',
      senderId,
      senderName,
      recipientId,
      recipientName,
      description,
      linkedDealId,
      linkedDealTitle,
      linkedBriefId,
      utr,
      idempotencyKey: `${idempotencyKey}_recv`,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // LEDGER ENTRIES
    const senderLedger: TransactionLedgerEntry = {
      id: `ledg_${senderTxnId}`,
      transactionId: senderTxnId,
      walletId: senderWallet.id,
      entryType: 'debit',
      balanceCategory: 'available',
      amountInPaise,
      balanceBeforePaise: senderBefore,
      balanceAfterPaise: senderAfter,
      currency: 'INR',
      timestamp,
      notes: `Transfer sent to ${recipientName}`,
    };

    const recipientLedger: TransactionLedgerEntry = {
      id: `ledg_${recipientTxnId}`,
      transactionId: recipientTxnId,
      walletId: recipientWallet.id,
      entryType: 'credit',
      balanceCategory: 'available',
      amountInPaise,
      balanceBeforePaise: recipientBefore,
      balanceAfterPaise: recipientAfter,
      currency: 'INR',
      timestamp,
      notes: `Payment received from ${senderName}`,
    };

    this.data.transactions.unshift(recipientTransaction);
    this.data.transactions.unshift(senderTransaction);
    this.data.ledgerEntries.unshift(recipientLedger);
    this.data.ledgerEntries.unshift(senderLedger);
    this.data.processedIdempotencyKeys.push(idempotencyKey);
    this.saveToStorage();

    // NOTIFICATIONS
    try {
      useAppStore.getState().addNotification({
        id: `notif_recv_${Date.now()}`,
        title: 'INR Payment Received',
        message: `₹${(amountInPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })} received from ${senderName}.`,
        type: 'collaboration',
        timestamp: 'Just now',
        read: false,
        linkTo: '/wallet',
      });
    } catch {
      // test fallback
    }

    return {
      success: true,
      senderTransaction,
      recipientTransaction,
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 4. WITHDRAWAL WORKFLOW (CREATOR / USER PAYOUT)
  // ────────────────────────────────────────────────────────────────────────────
  public requestWithdrawal(params: {
    userId: string;
    amountInPaise: number;
    payoutDestinationId: string;
    idempotencyKey: string;
  }): { success: boolean; withdrawal: WithdrawalRequest; transaction: WalletTransaction } {
    const { userId, amountInPaise, payoutDestinationId, idempotencyKey } = params;

    // Minimum withdrawal: ₹100.00 (10000 paise)
    if (!isValidPaiseAmount(amountInPaise) || amountInPaise < 10000) {
      throw new Error('Minimum withdrawal amount is ₹100.00 (10,000 paise).');
    }

    // Payout destination check
    const destination = this.data.payoutDestinations.find(
      (d) => d.id === payoutDestinationId && d.userId === userId
    );
    if (!destination) {
      throw new Error('Payout destination not found or not owned by user.');
    }
    if (!destination.isVerified) {
      throw new Error('Cannot withdraw to an unverified payout destination.');
    }

    // Idempotency check
    if (this.data.processedIdempotencyKeys.includes(idempotencyKey)) {
      const existingWd = this.data.withdrawals.find((w) => w.idempotencyKey === idempotencyKey);
      const existingTxn = this.data.transactions.find((t) => t.idempotencyKey === idempotencyKey);
      if (existingWd && existingTxn) {
        return { success: true, withdrawal: existingWd, transaction: existingTxn };
      }
    }

    const wallet = this.getWallet(userId);
    if (wallet.availablePaise < amountInPaise) {
      throw new Error(
        `Insufficient available balance. Required: ₹${(amountInPaise / 100).toFixed(2)}, Available: ₹${(wallet.availablePaise / 100).toFixed(2)}.`
      );
    }

    // Compute fee (1.5%, min ₹10 = 1000 paise)
    const feeInPaise = calculateProcessingFee(amountInPaise, 1.5, 1000);
    const netPayoutInPaise = amountInPaise - feeInPaise;

    const wdId = `wd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const txnId = `txn_wd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();

    // ATOMIC BALANCE RESERVATION: Deduct from available, reserve for processing
    const beforeAvailable = wallet.availablePaise;
    wallet.availablePaise -= amountInPaise;
    wallet.reservedPaise += amountInPaise;
    wallet.updatedAt = timestamp;
    this.data.wallets[userId] = wallet;

    const withdrawal: WithdrawalRequest = {
      id: wdId,
      walletId: wallet.id,
      userId,
      amountInPaise,
      feeInPaise,
      netPayoutInPaise,
      payoutDestination: destination,
      status: 'requested',
      idempotencyKey,
      requestedAt: timestamp,
    };

    const transaction: WalletTransaction = {
      id: txnId,
      walletId: wallet.id,
      userId,
      type: 'withdrawal',
      amountInPaise,
      feeInPaise,
      netAmountInPaise: netPayoutInPaise,
      currency: 'INR',
      status: 'pending',
      description: `Withdrawal to ${destination.type === 'upi' ? destination.upiId : destination.bankName}`,
      linkedPayoutDestinationId: destination.id,
      idempotencyKey,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const ledgerEntry: TransactionLedgerEntry = {
      id: `ledg_${txnId}`,
      transactionId: txnId,
      walletId: wallet.id,
      entryType: 'debit',
      balanceCategory: 'reserved',
      amountInPaise,
      balanceBeforePaise: beforeAvailable,
      balanceAfterPaise: wallet.availablePaise,
      currency: 'INR',
      timestamp,
      notes: `Withdrawal request placed (Held in reserved balance)`,
    };

    this.data.withdrawals.unshift(withdrawal);
    this.data.transactions.unshift(transaction);
    this.data.ledgerEntries.unshift(ledgerEntry);
    this.data.processedIdempotencyKeys.push(idempotencyKey);
    this.saveToStorage();

    return { success: true, withdrawal, transaction };
  }

  /**
   * Advances a withdrawal through valid statuses:
   * requested -> processing -> completed (or failed/cancelled)
   */
  public updateWithdrawalStatus(
    withdrawalId: string,
    newStatus: WithdrawalStatus,
    utrReference?: string,
    failureReason?: string
  ): WithdrawalRequest {
    const wd = this.data.withdrawals.find((w) => w.id === withdrawalId);
    if (!wd) {
      throw new Error('Withdrawal request not found.');
    }

    const currentStatus = wd.status;
    const wallet = this.getWallet(wd.userId);
    const timestamp = new Date().toISOString();

    if (newStatus === 'completed' && (currentStatus === 'requested' || currentStatus === 'processing')) {
      // Clear reserved hold, increment total withdrawn
      wallet.reservedPaise = Math.max(0, wallet.reservedPaise - wd.amountInPaise);
      wallet.totalWithdrawnPaise += wd.amountInPaise;
      wallet.updatedAt = timestamp;

      wd.status = 'completed';
      wd.completedAt = timestamp;
      wd.utrReference = utrReference || Math.floor(100000000000 + Math.random() * 900000000000).toString();

      // Update linked transaction
      const txn = this.data.transactions.find((t) => t.idempotencyKey === wd.idempotencyKey);
      if (txn) {
        txn.status = 'completed';
        txn.utr = wd.utrReference;
        txn.updatedAt = timestamp;
      }
    } else if (newStatus === 'failed' || newStatus === 'cancelled') {
      // Release held funds back to available balance
      wallet.reservedPaise = Math.max(0, wallet.reservedPaise - wd.amountInPaise);
      wallet.availablePaise += wd.amountInPaise;
      wallet.updatedAt = timestamp;

      wd.status = newStatus;
      wd.failureReason = failureReason || 'Payout rejected by processing bank.';

      const txn = this.data.transactions.find((t) => t.idempotencyKey === wd.idempotencyKey);
      if (txn) {
        txn.status = newStatus === 'failed' ? 'failed' : 'cancelled';
        txn.updatedAt = timestamp;
      }

      // Ledger reversal entry
      const ledgerEntry: TransactionLedgerEntry = {
        id: `ledg_rev_${Date.now()}`,
        transactionId: txn?.id || `rev_${wd.id}`,
        walletId: wallet.id,
        entryType: 'credit',
        balanceCategory: 'available',
        amountInPaise: wd.amountInPaise,
        balanceBeforePaise: wallet.availablePaise - wd.amountInPaise,
        balanceAfterPaise: wallet.availablePaise,
        currency: 'INR',
        timestamp,
        notes: `Withdrawal ${newStatus}: funds released back to available balance.`,
      };
      this.data.ledgerEntries.unshift(ledgerEntry);
    } else if (newStatus === 'processing' && currentStatus === 'requested') {
      wd.status = 'processing';
      wd.processedAt = timestamp;
    }

    this.data.wallets[wd.userId] = wallet;
    this.saveToStorage();
    return { ...wd };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 5. PAYOUT DESTINATIONS MANAGEMENT
  // ────────────────────────────────────────────────────────────────────────────
  public getPayoutDestinations(userId: string): PayoutDestination[] {
    return this.data.payoutDestinations.filter((d) => d.userId === userId);
  }

  public addPayoutDestination(userId: string, input: PayoutDestinationInput): PayoutDestination {
    if (!userId) throw new Error('User ID is required.');

    if (input.type === 'upi') {
      if (!input.upiId || !/^[\w.\-]+@[\w.\-]+$/.test(input.upiId.trim())) {
        throw new Error('Invalid UPI ID format. Expected format: username@bank.');
      }
    } else if (input.type === 'bank_account') {
      if (!input.accountNumber || input.accountNumber.length < 9 || input.accountNumber.length > 18) {
        throw new Error('Bank account number must be between 9 and 18 digits.');
      }
      if (!input.ifsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(input.ifsc.trim().toUpperCase())) {
        throw new Error('Invalid 11-character Indian IFSC code format (e.g. HDFC0001234).');
      }
    }

    const hasExisting = this.data.payoutDestinations.some((d) => d.userId === userId);

    const newDest: PayoutDestination = {
      id: `payout_dest_${Date.now()}`,
      userId,
      type: input.type,
      accountHolderName: input.accountHolderName.trim() || 'Account Holder',
      upiId: input.type === 'upi' ? input.upiId?.trim().toLowerCase() : undefined,
      bankName: input.type === 'bank_account' ? input.bankName?.trim() || 'Commercial Bank' : undefined,
      maskedAccountNumber: input.type === 'bank_account' ? maskFinancialIdentifier(input.accountNumber!, 'bank_account') : undefined,
      ifsc: input.type === 'bank_account' ? input.ifsc?.trim().toUpperCase() : undefined,
      isDefault: !hasExisting,
      isVerified: false,
      createdAt: new Date().toISOString(),
    };

    this.data.payoutDestinations.push(newDest);
    this.saveToStorage();
    return newDest;
  }

  public verifyPayoutDestination(userId: string, destId: string): PayoutDestination {
    const dest = this.data.payoutDestinations.find((d) => d.id === destId && d.userId === userId);
    if (!dest) throw new Error('Destination not found.');

    dest.isVerified = true;
    dest.verifiedAt = new Date().toISOString();
    this.saveToStorage();
    return { ...dest };
  }

  public removePayoutDestination(userId: string, destId: string): void {
    // Prevent deletion if active pending/processing withdrawal exists
    const hasPendingWithdrawal = this.data.withdrawals.some(
      (w) => w.payoutDestination.id === destId && (w.status === 'requested' || w.status === 'processing')
    );
    if (hasPendingWithdrawal) {
      throw new Error('Cannot remove destination while a payout request is pending or processing.');
    }

    this.data.payoutDestinations = this.data.payoutDestinations.filter(
      (d) => !(d.id === destId && d.userId === userId)
    );
    this.saveToStorage();
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 6. TRANSACTIONS & AUDIT LEDGER QUERIES
  // ────────────────────────────────────────────────────────────────────────────
  public getTransactions(
    userId: string,
    filter?: { type?: TransactionType; status?: TransactionStatus; search?: string }
  ): WalletTransaction[] {
    return this.data.transactions.filter((t) => {
      if (t.userId !== userId && t.senderId !== userId && t.recipientId !== userId) return false;
      if (filter?.type && t.type !== filter.type) return false;
      if (filter?.status && t.status !== filter.status) return false;
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        const matchesDesc = t.description.toLowerCase().includes(q);
        const matchesUtr = t.utr?.toLowerCase().includes(q);
        const matchesRecipient = t.recipientName?.toLowerCase().includes(q);
        if (!matchesDesc && !matchesUtr && !matchesRecipient) return false;
      }
      return true;
    });
  }

  public getTransactionById(txnId: string): WalletTransaction | undefined {
    return this.data.transactions.find((t) => t.id === txnId);
  }

  public getWithdrawalRequests(userId: string): WithdrawalRequest[] {
    return this.data.withdrawals.filter((w) => w.userId === userId);
  }

  public getLedgerEntries(walletId: string): TransactionLedgerEntry[] {
    return this.data.ledgerEntries.filter((l) => l.walletId === walletId);
  }

  // Helper for test resets
  public resetToSeed(): void {
    this.data = this.getInitialState();
    this.saveToStorage();
  }
}

export const walletService = new WalletService();
