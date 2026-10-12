/**
 * GenAura AI — Content Tone Matching Service
 * ============================================
 * Evaluates tone compatibility between brand campaign specifications and creator content.
 * Provides transparent, explainable scoring with distinct separation between
 * genuine style mismatches and insufficient portfolio evidence.
 *
 * Fully deterministic by default, with optional AI augmentation via Google Gemini.
 */
import type {
  Creator,
  PortfolioItem,
  ContentTone,
  CreatorToneProfile,
  CampaignTonePreferences,
} from '@/types';

export interface ToneMatchResult {
  score: number; // 0–100
  matchTier: 'Exceptional Tone Fit' | 'Strong Tone Fit' | 'Moderate Tone Fit' | 'Potential Tone Conflict' | 'Insufficient Evidence';
  matchedCharacteristics: string[];
  potentialMismatches: string[];
  supportingPortfolioExamples: string[];
  missingEvidence: string[];
  confidenceLevel: 'High' | 'Moderate' | 'Low' | 'Unknown';
  provenance: 'deterministic-rules' | 'ai-extracted';
  details: {
    toneOverlapScore: number;
    formalityCompatibility: number;
    energyCompatibility: number;
    formatAlignment: number;
    bioEvidenceScore: number;
  };
}

export const STANDARD_CONTENT_TONES: ContentTone[] = [
  'Professional',
  'Friendly',
  'Educational',
  'Inspirational',
  'Humorous',
  'Playful',
  'Premium or luxury',
  'Minimalist',
  'Bold',
  'Energetic',
  'Authentic or conversational',
  'Storytelling',
  'Youthful',
  'Traditional or heritage-focused',
  'Other',
];

/**
 * Normalizes text for keyword and tone concept matching
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
}

/**
 * Extracts tone signals from creator text (bio, tagline, skills, portfolio titles)
 */
export function extractToneKeywords(creator: Creator, portfolios: PortfolioItem[] = []): string[] {
  const textCorpus = [
    creator.bio || '',
    creator.tagline || '',
    (creator.skills || []).join(' '),
    (creator.regionalExpertise || []).join(' '),
    creator.culturalSpecialization || '',
    portfolios.map((p) => `${p.title} ${p.description} ${(p.tags || []).join(' ')}`).join(' '),
  ].join(' ').toLowerCase();

  const detected: string[] = [];
  const toneKeywordMap: Record<string, string[]> = {
    'Professional': ['corporate', 'b2b', 'enterprise', 'professional', 'executive', 'formal', 'strategic', 'compliance', 'structured'],
    'Friendly': ['approachable', 'friendly', 'warm', 'welcoming', 'kind', 'inviting', 'relatable', 'cheerful'],
    'Educational': ['tutorial', 'how to', 'deep dive', 'explainer', 'breakdown', 'tips', 'guide', 'insight', 'masterclass', 'educational', 'teaches'],
    'Inspirational': ['motivational', 'inspiring', 'transformation', 'empower', 'dream', 'journey', 'growth', 'elevate', 'vision'],
    'Humorous': ['comedy', 'skit', 'meme', 'hilarious', 'satire', 'funny', 'humor', 'parody', 'laugh', 'relatable humor'],
    'Playful': ['fun', 'playful', 'quirky', 'witty', 'game', 'interactive', 'lighthearted', 'whimsical'],
    'Premium or luxury': ['luxury', 'aesthetic', 'high-end', 'editorial', 'haute', 'sleek', 'premium', 'cinematic', 'artisan', 'curated'],
    'Minimalist': ['minimal', 'clean', 'simple', 'uncluttered', 'understated', 'modernist', 'minimalist'],
    'Bold': ['disruptive', 'bold', 'punchy', 'unapologetic', 'loud', 'vibrant', 'daring', 'provocative'],
    'Energetic': ['high energy', 'fast paced', 'hype', 'dynamic', 'intense', 'workout', 'kinetic', 'electric', 'vibrant'],
    'Authentic or conversational': ['authentic', 'conversational', 'pov', 'grwm', 'honest review', 'vlog', 'unfiltered', 'behind the scenes', 'candid', 'peer'],
    'Storytelling': ['narrative', 'story', 'journey', 'case study', 'docu', 'chronicle', 'character', 'storytelling', 'anecdote'],
    'Youthful': ['gen z', 'trendy', 'pop culture', 'tiktok native', 'viral', 'fresh', 'aesthetic', 'youth'],
    'Traditional or heritage-focused': ['heritage', 'traditional', 'cultural', 'vernacular', 'roots', 'artisan', 'indigenous', 'festive', 'classic'],
  };

  for (const [toneName, keywords] of Object.entries(toneKeywordMap)) {
    if (keywords.some((kw) => textCorpus.includes(kw))) {
      detected.push(toneName);
    }
  }

  return detected;
}

