/**
 * @file Shared domain types and validation models for GenAura AI.
 */

export const Platform = {
  INSTAGRAM: 'Instagram',
  YOUTUBE: 'YouTube',
  TIKTOK: 'TikTok',
  LINKEDIN: 'LinkedIn',
  X: 'X',
};

export const FollowerTier = {
  NANO: 'Nano (<10K)',
  MICRO: 'Micro (10K-100K)',
  MID: 'Mid-Tier (100K-500K)',
  MACRO: 'Macro (500K-1M)',
  MEGA: 'Mega (1M+)',
};

export function getFollowerTier(followerCount) {
  if (followerCount < 10_000) return FollowerTier.NANO;
  if (followerCount < 100_000) return FollowerTier.MICRO;
  if (followerCount < 500_000) return FollowerTier.MID;
  if (followerCount < 1_000_000) return FollowerTier.MACRO;
  return FollowerTier.MEGA;
}

export const Categories = [
  'Tech & AI',
  'Design & Creative',
  'Fitness & Health',
  'Fashion & Style',
  'Gaming',
  'Lifestyle & Travel',
  'Finance & Business',
  'Food & Culinary',
];

export const ShortlistStatus = {
  IDENTIFIED: 'Identified',
  CONTACTED: 'Contacted',
  NEGOTIATING: 'Negotiating',
  CONFIRMED: 'Confirmed',
  DECLINED: 'Declined',
};

/**
 * Validates whether an object conforms to Creator schema.
 * @param {object} creator
 * @returns {boolean}
 */
export function isValidCreator(creator) {
  return (
    typeof creator === 'object' &&
    creator !== null &&
    typeof creator.id === 'string' &&
    typeof creator.name === 'string' &&
    typeof creator.handle === 'string' &&
    typeof creator.primaryPlatform === 'string' &&
    typeof creator.category === 'string' &&
    typeof creator.followers === 'number' &&
    typeof creator.engagementRate === 'number' &&
    typeof creator.rateCard === 'object' &&
    typeof creator.rateCard.postRate === 'number'
  );
}

/**
 * Validates whether an object conforms to CampaignBrief schema.
 * @param {object} brief
 * @returns {boolean}
 */
export function isValidBrief(brief) {
  return (
    typeof brief === 'object' &&
    brief !== null &&
    typeof brief.id === 'string' &&
    typeof brief.title === 'string' &&
    Array.isArray(brief.requiredCategories) &&
    typeof brief.maxCreatorBudget === 'number'
  );
}
