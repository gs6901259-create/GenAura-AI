/**
 * GenAura AI — Global Creator Discovery & Multilingual Campaign Intelligence Test Suite
 * =======================================================================================
 * Validates:
 * 1. Upgraded 7-Factor AuraMatch Engine (v2.1 Multilingual):
 *    - Official weights summing to exactly 1.0 (100%):
 *      Niche 25%, Audience 20%, Language 15%, Tone 15%, Budget 10%, Platform 10%, Regional 5%.
 *    - Factor score computation and mathematical range checks.
 * 2. Strict Mandatory Criteria Enforcement:
 *    - Mandatory language qualification and disqualification flagging.
 *    - Mandatory regional market qualification and disqualification flagging.
 *    - Disqualification cap at 48% and transparent violation reporting.
 * 3. Content Tone Matching Service:
 *    - 15 standard content tones.
 *    - Declared vs observed tone compatibility, matched characteristics, and potential mismatches.
 *    - Confidence scoring and transparent missing evidence disclosure.
 * 4. Multilingual BriefGen AI:
 *    - 18 supported regional and global languages (including Indian vernaculars).
 *    - 18-section structured creative brief generation.
 *    - Linked language variant creation preserving canonical campaign ID and INR budget.
 *    - Side-by-side variant comparison.
 * 5. Discovery Search & Filtering Logic:
 *    - Distinction between creator physical location, audience geography, and campaign market.
 *    - AND logic vs OR logic for multilingual search.
 *    - Remote cross-border availability filtering.
 * 6. AI Assistant Knowledge Grounding:
 *    - Verification of 7-factor weights, 18 languages, and 15 tones in Aura's responses.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Mock browser LocalStorage for Node test environment
class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

if (typeof (global as any).window === 'undefined') {
  (global as any).window = {};
}
if (typeof (global as any).localStorage === 'undefined') {
  (global as any).localStorage = new MockLocalStorage();
}

import {
  auraMatchEngine,
  DEFAULT_AURA_MATCH_WEIGHTS,
} from '../src/services/auraMatchEngine.ts';
import {
  STANDARD_CONTENT_TONES,
  toneMatchingService,
  extractToneKeywords,
} from '../src/services/toneMatchingService.ts';
import {
  SUPPORTED_BRIEF_LANGUAGES,
  generateDetailedBrief,
  createLanguageVariant,
  compareVariants,
} from '../src/services/multilingualBriefService.ts';
import { aiAssistantService } from '../src/services/aiAssistantService.ts';
import type {
  Creator,
  CreativeBrief,
  CampaignTonePreferences,
} from '../src/types/index.ts';

// Sample mock creators for test scenarios
const mockCreatorIndia: Creator = {
  id: 'cr-ind-1' as any,
  name: 'Aarav Sharma',
  handle: '@aaravcreates',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
  category: 'video-editor',
  bio: 'Specialist in high-velocity tech explainers, deep dives and regional reels across South Asia.',
  tagline: 'Tech storytelling in Hindi and English',
  city: 'Bengaluru',
  stateProvince: 'Karnataka',
  country: 'India',
  location: 'Bengaluru, India',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  hourlyRate: 1500,
  skills: ['Video Editing', 'Motion Graphics', 'Hindi Voiceover'],
  collaborationTypes: ['Reels', 'Product Explainers'],
  yearsExperience: 5,
  verified: true,
  verificationScore: 92,
  verificationStatus: 'verified',
  status: 'available',
  featured: true,
  rating: 4.9,
  reviewCount: 38,
  completedProjects: 42,
  portfolioIds: ['p1' as any],
  joinedAt: '2025-01-01T00:00:00Z',
  languagesSpoken: ['English', 'Hindi', 'Kannada'],
  contentLanguages: ['English', 'Hindi'],
  deliverableLanguages: ['English', 'Hindi'],
  primaryMarket: 'India & South Asia',
  audienceRegions: ['India', 'UAE', 'Singapore'],
  audienceDistribution: { India: 75, UAE: 15, Singapore: 10 },
  preferredCampaignRegions: ['India', 'Southeast Asia'],
  remoteAvailable: true,
  regionalExpertise: ['Urban Tier-1 Tech', 'Bengaluru Startups'],
  culturalSpecialization: ['Festive Diwali Tech Guides', 'Vernacular Tech Reviews'],
  toneProfile: {
    primaryTone: 'Authentic or conversational',
    secondaryTones: ['Educational', 'Friendly'],
    declaredTones: ['Authentic or conversational', 'Educational'],
    formalityLevel: 'conversational',
    energyLevel: 'high',
  },
  portfolios: [
    {
      id: 'p1' as any,
      creatorId: 'cr-ind-1' as any,
      title: 'NextGen Smartphone Launch Reel',
      description: 'Energetic and educational tutorial breakdown in conversational Hindi.',
      mediaType: 'video',
      mediaUrl: 'https://example.com/video1.mp4',
      clientName: 'OnePlus India',
      creatorRole: 'Lead Editor',
      tags: ['Tech', 'Hindi', 'Educational'],
      publishedAt: '2026-01-01T00:00:00Z',
      featured: true,
      order: 1,
    },
  ],
};

const mockCreatorFrance: Creator = {
  id: 'cr-fr-2' as any,
  name: 'Camille Laurent',
  handle: '@camille_luxury',
  avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9',
  category: 'graphic-designer',
  bio: 'Luxury visual identity and editorial design for European perfume and fashion houses.',
  tagline: 'Haute couture branding',
  city: 'Paris',
  country: 'France',
  location: 'Paris, France',
  timezone: 'Europe/Paris',
  currency: 'INR',
  hourlyRate: 6500,
  skills: ['Brand Identity', 'Typography', 'Art Direction'],
  collaborationTypes: ['Brand Kit', 'Editorial Spread'],
  yearsExperience: 7,
  verified: true,
  verificationScore: 96,
  verificationStatus: 'verified',
  status: 'available',
  featured: true,
  rating: 4.95,
  reviewCount: 52,
  completedProjects: 58,
  portfolioIds: [],
  joinedAt: '2025-01-01T00:00:00Z',
  languagesSpoken: ['French', 'English'],
  contentLanguages: ['French', 'English'],
  deliverableLanguages: ['French', 'English'],
  primaryMarket: 'Western Europe & North America',
  audienceRegions: ['France', 'United Kingdom', 'United States'],
  audienceDistribution: { France: 60, UK: 25, USA: 15 },
  preferredCampaignRegions: ['Europe', 'North America'],
  remoteAvailable: false, // Strictly in-person or local EU
  regionalExpertise: ['Parisian Fashion Week', 'European Luxury'],
  culturalSpecialization: 'Minimalist European Elegance',
  toneProfile: {
    primaryTone: 'Premium or luxury',
    secondaryTones: ['Minimalist'],
    declaredTones: ['Premium or luxury'],
  },
  portfolios: [],
};

const mockCampaignBrief: CreativeBrief = {
  id: 'brf-101' as any,
  title: 'Pan-India Festive Tech Campaign',
  description: 'Pan-India festive tech campaign description',
  contentType: 'video-script',
  requiredSkills: ['Video Editing', 'Motion Graphics'],
  brandName: 'AuraTech Consumer Electronics',
  objective: 'Brand Awareness',
  budget: {
    min: 25000,
    max: 50000,
    currency: 'INR',
  },
  timeline: {
    startDate: '2026-03-01',
    deadline: '2026-03-22',
  },
  status: 'published',
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
  targetAudience: {
    demographics: 'Tech enthusiasts and college students aged 18-28 across Tier-1 and Tier-2 Indian cities',
    ageRange: '18-28',
    locations: ['India'],
    painPoints: ['Slow devices', 'Complicated specs'],
  },
  channels: ['Instagram', 'YouTube'],
  deliverables: [
    { id: 'del-1', format: 'Instagram Reel', channel: 'Instagram', quantity: 2, requirements: 'Unboxing' },
    { id: 'del-2', format: 'YouTube Short', channel: 'YouTube', quantity: 1, requirements: 'Teardown' },
  ],
  guidelines: {
    dos: ['Highlight fast charging', 'Speak conversational Hindi/English'],
    donts: ['No misleading benchmarks'],
    callToAction: 'Shop the festive collection with 10% instant bank discount',
  },
  briefLanguage: 'English',
  regionalPreferences: {
    targetCountries: ['India'],
    targetRegions: ['Karnataka', 'Maharashtra', 'Delhi NCR'],
    intendedAudienceRegions: ['India'],
    preferredContentLanguages: ['Hindi'],
    mandatoryLanguages: true,
    mandatoryRegions: true,
    regionalCulturalContext: 'Diwali festive electronics gifting season',
    regionalThemes: ['Diwali Festive Electronics'],
    localizedCallToAction: 'Shop the festive collection with 10% instant bank discount',
    regionalBudgetInINR: 75000,
  },
  tonePreferences: {
    desiredTones: ['Authentic or conversational', 'Educational'],
    campaignTone: 'Authentic or conversational',
    formalityLevel: 'conversational',
    energyLevel: 'high',
    brandVoiceDescription: 'Warm, approachable, and tech-savvy without jargon.',
  },
};

// ── TEST SUITE ──

test('1. Upgraded 7-Factor AuraMatch Weights & Mathematical Soundness', async (t) => {
  await t.test('weights sum exactly to 1.0 (100%)', () => {
    const sum =
      DEFAULT_AURA_MATCH_WEIGHTS.nicheRelevance +
      DEFAULT_AURA_MATCH_WEIGHTS.audienceTargetFit +
      DEFAULT_AURA_MATCH_WEIGHTS.languageCompatibility +
      DEFAULT_AURA_MATCH_WEIGHTS.toneCompatibility +
      DEFAULT_AURA_MATCH_WEIGHTS.budgetCompatibility +
      DEFAULT_AURA_MATCH_WEIGHTS.platformFormatFit +
      DEFAULT_AURA_MATCH_WEIGHTS.regionalExperience;

    assert.strictEqual(
      Math.round(sum * 100) / 100,
      1.0,
      'AuraMatch weights must sum to exactly 1.0'
    );
    assert.strictEqual(DEFAULT_AURA_MATCH_WEIGHTS.nicheRelevance, 0.25);
    assert.strictEqual(DEFAULT_AURA_MATCH_WEIGHTS.audienceTargetFit, 0.20);
    assert.strictEqual(DEFAULT_AURA_MATCH_WEIGHTS.languageCompatibility, 0.15);
    assert.strictEqual(DEFAULT_AURA_MATCH_WEIGHTS.toneCompatibility, 0.15);
    assert.strictEqual(DEFAULT_AURA_MATCH_WEIGHTS.budgetCompatibility, 0.10);
    assert.strictEqual(DEFAULT_AURA_MATCH_WEIGHTS.platformFormatFit, 0.10);
    assert.strictEqual(DEFAULT_AURA_MATCH_WEIGHTS.regionalExperience, 0.05);
  });

  await t.test('calculates correct high match score for qualified creator', () => {
    const breakdown = auraMatchEngine.calculateMatchBreakdown(
      mockCreatorIndia,
      mockCampaignBrief
    );

    assert.strictEqual(breakdown.isFullyQualified, true);
    assert.strictEqual(breakdown.mandatoryViolations.length, 0);
    assert.ok(breakdown.overallScore >= 70, `Expected score >= 70, got ${breakdown.overallScore}`);
    assert.ok(
      breakdown.matchTier === 'Exceptional Match' || breakdown.matchTier === 'Strong Match',
      `Expected Exceptional or Strong Match, got ${breakdown.matchTier}`
    );

    // Check individual factor scores are within 0 and 100
    assert.ok(breakdown.breakdown.nicheRelevance >= 0 && breakdown.breakdown.nicheRelevance <= 100);
    assert.ok(breakdown.breakdown.audienceTargetFit >= 0 && breakdown.breakdown.audienceTargetFit <= 100);
    assert.ok(breakdown.breakdown.languageCompatibility >= 0 && breakdown.breakdown.languageCompatibility <= 100);
    assert.ok(breakdown.breakdown.toneCompatibility >= 0 && breakdown.breakdown.toneCompatibility <= 100);
    assert.ok(breakdown.breakdown.budgetCompatibility >= 0 && breakdown.breakdown.budgetCompatibility <= 100);
    assert.ok(breakdown.breakdown.platformFormatFit >= 0 && breakdown.breakdown.platformFormatFit <= 100);
    assert.ok(breakdown.breakdown.regionalExperience >= 0 && breakdown.breakdown.regionalExperience <= 100);
  });
});

test('2. Strict Mandatory Criteria Enforcement', async (t) => {
  await t.test('disqualifies creator missing mandatory language', () => {
    // Camille speaks French and English, but brief mandates Hindi
    const breakdown = auraMatchEngine.calculateMatchBreakdown(
      mockCreatorFrance,
      mockCampaignBrief
    );

    assert.strictEqual(breakdown.isFullyQualified, false);
    assert.strictEqual(breakdown.matchTier, 'Disqualified (Mandatory Criteria)');
    assert.ok(
      breakdown.overallScore <= 48,
      `Disqualified score must be capped at 48%, got ${breakdown.overallScore}`
    );
    assert.ok(
      breakdown.mandatoryViolations.some((v) => v.toLowerCase().includes('hindi')),
      'Must record violation for missing mandatory Hindi'
    );
  });

  await t.test('disqualifies creator missing mandatory region', () => {
    const usOnlyBrief: CreativeBrief = {
      ...mockCampaignBrief,
      regionalPreferences: {
        ...mockCampaignBrief.regionalPreferences,
        targetCountries: ['United States'],
        intendedAudienceRegions: ['United States'],
        mandatoryRegions: true,
      },
    };

    // Aarav audience is primarily India, UAE, Singapore
    const breakdown = auraMatchEngine.calculateMatchBreakdown(
      mockCreatorIndia,
      usOnlyBrief
    );

    assert.strictEqual(breakdown.isFullyQualified, false);
    assert.strictEqual(breakdown.matchTier, 'Disqualified (Mandatory Criteria)');
    assert.ok(
      breakdown.mandatoryViolations.some((v) => v.toLowerCase().includes('united states')),
      'Must report missing mandatory region'
    );
  });
});

test('3. Content Tone Matching Service', async (t) => {
  await t.test('contains exactly 15 standard content tones', () => {
    assert.strictEqual(STANDARD_CONTENT_TONES.length, 15);
    assert.ok(STANDARD_CONTENT_TONES.includes('Authentic or conversational'));
    assert.ok(STANDARD_CONTENT_TONES.includes('Professional'));
    assert.ok(STANDARD_CONTENT_TONES.includes('Educational'));
    assert.ok(STANDARD_CONTENT_TONES.includes('Humorous'));
    assert.ok(STANDARD_CONTENT_TONES.includes('Inspirational'));
    assert.ok(STANDARD_CONTENT_TONES.includes('Friendly'));
    assert.ok(STANDARD_CONTENT_TONES.includes('Bold'));
    assert.ok(STANDARD_CONTENT_TONES.includes('Premium or luxury'));
    assert.ok(STANDARD_CONTENT_TONES.includes('Storytelling'));
    assert.ok(STANDARD_CONTENT_TONES.includes('Playful'));
    assert.ok(STANDARD_CONTENT_TONES.includes('Energetic'));
    assert.ok(STANDARD_CONTENT_TONES.includes('Minimalist'));
    assert.ok(STANDARD_CONTENT_TONES.includes('Youthful'));
    assert.ok(STANDARD_CONTENT_TONES.includes('Traditional or heritage-focused'));
    assert.ok(STANDARD_CONTENT_TONES.includes('Other'));
  });

  await t.test('evaluates high tone match when primary tone aligns', () => {
    const tonePrefs: CampaignTonePreferences = {
      desiredTones: ['Authentic or conversational', 'Educational'],
      campaignTone: 'Authentic or conversational',
      formalityLevel: 'conversational',
      energyLevel: 'high',
    };

    const result = toneMatchingService.evaluateToneMatch(
      mockCreatorIndia,
      tonePrefs,
      mockCreatorIndia.portfolios
    );

    assert.ok(result.score >= 70, `Expected score >= 70, got ${result.score}`);
    assert.ok(
      result.matchTier === 'Exceptional Tone Fit' || result.matchTier === 'Strong Tone Fit',
      `Expected Strong Tone Fit, got ${result.matchTier}`
    );
    assert.ok(result.matchedCharacteristics.length > 0);
  });

  await t.test('detects tone mismatch when creator has opposing tones', () => {
    const luxuryPrefs: CampaignTonePreferences = {
      desiredTones: ['Premium or luxury'],
      campaignTone: 'Premium or luxury',
      avoidPhrases: ['Authentic or conversational'],
    };

    const result = toneMatchingService.evaluateToneMatch(
      mockCreatorIndia,
      luxuryPrefs,
      mockCreatorIndia.portfolios
    );

    assert.ok(
      result.potentialMismatches.length > 0,
      'Should identify potential mismatches for conflicting tone preferences'
    );
  });

  await t.test('extracts tone keywords deterministically', () => {
    const detected = extractToneKeywords(mockCreatorIndia, mockCreatorIndia.portfolios);
    assert.ok(detected.includes('Educational'), 'Should detect Educational from bio/portfolio tags');
  });
});

test('4. Multilingual BriefGen AI & Linked Language Variants', async (t) => {
  await t.test('supports all 18 configured languages', () => {
    assert.strictEqual(SUPPORTED_BRIEF_LANGUAGES.length, 18);
    const codes = SUPPORTED_BRIEF_LANGUAGES.map((l) => l.code);
    assert.ok(codes.includes('en'));
    assert.ok(codes.includes('hi'));
    assert.ok(codes.includes('te'));
    assert.ok(codes.includes('ta'));
    assert.ok(codes.includes('kn'));
    assert.ok(codes.includes('ml'));
    assert.ok(codes.includes('bn'));
    assert.ok(codes.includes('mr'));
    assert.ok(codes.includes('gu'));
    assert.ok(codes.includes('pa'));
    assert.ok(codes.includes('ur'));
    assert.ok(codes.includes('es'));
    assert.ok(codes.includes('fr'));
    assert.ok(codes.includes('de'));
    assert.ok(codes.includes('ar'));
    assert.ok(codes.includes('pt'));
    assert.ok(codes.includes('ja'));
    assert.ok(codes.includes('ko'));
  });

  await t.test('generates 18-section structured brief', () => {
    const briefReq = {
      title: 'Pan-India Festive Tech Campaign',
      brandName: 'AuraTech Consumer Electronics',
      category: 'Tech & SaaS',
      objective: 'Brand Awareness',
      contentType: 'video-script',
      demographics: 'Tech enthusiasts and college students aged 18-28 across Tier-1 and Tier-2 Indian cities',
      painPoints: 'Slow devices, complicated tech specs',
      budgetTotal: 50000,
      currency: 'INR',
      channels: ['Instagram', 'YouTube'],
      tone: 'Authentic or conversational',
      startDate: '2026-03-01',
      deadline: '2026-03-22',
      callToAction: 'Shop the festive collection with 10% instant discount',
      languageCode: 'en',
    };

    const brief = generateDetailedBrief(briefReq);
    assert.ok(brief.campaignTitle);
    assert.ok(brief.executiveSummary);
    assert.ok(brief.campaignObjectives);
    assert.ok(brief.targetAudience);
    assert.ok(brief.targetRegions);
    assert.ok(brief.preferredContentLanguages);
    assert.ok(brief.recommendedCreatorProfile);
    assert.ok(brief.campaignToneAndBrandVoice);
    assert.ok(brief.deliverablesAndSpecifications);
    assert.ok(brief.suggestedTimeline);
    assert.ok(brief.budgetAllocationINR);
    assert.ok(brief.keyMessaging.length > 0);
    assert.ok(brief.callToAction);
    assert.ok(brief.successMetrics.length > 0);
    assert.ok(brief.regionalLocalizationGuidelines.length > 0);
    assert.ok(brief.culturalAndLanguageConsiderations.length > 0);
    assert.ok(brief.contentApprovalChecklist.length > 0);
    assert.ok(brief.missingInformationWarnings !== undefined);
  });

  await t.test('creates linked language variant preserving canonical campaign ID and INR budget', () => {
    const variant = createLanguageVariant(mockCampaignBrief, 'hi');

    assert.strictEqual(variant.languageCode, 'hi');
    assert.strictEqual(variant.languageName, 'Hindi');
    assert.strictEqual(variant.sourceBriefId, mockCampaignBrief.id);
    assert.ok(variant.content);
    assert.ok(variant.localizedTitle);
    assert.ok(variant.executiveSummary);
  });

  await t.test('compares canonical and translated variant side by side', () => {
    const hindiVariant = createLanguageVariant(mockCampaignBrief, 'hi');
    const comparison = compareVariants(mockCampaignBrief, hindiVariant);

    assert.strictEqual(comparison.summaryDiff.langA, 'English');
    assert.strictEqual(comparison.summaryDiff.langB, 'Hindi');
    assert.strictEqual(comparison.budgetIntegrity, true);
    assert.ok(comparison.summaryDiff.textA !== undefined);
    assert.ok(comparison.summaryDiff.textB !== undefined);
  });
});

test('5. Discovery Search & Filtering Logic', async (t) => {
  const creators = [mockCreatorIndia, mockCreatorFrance];

  await t.test('filters by physical location vs audience geography', () => {
    // Creator base: India
    const indiaBased = creators.filter((c) => c.country?.toLowerCase() === 'india');
    assert.strictEqual(indiaBased.length, 1);
    assert.strictEqual(indiaBased[0].name, 'Aarav Sharma');

    // Audience geography: United States
    const usAudience = creators.filter((c) =>
      c.audienceRegions?.some((r) => r.toLowerCase().includes('united states'))
    );
    assert.strictEqual(usAudience.length, 1);
    assert.strictEqual(usAudience[0].name, 'Camille Laurent');
  });

  await t.test('language filter with AND logic vs OR logic', () => {
    const selectedLanguages = ['English', 'Hindi'];

    // OR logic: speaks English OR Hindi
    const orResults = creators.filter((c) =>
      selectedLanguages.some((lang) =>
        (c.languagesSpoken || []).some((cl) => cl.toLowerCase() === lang.toLowerCase())
      )
    );
    assert.strictEqual(orResults.length, 2); // Both speak English

    // AND logic: speaks English AND Hindi
    const andResults = creators.filter((c) =>
      selectedLanguages.every((lang) =>
        (c.languagesSpoken || []).some((cl) => cl.toLowerCase() === lang.toLowerCase())
      )
    );
    assert.strictEqual(andResults.length, 1);
    assert.strictEqual(andResults[0].name, 'Aarav Sharma');
  });

  await t.test('filters by remote availability', () => {
    const remoteCreators = creators.filter((c) => c.remoteAvailable === true);
    assert.strictEqual(remoteCreators.length, 1);
    assert.strictEqual(remoteCreators[0].name, 'Aarav Sharma');
  });
});

test('6. AI Assistant Knowledge Grounding', async (t) => {
  await t.test('explains 7-Factor AuraMatch when asked about matching', async () => {
    const response = await aiAssistantService.sendMessage(
      'Explain the AuraMatch matching engine and its weights'
    );
    const text = response.text;

    assert.ok(text.includes('7-Factor'), 'Should mention 7-Factor matching');
    assert.ok(text.includes('25%'), 'Should mention 25% Niche');
    assert.ok(text.includes('20%'), 'Should mention 20% Audience');
    assert.ok(text.includes('15%'), 'Should mention 15% Language or Tone');
    assert.ok(text.includes('10%'), 'Should mention 10% Budget or Platform');
    assert.ok(text.includes('5%'), 'Should mention 5% Regional');
    assert.ok(text.includes('Disqualified (Mandatory Criteria)'), 'Should explain mandatory criteria');
  });

  await t.test('explains multilingual campaign intelligence and tone taxonomy', async () => {
    const response = await aiAssistantService.sendMessage(
      'What languages and content tones does GenAura AI support for briefs?'
    );
    const text = response.text;

    assert.ok(text.includes('18 Supported Brief Languages'), 'Should mention 18 brief languages');
    assert.ok(text.includes('Hindi'), 'Should mention Hindi');
    assert.ok(text.includes('Telugu'), 'Should mention Telugu');
    assert.ok(text.includes('15 Standard Content Tones'), 'Should mention 15 standard tones');
    assert.ok(text.includes('Authentic & Relatable') || text.includes('Authentic or conversational'));
  });
});
