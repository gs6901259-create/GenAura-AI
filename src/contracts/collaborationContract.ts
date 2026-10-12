/**
 * Collaboration Workflows Data Contract
 *
 * Defines collaboration projects, brief-linked requests, deliverable tracking,
 * creator accept/decline actions, audit trails, and consistent status machine.
 */

import { SocialPlatform } from './discoveryContract';

export type CollaborationStatus =
  | 'draft'               // Brand is preparing the project request
  | 'sent'                // Dispatched to creator, waiting for creator decision
  | 'accepted'            // Creator accepted the terms and linked brief
  | 'declined'            // Creator declined (reason and optional note recorded)
  | 'in_progress'         // Content creation underway
  | 'submitted'           // Content submitted for review
  | 'revision_requested'  // Brand requested changes
  | 'completed'           // Deliverables approved & verified, project closed
  | 'cancelled';          // Cancelled by brand or mutual agreement

export type DeclineCategory =
  | 'schedule_conflict'
  | 'rate_mismatch'
  | 'brand_mismatch'
  | 'exclusivity_conflict'
  | 'creative_differences'
  | 'other';

export interface DeclineReason {
  category: DeclineCategory;
  note: string;
  timestamp: string;
}

export type DeliverableStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'revision'
  | 'approved';

export interface ProjectDeliverable {
  id: string;
  title: string;
  platform: SocialPlatform;
  format: string;
  description: string;
  dueDate: string;
  status: DeliverableStatus;
  draftUrl?: string;
  liveUrl?: string;
  submittedAt?: string;
  approvedAt?: string;
  feedback?: string;
}

export interface CompensationPlan {
  amount: number;
  currency: string;
  type: 'fixed' | 'milestone' | 'gift_plus_commission';
  paymentTerms: string; // e.g. "Net-15 after deliverable approval"
  milestones?: {
    id: string;
    title: string;
    amount: number;
    isPaid: boolean;
    paidAt?: string;
  }[];
}

export interface UsageRightsTerms {
  durationDays: number;
  digitalAdsAllowed: boolean;
  organicWhitelisting: boolean;
  exclusivityDays?: number;
  exclusivityCategory?: string;
}

export interface StatusAuditLog {
  id: string;
  fromStatus: CollaborationStatus | null;
  toStatus: CollaborationStatus;
  timestamp: string;
  actorRole: 'brand' | 'creator' | 'system';
  actorName: string;
  note: string;
}

export interface CollaborationProject {
  id: string;
  briefId: string;
  creatorId: string;
  shortlistId?: string;
  title: string;
  personalizedMessage: string;
  deliverables: ProjectDeliverable[];
  compensation: CompensationPlan;
  usageRights: UsageRightsTerms;
  status: CollaborationStatus;
  statusHistory: StatusAuditLog[];
  declineReason?: DeclineReason;
  creatorCounterOffer?: {
    proposedAmount?: number;
    proposedDeadline?: string;
    message: string;
    timestamp: string;
  };
  contractSignoffDate?: string;
  targetDraftDate: string;
  targetPublishDate: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CollaborationFilterOptions {
  status?: CollaborationStatus | 'all';
  briefId?: string | 'all';
  creatorId?: string | 'all';
  search?: string;
  platform?: SocialPlatform | 'all';
}

export interface CollaborationDashboardMetrics {
  totalProjects: number;
  activeProjects: number; // in_progress or submitted or revision_requested
  pendingResponses: number; // sent
  acceptanceRate: number; // accepted / (accepted + declined) percentage
  totalBudgetCommitted: number;
  totalDeliverablesCompleted: number;
  totalDeliverablesPending: number;
}
