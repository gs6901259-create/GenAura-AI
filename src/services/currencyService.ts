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