export class ToneMatchingService {
  /**
   * Evaluates compatibility between campaign tone preferences and a creator's declared & observed style.
   */
  public evaluateToneMatch(
    creator: Creator,
    preferences?: CampaignTonePreferences,
    portfolios: PortfolioItem[] = []
  ): ToneMatchResult {
    const desiredTones = preferences?.desiredTones || [];

    // Fallback if no specific tones requested by campaign
    if (desiredTones.length === 0) {
      return {
        score: 85,
        matchTier: 'Strong Tone Fit',
        matchedCharacteristics: ['Campaign has not restricted specific tone constraints.'],
        potentialMismatches: [],
        supportingPortfolioExamples: [],
        missingEvidence: [],
        confidenceLevel: 'Moderate',
        provenance: 'deterministic-rules',
        details: {
          toneOverlapScore: 85,
          formalityCompatibility: 85,
          energyCompatibility: 85,
          formatAlignment: 85,
          bioEvidenceScore: 85,
        },
      };
    }

    const matchedCharacteristics: string[] = [];
    const potentialMismatches: string[] = [];
    const supportingPortfolioExamples: string[] = [];
    const missingEvidence: string[] = [];

    // 1. TONE OVERLAP CALCULATION
    const declaredTones = creator.toneProfile?.declaredTones || [];
    const detectedTones = extractToneKeywords(creator, portfolios);
    const combinedCreatorTones = Array.from(new Set([...declaredTones, ...detectedTones]));

    const matchingTones = desiredTones.filter((dt) =>
      combinedCreatorTones.some((ct) => ct.toLowerCase() === dt.toLowerCase())
    );

    let toneOverlapScore = 0;
    if (desiredTones.length > 0) {
      const matchRatio = matchingTones.length / desiredTones.length;
      toneOverlapScore = Math.min(100, Math.round(matchRatio * 100));
    }

    if (matchingTones.length > 0) {
      matchedCharacteristics.push(
        `Aligns on requested tones: ${matchingTones.join(', ')}`
      );
    } else {
      potentialMismatches.push(
        `Creator's documented styles (${combinedCreatorTones.slice(0, 3).join(', ') || 'General'}) do not explicitly cover target tones: ${desiredTones.join(', ')}`
      );
    }

    // 2. FORMALITY COMPATIBILITY
    const targetFormality = preferences?.formalityLevel || 'balanced';
    const creatorFormality = creator.toneProfile?.formalityLevel || 'balanced';
    let formalityCompatibility = 100;

    if (targetFormality === creatorFormality) {
      formalityCompatibility = 100;
      matchedCharacteristics.push(`Formality level directly matches: '${targetFormality}'`);
    } else if (
      (targetFormality === 'balanced' && ['casual', 'formal'].includes(creatorFormality)) ||
      (creatorFormality === 'balanced' && ['casual', 'formal'].includes(targetFormality))
    ) {
      formalityCompatibility = 80;
    } else {
      // Direct clash: casual vs formal
      formalityCompatibility = 40;
      potentialMismatches.push(
        `Formality gap: Campaign requests '${targetFormality}' while creator is oriented toward '${creatorFormality}'`
      );
    }

    // 3. ENERGY LEVEL COMPATIBILITY
    const targetEnergy = preferences?.energyLevel || 'moderate';
    const creatorEnergy = creator.toneProfile?.energyLevel || 'moderate';
    let energyCompatibility = 100;

    if (targetEnergy === creatorEnergy) {
      energyCompatibility = 100;
      matchedCharacteristics.push(`Energy cadence directly aligns: '${targetEnergy}'`);
    } else if (
      (targetEnergy === 'moderate' && ['relaxed', 'high-energy'].includes(creatorEnergy)) ||
      (creatorEnergy === 'moderate' && ['relaxed', 'high-energy'].includes(targetEnergy))
    ) {
      energyCompatibility = 80;
    } else {
      energyCompatibility = 50;
      potentialMismatches.push(
        `Pacing variance: Campaign requires '${targetEnergy}' energy, creator typically delivers '${creatorEnergy}'`
      );
    }

    // 4. PORTFOLIO EVIDENCE & SUPPORTING SAMPLES
    portfolios.forEach((item) => {
      const itemText = `${item.title} ${item.description} ${(item.tags || []).join(' ')}`.toLowerCase();
      const hasToneSignal = desiredTones.some((t) => itemText.includes(t.toLowerCase().split(' ')[0]));
      if (hasToneSignal && supportingPortfolioExamples.length < 3) {
        supportingPortfolioExamples.push(`"${item.title}" (${item.mediaType}): reflects requested tone cues`);
      }
    });

    // 5. MISSING EVIDENCE DETECTION (DO NOT PENALIZE UNNECESSARILY)
    const hasExplicitToneProfile = Boolean(creator.toneProfile && creator.toneProfile.declaredTones.length > 0);
    const hasPortfolioSamples = portfolios.length > 0;

    if (!hasExplicitToneProfile) {
      missingEvidence.push('Creator has not self-declared a detailed tone profile; estimated from public bio/skills.');
    }
    if (!hasPortfolioSamples) {
      missingEvidence.push('No uploaded portfolio items found to cross-reference delivery style with samples.');
    }
    if (preferences?.brandVoiceDescription && !creator.toneProfile?.brandAlignment?.length) {
      missingEvidence.push('Brand voice constraints have not been verified through prior brand case studies.');
    }

    // Determine confidence level
    let confidenceLevel: ToneMatchResult['confidenceLevel'] = 'Low';
    if (hasExplicitToneProfile && hasPortfolioSamples && supportingPortfolioExamples.length >= 2) {
      confidenceLevel = 'High';
    } else if (hasExplicitToneProfile || hasPortfolioSamples) {
      confidenceLevel = 'Moderate';
    } else if (combinedCreatorTones.length === 0) {
      confidenceLevel = 'Unknown';
    }

    // Calculate weighted overall tone score:
    // 50% Tone overlap + 25% Formality + 25% Energy
    let rawScore = Math.round(
      toneOverlapScore * 0.50 +
      formalityCompatibility * 0.25 +
      energyCompatibility * 0.25
    );

    // If confidence is unknown and there is literally 0 tone evidence, provide neutral baseline without false penalty
    if (confidenceLevel === 'Unknown' || (combinedCreatorTones.length === 0 && !hasPortfolioSamples)) {
      rawScore = 60; // neutral unpenalized score
    }

    // Enforce bounds
    const score = Math.max(20, Math.min(100, rawScore));

    let matchTier: ToneMatchResult['matchTier'] = 'Potential Tone Conflict';
    if (confidenceLevel === 'Unknown') {
      matchTier = 'Insufficient Evidence';
    } else if (score >= 88) {
      matchTier = 'Exceptional Tone Fit';
    } else if (score >= 75) {
      matchTier = 'Strong Tone Fit';
    } else if (score >= 55) {
      matchTier = 'Moderate Tone Fit';
    }

    return {
      score,
      matchTier,
      matchedCharacteristics,
      potentialMismatches,
      supportingPortfolioExamples,
      missingEvidence,
      confidenceLevel,
      provenance: creator.toneProfile?.isAIExtracted ? 'ai-extracted' : 'deterministic-rules',
      details: {
        toneOverlapScore,
        formalityCompatibility,
        energyCompatibility,
        formatAlignment: 85,
        bioEvidenceScore: hasPortfolioSamples ? 90 : 60,
      },
    };
  }
}

export const toneMatchingService = new ToneMatchingService();
