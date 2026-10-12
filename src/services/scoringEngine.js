/**
 * @file Deterministic explainable brief-to-creator scoring engine for GenAura AI.
 */

export const SCORING_WEIGHTS = {
  NICHE: 0.25,
  PLATFORM: 0.15,
  DEMOGRAPHICS: 0.20,
  PERFORMANCE: 0.20,
  BUDGET: 0.10,
  BRAND_SAFETY: 0.10,
};

// Guarantee weights sum to 1.0
const TOTAL_WEIGHT = Object.values(SCORING_WEIGHTS).reduce((sum, w) => sum + w, 0);
if (Math.abs(TOTAL_WEIGHT - 1.0) > 0.001) {
  throw new Error(`Scoring weights must sum to 1.0 (current sum: ${TOTAL_WEIGHT})`);
}

/**
 * Calculates a deterministic, explainable match score between a creator and a campaign brief.
 *
 * @param {object} creator - The creator profile
 * @param {object} brief - The campaign brief
 * @returns {object} Full match result with overall score, breakdown, and human-readable explanations.
 */
export function calculateBriefMatch(creator, brief) {
  if (!creator || !brief) {
    return {
      overallScore: 0,
      matchTier: 'No Match',
      breakdown: {
        nicheRelevance: 0,
        platformFit: 0,
        audienceDemographicFit: 0,
        performanceFit: 0,
        budgetFit: 0,
        brandSafetyFit: 0,
      },
      explanations: [],
    };
  }

  const explanations = [];

  // 1. NICHE & CONTENT FIT (25%)
  let nicheCategoryScore = 0;
  const reqCategories = brief.requiredCategories || [];
  if (reqCategories.length === 0) {
    nicheCategoryScore = 100;
  } else if (reqCategories.includes(creator.category)) {
    nicheCategoryScore = 100;
  } else {
    // Check partial string match
    const partialMatch = reqCategories.some(
      (cat) =>
        cat.toLowerCase().includes(creator.category.toLowerCase()) ||
        creator.category.toLowerCase().includes(cat.toLowerCase())
    );
    nicheCategoryScore = partialMatch ? 50 : 0;
  }

  // Tag intersection (Jaccard-style overlap)
  let tagScore = 0;
  const briefTags = (brief.requiredTags || []).map((t) => t.toLowerCase());
  const creatorTags = (creator.tags || []).map((t) => t.toLowerCase());
  let matchingTags = [];

  if (briefTags.length === 0) {
    tagScore = 100;
  } else {
    matchingTags = creatorTags.filter((t) => briefTags.includes(t));
    const ratio = matchingTags.length / Math.min(briefTags.length, 5);
    tagScore = Math.min(100, Math.round(ratio * 100));
  }

  // Weighted combo: 60% category, 40% tags
  const nicheRelevance = Math.round(nicheCategoryScore * 0.6 + tagScore * 0.4);

  if (nicheRelevance >= 80) {
    explanations.push({
      factor: 'Niche & Content',
      type: 'positive',
      score: nicheRelevance,
      detail: `Strong category alignment in '${creator.category}' with ${matchingTags.length} matching campaign tags (${matchingTags.slice(0, 3).join(', ')}).`,
    });
  } else if (nicheRelevance >= 50) {
    explanations.push({
      factor: 'Niche & Content',
      type: 'neutral',
      score: nicheRelevance,
      detail: `Moderate topical relevance to campaign tags with partial domain overlap.`,
    });
  } else {
    explanations.push({
      factor: 'Niche & Content',
      type: 'warning',
      score: nicheRelevance,
      detail: `Creator focus '${creator.category}' does not directly target required categories (${reqCategories.join(', ')}).`,
    });
  }

  // 2. PLATFORM ALIGNMENT (15%)
  const reqPlatforms = brief.requiredPlatforms || [];
  const creatorPlatforms = creator.platforms || [creator.primaryPlatform];
  let platformFit = 0;

  if (reqPlatforms.length === 0) {
    platformFit = 100;
  } else {
    const matchedPlatforms = reqPlatforms.filter((p) => creatorPlatforms.includes(p));
    const isPrimaryMatched = reqPlatforms.includes(creator.primaryPlatform);
    if (matchedPlatforms.length === reqPlatforms.length && isPrimaryMatched) {
      platformFit = 100;
    } else if (matchedPlatforms.length > 0) {
      platformFit = Math.round((matchedPlatforms.length / reqPlatforms.length) * 80 + (isPrimaryMatched ? 20 : 0));
    } else {
      platformFit = 15;
    }
  }

  if (platformFit >= 85) {
    explanations.push({
      factor: 'Platform & Formats',
      type: 'positive',
      score: platformFit,
      detail: `Primary platform '${creator.primaryPlatform}' and channels (${creatorPlatforms.join(', ')}) directly match campaign channels.`,
    });
  } else if (platformFit >= 50) {
    explanations.push({
      factor: 'Platform & Formats',
      type: 'neutral',
      score: platformFit,
      detail: `Active on some campaign channels, though primary focus differs.`,
    });
  } else {
    explanations.push({
      factor: 'Platform & Formats',
      type: 'warning',
      score: platformFit,
      detail: `Channels do not cover primary required campaign platforms (${reqPlatforms.join(', ')}).`,
    });
  }

  // 3. AUDIENCE DEMOGRAPHICS FIT (20%)
  let demographicScore = 0;
  const targetAges = brief.targetAgeBrackets || [];
  const targetCountries = brief.targetCountries || [];
  const creatorAges = (creator.audienceDemographics && creator.audienceDemographics.topAgeBrackets) || {};
  const creatorCountries = (creator.audienceDemographics && creator.audienceDemographics.topCountries) || {};

  // Age overlap percentage
  let ageOverlapPct = 0;
  if (targetAges.length > 0) {
    targetAges.forEach((bracket) => {
      ageOverlapPct += creatorAges[bracket] || 0;
    });
  } else {
    ageOverlapPct = 70;
  }

  // Country overlap percentage
  let countryOverlapPct = 0;
  if (targetCountries.length > 0) {
    targetCountries.forEach((code) => {
      countryOverlapPct += creatorCountries[code] || 0;
    });
  } else {
    countryOverlapPct = 60;
  }

  // Normalize demographicScore to 0-100
  // Target age > 60% is full points, target country > 60% is full points
  const normalizedAge = Math.min(100, Math.round((ageOverlapPct / 65) * 100));
  const normalizedCountry = Math.min(100, Math.round((countryOverlapPct / 65) * 100));
  demographicScore = Math.round(normalizedAge * 0.6 + normalizedCountry * 0.4);

  if (demographicScore >= 80) {
    explanations.push({
      factor: 'Audience Demographics',
      type: 'positive',
      score: demographicScore,
      detail: `${ageOverlapPct}% of audience matches target age brackets (${targetAges.join(', ')}), with strong geo-concentration in ${targetCountries.join(', ')}.`,
    });
  } else if (demographicScore >= 50) {
    explanations.push({
      factor: 'Audience Demographics',
      type: 'neutral',
      score: demographicScore,
      detail: `Moderate audience alignment (${ageOverlapPct}% target age match).`,
    });
  } else {
    explanations.push({
      factor: 'Audience Demographics',
      type: 'warning',
      score: demographicScore,
      detail: `Audience skews outside preferred age ranges (${ageOverlapPct}% target demographic overlap).`,
    });
  }

  // 4. PERFORMANCE & ENGAGEMENT FIT (20%)
  const minEng = brief.minEngagementRate || 2.0;
  const creatorEng = creator.engagementRate || 0;
  let engScore = 0;
  if (creatorEng >= minEng) {
    // Base 80 + bonus for exceeding
    const surplus = creatorEng - minEng;
    engScore = Math.min(100, Math.round(80 + surplus * 10));
  } else {
    // Proportional penalty
    engScore = Math.max(20, Math.round((creatorEng / minEng) * 75));
  }

  // Tier check
  let tierScore = 100;
  if (brief.targetTiers && brief.targetTiers.length > 0) {
    if (brief.targetTiers.includes(creator.followerTier)) {
      tierScore = 100;
    } else {
      tierScore = 60;
    }
  }

  const performanceFit = Math.round(engScore * 0.7 + tierScore * 0.3);

  if (creatorEng >= minEng) {
    explanations.push({
      factor: 'Performance & Engagement',
      type: 'positive',
      score: performanceFit,
      detail: `Engagement rate of ${creatorEng}% exceeds campaign requirement (${minEng}% minimum). Tier: ${creator.followerTier}.`,
    });
  } else {
    explanations.push({
      factor: 'Performance & Engagement',
      type: 'warning',
      score: performanceFit,
      detail: `Engagement rate of ${creatorEng}% is below campaign minimum (${minEng}%).`,
    });
  }

  // 5. BUDGET COMPATIBILITY (10%)
  const maxBudget = brief.maxCreatorBudget || 5000;
  const creatorRate =
    (creator.rateCard && (creator.rateCard.videoRate || creator.rateCard.postRate)) || 1000;
  let budgetFit = 100;

  if (creatorRate <= maxBudget) {
    // Well within budget
    budgetFit = 100;
    explanations.push({
      factor: 'Budget & Rates',
      type: 'positive',
      score: budgetFit,
      detail: `Estimated deliverable rate ($${creatorRate.toLocaleString()}) fits comfortably within creator budget cap ($${maxBudget.toLocaleString()}).`,
    });
  } else if (creatorRate <= maxBudget * 1.25) {
    // Slightly over budget (1-25% over)
    const excess = creatorRate - maxBudget;
    budgetFit = Math.max(40, Math.round(100 - (excess / (maxBudget * 0.25)) * 50));
    explanations.push({
      factor: 'Budget & Rates',
      type: 'warning',
      score: budgetFit,
      detail: `Deliverable rate ($${creatorRate.toLocaleString()}) exceeds target cap ($${maxBudget.toLocaleString()}) by ${Math.round(((creatorRate - maxBudget) / maxBudget) * 100)}%. Requires rate negotiation.`,
    });
  } else {
    // Substantially over budget
    budgetFit = Math.max(10, Math.round(40 - ((creatorRate - maxBudget * 1.25) / maxBudget) * 30));
    explanations.push({
      factor: 'Budget & Rates',
      type: 'warning',
      score: budgetFit,
      detail: `Significantly above campaign budget cap ($${creatorRate.toLocaleString()} vs $${maxBudget.toLocaleString()}).`,
    });
  }

  // 6. BRAND SAFETY & INTEGRITY (10%)
  const minSafety = brief.minBrandSafetyScore || 85;
  const creatorSafety = creator.brandSafetyScore || 90;
  let brandSafetyFit = 0;

  if (creatorSafety >= minSafety) {
    brandSafetyFit = Math.min(100, Math.round(85 + (creatorSafety - minSafety) * 2));
    explanations.push({
      factor: 'Brand Safety & Quality',
      type: 'positive',
      score: brandSafetyFit,
      detail: `Excellent brand safety score of ${creatorSafety}/100 exceeds threshold (${minSafety}). Verified partner status: ${creator.verified ? 'Yes' : 'Pending'}.`,
    });
  } else {
    brandSafetyFit = Math.max(20, Math.round((creatorSafety / minSafety) * 70));
    explanations.push({
      factor: 'Brand Safety & Quality',
      type: 'warning',
      score: brandSafetyFit,
      detail: `Brand safety index (${creatorSafety}/100) is below desired campaign threshold (${minSafety}).`,
    });
  }

  // CALCULATE OVERALL WEIGHTED SCORE
  const weightedSum =
    nicheRelevance * SCORING_WEIGHTS.NICHE +
    platformFit * SCORING_WEIGHTS.PLATFORM +
    demographicScore * SCORING_WEIGHTS.DEMOGRAPHICS +
    performanceFit * SCORING_WEIGHTS.PERFORMANCE +
    budgetFit * SCORING_WEIGHTS.BUDGET +
    brandSafetyFit * SCORING_WEIGHTS.BRAND_SAFETY;

  const overallScore = Math.min(100, Math.max(0, Math.round(weightedSum)));

  let matchTier = 'Low Match';
  if (overallScore >= 88) {
    matchTier = 'Exceptional Match';
  } else if (overallScore >= 72) {
    matchTier = 'Strong Match';
  } else if (overallScore >= 52) {
    matchTier = 'Moderate Match';
  }

  return {
    overallScore,
    matchTier,
    breakdown: {
      nicheRelevance,
      platformFit,
      audienceDemographicFit: demographicScore,
      performanceFit,
      budgetFit,
      brandSafetyFit,
    },
    weights: SCORING_WEIGHTS,
    explanations,
  };
}
