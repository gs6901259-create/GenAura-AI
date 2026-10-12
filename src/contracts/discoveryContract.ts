/**
 * Discovery Owner Data Contract
 *
 * Defines the contract between the Discovery module and Collaboration workflows.
 * Shortlists and creator profiles generated in Discovery are consumed here.
 */

export type SocialPlatform = 'youtube' | 'instagram' | 'tiktok' | 'twitter';

export type CreatorTier = 'nano' | 'micro' | 'mid' | 'macro' | 'celebrity';

export interface PlatformMetric {
  platform: SocialPlatform;
  handle: string;
  followers: number;
  engagementRate: number; // percentage e.g. 4.2
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
  brandSafetyScore: number; // 0 - 100
  audienceMatchScore: number; // 0 - 100
  email?: string;
}

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

export interface IDiscoveryService {
  getShortlists(): Promise<Shortlist[]>;
  getShortlistById(id: string): Promise<Shortlist | null>;
  getCreators(creatorIds?: string[]): Promise<CreatorProfile[]>;
  getCreatorById(id: string): Promise<CreatorProfile | null>;
}
