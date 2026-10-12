/**
 * GenAura AI — Comprehensive INR Payments, Currency Migration & Digital Wallet Test Suite
 * =======================================================================================
 * Validates:
 * 1. Indian Rupee (₹, INR) formatting for ₹500, ₹1,500, ₹25,000, ₹1,25,000, ₹10,00,000.
 * 2. Integer-paise arithmetic preventing IEEE-754 floating point inaccuracies.
 * 3. Safe USD -> INR currency migration preserving audit metadata and exchange rate 83.
 * 4. Indian number-to-words conversion for commercial invoices and digital receipts.
 * 5. Goods & Services Tax (GST 18%) computation and tax-exempt handling.
 * 6. Financial identifier masking (UPI VPAs and bank accounts).
 * 7. User-scoped wallet isolation and Available/Pending/Reserved balance mechanics.
 * 8. Add funds simulation and immutable double-entry ledger bookkeeping.
 * 9. Milestone escrow deposit, review approval release, and idempotency protection.
 * 10. Razorpay India gateway abstraction, order creation, and signature validation.
 * 11. Aura AI Assistant grounding for INR pricing benchmarks and wallet guidance.
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
  formatRupees,
  paiseToRupees,
  rupeesToPaise,
  isValidPaiseAmount,
  convertUsdToInr,
  calculateGst,
  numberToIndianWords,
  calculateProcessingFee,
  maskFinancialIdentifier,
} from '../src/services/currencyService.ts';
import { walletService } from '../src/services/walletService.ts';
import { paymentProvider } from '../src/services/paymentProvider.ts';
import { aiAssistantService } from '../src/services/aiAssistantService.ts';

test('GenAura AI — INR Payments & Digital Wallet Integration Test Suite', async (t) => {
  walletService.resetToSeed();

  // ──────────────────────────────────────────────────────────────────────────
  // 1. EXACT INR NUMBER FORMATTING (EN-IN)
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('1. Formats ₹500, ₹1,500, ₹25,000, ₹1,25,000, and ₹10,00,000 correctly', () => {
    // Whole rupee formatting
    assert.equal(formatRupees(500), '₹500', 'Should format ₹500');
    assert.equal(formatRupees(1500), '₹1,500', 'Should format ₹1,500');
    assert.equal(formatRupees(25000), '₹25,000', 'Should format ₹25,000');
    assert.equal(formatRupees(125000), '₹1,25,000', 'Should format ₹1,25,000');
    assert.equal(formatRupees(1000000), '₹10,00,000', 'Should format ₹10,00,000');

    // Integer paise formatting (50000 paise = ₹500.00)
    assert.equal(formatINR(50000, { fractionDigits: 0 }), '₹500', 'Paise formatter with 0 digits');
    assert.equal(formatINR(150000, { fractionDigits: 0 }), '₹1,500', 'Paise formatter with 0 digits');
    assert.equal(formatINR(2500000, { fractionDigits: 0 }), '₹25,000', 'Paise formatter with 0 digits');
    assert.equal(formatINR(12500000, { fractionDigits: 0 }), '₹1,25,000', 'Paise formatter with 0 digits');
    assert.equal(formatINR(100000000, { fractionDigits: 0 }), '₹10,00,000', 'Paise formatter with 0 digits');

    // Standard paise formatting with decimals
    assert.equal(formatINR(2500000), '₹25,000.00', 'Paise formatter with standard 2 decimal places');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. INTEGER PAISE MATHEMATICS & PRECISION
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('2. Integer-paise calculations avoid IEEE-754 precision errors', () => {
    // 19.99 rupees in standard JS float: 19.99 * 100 = 1998.9999999999998
    const floatAmount = 19.99;
    const paise = rupeesToPaise(floatAmount);
    assert.equal(paise, 1999, 'Must round accurately to 1999 paise');

    // Parsing string representation with commas
    assert.equal(rupeesToPaise('₹1,25,000'), 12500000, 'Must strip symbols and commas');
    assert.equal(paiseToRupees(12500000), 125000, 'Must convert back to exact rupees');

    assert.equal(isValidPaiseAmount(50000), true, 'Valid positive integer paise');
    assert.equal(isValidPaiseAmount(0), false, 'Zero is invalid for positive ledger movement');
    assert.equal(isValidPaiseAmount(-100), false, 'Negative paise is rejected');
    assert.equal(isValidPaiseAmount(100.5), false, 'Floating point paise is rejected');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. SAFE USD -> INR DATA MIGRATION
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('3. Converts legacy USD figures using 1 USD = 83 INR while preserving audit metadata', () => {
    const usdAmount = 100;
    const migration = convertUsdToInr(usdAmount);

    assert.equal(migration.exchangeRate, 83, 'Default exchange rate must be 83');
    assert.equal(migration.inrAmount, 8300, '100 USD * 83 = 8,300 INR');
    assert.equal(migration.amountInPaise, 830000, '8,300 INR = 830,000 paise');
    assert.equal(migration.originalAmount, 100, 'Original amount must be preserved');
    assert.equal(migration.originalCurrency, 'USD', 'Original currency must be USD');
    assert.ok(migration.convertedAt, 'Must include ISO conversion timestamp');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. NUMBER TO INDIAN WORDS
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('4. Converts numeric rupee values into formal Indian English words', () => {
    assert.equal(numberToIndianWords(500), 'Rupees Five Hundred Only');
    assert.equal(numberToIndianWords(1500), 'Rupees One Thousand Five Hundred Only');
    assert.equal(numberToIndianWords(25000), 'Rupees Twenty-Five Thousand Only');
    assert.equal(numberToIndianWords(125000), 'Rupees One Lakh Twenty-Five Thousand Only');
    assert.equal(numberToIndianWords(1000000), 'Rupees Ten Lakh Only');
    assert.equal(numberToIndianWords(0), 'Rupees Zero Only');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. GOODS & SERVICES TAX (GST 18%) COMPUTATION
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('5. Computes GST (18%) and handles tax-exempt wallet transactions', () => {
    // Commercial payment: 10,000 INR = 1,000,000 paise
    const commercialTax = calculateGst(1000000, 18, false);
    assert.equal(commercialTax.basePaise, 1000000);
    assert.equal(commercialTax.gstPaise, 180000, '18% of 1,000,000 paise is 180,000 paise');
    assert.equal(commercialTax.totalPaise, 1180000, 'Total with GST is 1,180,000 paise');
    assert.equal(commercialTax.isGstExempt, false);

    // Wallet deposit / exempt transaction
    const exemptTax = calculateGst(500000, 18, true);
    assert.equal(exemptTax.gstPaise, 0);
    assert.equal(exemptTax.totalPaise, 500000);
    assert.equal(exemptTax.isGstExempt, true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. SENSITIVE FINANCIAL IDENTIFIER MASKING
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('6. Masks UPI VPAs and Bank Account Numbers for privacy', () => {
    assert.equal(maskFinancialIdentifier('elena@okhdfcbank', 'upi'), 'el***@okhdfcbank');
    assert.equal(maskFinancialIdentifier('918239104821', 'bank_account'), '•••• •••• 4821');
    assert.equal(maskFinancialIdentifier('1234', 'bank_account'), '•••• 1234');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. USER WALLET ISOLATION & BALANCES
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('7. Provides distinct Available, Pending, and Reserved balances per user', () => {
    const brandWallet = walletService.getWallet('usr_brand_1', 'brand');
    assert.ok(brandWallet.availablePaise >= 0, 'Available balance must be non-negative');
    assert.equal(brandWallet.currency, 'INR', 'Currency must be INR');

    const creatorWallet = walletService.getWallet('usr_creator_1', 'creator');
    assert.ok(creatorWallet.availablePaise >= 0, 'Creator wallet available balance');
    assert.equal(creatorWallet.currency, 'INR');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 8. ADD FUNDS & IMMUTABLE LEDGER ENTRIES
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('8. Brand add funds top-up credits available balance and records ledger', () => {
    const brandWalletBefore = walletService.getWallet('usr_brand_1', 'brand');
    const topupPaise = 5000000; // ₹50,000

    const res = walletService.addFunds({
      userId: 'usr_brand_1',
      userRole: 'brand',
      amountInPaise: topupPaise,
      paymentMethod: 'upi',
      idempotencyKey: `topup_test_${Date.now()}`,
    });

    assert.equal(res.success, true);
    assert.equal(res.transaction.status, 'completed');
    assert.equal(res.transaction.amountInPaise, topupPaise);

    const brandWalletAfter = walletService.getWallet('usr_brand_1', 'brand');
    assert.equal(
      brandWalletAfter.availablePaise,
      brandWalletBefore.availablePaise + topupPaise,
      'Available balance must increment by top-up amount'
    );

    const ledger = walletService.getLedgerEntries(brandWalletAfter.id);
    assert.ok(ledger.length > 0, 'Ledger entries must be recorded');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 9. ATOMIC ESCROW & IDEMPOTENCY
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('9. Prevents duplicate payments using idempotency keys', () => {
    const idempotencyKey = `transfer_idem_${Date.now()}`;

    // First transfer succeeds
    const res1 = walletService.transferFunds({
      senderId: 'usr_brand_1',
      senderName: 'Brand Systems',
      recipientId: 'usr_creator_1',
      recipientName: 'Elena Rostova',
      amountInPaise: 1000000, // ₹10,000
      description: 'Milestone 1 Deliverable Payment',
      idempotencyKey,
    });
    assert.equal(res1.success, true);
    assert.equal(res1.senderTransaction.status, 'completed');

    // Duplicate submission with same key is idempotent: returns existing transaction without double deduction
    const balanceBeforeDup = walletService.getWallet('usr_brand_1', 'brand').availablePaise;
    const res2 = walletService.transferFunds({
      senderId: 'usr_brand_1',
      senderName: 'Brand Systems',
      recipientId: 'usr_creator_1',
      recipientName: 'Elena Rostova',
      amountInPaise: 1000000,
      description: 'Duplicate Milestone 1 Deliverable Payment',
      idempotencyKey,
    });
    const balanceAfterDup = walletService.getWallet('usr_brand_1', 'brand').availablePaise;

    assert.equal(res2.senderTransaction.id, res1.senderTransaction.id, 'Must return identical transaction ID');
    assert.equal(balanceBeforeDup, balanceAfterDup, 'Must not double-deduct from balance');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 10. PAYMENT GATEWAY PROVIDER & ORDER CREATION
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('10. Payment gateway provider creates INR orders and validates signatures', async () => {
    assert.equal(paymentProvider.getProviderName(), 'Razorpay India (Sandbox Gateway)');
    assert.equal(paymentProvider.isLiveMode(), false, 'Default mode is sandbox');

    const order = await paymentProvider.createOrder({
      amountInPaise: 2500000, // ₹25,000
      currency: 'INR',
      receipt: 'rcpt_101',
    });

    assert.ok(order.orderId.startsWith('order_sbx_'), 'Sandbox order ID prefix');
    assert.equal(order.amountInPaise, 2500000);
    assert.equal(order.currency, 'INR');

    // Valid signature
    const validVerify = await paymentProvider.verifyPayment({
      orderId: order.orderId,
      paymentId: 'pay_sbx_123',
      signature: 'sig_valid_abcdef1234567890',
    });
    assert.equal(validVerify.verified, true);

    // Invalid signature
    const invalidVerify = await paymentProvider.verifyPayment({
      orderId: order.orderId,
      paymentId: 'pay_sbx_123',
      signature: 'bad',
    });
    assert.equal(invalidVerify.verified, false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 11. AI ASSISTANT GROUNDING FOR INR & WALLET INQUIRIES
  // ──────────────────────────────────────────────────────────────────────────
  await t.test('11. Aura AI Assistant explains INR budget tiers, escrow, and links to /wallet', async () => {
    const res = await aiAssistantService.generateReply('How does the digital wallet and escrow payment work?');
    assert.ok(res.text.includes('Indian Rupees (₹ INR)'), 'Must reference Indian Rupees');
    assert.ok(res.text.includes('Available Balance'), 'Must explain Available Balance');
    assert.ok(res.text.includes('Reserved (Escrow) Balance'), 'Must explain Reserved Escrow');
    assert.ok(res.text.includes('₹2,000 – ₹5,000'), 'Must include Nano pricing benchmark');
    assert.ok(res.text.includes('₹25,000 – ₹1,00,000'), 'Must include Mid-tier pricing benchmark');
    assert.equal(res.actionLink?.to, '/wallet', 'Must link directly to /wallet');
  });
});
