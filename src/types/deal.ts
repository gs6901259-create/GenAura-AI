/**
 * GenAura AI — Smart Deal Room Data Types
 * ========================================
 * Formal type contracts for deal negotiations, terms, versions,
 * participants, activities, messages, and state machine.
 */

export type DealStatus =
  | 'draft'
  | 'sent'
  | 'counteroffered'
  | 'accepted'
  | 'declined'
  | 'withdrawn'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type DealRole = 'brand' | 'creator';

export interface DeliverableItem {
  id: string;
  title: string;
  format: string; // e.g., 'Reel', 'Dedicated Video', 'UGC Short', 'Carousel Post', 'Story Pack'
  quantity: number;
  requirements?: string;
}

export interface UsageRights {
  durationDays: number; // e.g. 30, 90, 180, 365, 0 = perpetual
  digitalAdsAllowed: boolean;
  organicWhitelisting: boolean;
  notes?: string;
}

export interface DealTerms {
  budget: number;
  currency: string; // e.g. 'USD', 'EUR', 'GBP'
  deliverables: DeliverableItem[];
  startDate: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD
  revisionAllowance: number; // e.g. 1, 2, 3 revisions, 99 = unlimited
  usageRights: UsageRights;
  notes?: string;
  referenceLinks?: string[];
}

export interface DealVersion {
  versionNumber: number;
  terms: DealTerms;
  proposedByRole: DealRole;
  proposedByName: string;
  proposedAt: string; // ISO 8601
  summaryNotes?: string;
}

export interface DealParticipant {
  id: string;
  role: DealRole;
  name: string;
  handle: string;
  avatarUrl: string;
  email?: string;
}

export type DealActivityType =
  | 'created'
  | 'sent'
  | 'counteroffered'
  | 'accepted'
  | 'declined'
  | 'withdrawn'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'message_added'
  | 'amended';

export interface DealActivity {
  id: string;
  dealId: string;
  timestamp: string; // ISO 8601
  actorRole: DealRole | 'system';
  actorName: string;
  type: DealActivityType;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface DealMessage {
  id: string;
  dealId: string;
  senderRole: DealRole;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string; // ISO 8601
  isPrivate: boolean; // if true, private note visible only to sender's role
  visibleToRole?: DealRole; // 'brand' or 'creator'
}

export interface Deal {
  id: string;
  title: string;
  campaignObjective: string;
  briefId?: string;
  briefTitle?: string;
  brand: DealParticipant;
  creator: DealParticipant;
  currentTerms: DealTerms;
  versions: DealVersion[];
  activeVersionNumber: number;
  status: DealStatus;
  awaitingActionFrom: DealRole | 'none';
  nextRequiredAction: string;
  lastActivityAt: string; // ISO 8601
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  privateNotesBrand?: string;
  privateNotesCreator?: string;
}

export interface DealTermsDiff {
  budgetChanged: boolean;
  oldBudget?: number;
  newBudget?: number;

  deadlineChanged: boolean;
  oldDeadline?: string;
  newDeadline?: string;

  startDateChanged: boolean;
  oldStartDate?: string;
  newStartDate?: string;

  deliverablesChanged: boolean;
  oldDeliverablesSummary?: string;
  newDeliverablesSummary?: string;

  revisionAllowanceChanged: boolean;
  oldRevisions?: number;
  newRevisions?: number;

  usageRightsChanged: boolean;
  oldUsageSummary?: string;
  newUsageSummary?: string;

  notesChanged: boolean;
  hasChanges: boolean;
}

export interface DealFilterOptions {
  status?: DealStatus | 'all';
  search?: string;
  roleView?: 'all' | 'incoming' | 'sent' | 'negotiating' | 'completed' | 'declined';
  sortBy?: 'lastActivity' | 'budgetHigh' | 'budgetLow' | 'deadline' | 'title';
}

export interface DealDashboardMetrics {
  totalDeals: number;
  activeNegotiations: number;
  acceptedOrActive: number;
  completedDeals: number;
  declinedOrWithdrawn: number;
  totalCommittedBudget: number;
}
