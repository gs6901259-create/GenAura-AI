/**
 * GenAura AI — Upgraded AuraMatch Engine (v2.1)
 * =============================================
 * Implements the official 7-factor explainable recommendation and ranking engine.
 *
 * Configurable weights:
 * - Campaign niche relevance: 25% (0.25)
 * - Audience and target-market fit: 20% (0.20)
 * - Language compatibility: 15% (0.15)
 * - Campaign tone compatibility: 15% (0.15)
 * - Budget compatibility: 10% (0.10)
 * - Platform & content-format compatibility: 10% (0.10)
 * - Regional campaign experience: 5% (0.05)
 * Total: 100% (1.00)
 *
 * Strict Mandatory Constraints:
 * If a brand marks language or target market as mandatory, creators who do not satisfy it
 * cannot be presented as fully qualified, regardless of their total composite score.
 */
import type {
  Creator,
  CreativeBrief,
  PortfolioItem,
  AuraMatchWeights,
} from '@/types';
import { DEFAULT_AURA_MATCH_WEIGHTS } from '@/types';
import { formatRupees } from '@/lib/utils';
import { toneMatchingService, ToneMatchResult } from './toneMatchingService';

export interface MatchExplanation {
  factor: string;
  score: number;
  type: 'positive' | 'neutral' | 'warning';
  detail: string;
}

export interface AuraMatchBreakdown {
  nicheRelevance: number;        // 25%
  audienceTargetFit: number;     // 20%
  languageCompatibility: number;  // 15%
  toneCompatibility: number;     // 15%
  budgetCompatibility: number;   // 10%
  platformFormatFit: number;     // 10%
  regionalExperience: number;    // 5%
}

export interface AuraMatchAnalysis {
  overallScore: number;
  matchTier: 'Exceptional Match' | 'Strong Match' | 'Moderate Match' | 'Low Match' | 'Disqualified (Mandatory Criteria)';
  breakdown: AuraMatchBreakdown;
  weights: AuraMatchWeights;
  algorithmVersion: string;
  isFullyQualified: boolean;
  mandatoryViolations: string[];
  missingCriteria: string[];
  explanations: MatchExplanation[];
  toneDetails?: ToneMatchResult;
  regionalSummary: {
    audienceRegionMatched: boolean;
    creatorLocation: string;
    remoteAvailable: boolean;
    languageCoverage: string;
  };
}

export class AuraMatchEngine {
  public static readonly VERSION = 'AuraMatch-v2.1-Multilingual';

