/** Utility helpers shared across the codebase. */

/** Merge class names, filtering falsy values. Works without any extra deps. */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format a number as Indian Rupees (₹, INR) with Indian numbering grouping (lakhs, crores).
 * Example: 25000 -> "₹25,000", 125000 -> "₹1,25,000", 1000000 -> "₹10,00,000"
 */
export function formatRupees(amount: number, compact = false): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
  const prefix = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);

  if (compact && abs >= 10_000_000) {
    return `${prefix}₹${(abs / 10_000_000).toFixed(1)}Cr`;
  }
  if (compact && abs >= 100_000) {
    return `${prefix}₹${(abs / 100_000).toFixed(1)}L`;
  }
  if (compact && abs >= 1_000) {
    return `${prefix}₹${(abs / 1_000).toFixed(1)}k`;
  }

  return `${prefix}${new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(abs)}`;
}

/**
 * Backwards-compatible alias redirected to Indian Rupees (INR)
 * @deprecated Use formatRupees or formatINR instead.
 */
export function formatUSD(amount: number, compact = false): string {
  return formatRupees(amount, compact);
}

export { formatINR } from '@/services/currencyService';


/** Format an ISO date string to a human-readable relative time */
export function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1)   return 'just now';
  if (minutes < 60)  return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)    return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7)      return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Format ISO date string to "Oct 12, 2026" */
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Generate a UUID-like unique id (good enough for client-side IDs) */
export function uid(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? text.slice(0, maxLength - 1) + '…' : text;
}
