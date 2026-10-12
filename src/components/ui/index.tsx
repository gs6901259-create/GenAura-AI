/**
 * Reusable UI components for GenAura AI.
 * Import from '@/components/ui' in any feature module.
 */
import React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

// ──────────────────────────────────────────────────────────────────
// Button
// ──────────────────────────────────────────────────────────────────
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
}

const btnBase =
  'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

const btnVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-violet-600 text-white hover:bg-violet-500 active:bg-violet-700 shadow-sm',
  secondary:
    'bg-navy-800 text-navy-100 hover:bg-navy-700 border border-navy-700',
  ghost:
    'text-navy-300 hover:text-white hover:bg-navy-800',
  danger:
    'bg-rose-500 text-white hover:bg-rose-400 active:bg-rose-600',
  outline:
    'border border-violet-500 text-violet-400 hover:bg-violet-500/10',
};

const btnSizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon: Icon,
      iconRight: IconRight,
      loading,
      fullWidth,
      className,
      children,
      disabled,
      ...rest
    },
    ref
  ) => (
    <button
      ref={ref}
      className={cn(
        btnBase,
        btnVariants[variant],
        btnSizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      ) : (
        Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} aria-hidden />
      )}
      {children}
      {!loading && IconRight && (
        <IconRight size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} aria-hidden />
      )}
    </button>
  )
);
Button.displayName = 'Button';

// ──────────────────────────────────────────────────────────────────
// Badge
// ──────────────────────────────────────────────────────────────────
export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'violet';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-navy-700 text-navy-200',
  success: 'bg-emerald-500/20 text-emerald-400',
  warning: 'bg-amber-500/20 text-amber-400',
  danger:  'bg-rose-500/20 text-rose-400',
  info:    'bg-cyan-500/20 text-cyan-400',
  violet:  'bg-violet-500/20 text-violet-300',
};

export function Badge({ variant = 'default', children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        badgeVariants[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-emerald-400',
            variant === 'warning' && 'bg-amber-400',
            variant === 'danger'  && 'bg-rose-400',
            variant === 'info'    && 'bg-cyan-400',
            variant === 'violet'  && 'bg-violet-400',
            variant === 'default' && 'bg-navy-400',
          )}
        />
      )}
      {children}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────
// Card
// ──────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className, onClick, hoverable, padding = 'md' }: CardProps) {
  const paddings = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6' };
  return (
    <div
      className={cn(
        'rounded-xl bg-navy-900 border border-navy-700/50',
        paddings[padding],
        hoverable && 'cursor-pointer hover:border-navy-600 hover:bg-navy-800 transition-all duration-150',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-base font-semibold text-navy-100', className)}>{children}</h3>;
}

// ──────────────────────────────────────────────────────────────────
// Avatar
// ──────────────────────────────────────────────────────────────────
interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const avatarSizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base', xl: 'h-16 w-16 text-xl' };

export function Avatar({ src, alt, size = 'md', className }: AvatarProps) {
  const initials = alt
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden shrink-0 bg-violet-700 flex items-center justify-center font-semibold text-white',
        avatarSizes[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Input
// ──────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon: Icon, iconRight: IconRight, className, id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-navy-300">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy-500">
              <Icon size={16} />
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full rounded-lg bg-navy-800 border px-3 py-2 text-sm text-navy-100 placeholder:text-navy-500',
              'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent',
              'transition-colors duration-150',
              error ? 'border-rose-500' : 'border-navy-600',
              Icon && 'pl-9',
              IconRight && 'pr-9',
              className
            )}
            {...rest}
          />
          {IconRight && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-navy-500">
              <IconRight size={16} />
            </span>
          )}
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        {hint && !error && <p className="text-xs text-navy-500">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ──────────────────────────────────────────────────────────────────
// StarRating
// ──────────────────────────────────────────────────────────────────
export function StarRating({ rating, max = 5, size = 14 }: { rating: number; max?: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of ${max}`}>
      {Array.from({ length: max }).map((_, i) => {
        const fill = Math.min(Math.max(rating - i, 0), 1);
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
            <defs>
              <linearGradient id={`star-${i}-${rating}`}>
                <stop offset={`${fill * 100}%`} stopColor="#f59e0b" />
                <stop offset={`${fill * 100}%`} stopColor="#334155" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#star-${i}-${rating})`}
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Stat Card (for dashboard)
// ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  accent?: 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose';
  className?: string;
}

const accentMap = {
  violet:  { bg: 'bg-violet-500/15', icon: 'text-violet-400', border: 'border-violet-500/30' },
  cyan:    { bg: 'bg-cyan-500/15',   icon: 'text-cyan-400',   border: 'border-cyan-500/30'   },
  emerald: { bg: 'bg-emerald-500/15',icon: 'text-emerald-400',border: 'border-emerald-500/30'},
  amber:   { bg: 'bg-amber-500/15',  icon: 'text-amber-400',  border: 'border-amber-500/30'  },
  rose:    { bg: 'bg-rose-500/15',   icon: 'text-rose-400',   border: 'border-rose-500/30'   },
};

export function StatCard({ label, value, icon: Icon, trend, accent = 'violet', className }: StatCardProps) {
  const a = accentMap[accent];
  return (
    <div
      className={cn(
        'rounded-xl bg-navy-900 border border-navy-700/50 p-5 flex items-start gap-4',
        className
      )}
    >
      <div className={cn('rounded-lg p-2.5 shrink-0', a.bg, `border ${a.border}`)}>
        <Icon size={20} className={a.icon} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-navy-50 tabular-nums">{value}</p>
        <p className="text-sm text-navy-400 mt-0.5">{label}</p>
        {trend && (
          <p className={cn('text-xs mt-1', trend.value >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// PageHeader
// ──────────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-50">{title}</h1>
        {subtitle && <p className="text-navy-400 mt-1 text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Empty State
// ──────────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="rounded-full bg-navy-800 p-4">
        <Icon size={28} className="text-navy-500" />
      </div>
      <p className="text-navy-200 font-semibold">{title}</p>
      {description && <p className="text-navy-500 text-sm max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Tooltip (accessible title-based for now)
// ──────────────────────────────────────────────────────────────────
export function Tooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement;
}) {
  return React.cloneElement(children, { title: label } as Record<string, unknown>);
}

// ──────────────────────────────────────────────────────────────────
// Divider
// ──────────────────────────────────────────────────────────────────
export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-navy-700/50', className)} />;
}

// ──────────────────────────────────────────────────────────────────
// Spinner
// ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('animate-spin text-violet-500', className)}
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
