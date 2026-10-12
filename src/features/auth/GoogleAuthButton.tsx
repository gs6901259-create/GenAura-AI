/**
 * GenAura AI — Google Authentication Action Button
 * ==================================================
 * Professional button supporting "Continue with Google" (login)
 * and "Sign up with Google" (registration) with smooth hover, focus,
 * loading spinner, and light/dark theme contrast.
 */
import { GoogleIcon } from './GoogleIcon';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GoogleAuthButtonProps {
  mode: 'signin' | 'signup';
  isLoading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}

export function GoogleAuthButton({
  mode,
  isLoading = false,
  disabled = false,
  onClick,
  className,
}: GoogleAuthButtonProps) {
  const label = mode === 'signin' ? 'Continue with Google' : 'Sign up with Google';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={label}
      className={cn(
        'w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition-all duration-150',
        'flex items-center justify-center gap-3 shadow-xs hover:shadow-md cursor-pointer',
        // Theme surfaces: Clean crisp white in light, midnight navy in dark
        'bg-white dark:bg-navy-800 text-slate-800 dark:text-navy-100',
        'border border-slate-300 dark:border-navy-700 hover:border-slate-400 dark:hover:border-navy-600',
        'hover:bg-slate-50 dark:hover:bg-navy-750',
        'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none',
        className
      )}
    >
      {isLoading ? (
        <>
          <Loader2 size={16} className="animate-spin text-violet-500" />
          <span>Connecting to Google...</span>
        </>
      ) : (
        <>
          <GoogleIcon className="h-4 w-4 shrink-0" />
          <span className="font-semibold">{label}</span>
        </>
      )}
    </button>
  );
}
