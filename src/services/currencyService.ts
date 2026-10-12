/**
 * GenAura AI — INR Currency Service
 * =================================
 * Exact integer-paise representation of Indian Rupees (INR, ₹).
 * Standardized across all wallet, payment, transfer, and payout operations.
 *
 * Rules:
 * 1. 1 INR = 100 paise.
 * 2. Authoritative calculations must only use integer paise arithmetic.
 * 3. Formatting strictly adheres to Indian numbering format (en-IN): e.g. ₹1,00,000.00.
 */

/**
 * Formats an amount in integer paise to a localized INR string.
 * Example: 1250000 -> "₹12,500.00", 10000000 -> "₹1,00,000.00"
 */
export function formatINR(paise: number, options: { includeSymbol?: boolean; fractionDigits?: number } = {}): string {
  const { includeSymbol = true, fractionDigits = 2 } = options;

  if (typeof paise !== 'number' || isNaN(paise)) {
    return includeSymbol ? '₹0.00' : '0.00';
  }

  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.round(paise));
  const rupees = absPaise / 100;

  // Use Intl.NumberFormat with en-IN locale for Indian numbering grouping (lakhs, crores)
  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  const formattedNumber = formatter.format(rupees);
  const prefix = isNegative ? '-' : '';
  const symbol = includeSymbol ? '₹' : '';

  return `${prefix}${symbol}${formattedNumber}`;
}

/**
 * Converts integer paise to decimal rupees for UI display input values.
 */
export function paiseToRupees(paise: number): number {
  if (typeof paise !== 'number' || isNaN(paise)) return 0;
  return Math.round(paise) / 100;
}

/**
 * Converts a decimal rupee amount into safe integer paise.
 * Avoids IEEE 754 precision issues (e.g. 19.99 * 100 = 1998.9999999999998).
 */
export function rupeesToPaise(rupees: number | string): number {
  if (typeof rupees === 'string') {
    // Strip commas, currency symbols, and whitespace
    const clean = rupees.replace(/[₹,\s]/g, '').trim();
    const parsed = parseFloat(clean);
    if (isNaN(parsed)) return 0;
    return Math.round(parsed * 100);
  }

  if (typeof rupees !== 'number' || isNaN(rupees)) {
    return 0;
  }

  return Math.round(rupees * 100);
}

/**
 * Validates that an amount is a strictly positive integer number of paise.
 */
export function isValidPaiseAmount(paise: unknown): paise is number {
  return typeof paise === 'number' && Number.isInteger(paise) && paise > 0;
}

/**
 * Computes platform or payment processing fee in integer paise.
 * Default: 1.5% processing fee, rounded down to nearest paise.
 */
export function calculateProcessingFee(amountInPaise: number, feePercent = 1.5, minFeePaise = 1000): number {
  if (!isValidPaiseAmount(amountInPaise)) return 0;
  const computed = Math.round((amountInPaise * feePercent) / 100);
  return Math.max(minFeePaise, computed);
}

/**
 * Mask sensitive financial identifiers:
 * - Bank Account: "•••• •••• 4821"
 * - UPI ID: "el***@okhdfcbank"
 */
export function maskFinancialIdentifier(value: string, type: 'upi' | 'bank_account'): string {
  if (!value) return '';

  if (type === 'upi') {
    const parts = value.split('@');
    if (parts.length !== 2) return value;
    const [user, handle] = parts;
    if (user.length <= 2) return `${user.charAt(0)}*@${handle}`;
    return `${user.slice(0, 2)}${'*'.repeat(Math.max(3, user.length - 2))}@${handle}`;
  }

  // Bank Account Number
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 4) return `•••• ${digits}`;
  const last4 = digits.slice(-4);
  return `•••• •••• ${last4}`;
}

/**
 * Formats an amount in decimal or whole rupees using Indian numbering (en-IN).
 * Examples:
 * - 500 -> "₹500"
 * - 1500 -> "₹1,500"
 * - 25000 -> "₹25,000"
 * - 125000 -> "₹1,25,000"
 * - 1000000 -> "₹10,00,000"
 */
