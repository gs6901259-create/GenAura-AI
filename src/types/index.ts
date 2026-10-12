/**
 * GenAura AI — Shared Type Contracts
 * ====================================
 * VERSION: 1.0.0
 *
 * These contracts are owned by Member 1 (Team Lead / Dashboard).
 * All members MUST import from this file.
 * Changes must be backward-compatible; coordinate with team before
 * adding breaking changes.
 *
 * Feature members:
 *  Member 2 → src/features/creators/   (Creator profiles & portfolios)
 *  Member 3 → src/features/discovery/  (Discovery, matching, shortlists)
 *  Member 4 → src/features/briefs/     (Brief builder)
 *  Member 5 → src/features/projects/   (Project requests & collaboration)
 */

// ────────────────────────────────────────────────────────────────────────────
// Primitive IDs (branded strings for type safety)
// ────────────────────────────────────────────────────────────────────────────
export type CreatorId    = string & { readonly __brand: 'CreatorId' };
export type PortfolioId  = string & { readonly __brand: 'PortfolioId' };
export type BriefId      = string & { readonly __brand: 'BriefId' };
export type ShortlistId  = string & { readonly __brand: 'ShortlistId' };
export type ProjectId    = string & { readonly __brand: 'ProjectId' };
export type UserId       = string & { readonly __brand: 'UserId' };

/** Cast a raw string to a branded ID. Only use at data boundaries (seed data, API responses). */
export const asCreatorId   = (s: string): CreatorId   => s as CreatorId;
export const asPortfolioId = (s: string): PortfolioId => s as PortfolioId;
export const asBriefId     = (s: string): BriefId     => s as BriefId;
export const asShortlistId = (s: string): ShortlistId => s as ShortlistId;
export const asProjectId   = (s: string): ProjectId   => s as ProjectId;
export const asUserId      = (s: string): UserId       => s as UserId;

// ────────────────────────────────────────────────────────────────────────────
// Creator (Member 2)
// ────────────────────────────────────────────────────────────────────────────
export type CreatorCategory =
  | 'copywriter'
  | 'graphic-designer'
  | 'video-editor'
  | 'photographer'
  | 'social-media-manager'
  | 'motion-designer'
  | 'illustrator'
  | 'ux-designer'
  | 'content-strategist'
  | 'voiceover-artist';

export type CreatorStatus = 'available' | 'busy' | 'on-leave';

export type VerificationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'needs_changes'
  | 'verified'
  | 'rejected';

export type FollowerTier = 'nano' | 'micro' | 'mid' | 'macro' | 'celebrity';

export type UserPersona = 'brand' | 'creator' | 'admin';

export interface CreatorVerificationAudit {
  reviewer: string;
  reviewedAt: string;
  decision: 'approved' | 'changes_requested' | 'rejected';
  reason: string;
  score: number;
}

export interface CreatorVerificationReport {
  status: VerificationStatus;
  overallScore: number;
  criterionScores: {
    profileCompleteness: number;      // max 20
    portfolioQuality: number;         // max 25
    contentOriginality: number;       // max 20
    professionalReadiness: number;    // max 15
    authenticityConsistency: number;  // max 20
  };
  passedChecks: string[];
  warnings: string[];
  suggestions: string[];
  recommendedDecision: 'approve_eligible' | 'needs_changes' | 'manual_review';
  explanation: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  auditTrail?: CreatorVerificationAudit[];
}

export interface Creator {
  id: CreatorId;
  name: string;
  handle: string;                // e.g. "@jane_creates"
  avatarUrl: string;
  coverImageUrl?: string;
  tagline: string;
  bio: string;
  category: CreatorCategory;
  skills: string[];              // free-form skill tags
  hourlyRate: number;            // USD
  currency: 'USD';
  rating: number;                // 0–5 (one decimal)
  reviewCount: number;
  completedProjects: number;
  status: CreatorStatus;
  location: string;
  timezone: string;              // IANA tz string, e.g. "Asia/Kolkata"
  portfolioIds: PortfolioId[];
  joinedAt: string;              // ISO 8601
  featured: boolean;
  verified: boolean;
  socialLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    behance?: string;
    dribbble?: string;
    youtube?: string;
    tiktok?: string;
  };

  // ── Onboarding, Studio & Verification extensions ──
  email?: string;
  username?: string;
  country?: string;
  city?: string;
  preferredRegions?: string[];
  languages?: string[];
  contentFormats?: string[];
  yearsExperience?: number;
  audienceSize?: number;
  followerTier?: FollowerTier;
  engagementRate?: number;
  rateRange?: { min: number; max: number };
  collaborationTypes?: string[];
  verificationStatus?: VerificationStatus;
  verificationReport?: CreatorVerificationReport;
}

