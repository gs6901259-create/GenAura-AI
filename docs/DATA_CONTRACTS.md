# GenAura AI — Data Contracts Specification

This document details the cross-module data contracts coordinated between **Collaboration Workflows**, **Discovery Owner**, and **Campaign Lead (BriefGen)**.

---

## 1. Discovery Owner Contract (`src/contracts/discoveryContract.ts`)

Owned by the **Discovery Engine**. Collaboration workflows consume creator profiles and vetted shortlists to initiate outreach.

### `CreatorProfile`
Represents an individual content creator analyzed and vetted by Discovery.

```typescript
export type SocialPlatform = 'youtube' | 'instagram' | 'tiktok' | 'twitter';
export type CreatorTier = 'nano' | 'micro' | 'mid' | 'macro' | 'celebrity';

export interface PlatformMetric {
  platform: SocialPlatform;
  handle: string;
  followers: number;
  engagementRate: number; // e.g. 5.4 for 5.4%
  avgViews?: number;
  profileUrl: string;
}

export interface CreatorProfile {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  bio: string;
  niche: string[];
  location: string;
  verified: boolean;
  tier: CreatorTier;
  primaryPlatform: SocialPlatform;
  platforms: PlatformMetric[];
  baseRateUSD: number;
  contentQualityScore: number; // 0 - 100
  brandSafetyScore: number;    // 0 - 100
  audienceMatchScore: number;  // 0 - 100
  email?: string;
}
```

### `Shortlist`
Curated collection of vetted creators grouped for a campaign or target demographic.

```typescript
export interface Shortlist {
  id: string;
  name: string;
  description: string;
  campaignTarget?: string;
  creatorIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status: 'active' | 'archived';
}
```

### Discovery Service Interface
```typescript
export interface IDiscoveryService {
  getShortlists(): Promise<Shortlist[]>;
  getShortlistById(id: string): Promise<Shortlist | null>;
  getCreators(creatorIds?: string[]): Promise<CreatorProfile[]>;
  getCreatorById(id: string): Promise<CreatorProfile | null>;
}
```

---

## 2. Campaign Lead Contract (`src/contracts/briefContract.ts`)

Owned by the **Campaign Lead / BriefGen Module**. Collaboration project requests link directly to a validated Campaign Brief.

### `CampaignBrief`
```typescript
export interface BriefDeliverableTemplate {
  id: string;
  title: string;
  platform: SocialPlatform;
  format: string; // e.g. "Dedicated Video", "Reel / TikTok Short"
  quantity: number;
  guidelines: string;
  dueDateOffsetDays: number;
}

export interface CampaignBrief {
  id: string;
  title: string;
  brandName: string;
  brandLogoUrl: string;
  campaignType: 'product_launch' | 'brand_awareness' | 'conversion' | 'event_coverage';
  objectives: string;
  targetAudience: string;
  keyMessages: string[];
  dos: string[];
  donts: string[];
  budgetTotal: number;
  currency: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'published' | 'archived';
  standardDeliverables: BriefDeliverableTemplate[];
  usageRightsDefault: {
    durationDays: number;
    digitalAdsAllowed: boolean;
    exclusivityCategory?: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

---

## 3. Collaboration Workflows Contract (`src/contracts/collaborationContract.ts`)

Owned by the **Collaboration Workflows Module**. Coordinates project requests, status state machines, deliverable approvals, and audit trails.

### Status State Machine
```typescript
export type CollaborationStatus =
  | 'draft'               // Brand is preparing the project request
  | 'sent'                // Dispatched to creator, waiting for creator decision
  | 'accepted'            // Creator accepted the terms and linked brief
  | 'declined'            // Creator declined (reason attached)
  | 'in_progress'         // Deliverables being drafted/produced
  | 'submitted'           // Content submitted for review
  | 'revision_requested'  // Brand requested changes
  | 'completed'           // All deliverables approved & verified, project closed
  | 'cancelled';          // Terminated by brand
```

### Transition Matrix
- `draft` → `sent` | `cancelled`
- `sent` → `accepted` | `declined` | `cancelled`
- `accepted` → `in_progress` | `cancelled`
- `in_progress` → `submitted` | `cancelled`
- `submitted` → `revision_requested` | `completed` | `in_progress`
- `revision_requested` → `submitted` | `cancelled`
- `declined` → `sent` (can re-invite with adjusted terms) | `cancelled`
- `completed` → (terminal)
- `cancelled` → `draft` (can revive if necessary)

### Decline Categories
```typescript
export type DeclineCategory =
  | 'schedule_conflict'
  | 'rate_mismatch'
  | 'brand_mismatch'
  | 'exclusivity_conflict'
  | 'creative_differences'
  | 'other';
```

### Audit Trail Log
```typescript
export interface StatusAuditLog {
  id: string;
  fromStatus: CollaborationStatus | null;
  toStatus: CollaborationStatus;
  timestamp: string;
  actorRole: 'brand' | 'creator' | 'system';
  actorName: string;
  note: string;
}
```
