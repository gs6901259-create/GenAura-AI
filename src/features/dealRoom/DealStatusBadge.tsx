import React from 'react';
import { DealStatus } from '@/types/deal';

interface DealStatusBadgeProps {
  status: DealStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusMeta: Record<
  DealStatus,
  { label: string; bg: string; text: string; border: string; dot: string; pulse?: boolean }
> = {
  draft: {
    label: 'Draft',
    bg: 'bg-navy-800/80',
    text: 'text-navy-300',
    border: 'border-navy-700',
    dot: 'bg-navy-400',
  },
  sent: {
    label: 'Sent (Pending Decision)',
    bg: 'bg-amber-950/70',
    text: 'text-amber-300',
    border: 'border-amber-800/80',
    dot: 'bg-amber-400',
    pulse: true,
  },
  counteroffered: {
    label: 'In Negotiation (Counteroffer)',
    bg: 'bg-violet-950/80',
    text: 'text-violet-300',
    border: 'border-violet-700/80',
    dot: 'bg-violet-400',
    pulse: true,
  },
  accepted: {
    label: 'Accepted (Terms Agreed)',
    bg: 'bg-emerald-950/70',
    text: 'text-emerald-300',
    border: 'border-emerald-800/80',
    dot: 'bg-emerald-400',
  },
  in_progress: {
    label: 'In Production',
    bg: 'bg-cyan-950/70',
    text: 'text-cyan-300',
    border: 'border-cyan-800/80',
    dot: 'bg-cyan-400',
    pulse: true,
  },
  completed: {
    label: 'Completed & Verified',
    bg: 'bg-teal-950/70',
    text: 'text-teal-300',
    border: 'border-teal-800/80',
    dot: 'bg-teal-400',
  },
  declined: {
    label: 'Declined',
    bg: 'bg-rose-950/70',
    text: 'text-rose-300',
    border: 'border-rose-800/80',
    dot: 'bg-rose-400',
  },
  withdrawn: {
    label: 'Withdrawn',
    bg: 'bg-zinc-900/80',
    text: 'text-zinc-400',
    border: 'border-zinc-700',
    dot: 'bg-zinc-500',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-red-950/50',
    text: 'text-red-400',
    border: 'border-red-900/60',
    dot: 'bg-red-500',
  },
};

export const DealStatusBadge: React.FC<DealStatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const meta = statusMeta[status] || statusMeta.draft;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${meta.bg} ${meta.text} ${meta.border} ${sizeClasses} ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${meta.dot} ${meta.pulse ? 'animate-pulse' : ''}`}
      />
      {meta.label}
    </span>
  );
};
