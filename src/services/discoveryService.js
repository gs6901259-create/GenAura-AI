/**
 * @file Discovery, filtering, text search, sorting, and empty-state resolution service.
 */

import { calculateBriefMatch } from './scoringEngine.js';

export class DiscoveryService {
  /**
   * Applies search, combined filters, scoring, and sorting to a list of creators.
   *
   * @param {Array<object>} creators - The list of creators
   * @param {object} criteria - Search and filter parameters
   * @param {object|null} activeBrief - The currently selected campaign brief (optional)
   * @returns {object} Filtered and sorted results, total count, score attachments, and empty state metadata.
   */
  filterAndSort(creators, criteria = {}, activeBrief = null) {
    if (!Array.isArray(creators)) {
      return {
        results: [],
        total: 0,
        activeFiltersCount: 0,
        emptyState: { isEmpty: true, reason: 'no_creators', message: 'No creators available.' },
      };
    }

    const {
      query = '',
      platforms = [],
      categories = [],
      tiers = [],
      minFollowers = null,
      maxFollowers = null,
      minEngagement = null,
      maxBudget = null,
      country = '',
      verifiedOnly = false,
      minBrandSafety = null,
      sortBy = activeBrief ? 'matchScore_desc' : 'followers_desc',
    } = criteria;

    let activeFiltersCount = 0;
    if (query && query.trim()) activeFiltersCount++;
    if (platforms.length > 0) activeFiltersCount += platforms.length;
    if (categories.length > 0) activeFiltersCount += categories.length;
    if (tiers.length > 0) activeFiltersCount += tiers.length;
    if (minFollowers !== null && minFollowers > 0) activeFiltersCount++;
    if (maxFollowers !== null && maxFollowers < 10_000_000) activeFiltersCount++;
    if (minEngagement !== null && minEngagement > 0) activeFiltersCount++;
    if (maxBudget !== null && maxBudget < 100_000) activeFiltersCount++;
    if (country && country.trim()) activeFiltersCount++;
    if (verifiedOnly) activeFiltersCount++;
    if (minBrandSafety !== null && minBrandSafety > 0) activeFiltersCount++;

    // 1. ATTACH BRIEF MATCH SCORES
    const enhanced = creators.map((creator) => {
      let match = null;
      if (activeBrief) {
        match = calculateBriefMatch(creator, activeBrief);
      }
      return {
        ...creator,
        matchScore: match ? match.overallScore : null,
        matchDetails: match,
      };
    });

    // 2. TEXT SEARCH FILTER
    const trimmedQuery = query.trim().toLowerCase();
    const queryTokens = trimmedQuery ? trimmedQuery.split(/\s+/) : [];

    let filtered = enhanced.filter((c) => {
      // Text search: matches all tokens across name, handle, bio, category, tags, city/country
      if (queryTokens.length > 0) {
        const searchableText = [
          c.name || '',
          c.handle || '',
          c.bio || '',
          c.category || '',
          (c.tags || []).join(' '),
          (c.platforms || []).join(' '),
          (c.location && c.location.city) || '',
          (c.location && c.location.country) || '',
        ]
          .join(' ')
          .toLowerCase();

        const allTokensMatch = queryTokens.every((token) => searchableText.includes(token));
        if (!allTokensMatch) return false;
      }

      // 3. COMBINED FILTERS
      // Platforms: creator must support at least one of the selected platforms
      if (platforms.length > 0) {
        const creatorPlatforms = c.platforms || [c.primaryPlatform];
        const hasPlatformMatch = platforms.some((p) =>
          creatorPlatforms.map((cp) => cp.toLowerCase()).includes(p.toLowerCase())
        );
        if (!hasPlatformMatch) return false;
      }

      // Categories: creator must match any of the selected categories
      if (categories.length > 0) {
        const hasCategoryMatch = categories.some(
          (cat) => cat.toLowerCase() === (c.category || '').toLowerCase()
        );
        if (!hasCategoryMatch) return false;
      }

      // Tiers: creator must match any selected tier
      if (tiers.length > 0) {
        const hasTierMatch = tiers.includes(c.followerTier);
        if (!hasTierMatch) return false;
      }

      // Min Followers
      if (minFollowers !== null && minFollowers > 0) {
        if ((c.followers || 0) < minFollowers) return false;
      }

      // Max Followers
      if (maxFollowers !== null && maxFollowers > 0) {
        if ((c.followers || 0) > maxFollowers) return false;
      }

      // Min Engagement Rate
      if (minEngagement !== null && minEngagement > 0) {
        if ((c.engagementRate || 0) < minEngagement) return false;
      }

      // Max Budget (checks minimum deliverable fee, i.e. postRate or videoRate)
      if (maxBudget !== null && maxBudget > 0) {
        const rate = (c.rateCard && (c.rateCard.postRate || c.rateCard.videoRate)) || 0;
        if (rate > maxBudget) return false;
      }

      // Country / Location
      if (country && country.trim()) {
        const creatorCountry = (c.location && c.location.country) || '';
        if (creatorCountry.toLowerCase() !== country.trim().toLowerCase()) return false;
      }

      // Verified Only
      if (verifiedOnly) {
        if (!c.verified) return false;
      }

      // Min Brand Safety Score
      if (minBrandSafety !== null && minBrandSafety > 0) {
        if ((c.brandSafetyScore || 0) < minBrandSafety) return false;
      }

      return true;
    });

    // 4. SORTING
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'matchScore_desc': {
          const scoreA = a.matchScore ?? -1;
          const scoreB = b.matchScore ?? -1;
          if (scoreB !== scoreA) return scoreB - scoreA;
          return (b.followers || 0) - (a.followers || 0);
        }
        case 'matchScore_asc': {
          const scoreA = a.matchScore ?? 999;
          const scoreB = b.matchScore ?? 999;
          return scoreA - scoreB;
        }
        case 'followers_desc':
          return (b.followers || 0) - (a.followers || 0);
        case 'followers_asc':
          return (a.followers || 0) - (b.followers || 0);
        case 'engagement_desc':
          return (b.engagementRate || 0) - (a.engagementRate || 0);
        case 'engagement_asc':
          return (a.engagementRate || 0) - (b.engagementRate || 0);
        case 'rate_asc': {
          const rateA = (a.rateCard && a.rateCard.postRate) || 0;
          const rateB = (b.rateCard && b.rateCard.postRate) || 0;
          return rateA - rateB;
        }
        case 'rate_desc': {
          const rateA = (a.rateCard && a.rateCard.postRate) || 0;
          const rateB = (b.rateCard && b.rateCard.postRate) || 0;
          return rateB - rateA;
        }
        case 'brandSafety_desc':
          return (b.brandSafetyScore || 0) - (a.brandSafetyScore || 0);
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '');
        default:
          return 0;
      }
    });

    // 5. EMPTY STATE ANALYSIS
    let emptyState = null;
    if (filtered.length === 0) {
      if (trimmedQuery && activeFiltersCount > 1) {
        emptyState = {
          isEmpty: true,
          reason: 'query_and_filters',
          title: 'No matching creators found',
          message: `No creators matched your search for "${trimmedQuery}" with the active filters applied.`,
          suggestion: 'Try clearing some filters or searching with broader keywords.',
          canReset: true,
        };
      } else if (trimmedQuery) {
        emptyState = {
          isEmpty: true,
          reason: 'query_only',
          title: 'No creators found',
          message: `No creators matched "${trimmedQuery}".`,
          suggestion: 'Check your spelling or try searching by category or topic tags.',
          canReset: true,
        };
      } else if (activeFiltersCount > 0) {
        emptyState = {
          isEmpty: true,
          reason: 'filters_only',
          title: 'No creators match these filters',
          message: 'The current filter combinations are too restrictive.',
          suggestion: 'Try broadening your follower tier range, budget cap, or minimum engagement threshold.',
          canReset: true,
        };
      } else {
        emptyState = {
          isEmpty: true,
          reason: 'no_creators',
          title: 'No creators in directory',
          message: 'The creator database is currently empty.',
          suggestion: 'Load sample creators or connect your platform data sources.',
          canReset: false,
        };
      }
    }

    return {
      results: filtered,
      total: filtered.length,
      initialTotal: creators.length,
      activeFiltersCount,
      emptyState,
    };
  }
}

export const discoveryService = new DiscoveryService();
