import React from 'react';
import { CollaborationStatus } from '@/contracts/collaborationContract';
import { STATUS_METADATA } from '@/utils/statusTransitions';

interface StatusBadgeProps {
  status: CollaborationStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
}) => {
  const meta = STATUS_METADATA[status] || {
    label: status,
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    dotClass: 'bg-slate-400',
    description: '',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 font-semibold',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-xs transition-colors ${meta.badgeClass} ${sizeClasses}`}
      title={meta.description}
    >
      {showDot && (
        <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
      )}
      {meta.label}
    </span>
  );
};


