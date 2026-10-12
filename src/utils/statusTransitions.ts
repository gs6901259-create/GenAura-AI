import { CollaborationStatus } from '../contracts/collaborationContract';

export interface StatusMeta {
  label: string;
  badgeClass: string;
  dotClass: string;
  description: string;
}

export const STATUS_METADATA: Record<CollaborationStatus, StatusMeta> = {
  draft: {
    label: 'Draft',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    dotClass: 'bg-slate-400',
    description: 'Proposal created by brand; not yet dispatched to creator.',
  },
  sent: {
    label: 'Sent (Pending Decision)',
    badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-800',
    dotClass: 'bg-amber-400 animate-pulse',
    description: 'Invitation sent to creator; awaiting accept or decline.',
  },
  accepted: {
    label: 'Accepted',
    badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-800',
    dotClass: 'bg-emerald-400',
    description: 'Creator accepted the terms and linked campaign brief.',
  },
  declined: {
    label: 'Declined',
    badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-800',
    dotClass: 'bg-rose-400',
    description: 'Creator declined the collaboration proposal.',
  },
  in_progress: {
    label: 'In Progress',
    badgeClass: 'bg-blue-950/70 text-blue-300 border-blue-800',
    dotClass: 'bg-blue-400 animate-pulse',
    description: 'Active collaboration; creator is producing deliverables.',
  },
  submitted: {
    label: 'Under Review',
    badgeClass: 'bg-purple-950/70 text-purple-300 border-purple-800',
    dotClass: 'bg-purple-400',
    description: 'Deliverables submitted by creator; awaiting brand review.',
  },
  revision_requested: {
    label: 'Revisions Requested',
    badgeClass: 'bg-orange-950/70 text-orange-300 border-orange-800',
    dotClass: 'bg-orange-400',
    description: 'Brand requested changes on submitted content.',
  },
  completed: {
    label: 'Completed',
    badgeClass: 'bg-teal-950/70 text-teal-300 border-teal-800',
    dotClass: 'bg-teal-400',
    description: 'All deliverables approved & verified; project archived.',
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    dotClass: 'bg-zinc-500',
    description: 'Collaboration terminated by brand or mutual agreement.',
  },
};

/**
 * Valid state transitions mapping
 */
export const ALLOWED_TRANSITIONS: Record<CollaborationStatus, CollaborationStatus[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['accepted', 'declined', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  declined: ['sent', 'cancelled'], // can re-invite with adjusted terms
  in_progress: ['submitted', 'cancelled'],
  submitted: ['revision_requested', 'completed', 'in_progress'],
  revision_requested: ['submitted', 'in_progress', 'cancelled'],
  completed: [], // Terminal
  cancelled: ['draft'], // Can revive as draft if desired
};

export function canTransition(current: CollaborationStatus, target: CollaborationStatus): boolean {
  if (current === target) return false;
  const allowed = ALLOWED_TRANSITIONS[current] || [];
  return allowed.includes(target);
}

export function getAvailableTransitions(current: CollaborationStatus): CollaborationStatus[] {
  return ALLOWED_TRANSITIONS[current] || [];
}
