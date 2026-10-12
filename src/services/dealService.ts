/**
 * GenAura AI — Smart Deal Room Service
 * =====================================
 * Business logic, state machine validation, side-by-side diffing,
 * role authorization, and reactive persistence for Smart Deal Room.
 */

import {
  Deal,
  DealStatus,
  DealRole,
  DealTerms,
  DealVersion,
  DealActivity,
  DealMessage,
  DealTermsDiff,
  DealFilterOptions,
  DealDashboardMetrics,
} from '@/types/deal';

const STORAGE_KEYS = {
  DEALS: 'genaura_smart_deals_v2',
  ACTIVITIES: 'genaura_deal_activities_v2',
  MESSAGES: 'genaura_deal_messages_v2',
};

// ────────────────────────────────────────────────────────────────────────────
// Allowed State Transitions
// ────────────────────────────────────────────────────────────────────────────
export const ALLOWED_DEAL_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['counteroffered', 'accepted', 'declined', 'withdrawn', 'cancelled'],
  counteroffered: ['sent', 'counteroffered', 'accepted', 'declined', 'withdrawn', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  declined: ['sent'], // Can re-invite with revised terms
  withdrawn: ['draft'], // Sender can revive proposal as draft to edit
  completed: [], // Terminal
  cancelled: ['draft'], // Can restart as draft
};

export function canDealTransition(current: DealStatus, target: DealStatus): boolean {
  if (current === target) return false;
  const allowed = ALLOWED_DEAL_TRANSITIONS[current] || [];
  return allowed.includes(target);
}

export function getAllowedDealTransitions(current: DealStatus): DealStatus[] {
  return ALLOWED_DEAL_TRANSITIONS[current] || [];
}

