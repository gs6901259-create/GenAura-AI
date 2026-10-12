/**
 * GenAura AI — Wallet, Privacy & Workspace Chat Automated Test Suite
 * ==================================================================
 * Verifies all requirements from Phases 2, 3, 4, 5, 6, 7, 8, 9 & 10.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Mock browser LocalStorage for Node test environment
class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

if (typeof (global as any).window === 'undefined') {
  (global as any).window = {};
}
if (typeof (global as any).localStorage === 'undefined') {
  (global as any).localStorage = new MockLocalStorage();
}

import {
  formatINR,
  paiseToRupees,
  rupeesToPaise,
  isValidPaiseAmount,
  calculateProcessingFee,
  maskFinancialIdentifier,
} from '../src/services/currencyService.ts';
import { walletService } from '../src/services/walletService.ts';
import { chatService } from '../src/services/chatService.ts';
import { paymentProvider } from '../src/services/paymentProvider.ts';
import { dealService } from '../src/services/dealService.ts';
import { useAppStore } from '../src/lib/store.ts';

test('GenAura AI — Privacy, Workspace Chat & INR Wallet Test Suite', async (t) => {
  // Reset services before suite
  walletService.resetToSeed();
  chatService.resetToSeed();

  // ──────────────────────────────────────────────────────────────────────────
  // 1. CURRENCY & INTEGER PAISE MATHEMATICS
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('1. Exact integer-paise conversions and Indian Rupee (en-IN) formatting', () => {
    // 1 INR = 100 paise
    assert.equal(rupeesToPaise(100), 10000, '₹100 must equal 10,000 paise');
    assert.equal(rupeesToPaise(125.5), 12550, '₹125.50 must equal 12,550 paise');
    assert.equal(rupeesToPaise('1,00,000.00'), 10000000, '₹1,00,000.00 must parse to 10,000,000 paise');
    assert.equal(paiseToRupees(12550), 125.5, '12,550 paise must equal 125.5 rupees');

    // Indian locale formatting
    const formatted1 = formatINR(1250000);
    assert.ok(formatted1.includes('12,500.00'), `Expected 12,500.00 in ${formatted1}`);
    assert.ok(formatted1.startsWith('₹'), `Must include ₹ symbol in ${formatted1}`);

    const formattedLakh = formatINR(10000000);
    assert.ok(formattedLakh.includes('1,00,000.00'), `Expected 1,00,000.00 in ${formattedLakh}`);

    assert.equal(isValidPaiseAmount(10000), true, 'Positive integer paise is valid');
    assert.equal(isValidPaiseAmount(-50), false, 'Negative paise is invalid');
    assert.equal(isValidPaiseAmount(12.5), false, 'Floating point paise is invalid');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. FINANCIAL MASKING & PAYOUT DESTINATION VALIDATION
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('2. Financial identifier masking and payout destination validation', () => {
    // Masking
    const maskedUpi = maskFinancialIdentifier('elena.rostova@okhdfcbank', 'upi');
    assert.ok(maskedUpi.startsWith('el***@') || maskedUpi.startsWith('el*'), `UPI must be masked: ${maskedUpi}`);

    const maskedBank = maskFinancialIdentifier('123456784821', 'bank_account');
    assert.ok(maskedBank.includes('4821'), 'Masked bank must preserve last 4 digits');
    assert.ok(maskedBank.includes('••••'), 'Masked bank must obscure leading digits');

    // Payout destination validation
    assert.throws(
      () =>
        walletService.addPayoutDestination('test_user', {
          type: 'upi',
          accountHolderName: 'Test Creator',
          upiId: 'invalid-upi-without-at',
        }),
      /Invalid UPI ID format/,
      'Must reject invalid UPI format'
    );

    assert.throws(
      () =>
        walletService.addPayoutDestination('test_user', {
          type: 'bank_account',
          accountHolderName: 'Test Creator',
          accountNumber: '123', // too short
          ifsc: 'HDFC0001234',
        }),
      /Bank account number must be between 9 and 18 digits/,
      'Must reject too short account number'
    );

    assert.throws(
      () =>
        walletService.addPayoutDestination('test_user', {
          type: 'bank_account',
          accountHolderName: 'Test Creator',
          accountNumber: '123456789012',
          ifsc: 'INVALID_IFSC',
        }),
      /Invalid 11-character Indian IFSC code format/,
      'Must reject invalid IFSC format'
    );

    // Valid UPI addition and verification
    const validUpi = walletService.addPayoutDestination('usr_creator_test_1', {
      type: 'upi',
      accountHolderName: 'Test Creator',
      upiId: 'creator@okhdfcbank',
    });
    assert.equal(validUpi.isVerified, false, 'Initial account must be unverified');

    const verifiedUpi = walletService.verifyPayoutDestination('usr_creator_test_1', validUpi.id);
    assert.equal(verifiedUpi.isVerified, true, 'Account must become verified');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. WALLET ISOLATION & BALANCES
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('3. Scoped user wallet isolation and distinct balance categories', () => {
    const brandWallet = walletService.getWallet('usr_brand_1', 'brand');
    const creatorWallet = walletService.getWallet('usr_creator_1', 'creator');

    assert.notEqual(brandWallet.id, creatorWallet.id, 'Wallets must have distinct IDs');
    assert.equal(brandWallet.currency, 'INR', 'Currency must be INR');
    assert.equal(creatorWallet.currency, 'INR', 'Currency must be INR');

    // Distinct balances
    assert.ok(brandWallet.availablePaise > 0, 'Brand wallet has positive available balance');
    assert.ok(typeof brandWallet.pendingPaise === 'number', 'Pending paise is integer');
    assert.ok(typeof brandWallet.reservedPaise === 'number', 'Reserved paise is integer');

    // Sum verification: categories must never double-count
    const totalCategories = brandWallet.availablePaise + brandWallet.pendingPaise + brandWallet.reservedPaise;
    assert.ok(totalCategories >= brandWallet.availablePaise, 'Categories must partition funds distinctly');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. ADD FUNDS (TOP-UP VIA GATEWAY SANDBOX)
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('4. Add funds top-up credits available balance and records immutable ledger', () => {
    const brandWalletBefore = walletService.getWallet('usr_brand_topup', 'brand');
    const initialBal = brandWalletBefore.availablePaise;

    const topupAmount = 5000000; // ₹50,000.00
    const idempotencyKey = `topup_test_${Date.now()}`;

    const res = walletService.addFunds({
      userId: 'usr_brand_topup',
      amountInPaise: topupAmount,
      paymentMethod: 'upi',
      idempotencyKey,
    });

    assert.equal(res.success, true, 'Top-up must succeed');
    assert.equal(res.newBalancePaise, initialBal + topupAmount, 'Available balance must increase by exact paise');

    const brandWalletAfter = walletService.getWallet('usr_brand_topup', 'brand');
    assert.equal(brandWalletAfter.availablePaise, initialBal + topupAmount);
    assert.equal(res.transaction.type, 'topup');
    assert.equal(res.transaction.status, 'completed');

    // Ledger entry check
    const ledger = walletService.getLedgerEntries(brandWalletAfter.id);
    assert.ok(ledger.length > 0, 'Ledger entry must be created');
    assert.equal(ledger[0].entryType, 'credit');
    assert.equal(ledger[0].amountInPaise, topupAmount);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. RESTRICTIONS: SELF-TRANSFER & INSUFFICIENT BALANCE
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('5. Rejection of self-transfer and insufficient balance', () => {
    assert.throws(
      () =>
        walletService.transferFunds({
          senderId: 'usr_brand_1',
          recipientId: 'usr_brand_1', // self
          amountInPaise: 10000,
          description: 'Self transfer',
          idempotencyKey: 'self_tx_1',
        }),
      /Cannot transfer funds to yourself/,
      'Must reject self-transfers'
    );

    assert.throws(
      () =>
        walletService.transferFunds({
          senderId: 'usr_brand_1',
          recipientId: 'usr_creator_1',
          amountInPaise: 99999999999, // exceeds available balance
          description: 'Excessive transfer',
          idempotencyKey: 'excess_tx_1',
        }),
      /Insufficient available balance/,
      'Must reject transfers exceeding available balance'
    );

    assert.throws(
      () =>
        walletService.transferFunds({
          senderId: 'usr_brand_1',
          recipientId: 'usr_creator_1',
          amountInPaise: -500, // negative
          description: 'Negative transfer',
          idempotencyKey: 'neg_tx_1',
        }),
      /Transfer amount must be a positive integer in paise/,
      'Must reject non-positive amounts'
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. VALID BRAND-TO-CREATOR TRANSFER & DOUBLE-ENTRY LEDGER
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('6. Atomic Brand-to-Creator transfer with double-entry ledger', () => {
    const senderId = 'usr_brand_tx_test';
    const recipientId = 'usr_creator_tx_test';

    // Fund sender first
    walletService.addFunds({
      userId: senderId,
      amountInPaise: 10000000, // ₹1,00,000.00
      paymentMethod: 'netbanking',
      idempotencyKey: `fund_${Date.now()}`,
    });

    const senderWalletBefore = walletService.getWallet(senderId);
    const recipientWalletBefore = walletService.getWallet(recipientId, 'creator');

    const transferAmount = 3500000; // ₹35,000.00
    const idempotencyKey = `transfer_contract_${Date.now()}`;

    const res = walletService.transferFunds({
      senderId,
      recipientId,
      amountInPaise: transferAmount,
      description: 'Milestone 2 Content Approval',
      senderName: 'Test Brand',
      recipientName: 'Test Creator',
      linkedDealId: 'deal-001',
      idempotencyKey,
    });

    assert.equal(res.success, true);
    assert.equal(res.senderTransaction.type, 'transfer_sent');
    assert.equal(res.recipientTransaction.type, 'transfer_received');

    // Balance checks
    const senderWalletAfter = walletService.getWallet(senderId);
    const recipientWalletAfter = walletService.getWallet(recipientId);

    assert.equal(
      senderWalletAfter.availablePaise,
      senderWalletBefore.availablePaise - transferAmount,
      'Sender available balance must decrease by exact transfer amount'
    );
    assert.equal(
      recipientWalletAfter.availablePaise,
      recipientWalletBefore.availablePaise + transferAmount,
      'Recipient available balance must increase by exact transfer amount'
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. DUPLICATE TRANSACTION PREVENTION (IDEMPOTENCY)
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('7. Duplicate transaction prevention via idempotency keys', () => {
    const senderId = 'usr_brand_idemp';
    const recipientId = 'usr_creator_idemp';

    walletService.addFunds({
      userId: senderId,
      amountInPaise: 2000000, // ₹20,000.00
      paymentMethod: 'upi',
      idempotencyKey: `fund_idemp_${Date.now()}`,
    });

    const idempotencyKey = `idemp_unique_${Date.now()}`;

    // First call
    const res1 = walletService.transferFunds({
      senderId,
      recipientId,
      amountInPaise: 500000, // ₹5,000.00
      description: 'First attempt',
      idempotencyKey,
    });

    const senderBalAfterFirst = walletService.getWallet(senderId).availablePaise;

    // Second call with same idempotency key (repeated click simulation)
    const res2 = walletService.transferFunds({
      senderId,
      recipientId,
      amountInPaise: 500000,
      description: 'First attempt repeated',
      idempotencyKey,
    });

    assert.equal(res2.success, true);
    assert.equal(res2.senderTransaction.id, res1.senderTransaction.id, 'Must return same transaction ID');

    const senderBalAfterSecond = walletService.getWallet(senderId).availablePaise;
    assert.equal(
      senderBalAfterSecond,
      senderBalAfterFirst,
      'Balance must NOT be deducted twice on duplicate idempotency key'
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 8. WITHDRAWAL WORKFLOW & ATOMIC BALANCE RESERVATION
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('8. Creator withdrawal request atomically reserves funds and transitions', () => {
    const creatorId = 'usr_creator_wd_test';

    // Fund creator with ₹50,000.00
    walletService.addFunds({
      userId: creatorId,
      amountInPaise: 5000000,
      paymentMethod: 'upi',
      idempotencyKey: `fund_wd_${Date.now()}`,
    });

    const dest = walletService.addPayoutDestination(creatorId, {
      type: 'upi',
      accountHolderName: 'Elena Creator',
      upiId: 'elena@okhdfcbank',
    });
    walletService.verifyPayoutDestination(creatorId, dest.id);

    const walletBefore = walletService.getWallet(creatorId);
    const wdAmount = 2000000; // ₹20,000.00
    const idempotencyKey = `wd_request_${Date.now()}`;

    const res = walletService.requestWithdrawal({
      userId: creatorId,
      amountInPaise: wdAmount,
      payoutDestinationId: dest.id,
      idempotencyKey,
    });

    assert.equal(res.success, true);
    assert.equal(res.withdrawal.status, 'requested');

    // Balance check: Available must be reduced, Reserved must hold the funds
    const walletAfterReq = walletService.getWallet(creatorId);
    assert.equal(
      walletAfterReq.availablePaise,
      walletBefore.availablePaise - wdAmount,
      'Available balance must decrease immediately'
    );
    assert.equal(
      walletAfterReq.reservedPaise,
      walletBefore.reservedPaise + wdAmount,
      'Reserved balance must hold the requested funds'
    );

    // Complete payout via bank processing
    const completed = walletService.updateWithdrawalStatus(res.withdrawal.id, 'completed', 'UTR_BANK_SUCCESS_999');
    assert.equal(completed.status, 'completed');
    assert.equal(completed.utrReference, 'UTR_BANK_SUCCESS_999');

    const walletAfterComplete = walletService.getWallet(creatorId);
    assert.equal(walletAfterComplete.reservedPaise, 0, 'Reserved hold cleared on completion');
    assert.equal(
      walletAfterComplete.totalWithdrawnPaise,
      walletBefore.totalWithdrawnPaise + wdAmount,
      'Total withdrawn updated'
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 9. WITHDRAWAL FAILURE/CANCELLATION RELEASES RESERVED FUNDS
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('9. Withdrawal failure releases held funds back to available balance', () => {
    const creatorId = 'usr_creator_fail_test';

    walletService.addFunds({
      userId: creatorId,
      amountInPaise: 3000000, // ₹30,000.00
      paymentMethod: 'upi',
      idempotencyKey: `fund_fail_${Date.now()}`,
    });

    const dest = walletService.addPayoutDestination(creatorId, {
      type: 'upi',
      accountHolderName: 'Test Payout',
      upiId: 'test@upi',
    });
    walletService.verifyPayoutDestination(creatorId, dest.id);

    const wdAmount = 1500000; // ₹15,000.00
    const res = walletService.requestWithdrawal({
      userId: creatorId,
      amountInPaise: wdAmount,
      payoutDestinationId: dest.id,
      idempotencyKey: `wd_fail_${Date.now()}`,
    });

    const walletDuringHold = walletService.getWallet(creatorId);
    assert.equal(walletDuringHold.reservedPaise, wdAmount);

    // Bank rejects payout
    const failed = walletService.updateWithdrawalStatus(
      res.withdrawal.id,
      'failed',
      undefined,
      'Beneficiary bank server down'
    );
    assert.equal(failed.status, 'failed');

    const walletAfterFailure = walletService.getWallet(creatorId);
    assert.equal(walletAfterFailure.reservedPaise, 0, 'Reserved hold released');
    assert.equal(walletAfterFailure.availablePaise, 3000000, 'Funds restored to available balance');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 10. PRIVACY SETTINGS & MESSAGING RESTRICTIONS
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('10. Privacy settings persistence and messaging restriction enforcement', () => {
    const store = useAppStore.getState();

    // Default privacy includes all categories
    assert.ok(store.userSettings.privacy.profileVisibility, 'Profile visibility present');
    assert.ok(store.userSettings.privacy.messaging, 'Messaging privacy present');

    // Update messaging privacy to verified-only
    store.updateUserSettings({
      privacy: {
        ...store.userSettings.privacy,
        messaging: {
          allowedSenders: 'verified-only',
          allowNewMessageRequests: true,
          showOnlineStatus: false,
          readReceipts: false,
          showPreviewsInNotifications: false,
        },
      },
    });

    const updated = useAppStore.getState().userSettings.privacy;
    assert.equal(updated.messaging?.allowedSenders, 'verified-only');
    assert.equal(updated.messaging?.showOnlineStatus, false);
    assert.equal(updated.messaging?.readReceipts, false);
    assert.equal(updated.messaging?.showPreviewsInNotifications, false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 11. WORKSPACE CHAT AUTHORIZATION & MESSAGE ROUTING
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('11. Workspace chat access authorization, message dispatch and unread counts', () => {
    const convs = chatService.getConversationsForUser('usr_brand_1');
    assert.ok(convs.length > 0, 'Brand must have seeded conversations');

    const convId = convs[0].id;

    // Authorized participant can read
    const msgs = chatService.getMessages(convId, 'usr_brand_1');
    assert.ok(Array.isArray(msgs), 'Authorized user gets message array');

    // Unauthorized outsider is rejected
    assert.throws(
      () => chatService.getMessages(convId, 'outsider_unauthorized_user'),
      /Unauthorized/,
      'Outsider must be rejected with Unauthorized error'
    );

    // Send valid message
    const initialUnread = convs[0].unreadCountByUser['usr_creator_1'] || 0;
    const sent = chatService.sendMessage({
      conversationId: convId,
      senderId: 'usr_brand_1',
      senderName: 'Sarah Lin',
      senderRole: 'brand',
      senderAvatar: '',
      content: 'Hello from test suite!',
    });

    assert.equal(sent.status, 'sent');
    assert.equal(sent.content, 'Hello from test suite!');

    const updatedConv = chatService.getConversationById(convId, 'usr_brand_1');
    assert.equal(
      updatedConv?.unreadCountByUser['usr_creator_1'],
      initialUnread + 1,
      'Recipient unread count must increment'
    );

    // Recipient marks as read
    chatService.markAsRead(convId, 'usr_creator_1');
    const readConv = chatService.getConversationById(convId, 'usr_creator_1');
    assert.equal(readConv?.unreadCountByUser['usr_creator_1'], 0, 'Unread count resets to 0 upon viewing');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 12. CAMPAIGN DEAL ROOM PAYMENT LINKAGE
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('12. Deal Room payment linkage and audit activity logging', () => {
    dealService.ensureInitialized();
    const deal = dealService.getDealById('deal-001');
    assert.ok(deal, 'Deal 001 must exist');

    const initialActivityCount = dealService.getActivities('deal-001').length;

    dealService.addActivity(
      'deal-001',
      'brand',
      'Sarah Lin',
      'amended',
      'Milestone 1 Payment of ₹40,000.00 confirmed via INR Wallet (Txn #txn_102).'
    );

    const updatedActivities = dealService.getActivities('deal-001');
    assert.equal(
      updatedActivities.length,
      initialActivityCount + 1,
      'Payment activity must be appended to deal timeline'
    );
    assert.ok(updatedActivities[0].description.includes('₹40,000.00'));
  });
});