// ────────────────────────────────────────────────────────────────────────────
// Portfolio Item (Member 2)
// ────────────────────────────────────────────────────────────────────────────
export type PortfolioMediaType = 'image' | 'video' | 'link' | 'pdf';

export interface PortfolioItem {
  id: PortfolioId;
  creatorId: CreatorId;
  title: string;
  description: string;
  mediaType: PortfolioMediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
  tags: string[];
  publishedAt: string;           // ISO 8601
  featured: boolean;
  externalUrl?: string;
  clientName?: string;

  // ── Portfolio Builder extensions ──
  format?: string;
  campaignContext?: string;
  creatorRole?: string;
  isSelfReportedMetrics?: boolean;
  views?: number;
  likes?: number;
  order?: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Creative Brief (Member 4)
// ────────────────────────────────────────────────────────────────────────────
export type BriefStatus = 'draft' | 'published' | 'closed' | 'archived';
export type ContentType =
  | 'blog-post'
  | 'social-post'
  | 'video-script'
  | 'brand-identity'
  | 'product-photography'
  | 'motion-graphics'
  | 'podcast'
  | 'infographic'
  | 'ad-creative'
  | 'email-campaign'
  | 'other';

export interface CreativeBriefDeliverable {
  id: string;
  format: string;
  channel: string;
  quantity: number;
  requirements: string;
}

export interface CreativeBriefPillar {
  pillar: string;
  description: string;
  hookExamples: string[];
}

export interface CreativeBriefContent {
  executiveSummary: string;
  targetPersonaNarrative: string;
  keyMessagingPillars: CreativeBriefPillar[];
  contentStrategy: string;
  kpiBenchmarks: Array<{ metric: string; target: string }>;
  budgetBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  creatorCriteria?: { tier: string; minEngagementRate: string; aestheticVibe: string; niche: string[] };
  generatedAt: string;
  isDemoGenerated: boolean;
  modelNotice: string;
}

export interface CreativeBrief {
  id: BriefId;
  title: string;
  description: string;
  contentType: ContentType;
  requiredSkills: string[];
  budget: {
    min: number;
    max: number;
    currency: 'USD';
  };
  timeline: {
    startDate: string;           // ISO 8601 date
    deadline: string;            // ISO 8601 date
  };
  status: BriefStatus;
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
  attachments?: string[];        // URLs
  preferredCategories?: CreatorCategory[];
  notes?: string;