// ────────────────────────────────────────────────────────────────────────────
// Terms Diff Utility (Side-by-Side Comparison)
// ────────────────────────────────────────────────────────────────────────────
export function diffDealTerms(oldTerms: DealTerms, newTerms: DealTerms): DealTermsDiff {
  const budgetChanged = oldTerms.budget !== newTerms.budget || oldTerms.currency !== newTerms.currency;
  const deadlineChanged = oldTerms.deadline !== newTerms.deadline;
  const startDateChanged = oldTerms.startDate !== newTerms.startDate;

  const oldDelivSummary = oldTerms.deliverables
    .map((d) => `${d.quantity}x ${d.title} (${d.format})`)
    .join(', ');
  const newDelivSummary = newTerms.deliverables
    .map((d) => `${d.quantity}x ${d.title} (${d.format})`)
    .join(', ');
  const deliverablesChanged = oldDelivSummary !== newDelivSummary;

  const revisionAllowanceChanged = oldTerms.revisionAllowance !== newTerms.revisionAllowance;

  const oldUsageSummary = `${oldTerms.usageRights.durationDays === 0 ? 'Perpetual' : `${oldTerms.usageRights.durationDays}d`}, Ads: ${oldTerms.usageRights.digitalAdsAllowed ? 'Yes' : 'No'}, Whitelist: ${oldTerms.usageRights.organicWhitelisting ? 'Yes' : 'No'}`;
  const newUsageSummary = `${newTerms.usageRights.durationDays === 0 ? 'Perpetual' : `${newTerms.usageRights.durationDays}d`}, Ads: ${newTerms.usageRights.digitalAdsAllowed ? 'Yes' : 'No'}, Whitelist: ${newTerms.usageRights.organicWhitelisting ? 'Yes' : 'No'}`;
  const usageRightsChanged = oldUsageSummary !== newUsageSummary;

  const notesChanged = (oldTerms.notes || '').trim() !== (newTerms.notes || '').trim();

  const hasChanges =
    budgetChanged ||
    deadlineChanged ||
    startDateChanged ||
    deliverablesChanged ||
    revisionAllowanceChanged ||
    usageRightsChanged ||
    notesChanged;

  return {
    budgetChanged,
    oldBudget: oldTerms.budget,
    newBudget: newTerms.budget,

    deadlineChanged,
    oldDeadline: oldTerms.deadline,
    newDeadline: newTerms.deadline,

    startDateChanged,
    oldStartDate: oldTerms.startDate,
    newStartDate: newTerms.startDate,

    deliverablesChanged,
    oldDeliverablesSummary: oldDelivSummary,
    newDeliverablesSummary: newDelivSummary,

    revisionAllowanceChanged,
    oldRevisions: oldTerms.revisionAllowance,
    newRevisions: newTerms.revisionAllowance,

    usageRightsChanged,
    oldUsageSummary,
    newUsageSummary,

    notesChanged,
    hasChanges,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Proposal Terms Validation
// ────────────────────────────────────────────────────────────────────────────
export interface ProposalValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateProposalTerms(
  title: string,
  objective: string,
  terms: Partial<DealTerms>
): ProposalValidationResult {
  const errors: Record<string, string> = {};

  if (!title || !title.trim()) {
    errors.title = 'Campaign title is required';
  } else if (title.trim().length < 3) {
    errors.title = 'Campaign title must be at least 3 characters';
  }

  if (!objective || !objective.trim()) {
    errors.objective = 'Campaign objective is required';
  }

  if (terms.budget === undefined || terms.budget === null || isNaN(terms.budget)) {
    errors.budget = 'Proposed budget is required';
  } else if (terms.budget <= 0) {
    errors.budget = 'Budget must be greater than 0';
  }

  if (!terms.startDate) {
    errors.startDate = 'Proposed start date is required';
  }

  if (!terms.deadline) {
    errors.deadline = 'Delivery deadline is required';
  } else if (terms.startDate && terms.deadline && new Date(terms.deadline) <= new Date(terms.startDate)) {
    errors.deadline = 'Delivery deadline must be after start date';
  }

  if (!terms.deliverables || terms.deliverables.length === 0) {
    errors.deliverables = 'At least one deliverable is required';
  } else {
    terms.deliverables.forEach((d, idx) => {
      if (!d.title || !d.title.trim()) {
        errors[`deliverable_${idx}_title`] = 'Deliverable title is required';
      }
      if (!d.quantity || d.quantity <= 0) {
        errors[`deliverable_${idx}_quantity`] = 'Quantity must be at least 1';
      }
    });
  }

  if (terms.revisionAllowance !== undefined && terms.revisionAllowance < 0) {
    errors.revisionAllowance = 'Revision allowance cannot be negative';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Realistic Seed Data
// ────────────────────────────────────────────────────────────────────────────
export const INITIAL_DEALS: Deal[] = [
  {
    id: 'deal-001',
    title: 'Neon Dusk — Luxury Fashion Brand Film',
    campaignObjective: 'Create an ethereal 60-second cinematic film blending AI-generated runway scenes with luxury product closeups for Autumn launch.',
    briefId: 'brief_1',
    briefTitle: 'GenAura Systems AI Product Launch',
    brand: {
      id: 'brand-auraglow',
      role: 'brand',
      name: 'Aura Luxury House',
      handle: '@auraluxury',
      avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=auraluxury',
      email: 'partnerships@auraluxury.com',
    },
    creator: {
      id: 'cr_1',
      role: 'creator',
      name: 'Sarah Jenkins',
      handle: '@sarahj_tech',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      email: 'sarah@creatornetwork.io',
    },
    currentTerms: {
      budget: 5200,
      currency: 'USD',
      deliverables: [
        {
          id: 'del-1',
          title: 'Cinematic 60s Brand Film',
          format: '4K AI Video',
          quantity: 1,
          requirements: 'Gen-3 Alpha / Kling AI with DaVinci grade & sound design',
        },
        {
          id: 'del-2',
          title: 'Behind-the-Scenes Workflow Reel',
          format: 'Vertical Video (9:16)',
          quantity: 2,
          requirements: 'Highlighting prompt architecture & styling process',
        },
        {
          id: 'del-3',
          title: 'High-Res Hero Stills',
          format: 'AI Image (4:5)',
          quantity: 4,
          requirements: 'Editorial magazine quality exports',
        },
      ],
      startDate: '2026-10-15',
      deadline: '2026-11-05',
      revisionAllowance: 3,
      usageRights: {
        durationDays: 180,
        digitalAdsAllowed: true,
        organicWhitelisting: true,
        notes: 'Worldwide digital rights including Meta & YouTube campaigns',
      },
      notes: 'Creator requested +$700 adjustment due to 4K upscaling and 1 additional revision cycle.',
      referenceLinks: ['https://vimeo.com/showcase/cinematic-ai'],
    },
    versions: [
      {
        versionNumber: 1,
        terms: {
          budget: 4500,
          currency: 'USD',
          deliverables: [
            {
              id: 'del-1',
              title: 'Cinematic 60s Brand Film',
              format: '4K AI Video',
              quantity: 1,
              requirements: 'Gen-3 Alpha / Kling AI with DaVinci grade',
            },
            {
              id: 'del-2',
              title: 'Behind-the-Scenes Workflow Reel',
              format: 'Vertical Video (9:16)',
              quantity: 1,
              requirements: 'Highlighting prompt architecture',
            },
            {
              id: 'del-3',
              title: 'High-Res Hero Stills',
              format: 'AI Image (4:5)',
              quantity: 3,
              requirements: 'Editorial exports',
            },
          ],
          startDate: '2026-10-15',
          deadline: '2026-10-31',
          revisionAllowance: 2,
          usageRights: {
            durationDays: 90,
            digitalAdsAllowed: true,
            organicWhitelisting: true,
          },
          notes: 'Initial proposal dispatched by brand.',
        },
        proposedByRole: 'brand',
        proposedByName: 'Aura Luxury House',
        proposedAt: '2026-10-10T14:30:00Z',
        summaryNotes: 'Initial proposal dispatched by brand sponsor.',
      },
      {
        versionNumber: 2,
        terms: {
          budget: 5200,
          currency: 'USD',
          deliverables: [
            {
              id: 'del-1',
              title: 'Cinematic 60s Brand Film',
              format: '4K AI Video',
              quantity: 1,
              requirements: 'Gen-3 Alpha / Kling AI with DaVinci grade & sound design',
            },
            {
              id: 'del-2',
              title: 'Behind-the-Scenes Workflow Reel',
              format: 'Vertical Video (9:16)',
              quantity: 2,
              requirements: 'Highlighting prompt architecture & styling process',
            },
            {
              id: 'del-3',
              title: 'High-Res Hero Stills',
              format: 'AI Image (4:5)',
              quantity: 4,
              requirements: 'Editorial magazine quality exports',
            },
          ],
          startDate: '2026-10-15',
          deadline: '2026-11-05',
          revisionAllowance: 3,
          usageRights: {
            durationDays: 180,
            digitalAdsAllowed: true,
            organicWhitelisting: true,
            notes: 'Worldwide digital rights including Meta & YouTube campaigns',
          },
          notes: 'Creator requested +$700 adjustment due to 4K upscaling and 1 additional revision cycle.',
          referenceLinks: ['https://vimeo.com/showcase/cinematic-ai'],
        },
        proposedByRole: 'creator',
        proposedByName: 'Sarah Jenkins',
        proposedAt: '2026-10-11T16:15:00Z',
        summaryNotes: 'Counteroffer: increased budget to $5,200, extended deadline to Nov 5, added BTS reel and extra revision.',
      },
    ],
    activeVersionNumber: 2,
    status: 'counteroffered',
    awaitingActionFrom: 'brand',
    nextRequiredAction: 'Brand to review counteroffer v2 (Accept, Decline, or Submit Revised Terms)',
    lastActivityAt: '2026-10-11T16:15:00Z',
    createdAt: '2026-10-10T14:30:00Z',
    updatedAt: '2026-10-11T16:15:00Z',
    privateNotesBrand: 'Sarah has 4.2% engagement and great cinematic examples. Willing to accept $5,200 if Nov 5 is hard deadline.',
    privateNotesCreator: 'Render costs on Gen-3 Alpha are high; $5,200 is my bottom line for 4K.',
  },
  {
    id: 'deal-002',
    title: 'AuraGlow Skincare Ad Creative Pack',
    campaignObjective: 'Batch create high-converting product visualization and UGC ad creatives for Meta & TikTok campaigns.',
    brand: {
      id: 'brand-genaura',
      role: 'brand',
      name: 'GenAura Cosmetics',
      handle: '@genaurabeauty',
      avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=genaurabeauty',
      email: 'campaigns@genaurabeauty.com',
    },
    creator: {
      id: 'cr_2',
      role: 'creator',
      name: 'Marcus Vance',
      handle: '@marcusv_design',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      email: 'marcus@visualad.com',
    },
    currentTerms: {
      budget: 3200,
      currency: 'USD',
      deliverables: [
        {
          id: 'del-201',
          title: 'E-commerce Hero Product Visuals',
          format: 'AI Image (1:1 & 4:5)',
          quantity: 6,
          requirements: 'Midjourney v6 + Photoshop clean composites',
        },
        {
          id: 'del-202',
          title: 'Motion Hook Ad Snippets (6s)',
          format: 'Short Video (9:16)',
          quantity: 3,
          requirements: 'Fast-paced text overlays with product render',
        },
      ],
      startDate: '2026-10-18',
      deadline: '2026-11-02',
      revisionAllowance: 2,
      usageRights: {
        durationDays: 90,
        digitalAdsAllowed: true,
        organicWhitelisting: true,
      },
      notes: 'Brand assets and product 3D CAD files will be shared upon deal confirmation.',
    },
    versions: [
      {
        versionNumber: 1,
        terms: {
          budget: 3200,
          currency: 'USD',
          deliverables: [
            {
              id: 'del-201',
              title: 'E-commerce Hero Product Visuals',
              format: 'AI Image (1:1 & 4:5)',
              quantity: 6,
              requirements: 'Midjourney v6 + Photoshop clean composites',
            },
            {
              id: 'del-202',
              title: 'Motion Hook Ad Snippets (6s)',
              format: 'Short Video (9:16)',
              quantity: 3,
              requirements: 'Fast-paced text overlays with product render',
            },
          ],
          startDate: '2026-10-18',
          deadline: '2026-11-02',
          revisionAllowance: 2,
          usageRights: {
            durationDays: 90,
            digitalAdsAllowed: true,
            organicWhitelisting: true,
          },
          notes: 'Brand assets and product 3D CAD files will be shared upon deal confirmation.',
        },
        proposedByRole: 'brand',
        proposedByName: 'GenAura Cosmetics',
        proposedAt: '2026-10-12T09:00:00Z',
        summaryNotes: 'Proposal dispatched to creator.',
      },
    ],
    activeVersionNumber: 1,
    status: 'sent',
    awaitingActionFrom: 'creator',
    nextRequiredAction: 'Creator to review proposal (Accept, Decline, or Counteroffer)',
    lastActivityAt: '2026-10-12T09:00:00Z',
    createdAt: '2026-10-12T09:00:00Z',
    updatedAt: '2026-10-12T09:00:00Z',
    privateNotesBrand: 'Target launch date is mid-November. Need fast turnaround on draft 1.',
  },
  {
    id: 'deal-003',
    title: 'Sakura Loop — Animated Game Teaser',
    campaignObjective: 'Create a 15-second looping anime character animation for our upcoming sci-fi game announcement.',
    brand: {
      id: 'brand-pixelcraft',
      role: 'brand',
      name: 'PixelCraft Games',
      handle: '@pixelcraft',
      avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=pixelcraft',
      email: 'marketing@pixelcraft.gg',
    },
    creator: {
      id: 'cr_3',
      role: 'creator',
      name: 'Elena Rostova',
      handle: '@elena_motion',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      email: 'elena@motioncreatives.net',
    },
    currentTerms: {
      budget: 2800,
      currency: 'USD',
      deliverables: [
        {
          id: 'del-301',
          title: 'Looping Character Teaser',
          format: '2D Animated Loop (16:9)',
          quantity: 1,
          requirements: 'AnimateDiff + After Effects seamless loop with ambient sound',
        },
        {
          id: 'del-302',
          title: 'Vertical Story Crop',
          format: 'Vertical Video (9:16)',
          quantity: 1,
        },
      ],
      startDate: '2026-10-14',
      deadline: '2026-10-28',
      revisionAllowance: 2,
      usageRights: {
        durationDays: 365,
        digitalAdsAllowed: true,
        organicWhitelisting: true,
      },
      notes: 'Final terms agreed by both parties. Production scheduled to start.',
    },
    versions: [
      {
        versionNumber: 1,
        terms: {
          budget: 2800,
          currency: 'USD',
          deliverables: [
            {
              id: 'del-301',
              title: 'Looping Character Teaser',
              format: '2D Animated Loop (16:9)',
              quantity: 1,
              requirements: 'AnimateDiff + After Effects seamless loop with ambient sound',
            },
            {
              id: 'del-302',
              title: 'Vertical Story Crop',
              format: 'Vertical Video (9:16)',
              quantity: 1,
            },
          ],
          startDate: '2026-10-14',
          deadline: '2026-10-28',
          revisionAllowance: 2,
          usageRights: {
            durationDays: 365,
            digitalAdsAllowed: true,
            organicWhitelisting: true,
          },
        },
        proposedByRole: 'brand',
        proposedByName: 'PixelCraft Games',
        proposedAt: '2026-10-08T11:00:00Z',
      },
    ],
    activeVersionNumber: 1,
    status: 'accepted',
    awaitingActionFrom: 'brand',
    nextRequiredAction: 'Brand to initiate project kick-off (Start Production)',
    lastActivityAt: '2026-10-09T14:20:00Z',
    createdAt: '2026-10-08T11:00:00Z',
    updatedAt: '2026-10-09T14:20:00Z',
  },
  {
    id: 'deal-004',
    title: 'ARC Headphones 3D Product Visualization',
    campaignObjective: 'Photorealistic product hero renders and 360-degree turntable animation for pre-order launch.',
    brand: {
      id: 'brand-soundaura',
      role: 'brand',
      name: 'SoundAura Audio',
      handle: '@soundaura',
      avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=soundaura',
      email: 'press@soundaura.com',
    },
    creator: {
      id: 'cr_4',
      role: 'creator',
      name: 'David Chen',
      handle: '@davidc_photo',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      email: 'david@renderlab.de',
    },
    currentTerms: {
      budget: 4200,
      currency: 'USD',
      deliverables: [
        {
          id: 'del-401',
          title: 'Hero 3D Lighting Stills',
          format: 'Render (16:9 & 1:1)',
          quantity: 5,
        },
        {
          id: 'del-402',
          title: '360 Turntable Video',
          format: '4K MP4 (60fps)',
          quantity: 1,
        },
      ],
      startDate: '2026-10-01',
      deadline: '2026-10-25',
      revisionAllowance: 2,
      usageRights: {
        durationDays: 0, // perpetual
        digitalAdsAllowed: true,
        organicWhitelisting: true,
      },
      notes: 'Production in progress. Milestone 1 drafts submitted.',
    },
    versions: [
      {
        versionNumber: 1,
        terms: {
          budget: 4200,
          currency: 'USD',
          deliverables: [
            {
              id: 'del-401',
              title: 'Hero 3D Lighting Stills',
              format: 'Render (16:9 & 1:1)',
              quantity: 5,
            },
            {
              id: 'del-402',
              title: '360 Turntable Video',
              format: '4K MP4 (60fps)',
              quantity: 1,
            },
          ],
          startDate: '2026-10-01',
          deadline: '2026-10-25',
          revisionAllowance: 2,
          usageRights: {
            durationDays: 0,
            digitalAdsAllowed: true,
            organicWhitelisting: true,
          },
        },
        proposedByRole: 'brand',
        proposedByName: 'SoundAura Audio',
        proposedAt: '2026-09-29T10:00:00Z',
      },
    ],
    activeVersionNumber: 1,
    status: 'in_progress',
    awaitingActionFrom: 'creator',
    nextRequiredAction: 'Creator to submit final deliverables for review',
    lastActivityAt: '2026-10-05T12:00:00Z',
    createdAt: '2026-09-29T10:00:00Z',
    updatedAt: '2026-10-05T12:00:00Z',
  },
  {
    id: 'deal-005',
    title: 'Velvet Season — Autumn Editorial Campaign',
    campaignObjective: '4-image editorial spread showcasing autumn seasonal tones and styling.',
    brand: {
      id: 'brand-vogueai',
      role: 'brand',
      name: 'VogueAI Collective',
      handle: '@vogueai',
      avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=vogueai',
      email: 'editor@vogueai.fr',
    },
    creator: {
      id: 'cr_5',
      role: 'creator',
      name: 'Amina Diallo',
      handle: '@amina_writes',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      email: 'amina@artfashion.fr',
    },
    currentTerms: {
      budget: 3600,
      currency: 'USD',
      deliverables: [
        {
          id: 'del-501',
          title: 'Editorial Spread Images',
          format: 'AI Image (3:4)',
          quantity: 4,
        },
      ],
      startDate: '2026-09-15',
      deadline: '2026-09-30',
      revisionAllowance: 2,
      usageRights: {
        durationDays: 365,
        digitalAdsAllowed: true,
        organicWhitelisting: true,
      },
      notes: 'Deal completed and verified on September 30, 2026.',
    },
    versions: [
      {
        versionNumber: 1,
        terms: {
          budget: 3600,
          currency: 'USD',
          deliverables: [
            {
              id: 'del-501',
              title: 'Editorial Spread Images',
              format: 'AI Image (3:4)',
              quantity: 4,
            },
          ],
          startDate: '2026-09-15',
          deadline: '2026-09-30',
          revisionAllowance: 2,
          usageRights: {
            durationDays: 365,
            digitalAdsAllowed: true,
            organicWhitelisting: true,
          },
        },
        proposedByRole: 'brand',
        proposedByName: 'VogueAI Collective',
        proposedAt: '2026-09-12T08:00:00Z',
      },
    ],
    activeVersionNumber: 1,
    status: 'completed',
    awaitingActionFrom: 'none',
    nextRequiredAction: 'All deliverables approved & verified; deal archived.',
    lastActivityAt: '2026-09-30T17:00:00Z',
    createdAt: '2026-09-12T08:00:00Z',
    updatedAt: '2026-09-30T17:00:00Z',
  },
];

export const INITIAL_ACTIVITIES: DealActivity[] = [
  {
    id: 'act-001-1',
    dealId: 'deal-001',
    timestamp: '2026-10-10T14:30:00Z',
    actorRole: 'brand',
    actorName: 'Aura Luxury House',
    type: 'sent',
    description: 'Sent initial collaboration proposal (Version 1) with budget $4,500.',
  },
  {
    id: 'act-001-2',
    dealId: 'deal-001',
    timestamp: '2026-10-11T16:15:00Z',
    actorRole: 'creator',
    actorName: 'Sarah Jenkins',
    type: 'counteroffered',
    description: 'Submitted Counteroffer (Version 2) requesting $5,200, Nov 5 deadline, and 1 extra revision.',
    metadata: { version: 2 },
  },
  {
    id: 'act-002-1',
    dealId: 'deal-002',
    timestamp: '2026-10-12T09:00:00Z',
    actorRole: 'brand',
    actorName: 'GenAura Cosmetics',
    type: 'sent',
    description: 'Dispatched initial proposal with $3,200 budget for 9 deliverables.',
  },
  {
    id: 'act-003-1',
    dealId: 'deal-003',
    timestamp: '2026-10-08T11:00:00Z',
    actorRole: 'brand',
    actorName: 'PixelCraft Games',
    type: 'sent',
    description: 'Sent proposal for animated game teaser.',
  },
  {
    id: 'act-003-2',
    dealId: 'deal-003',
    timestamp: '2026-10-09T14:20:00Z',
    actorRole: 'creator',
    actorName: 'Elena Rostova',
    type: 'accepted',
    description: 'Accepted campaign terms and signed collaboration agreement.',
  },
];

export const INITIAL_MESSAGES: DealMessage[] = [
  {
    id: 'msg-001-1',
    dealId: 'deal-001',
    senderRole: 'brand',
    senderName: 'Aura Luxury House',
    senderAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=auraluxury',
    content: "Hi Sarah! We loved your recent cinematic film. We'd love to partner on our Autumn luxury launch.",
    timestamp: '2026-10-10T14:32:00Z',
    isPrivate: false,
  },
  {
    id: 'msg-001-2',
    dealId: 'deal-001',
    senderRole: 'creator',
    senderName: 'Sarah Jenkins',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    content: "Thank you! I'm very excited about this concept. I've submitted a counteroffer adjusting for 4K upscale pipelines and added an extra BTS reel to give your team more organic content.",
    timestamp: '2026-10-11T16:16:00Z',
    isPrivate: false,
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Deal Service Class
// ────────────────────────────────────────────────────────────────────────────
class DealService {
  private listeners: Set<() => void> = new Set();
  private inFlightSubmissions: Set<string> = new Set();

  constructor() {
    this.ensureInitialized();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', () => this.notify());
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(): void {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('DealService listener error:', err);
      }
    });
  }

  private getItem<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.notify();
    } catch (err) {
      console.error(`Failed to save to localStorage key "${key}":`, err);
    }
  }

  public ensureInitialized(): void {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(STORAGE_KEYS.DEALS)) {
      this.setItem(STORAGE_KEYS.DEALS, INITIAL_DEALS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
      this.setItem(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
      this.setItem(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    }
  }

  public resetToSeed(): void {
    if (typeof window === 'undefined') return;
    this.setItem(STORAGE_KEYS.DEALS, INITIAL_DEALS);
    this.setItem(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
    this.setItem(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
  }

  // ── Queries ──

  public getDeals(filters?: DealFilterOptions, viewerRole?: DealRole): Deal[] {
    let deals = this.getItem<Deal[]>(STORAGE_KEYS.DEALS, INITIAL_DEALS);

    if (!filters) return deals;

    if (filters.status && filters.status !== 'all') {
      deals = deals.filter((d) => d.status === filters.status);
    }

    if (filters.roleView && filters.roleView !== 'all') {
      switch (filters.roleView) {
        case 'incoming':
          deals = deals.filter((d) =>
            viewerRole === 'creator'
              ? d.awaitingActionFrom === 'creator'
              : d.awaitingActionFrom === 'brand'
          );
          break;
        case 'sent':
          deals = deals.filter((d) =>
            viewerRole === 'creator'
              ? d.awaitingActionFrom === 'brand'
              : d.awaitingActionFrom === 'creator'
          );
          break;
        case 'negotiating':
          deals = deals.filter((d) => d.status === 'sent' || d.status === 'counteroffered');
          break;
        case 'completed':
          deals = deals.filter((d) => d.status === 'completed');
          break;
        case 'declined':
          deals = deals.filter((d) => d.status === 'declined' || d.status === 'withdrawn' || d.status === 'cancelled');
          break;
      }
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      deals = deals.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.campaignObjective.toLowerCase().includes(q) ||
          d.brand.name.toLowerCase().includes(q) ||
          d.creator.name.toLowerCase().includes(q) ||
          d.brand.handle.toLowerCase().includes(q) ||
          d.creator.handle.toLowerCase().includes(q)
      );
    }

    if (filters.sortBy) {
      deals = [...deals].sort((a, b) => {
        switch (filters.sortBy) {
          case 'budgetHigh':
            return b.currentTerms.budget - a.currentTerms.budget;
          case 'budgetLow':
            return a.currentTerms.budget - b.currentTerms.budget;
          case 'deadline':
            return new Date(a.currentTerms.deadline).getTime() - new Date(b.currentTerms.deadline).getTime();
          case 'title':
            return a.title.localeCompare(b.title);
          case 'lastActivity':
          default:
            return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
        }
      });
    }

    return deals;
  }

  public getDealById(id: string): Deal | undefined {
    return this.getDeals().find((d) => d.id === id);
  }

  public saveDeal(deal: Deal): void {
    const deals = this.getDeals();
    const idx = deals.findIndex((d) => d.id === deal.id);
    if (idx >= 0) {
      deals[idx] = { ...deal, updatedAt: new Date().toISOString() };
    } else {
      deals.unshift(deal);
    }
    this.setItem(STORAGE_KEYS.DEALS, deals);
  }

  public getActivities(dealId: string): DealActivity[] {
    const acts = this.getItem<DealActivity[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
    return acts
      .filter((a) => a.dealId === dealId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public addActivity(
    dealId: string,
    actorRole: DealRole | 'system',
    actorName: string,
    type: DealActivity['type'],
    description: string,
    metadata?: Record<string, unknown>
  ): DealActivity {
    const acts = this.getItem<DealActivity[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
    const newAct: DealActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dealId,
      timestamp: new Date().toISOString(),
      actorRole,
      actorName,
      type,
      description,
      metadata,
    };
    acts.unshift(newAct);
    this.setItem(STORAGE_KEYS.ACTIVITIES, acts);
    return newAct;
  }

  public getMessages(dealId: string, viewerRole?: DealRole): DealMessage[] {
    const msgs = this.getItem<DealMessage[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    return msgs
      .filter((m) => {
        if (m.dealId !== dealId) return false;
        // Strict privacy check: private notes are only visible to the role that created them
        if (m.isPrivate) {
          if (!viewerRole) return false;
          return m.visibleToRole === viewerRole;
        }
        return true;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public addMessage(
    dealId: string,
    senderRole: DealRole,
    senderName: string,
    content: string,
    isPrivate = false,
    senderAvatar?: string
  ): DealMessage {
    const msgs = this.getItem<DealMessage[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    const newMsg: DealMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dealId,
      senderRole,
      senderName,
      senderAvatar,
      content,
      timestamp: new Date().toISOString(),
      isPrivate,
      visibleToRole: isPrivate ? senderRole : undefined,
    };
    msgs.push(newMsg);
    this.setItem(STORAGE_KEYS.MESSAGES, msgs);

    if (!isPrivate) {
      this.addActivity(
        dealId,
        senderRole,
        senderName,
        'message_added',
        `${senderName} (${senderRole}) added a message in Deal Room chat.`
      );
    }

    return newMsg;
  }

  public updatePrivateNotes(dealId: string, role: DealRole, notes: string): void {
    const deal = this.getDealById(dealId);
    if (!deal) return;
    if (role === 'brand') {
      deal.privateNotesBrand = notes;
    } else {
      deal.privateNotesCreator = notes;
    }
    this.saveDeal(deal);
  }

  // ── Actions & State Machine Transitions ──

  /**
   * Create a new Proposal (as draft or directly sent)
   */
  public createProposal(params: {
    title: string;
    campaignObjective: string;
    briefId?: string;
    briefTitle?: string;
    brand: Deal['brand'];
    creator: Deal['creator'];
    terms: DealTerms;
    asDraft?: boolean;
    senderRole?: DealRole;
    senderName?: string;
  }): { success: boolean; deal?: Deal; error?: string } {
    const lockKey = `create_${params.title}_${params.creator.id}`;
    if (this.inFlightSubmissions.has(lockKey)) {
      return { success: false, error: 'A submission is currently in progress. Please wait.' };
    }
    this.inFlightSubmissions.add(lockKey);

    try {
      const validation = validateProposalTerms(params.title, params.campaignObjective, params.terms);
      if (!validation.isValid) {
        return {
          success: false,
          error: Object.values(validation.errors)[0] || 'Invalid proposal terms',
        };
      }

      const dealId = `deal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();
      const status: DealStatus = params.asDraft ? 'draft' : 'sent';
      const awaitingActionFrom: DealRole | 'none' = params.asDraft ? 'none' : 'creator';
      const nextRequiredAction = params.asDraft
        ? 'Brand to finalize and send proposal'
        : `Creator (${params.creator.name}) to review proposal (Accept, Decline, or Counteroffer)`;

      const versionOne: DealVersion = {
        versionNumber: 1,
        terms: params.terms,
        proposedByRole: params.senderRole || 'brand',
        proposedByName: params.senderName || params.brand.name,
        proposedAt: now,
        summaryNotes: params.asDraft ? 'Draft proposal initialized.' : 'Initial proposal dispatched.',
      };

      const newDeal: Deal = {
        id: dealId,
        title: params.title.trim(),
        campaignObjective: params.campaignObjective.trim(),
        briefId: params.briefId,
        briefTitle: params.briefTitle,
        brand: params.brand,
        creator: params.creator,
        currentTerms: params.terms,
        versions: [versionOne],
        activeVersionNumber: 1,
        status,
        awaitingActionFrom,
        nextRequiredAction,
        lastActivityAt: now,
        createdAt: now,
        updatedAt: now,
      };

      this.saveDeal(newDeal);

      this.addActivity(
        dealId,
        params.senderRole || 'brand',
        params.senderName || params.brand.name,
        params.asDraft ? 'created' : 'sent',
        params.asDraft
          ? `Created draft proposal for ${params.creator.name}.`
          : `Sent proposal to ${params.creator.name} with budget $${params.terms.budget.toLocaleString()}.`
      );

      return { success: true, deal: newDeal };
    } finally {
      this.inFlightSubmissions.delete(lockKey);
    }
  }

  /**
   * Submit a Counteroffer
   */
  public submitCounteroffer(params: {
    dealId: string;
    proposedTerms: DealTerms;
    counterByRole: DealRole;
    counterByName: string;
    summaryNotes?: string;
  }): { success: boolean; deal?: Deal; error?: string } {
    const lockKey = `counter_${params.dealId}`;
    if (this.inFlightSubmissions.has(lockKey)) {
      return { success: false, error: 'Counteroffer is already submitting. Please wait.' };
    }
    this.inFlightSubmissions.add(lockKey);

    try {
      const deal = this.getDealById(params.dealId);
      if (!deal) return { success: false, error: 'Deal not found' };

      // State machine validation
      if (!canDealTransition(deal.status, 'counteroffered')) {
        return {
          success: false,
          error: `Cannot counteroffer a deal in status "${deal.status}".`,
        };
      }

      // Authorization check: participant must be the one whose turn it is
      if (deal.awaitingActionFrom !== params.counterByRole) {
        return {
          success: false,
          error: `It is currently not ${params.counterByRole}'s turn to respond to this deal.`,
        };
      }

      // Validate changed terms
      const validation = validateProposalTerms(deal.title, deal.campaignObjective, params.proposedTerms);
      if (!validation.isValid) {
        return {
          success: false,
          error: Object.values(validation.errors)[0] || 'Invalid counteroffer terms',
        };
      }

      // Ensure terms actually changed
      const diff = diffDealTerms(deal.currentTerms, params.proposedTerms);
      if (!diff.hasChanges) {
        return {
          success: false,
          error: 'No terms were changed. A counteroffer must modify at least one commercial term.',
        };
      }

      const now = new Date().toISOString();
      const nextVersionNum = deal.versions.length + 1;
      const nextAwaiting: DealRole = params.counterByRole === 'brand' ? 'creator' : 'brand';
      const targetParty = nextAwaiting === 'brand' ? deal.brand.name : deal.creator.name;

      const newVersion: DealVersion = {
        versionNumber: nextVersionNum,
        terms: params.proposedTerms,
        proposedByRole: params.counterByRole,
        proposedByName: params.counterByName,
        proposedAt: now,
        summaryNotes: params.summaryNotes || `Counteroffer Version ${nextVersionNum} submitted by ${params.counterByName}.`,
      };

      const updatedDeal: Deal = {
        ...deal,
        currentTerms: params.proposedTerms,
        versions: [...deal.versions, newVersion],
        activeVersionNumber: nextVersionNum,
        status: 'counteroffered',
        awaitingActionFrom: nextAwaiting,
        nextRequiredAction: `${targetParty} to review Counteroffer Version ${nextVersionNum} (Accept, Decline, or Submit Revised Terms)`,
        lastActivityAt: now,
        updatedAt: now,
      };

      this.saveDeal(updatedDeal);

      this.addActivity(
        deal.id,
        params.counterByRole,
        params.counterByName,
        'counteroffered',
        `Submitted Counteroffer Version ${nextVersionNum} with budget $${params.proposedTerms.budget.toLocaleString()}.`,
        { version: nextVersionNum }
      );

      return { success: true, deal: updatedDeal };
    } finally {
      this.inFlightSubmissions.delete(lockKey);
    }
  }

  /**
   * Accept a Deal
   */
  public acceptDeal(params: {
    dealId: string;
    acceptedByRole: DealRole;
    acceptedByName: string;
    note?: string;
  }): { success: boolean; deal?: Deal; error?: string } {
    const deal = this.getDealById(params.dealId);
    if (!deal) return { success: false, error: 'Deal not found' };

    if (!canDealTransition(deal.status, 'accepted')) {
      return {
        success: false,
        error: `Cannot accept a deal in status "${deal.status}".`,
      };
    }

    if (deal.awaitingActionFrom !== params.acceptedByRole) {
      return {
        success: false,
        error: 'You cannot accept your own offer; awaiting the other party to respond.',
      };
    }

    const now = new Date().toISOString();
    const updatedDeal: Deal = {
      ...deal,
      status: 'accepted',
      awaitingActionFrom: 'brand', // Brand initiates kick-off
      nextRequiredAction: 'Terms agreed! Brand to kick off production (Start Deal).',
      lastActivityAt: now,
      updatedAt: now,
    };

    this.saveDeal(updatedDeal);

    this.addActivity(
      deal.id,
      params.acceptedByRole,
      params.acceptedByName,
      'accepted',
      `Accepted deal terms (Version ${deal.activeVersionNumber}) of $${deal.currentTerms.budget.toLocaleString()}. Agreement confirmed.`
    );

    return { success: true, deal: updatedDeal };
  }

  /**
   * Decline a Deal
   */
  public declineDeal(params: {
    dealId: string;
    declinedByRole: DealRole;
    declinedByName: string;
    reason?: string;
  }): { success: boolean; deal?: Deal; error?: string } {
    const deal = this.getDealById(params.dealId);
    if (!deal) return { success: false, error: 'Deal not found' };

    if (!canDealTransition(deal.status, 'declined')) {
      return {
        success: false,
        error: `Cannot decline a deal in status "${deal.status}".`,
      };
    }

    if (deal.awaitingActionFrom !== params.declinedByRole) {
      return {
        success: false,
        error: 'Only the party awaiting action can decline this proposal.',
      };
    }

    const now = new Date().toISOString();
    const updatedDeal: Deal = {
      ...deal,
      status: 'declined',
      awaitingActionFrom: 'none',
      nextRequiredAction: 'Deal declined. Proposal closed.',
      lastActivityAt: now,
      updatedAt: now,
    };

    this.saveDeal(updatedDeal);

    this.addActivity(
      deal.id,
      params.declinedByRole,
      params.declinedByName,
      'declined',
      `Declined proposal. ${params.reason ? `Reason: ${params.reason}` : ''}`
    );

    return { success: true, deal: updatedDeal };
  }

  /**
   * Withdraw a Proposal (sender withdraws before acceptance)
   */
  public withdrawDeal(params: {
    dealId: string;
    withdrawnByRole: DealRole;
    withdrawnByName: string;
    reason?: string;
  }): { success: boolean; deal?: Deal; error?: string } {
    const deal = this.getDealById(params.dealId);
    if (!deal) return { success: false, error: 'Deal not found' };

    if (!canDealTransition(deal.status, 'withdrawn')) {
      return {
        success: false,
        error: `Cannot withdraw a deal in status "${deal.status}". Accepted deals cannot be withdrawn.`,
      };
    }

    // Only the party who proposed the currently active version can withdraw it
    const activeVersion = deal.versions[deal.versions.length - 1];
    if (activeVersion && activeVersion.proposedByRole !== params.withdrawnByRole) {
      return {
        success: false,
        error: 'Only the proposing party can withdraw an active offer.',
      };
    }

    const now = new Date().toISOString();
    const updatedDeal: Deal = {
      ...deal,
      status: 'withdrawn',
      awaitingActionFrom: 'none',
      nextRequiredAction: 'Proposal withdrawn by sender.',
      lastActivityAt: now,
      updatedAt: now,
    };

    this.saveDeal(updatedDeal);

    this.addActivity(
      deal.id,
      params.withdrawnByRole,
      params.withdrawnByName,
      'withdrawn',
      `Withdrew proposal. ${params.reason ? `Reason: ${params.reason}` : ''}`
    );

    return { success: true, deal: updatedDeal };
  }

  /**
   * Start Production (accepted -> in_progress)
   */
  public startDeal(params: {
    dealId: string;
    startedByName: string;
    startedByRole: DealRole;
  }): { success: boolean; deal?: Deal; error?: string } {
    const deal = this.getDealById(params.dealId);
    if (!deal) return { success: false, error: 'Deal not found' };

    if (!canDealTransition(deal.status, 'in_progress')) {
      return {
        success: false,
        error: `Cannot start deal from status "${deal.status}". Must be "accepted" first.`,
      };
    }

    const now = new Date().toISOString();
    const updatedDeal: Deal = {
      ...deal,
      status: 'in_progress',
      awaitingActionFrom: 'creator',
      nextRequiredAction: 'Creator is producing deliverables according to agreed terms.',
      lastActivityAt: now,
      updatedAt: now,
    };

    this.saveDeal(updatedDeal);

    this.addActivity(
      deal.id,
      params.startedByRole,
      params.startedByName,
      'in_progress',
      `Kick-off confirmed. Deal moved to In Progress. Creator producing deliverables.`
    );

    return { success: true, deal: updatedDeal };
  }

  /**
   * Complete Deal (in_progress -> completed)
   */
  public completeDeal(params: {
    dealId: string;
    completedByName: string;
    completedByRole: DealRole;
    verificationNotes?: string;
  }): { success: boolean; deal?: Deal; error?: string } {
    const deal = this.getDealById(params.dealId);
    if (!deal) return { success: false, error: 'Deal not found' };

    if (!canDealTransition(deal.status, 'completed')) {
      return {
        success: false,
        error: `Cannot complete deal from status "${deal.status}". Must be "in_progress" first.`,
      };
    }

    const now = new Date().toISOString();
    const updatedDeal: Deal = {
      ...deal,
      status: 'completed',
      awaitingActionFrom: 'none',
      nextRequiredAction: 'All deliverables approved & verified; deal archived.',
      lastActivityAt: now,
      updatedAt: now,
    };

    this.saveDeal(updatedDeal);

    this.addActivity(
      deal.id,
      params.completedByRole,
      params.completedByName,
      'completed',
      `Deal completed & approved! ${params.verificationNotes || 'All deliverables verified.'}`
    );

    return { success: true, deal: updatedDeal };
  }

  /**
   * Metrics calculation
   */
  public getMetrics(): DealDashboardMetrics {
    const deals = this.getDeals();
    const activeNegotiations = deals.filter(
      (d) => d.status === 'sent' || d.status === 'counteroffered'
    ).length;
    const acceptedOrActive = deals.filter(
      (d) => d.status === 'accepted' || d.status === 'in_progress'
    ).length;
    const completedDeals = deals.filter((d) => d.status === 'completed').length;
    const declinedOrWithdrawn = deals.filter(
      (d) => d.status === 'declined' || d.status === 'withdrawn' || d.status === 'cancelled'
    ).length;
    const totalCommittedBudget = deals
      .filter((d) => ['accepted', 'in_progress', 'completed'].includes(d.status))
      .reduce((sum, d) => sum + d.currentTerms.budget, 0);

    return {
      totalDeals: deals.length,
      activeNegotiations,
      acceptedOrActive,
      completedDeals,
      declinedOrWithdrawn,
      totalCommittedBudget,
    };
  }
}

export const dealService = new DealService();
