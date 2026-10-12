/**
 * Campaign Brief Data Contract
 *
 * Defines the contract between the BriefGen / Lead module and Collaboration workflows.
 * Collaboration project requests link directly to a validated Campaign Brief.
 */

import { SocialPlatform } from './discoveryContract';

export interface BriefDeliverableTemplate {
  id: string;
  title: string;
  platform: SocialPlatform;
  format: string; // e.g. "60-90s Dedicated Review", "Reel / TikTok Short", "Carousels"
  quantity: number;
  guidelines: string;
  dueDateOffsetDays: number; // Days after collaboration agreement
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

export interface IBriefService {
  getBriefs(): Promise<CampaignBrief[]>;
  getBriefById(id: string): Promise<CampaignBrief | null>;
}