  // GenAura AI BriefGen extensions
  brandName?: string;
  category?: string;
  objective?: string;
  targetAudience?: {
    demographics: string;
    ageRange: string;
    locations?: string[];
    interests?: string[];
    painPoints?: string[];
  };
  channels?: string[];
  deliverables?: CreativeBriefDeliverable[];
  tone?: string;
  guidelines?: {
    dos: string[];
    donts: string[];
    mandatoryMentions?: string[];
    hashtags?: string[];
    callToAction?: string;
  };
  generatedContent?: CreativeBriefContent;
  isDemoGenerated?: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// Shortlist Entry (Member 3)
// ────────────────────────────────────────────────────────────────────────────
export type ShortlistEntryStatus = 'saved' | 'contacted' | 'declined';

export interface ShortlistEntry {
  id: ShortlistId;
  creatorId: CreatorId;
  briefId?: BriefId;             // optional: associated brief
  status: ShortlistEntryStatus;
  notes?: string;
  addedAt: string;               // ISO 8601
  matchScore?: number;           // 0–100 AI match score
}

// ────────────────────────────────────────────────────────────────────────────
// Project Request (Member 5)
// ────────────────────────────────────────────────────────────────────────────
export type ProjectStatus =
  | 'pending'
  | 'accepted'
  | 'in-progress'
  | 'review'
  | 'completed'
  | 'cancelled';

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate: string;               // ISO 8601 date
  completed: boolean;
  amount?: number;               // partial payment tied to milestone
}

export interface ProjectRequest {
  id: ProjectId;
  briefId: BriefId;
  creatorId: CreatorId;
  status: ProjectStatus;
  agreedRate: number;            // USD
  currency: 'USD';
  startDate: string;             // ISO 8601 date
  endDate: string;               // ISO 8601 date
  milestones: Milestone[];
  messages: CollaborationMessage[];
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}

export interface CollaborationMessage {
  id: string;
  senderId: UserId | CreatorId;
  senderName: string;
  senderType: 'client' | 'creator';
  content: string;
  attachments?: string[];
  sentAt: string;                // ISO 8601
  read: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// Shared Storage Interface
// ────────────────────────────────────────────────────────────────────────────
/**
 * All feature stores MUST satisfy this interface so the dashboard
 * can read statistics without coupling to store implementations.
 */
export interface AppStore {
  creators:          Creator[];
  portfolios:        PortfolioItem[];
  briefs:            CreativeBrief[];
  shortlist:         ShortlistEntry[];
  projects:          ProjectRequest[];
  currentPersona?:   UserPersona;
  currentCreatorId?: CreatorId;
  activeBriefId?:    BriefId | null;
  authUser?:         AuthUser | null;
  isAuthenticated?:  boolean;
  theme?:            ThemeMode;
  userSettings?:     UserSettings;
  notifications?:    AppNotification[];
  chatMessages?:     ChatMessage[];
}

// ────────────────────────────────────────────────────────────────────────────
// Theme, Auth & Settings Contracts
// ────────────────────────────────────────────────────────────────────────────
export type ThemeMode = 'light' | 'dark' | 'system';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserPersona;
  avatarUrl: string;
  bio?: string;
  location?: string;
  languages?: string[];
  createdAt: string;
  isDemoAccount?: boolean;
}

export interface UserSettings {
  profile: {
    displayName: string;
    username: string;
    avatarUrl: string;
    bio: string;
    location: string;
    languages: string[];
    hourlyRate?: number;
    website?: string;
  };
  account: {
    email: string;
    twoFactorEnabled: boolean;
    activeSessions: {
      id: string;
      device: string;
      location: string;
      lastActive: string;
      isCurrent: boolean;
    }[];
  };
  appearance: {
    theme: ThemeMode;
    reduceMotion: boolean;
    compactDensity: boolean;
  };
  notifications: {
    collaborationRequests: boolean;
    verificationUpdates: boolean;
    campaignUpdates: boolean;
    productAnnouncements: boolean;
    emailChannel: boolean;
    inAppChannel: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'shortlist-only' | 'private';
    discoverabilityEnabled: boolean;
    searchEngineIndexing: boolean;
  };
  aiPreferences: {
    responseLanguage: string;
    autoSuggestions: boolean;
    storeConversations: boolean;
    preferLiveModel: boolean;
    voiceEnabled?: boolean;
    autoSpeakReplies?: boolean;
    autoListenNextTurn?: boolean;
    speechRate?: number;
    speechPitch?: number;
    selectedVoice?: string;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  actionLink?: {
    label: string;
    to: string;
  };
  isError?: boolean;
  isStreaming?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'collaboration' | 'verification' | 'brief' | 'system';
  timestamp: string;
  read: boolean;
  linkTo?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Dashboard computed stats (derived — never hardcoded)
// ────────────────────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalCreators:        number;
  availableCreators:    number;
  publishedBriefs:      number;
  shortlistedCreators:  number;
  pendingRequests:      number;
  activeEngagements:    number;
}

// ────────────────────────────────────────────────────────────────────────────
// Route conventions
// ────────────────────────────────────────────────────────────────────────────
/**
 * These constants define every client-side route in the app.
 * The router (src/app/router.tsx) is the single source of truth.
 * Feature owners should import ROUTES to build links.
 */
export const ROUTES = {
  dashboard:        '/',
  welcome:          '/welcome',
  login:            '/login',
  creators:         '/creators',
  creatorDetail:    '/creators/:id',
  discovery:        '/discovery',
  studio:           '/studio',
  verification:     '/verification',
  adminVerification:'/admin/verification',
  shortlist:        '/shortlist',
  briefs:           '/briefs',
  briefNew:         '/briefs/new',
  briefDetail:      '/briefs/:id',
  briefEdit:        '/briefs/:id/edit',
  projects:         '/projects',
  projectDetail:    '/projects/:id',
  deals:            '/deals',
  dealDetail:       '/deals/:id',
  assistant:        '/assistant',
  notifications:    '/notifications',
  settings:         '/settings',
  help:             '/help',
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];

export * from './deal';