export function formatRupees(
  amount: number,
  options: { compact?: boolean; fractionDigits?: number; includeSymbol?: boolean } = {}
): string {
  const { compact = false, fractionDigits = 0, includeSymbol = true } = options;

  if (typeof amount !== 'number' || isNaN(amount)) {
    return includeSymbol ? '₹0' : '0';
  }

  const prefix = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  const symbol = includeSymbol ? '₹' : '';

  if (compact && abs >= 10_000_000) {
    return `${prefix}${symbol}${(abs / 10_000_000).toFixed(1)}Cr`;
  }
  if (compact && abs >= 100_000) {
    return `${prefix}${symbol}${(abs / 100_000).toFixed(1)}L`;
  }
  if (compact && abs >= 1_000) {
    return `${prefix}${symbol}${(abs / 1_000).toFixed(1)}k`;
  }

  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  return `${prefix}${symbol}${formatter.format(abs)}`;
}

/** Configured exchange rate for legacy USD data migration: 1 USD = 83 INR */
export const DEFAULT_USD_TO_INR_RATE = 83;

export interface CurrencyConversionMetadata {
  amountInPaise: number;
  inrAmount: number;
  currency: 'INR';
  originalAmount: number;
  originalCurrency: 'USD';
  exchangeRate: number;
  convertedAt: string;
}

/**
 * Safely converts legacy USD financial figures to INR and integer paise,
 * maintaining original values for full auditability.
 */
export function convertUsdToInr(usdAmount: number, rate = DEFAULT_USD_TO_INR_RATE): CurrencyConversionMetadata {
  const inrAmount = Math.round(usdAmount * rate);
  const amountInPaise = inrAmount * 100;
  return {
    amountInPaise,
    inrAmount,
    currency: 'INR',
    originalAmount: usdAmount,
    originalCurrency: 'USD',
    exchangeRate: rate,
    convertedAt: new Date().toISOString(),
  };
}

export interface GstCalculation {
  basePaise: number;
  gstPaise: number;
  totalPaise: number;
  ratePercent: number;
  isGstExempt: boolean;
}

/**
 * Calculates Goods & Services Tax (GST, default 18%) for commercial invoices.
 */
export function calculateGst(amountInPaise: number, ratePercent = 18, isExempt = false): GstCalculation {
  if (isExempt || !isValidPaiseAmount(amountInPaise)) {
    const base = Math.max(0, Math.round(amountInPaise || 0));
    return {
      basePaise: base,
      gstPaise: 0,
      totalPaise: base,
      ratePercent: 0,
      isGstExempt: true,
    };
  }

  const basePaise = Math.round(amountInPaise);
  const gstPaise = Math.round((basePaise * ratePercent) / 100);
  const totalPaise = basePaise + gstPaise;

  return {
    basePaise,
    gstPaise,
    totalPaise,
    ratePercent,
    isGstExempt: false,
  };
}

/**
 * Converts a rupee amount to formal Indian English currency words.
 * Example: 25000 -> "Rupees Twenty-Five Thousand Only"
 */
export function numberToIndianWords(rupees: number): string {
  if (typeof rupees !== 'number' || isNaN(rupees) || rupees === 0) {
    return 'Rupees Zero Only';
  }

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 20) return ones[n];
    const unit = n % 10;
    return tens[Math.floor(n / 10)] + (unit ? '-' + ones[unit] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred) {
      res += ones[hundred] + ' Hundred';
      if (rest) res += ' ';
    }
    if (rest) {
      res += convertTwoDigits(rest);
    }
    return res;
  }

  const abs = Math.abs(Math.round(rupees));
  const crore = Math.floor(abs / 10_000_000);
  const lakh = Math.floor((abs % 10_000_000) / 100_000);
  const thousand = Math.floor((abs % 100_000) / 1_000);
  const hundred = abs % 1_000;

  const parts: string[] = [];
  if (crore) parts.push(convertThreeDigits(crore) + ' Crore');
  if (lakh) parts.push(convertTwoDigits(lakh) + ' Lakh');
  if (thousand) parts.push(convertTwoDigits(thousand) + ' Thousand');
  if (hundred) parts.push(convertThreeDigits(hundred));

  return `Rupees ${parts.join(' ').trim()} Only`;
}