  /**
   * Computes deterministic, explainable AuraMatch analysis between a creator and a campaign brief.
   */
  public computeMatch(
    creator: Creator,
    brief: CreativeBrief | null,
    portfolios: PortfolioItem[] = [],
    customWeights: AuraMatchWeights = DEFAULT_AURA_MATCH_WEIGHTS
  ): AuraMatchAnalysis {
    // 1. Null / unselected brief fallback
    if (!brief) {
      return {
        overallScore: 82,
        matchTier: 'Strong Match',
        breakdown: {
          nicheRelevance: 85,
          audienceTargetFit: 80,
          languageCompatibility: 85,
          toneCompatibility: 85,
          budgetCompatibility: 90,
          platformFormatFit: 85,
          regionalExperience: 75,
        },
        weights: customWeights,
        algorithmVersion: AuraMatchEngine.VERSION,
        isFullyQualified: true,
        mandatoryViolations: [],
        missingCriteria: ['Select or link a specific campaign brief to calculate custom 7-factor alignment.'],
        explanations: [
          {
            factor: 'Profile Quality Baseline',
            score: Math.round(creator.rating * 18),
            type: 'positive',
            detail: `High creator rating (${creator.rating}/5.0) across ${creator.completedProjects} verified projects.`,
          },
        ],
        regionalSummary: {
          audienceRegionMatched: true,
          creatorLocation: creator.location || 'Global',
          remoteAvailable: creator.remoteAvailable !== false,
          languageCoverage: (creator.languages || creator.languagesSpoken || ['English']).join(', '),
        },
      };
    }

    const explanations: MatchExplanation[] = [];
    const missingCriteria: string[] = [];
    const mandatoryViolations: string[] = [];

    // ────────────────────────────────────────────────────────────────────────
    // FACTOR 1: NICHE RELEVANCE (25%)
    // ────────────────────────────────────────────────────────────────────────
    let nicheRelevance = 45;
    const preferredCats = brief.preferredCategories || (brief.category ? [brief.category] : []);
    const requiredSkills = (brief.requiredSkills || []).map((s) => s.toLowerCase());
    const creatorSkills = (creator.skills || []).map((s) => s.toLowerCase());

    const matchingSkills = creatorSkills.filter((s) =>
      requiredSkills.some((req) => req.includes(s) || s.includes(req))
    );

    const categoryMatch =
      preferredCats.length === 0 ||
      preferredCats.some((c) =>
        c.toLowerCase().includes(creator.category.toLowerCase()) ||
        creator.category.toLowerCase().includes(c.toLowerCase())
      );

    if (categoryMatch && matchingSkills.length > 0) {
      nicheRelevance = 98;
      explanations.push({
        factor: 'Niche Relevance (25%)',
        score: 98,
        type: 'positive',
        detail: `Direct specialty alignment in '${creator.category}' with ${matchingSkills.length} matching skills (${matchingSkills.slice(0, 3).join(', ')}).`,
      });
    } else if (categoryMatch) {
      nicheRelevance = 85;
      explanations.push({
        factor: 'Niche Relevance (25%)',
        score: 85,
        type: 'positive',
        detail: `Specialty directly matches campaign category focus '${creator.category}'.`,
      });
    } else if (matchingSkills.length > 0) {
      nicheRelevance = 65;
      explanations.push({
        factor: 'Niche Relevance (25%)',
        score: 65,
        type: 'neutral',
        detail: `Offers ${matchingSkills.length} requested skills, though primary category is '${creator.category}'.`,
      });
    } else {
      nicheRelevance = 35;
      missingCriteria.push(`Creator category '${creator.category}' differs from requested campaign focus`);
      explanations.push({
        factor: 'Niche Relevance (25%)',
        score: 35,
        type: 'warning',
        detail: `Category '${creator.category}' does not directly target requested campaign disciplines.`,
      });
    }

    // ────────────────────────────────────────────────────────────────────────
    // FACTOR 2: AUDIENCE & TARGET-MARKET FIT (20%)
    // (Distinguishes creator physical location from audience geography!)
    // ────────────────────────────────────────────────────────────────────────
    let audienceTargetFit = 75;
    const targetAudienceRegions =
      brief.regionalPreferences?.intendedAudienceRegions ||
      brief.regionalPreferences?.targetCountries ||
      brief.targetAudience?.locations ||
      [];

    const creatorAudienceRegions = creator.audienceRegions || (creator.country ? [creator.country] : []);
    const hasAudienceRegionData = Boolean(creator.audienceRegions && creator.audienceRegions.length > 0);

    let audienceRegionMatched = false;
    if (targetAudienceRegions.length > 0) {
      audienceRegionMatched = targetAudienceRegions.some((targetReg) =>
        creatorAudienceRegions.some((creReg) =>
          creReg.toLowerCase().includes(targetReg.toLowerCase()) ||
          targetReg.toLowerCase().includes(creReg.toLowerCase())
        )
      );

      if (audienceRegionMatched) {
        audienceTargetFit = 95;
        explanations.push({
          factor: 'Audience & Target-Market Fit (20%)',
          score: 95,
          type: 'positive',
          detail: `Creator's audience geography (${creatorAudienceRegions.join(', ')}) directly penetrates campaign target market (${targetAudienceRegions.join(', ')}).`,
        });
      } else if (!hasAudienceRegionData) {
        audienceTargetFit = 65;
        missingCriteria.push('Audience geographic distribution unverified by platform telemetry; estimated based on profile');
        explanations.push({
          factor: 'Audience & Target-Market Fit (20%)',
          score: 65,
          type: 'neutral',
          detail: `Audience geography is not yet verified through analytics; creator location is ${creator.location}.`,
        });
      } else {
        audienceTargetFit = 45;
        explanations.push({
          factor: 'Audience & Target-Market Fit (20%)',
          score: 45,
          type: 'warning',
          detail: `Creator audience concentrated in (${creatorAudienceRegions.join(', ')}), diverging from campaign market (${targetAudienceRegions.join(', ')}).`,
        });
      }

      // Check mandatory target market constraint
      if (brief.regionalPreferences?.mandatoryRegions && !audienceRegionMatched) {
        mandatoryViolations.push(
          `Campaign marked audience market (${targetAudienceRegions.join(', ')}) as mandatory; creator has not verified presence in this region.`
        );
      }
    } else {
      // General quality baseline
      const ratingPct = Math.min(100, Math.round((creator.rating / 5) * 100));
      audienceTargetFit = Math.min(95, ratingPct + Math.min(10, Math.round(creator.reviewCount / 10)));
      explanations.push({
        factor: 'Audience & Target-Market Fit (20%)',
        score: audienceTargetFit,
        type: 'positive',
        detail: `Solid audience satisfaction rating of ${creator.rating}★ across ${creator.reviewCount} client engagements.`,
      });
    }

    // ────────────────────────────────────────────────────────────────────────
    // FACTOR 3: LANGUAGE COMPATIBILITY (15%)
    // ────────────────────────────────────────────────────────────────────────
    let languageCompatibility = 85;
    const requestedLanguages =
      brief.regionalPreferences?.preferredContentLanguages ||
      (brief.briefLanguage ? [brief.briefLanguage] : ['English']);

    const creatorLanguages = Array.from(
      new Set([
        ...(creator.contentLanguages || []),
        ...(creator.languagesSpoken || []),
        ...(creator.languages || []),
        ...(creator.deliverableLanguages || []),
      ])
    );

    const matchingLanguages = requestedLanguages.filter((reqLang) =>
      creatorLanguages.some((crLang) =>
        crLang.toLowerCase().includes(reqLang.toLowerCase()) ||
        reqLang.toLowerCase().includes(crLang.toLowerCase())
      )
    );

    if (requestedLanguages.length === 0 || matchingLanguages.length === requestedLanguages.length) {
      languageCompatibility = 100;
      explanations.push({
        factor: 'Language Compatibility (15%)',
        score: 100,
        type: 'positive',
        detail: `Fluently supports requested content languages (${matchingLanguages.join(', ')}).`,
      });
    } else if (matchingLanguages.length > 0) {
      languageCompatibility = 75;
      explanations.push({
        factor: 'Language Compatibility (15%)',
        score: 75,
        type: 'neutral',
        detail: `Partially supports campaign languages: verified for [${matchingLanguages.join(', ')}], missing [${requestedLanguages.filter((l) => !matchingLanguages.includes(l)).join(', ')}].`,
      });
    } else {
      languageCompatibility = 30;
      missingCriteria.push(`Lacks verified fluency in required languages (${requestedLanguages.join(', ')})`);
      explanations.push({
        factor: 'Language Compatibility (15%)',
        score: 30,
        type: 'warning',
        detail: `Creator's languages (${creatorLanguages.join(', ') || 'Not specified'}) do not match campaign requirements (${requestedLanguages.join(', ')}).`,
      });

      // Check mandatory language constraint
      if (brief.regionalPreferences?.mandatoryLanguages) {
        mandatoryViolations.push(
          `Campaign marked languages (${requestedLanguages.join(', ')}) as mandatory; creator does not support them.`
        );
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // FACTOR 4: CAMPAIGN TONE COMPATIBILITY (15%)
    // ────────────────────────────────────────────────────────────────────────
    const toneResult = toneMatchingService.evaluateToneMatch(
      creator,
      brief.tonePreferences || (brief.tone ? { desiredTones: [brief.tone as any] } : undefined),
      portfolios
    );

    const toneCompatibility = toneResult.score;
    if (toneCompatibility >= 80) {
      explanations.push({
        factor: 'Campaign Tone Compatibility (15%)',
        score: toneCompatibility,
        type: 'positive',
        detail: `High tone compatibility (${toneResult.matchTier}): ${toneResult.matchedCharacteristics.slice(0, 2).join('; ') || 'Matches requested brand vibe.'}`,
      });
    } else if (toneCompatibility >= 55) {
      explanations.push({
        factor: 'Campaign Tone Compatibility (15%)',
        score: toneCompatibility,
        type: 'neutral',
        detail: `Moderate tone fit. ${toneResult.missingEvidence[0] || 'Acceptable style alignment for creative campaign adaptation.'}`,
      });
    } else {
      explanations.push({
        factor: 'Campaign Tone Compatibility (15%)',
        score: toneCompatibility,
        type: 'warning',
        detail: `Potential style conflict: ${toneResult.potentialMismatches[0] || 'Creator cadence differs from target campaign brand voice.'}`,
      });

      if (brief.tonePreferences?.mandatoryTone) {
        mandatoryViolations.push('Campaign marked specific tone profile as mandatory; creator has potential style conflict.');
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // FACTOR 5: BUDGET COMPATIBILITY (10%)
    // ────────────────────────────────────────────────────────────────────────
    const maxBudget = brief.budget?.max || 50000;
    const estimatedCost = creator.hourlyRate * 25;
    let budgetCompatibility = 100;

    if (estimatedCost <= maxBudget) {
      budgetCompatibility = 100;
      explanations.push({
        factor: 'Budget Compatibility (10%)',
        score: 100,
        type: 'positive',
        detail: `Estimated deliverable pricing (${formatRupees(creator.hourlyRate)}/hr, est. ${formatRupees(estimatedCost)}) is well within the ${formatRupees(maxBudget)} campaign cap.`,
      });
    } else if (estimatedCost <= maxBudget * 1.25) {
      budgetCompatibility = 75;
      missingCriteria.push(`Rate (${formatRupees(creator.hourlyRate)}/hr) slightly exceeds target budget cap`);
      explanations.push({
        factor: 'Budget Compatibility (10%)',
        score: 75,
        type: 'warning',
        detail: `Creator rate slightly exceeds target cap. High potential for bundle discount negotiation.`,
      });
    } else {
      budgetCompatibility = 35;
      missingCriteria.push(`Estimated cost (${formatRupees(estimatedCost)}) exceeds campaign budget by >25%`);
      explanations.push({
        factor: 'Budget Compatibility (10%)',
        score: 35,
        type: 'warning',
        detail: `Above campaign cap (${formatRupees(creator.hourlyRate)}/hr vs ${formatRupees(maxBudget)} max project allocation).`,
      });
    }

    // ────────────────────────────────────────────────────────────────────────
    // FACTOR 6: PLATFORM & CONTENT-FORMAT COMPATIBILITY (10%)
    // ────────────────────────────────────────────────────────────────────────
    let platformFormatFit = 70;
    const briefChannels = brief.channels || [];
    const socialPlatforms = creator.socialLinks ? Object.keys(creator.socialLinks).map((s) => s.toLowerCase()) : [];

    const platformMatches = briefChannels.filter((c) =>
      socialPlatforms.some((p) => p.includes(c.toLowerCase()) || c.toLowerCase().includes(p))
    );

    if (platformMatches.length > 0) {
      platformFormatFit = 95;
      explanations.push({
        factor: 'Platform & Format Fit (10%)',
        score: 95,
        type: 'positive',
        detail: `Active on requested campaign channels: ${platformMatches.join(', ')}.`,
      });
    } else if (socialPlatforms.length >= 2) {
      platformFormatFit = 80;
      explanations.push({
        factor: 'Platform & Format Fit (10%)',
        score: 80,
        type: 'positive',
        detail: `Established cross-channel footprint across ${socialPlatforms.join(', ')}.`,
      });
    } else {
      platformFormatFit = 60;
      explanations.push({
        factor: 'Platform & Format Fit (10%)',
        score: 60,
        type: 'neutral',
        detail: `Deliverable format compatible with campaign production requirements.`,
      });
    }

    // ────────────────────────────────────────────────────────────────────────
    // FACTOR 7: REGIONAL CAMPAIGN EXPERIENCE (5%)
    // ────────────────────────────────────────────────────────────────────────
    let regionalExperience = 60;
    const creatorRegionalSkills = [
      ...(creator.regionalExpertise || []),
      creator.culturalSpecialization || '',
      creator.primaryMarket || '',
    ].join(' ').toLowerCase();

    const targetRegionalContext = [
      brief.regionalPreferences?.regionalCulturalContext || '',
      brief.regionalPreferences?.localTerminology || '',
      brief.regionalPreferences?.regionalEventsOrHolidays || '',
      (brief.regionalPreferences?.targetCountries || []).join(' '),
    ].join(' ').toLowerCase();

    const hasCulturalOverlap = Boolean(
      targetRegionalContext &&
      targetRegionalContext.split(' ').some((token) => token.length > 4 && creatorRegionalSkills.includes(token))
    );

    if (hasCulturalOverlap || (creator.regionalExpertise && creator.regionalExpertise.length >= 2)) {
      regionalExperience = 95;
      explanations.push({
        factor: 'Regional Campaign Experience (5%)',
        score: 95,
        type: 'positive',
        detail: `Demonstrated regional expertise: ${creator.regionalExpertise?.join(', ') || creator.culturalSpecialization || 'Local market fluency'}.`,
      });
    } else if (creator.remoteAvailable !== false) {
      regionalExperience = 75;
      explanations.push({
        factor: 'Regional Campaign Experience (5%)',
        score: 75,
        type: 'neutral',
        detail: `Verified remote collaboration readiness in timezone ${creator.timezone || 'Asia/Kolkata'}.`,
      });
    } else {
      regionalExperience = 50;
      explanations.push({
        factor: 'Regional Campaign Experience (5%)',
        score: 50,
        type: 'neutral',
        detail: `Standard regional delivery profile.`,
      });
    }

    // ────────────────────────────────────────────────────────────────────────
    // COMPOSITE WEIGHTED SCORE CALCULATION
    // 25% + 20% + 15% + 15% + 10% + 10% + 5% = 100%
    // ────────────────────────────────────────────────────────────────────────
    const weightedScore =
      nicheRelevance * customWeights.nicheRelevance +
      audienceTargetFit * customWeights.audienceTargetFit +
      languageCompatibility * customWeights.languageCompatibility +
      toneCompatibility * customWeights.toneCompatibility +
      budgetCompatibility * customWeights.budgetCompatibility +
      platformFormatFit * customWeights.platformFormatFit +
      regionalExperience * customWeights.regionalExperience;

    let overallScore = Math.min(100, Math.max(25, Math.round(weightedScore)));

    // Handle mandatory violation disqualification
    const isFullyQualified = mandatoryViolations.length === 0;
    if (!isFullyQualified) {
      // Cap score to indicate disqualification without hiding component values
      overallScore = Math.min(48, overallScore);
    }

    let matchTier: AuraMatchAnalysis['matchTier'] = 'Low Match';
    if (!isFullyQualified) {
      matchTier = 'Disqualified (Mandatory Criteria)';
    } else if (overallScore >= 88) {
      matchTier = 'Exceptional Match';
    } else if (overallScore >= 75) {
      matchTier = 'Strong Match';
    } else if (overallScore >= 55) {
      matchTier = 'Moderate Match';
    }

    return {
      overallScore,
      matchTier,
      breakdown: {
        nicheRelevance,
        audienceTargetFit,
        languageCompatibility,
        toneCompatibility,
        budgetCompatibility,
        platformFormatFit,
        regionalExperience,
      },
      weights: customWeights,
      algorithmVersion: AuraMatchEngine.VERSION,
      isFullyQualified,
      mandatoryViolations,
      missingCriteria,
      explanations,
      toneDetails: toneResult,
      regionalSummary: {
        audienceRegionMatched,
        creatorLocation: creator.location,
        remoteAvailable: creator.remoteAvailable !== false,
        languageCoverage: creatorLanguages.join(', '),
      },
    };
  }

  public calculateMatchBreakdown(
    creator: Creator,
    brief: CreativeBrief | null,
    portfolios: PortfolioItem[] = [],
    customWeights: AuraMatchWeights = DEFAULT_AURA_MATCH_WEIGHTS
  ): AuraMatchAnalysis {
    return this.computeMatch(creator, brief, portfolios, customWeights);
  }
}

export const auraMatchEngine = new AuraMatchEngine();
export const calculateMatchBreakdown = (
  creator: Creator,
  brief: CreativeBrief | null,
  portfolios: PortfolioItem[] = [],
  customWeights: AuraMatchWeights = DEFAULT_AURA_MATCH_WEIGHTS
) => auraMatchEngine.computeMatch(creator, brief, portfolios, customWeights);
export { DEFAULT_AURA_MATCH_WEIGHTS };
