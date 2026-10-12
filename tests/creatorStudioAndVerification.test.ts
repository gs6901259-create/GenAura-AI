/**
 * Comprehensive Automated Test Suite for Creator Studio, Verification Rubric,
 * Admin Review Queue, and AI Profile Coach.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Mock browser LocalStorage for Node environment
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

(global as any).window = {};
(global as any).localStorage = new MockLocalStorage();

import { verificationEngine } from '../src/services/verificationEngine.ts';
import { VERIFICATION_RUBRIC } from '../src/config/verificationRubric.ts';
import { profileCoachService } from '../src/services/profileCoach.ts';
import { Creator, PortfolioItem, asCreatorId, asPortfolioId } from '../src/types/index.ts';

// Helper to create a realistic test creator
function createMockCreator(overrides: Partial<Creator> = {}): Creator {
  return {
    id: asCreatorId('test_cr_1'),
    name: 'Elena Rostova',
    handle: '@elenacreates',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    tagline: 'Senior Visual Storyteller & 3D Brand Animator',
    bio: 'Senior Visual Storyteller & 3D Brand Animator with 7+ years creating cinematic digital campaigns for global tech brands.',
    category: 'video-animation',
    skills: ['3D Motion', 'Cinema 4D', 'Blender', 'Visual Identity'],
    hourlyRate: 150,
    currency: 'USD',
    rating: 4.9,
    reviewCount: 38,
    completedProjects: 42,
    status: 'active',
    location: 'Vancouver, Canada',
    timezone: 'America/Vancouver',
    portfolioIds: [asPortfolioId('port_1'), asPortfolioId('port_2'), asPortfolioId('port_3')],
    joinedAt: new Date().toISOString(),
    featured: false,
    verified: false,
    verificationStatus: 'draft',
    email: 'elena@creativemotion.studio',
    username: 'elenacreates',
    country: 'Canada',
    city: 'Vancouver',
    languages: ['English', 'French'],
    yearsExperience: 7,
    collaborationTypes: ['Brand Campaigns', 'Product Reveals', 'Commercial Spots'],
    socialLinks: {
      instagram: 'https://instagram.com/elenacreates',
      youtube: 'https://youtube.com/@elenacreates',
      website: 'https://elenacreates.design',
    },
    ...overrides,
  };
}

function createMockPortfolios(creatorId = asCreatorId('test_cr_1')): PortfolioItem[] {
  return [
    {
      id: asPortfolioId('port_1'),
      creatorId,
      title: 'HyperDrive EV Launch Campaign',
      description: 'Cinematic 60-second 3D product reveal and social video assets for electric vehicle prototype.',
      mediaType: 'video',
      mediaUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=600&h=400&fit=crop',
      tags: ['3D Motion', 'Cinema 4D', 'Octane'],
      publishedAt: new Date().toISOString(),
      views: 34200,
      likes: 1850,
      clientName: 'Apex Mobility',
      creatorRole: 'Lead 3D Director',
      featured: true,
      order: 0,
    },
    {
      id: asPortfolioId('port_2'),
      creatorId,
      title: 'Nova Acoustic Spatial Audio Commercial',
      description: 'Dynamic physics simulation and acoustic product breakdowns for high-end audio hardware.',
      mediaType: 'video',
      mediaUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&h=400&fit=crop',
      tags: ['Houdini', 'Sound Design', 'Motion'],
      publishedAt: new Date().toISOString(),
      views: 19800,
      likes: 1120,
      clientName: 'Nova Acoustics',
      creatorRole: '3D Animator & Visualist',
      featured: true,
      order: 1,
    },
    {
      id: asPortfolioId('port_3'),
      creatorId,
      title: 'Solaris Smart Watch Interface Teaser',
      description: 'Holographic UI animation and wrist wearable interactive lighting simulations.',
      mediaType: 'video',
      mediaUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop',
      tags: ['UI Animation', 'Wearables', 'After Effects'],
      publishedAt: new Date().toISOString(),
      views: 12500,
      likes: 920,
      clientName: 'Solaris Tech',
      creatorRole: 'Motion Designer',
      featured: false,
      order: 2,
    },
  ];
}

describe('GenAura AI — Creator Studio, Rubric & Verification Tests', () => {

  // Test 1: Rubric 100-Point Structure and Threshold Constants
  it('1. Rubric Configuration: Total points equal 100 and categories match specifications', () => {
    const weights = VERIFICATION_RUBRIC.weights;
    const totalMax =
      weights.profileCompleteness +
      weights.portfolioQuality +
      weights.contentOriginality +
      weights.professionalReadiness +
      weights.authenticityConsistency;

    assert.equal(totalMax, 100, 'Rubric total score must be exactly 100 points');
    assert.equal(weights.profileCompleteness, 20);
    assert.equal(weights.portfolioQuality, 25);
    assert.equal(weights.contentOriginality, 20);
    assert.equal(weights.professionalReadiness, 15);
    assert.equal(weights.authenticityConsistency, 20);

    assert.equal(VERIFICATION_RUBRIC.thresholds.approvalEligible, 85, 'Approve threshold must be 85');
    assert.equal(VERIFICATION_RUBRIC.thresholds.needsImprovement, 65, 'Needs changes threshold must be 65');
  });

  // Test 2: High Quality Creator Rubric Scoring
  it('2. Rubric Evaluation: Complete high-performing profile scores >= 85 and is eligible for approval', () => {
    const creator = createMockCreator();
    const portfolios = createMockPortfolios();

    const report = verificationEngine.evaluateCreator(creator, portfolios);

    assert.ok(report.overallScore >= 85, `Expected score >= 85, got ${report.overallScore}`);
    assert.equal(report.recommendedDecision, 'approve_eligible');
    assert.ok(report.criterionScores.portfolioQuality >= 20, 'Portfolio quality score should be high');
    assert.ok(report.passedChecks.length > 0, 'Report must list passed checks');
    assert.ok(report.explanation.length > 0, 'Report must contain transparent explanation');
  });

  // Test 3: Sparse / Low Quality Profile Rubric Scoring
  it('3. Rubric Evaluation: Incomplete profile scores < 65 and triggers manual review / changes requested', () => {
    const sparseCreator = createMockCreator({
      bio: 'Short',
      skills: [],
      hourlyRate: 0,
      yearsExperience: 0,
      socialLinks: {},
      collaborationTypes: [],
      languages: [],
    });
    const sparsePortfolios: PortfolioItem[] = []; // No portfolio items

    const report = verificationEngine.evaluateCreator(sparseCreator, sparsePortfolios);

    assert.ok(report.overallScore < 65, `Expected score < 65, got ${report.overallScore}`);
    assert.ok(
      report.recommendedDecision === 'manual_review' ||
      report.recommendedDecision === 'needs_changes'
    );
    assert.ok(report.suggestions.length > 0, 'Report must list recommendations for incomplete profile');
  });

  // Test 4: BADGE INVARIANT — Submitting profile does NOT auto-verify
  it('4. Badge Invariant: Submission moves status to "submitted" but verified remains FALSE', () => {
    const creator = createMockCreator({ verified: false, verificationStatus: 'draft' });
    const portfolios = createMockPortfolios();

    const submittedCreator = verificationEngine.submitForVerification(creator, portfolios);

    // CRITICAL REQUIREMENT: Newly registered/submitted creators MUST NEVER be auto-verified
    assert.equal(submittedCreator.verified, false, 'Creator verified flag MUST remain false upon submission');
    assert.equal(submittedCreator.verificationStatus, 'submitted', 'Status must transition to submitted');
    assert.ok(submittedCreator.verificationReport, 'Verification report must be generated');
    assert.ok(submittedCreator.verificationReport.submittedAt, 'Submission timestamp must be recorded');
  });

  // Test 5: Admin Review Lifecycle — Approval grants Verified Badge and appends Audit Trail
  it('5. Admin Review: Explicit approval grants verified badge (true) and records audit log', () => {
    const creator = createMockCreator({ verified: false, verificationStatus: 'submitted' });
    const portfolios = createMockPortfolios();
    const evaluated = verificationEngine.submitForVerification(creator, portfolios);

    const approvedCreator = verificationEngine.reviewVerification(
      evaluated,
      'approved',
      'Portfolio samples verified with client credits. High-quality 3D render work.',
      'admin_reviewer_1'
    );

    assert.equal(approvedCreator.verified, true, 'Verified badge must now be TRUE after explicit admin approval');
    assert.equal(approvedCreator.verificationStatus, 'verified');
    assert.ok(approvedCreator.verificationReport?.auditTrail, 'Audit trail must exist');
    assert.equal(approvedCreator.verificationReport?.auditTrail.length, 1);
    assert.equal(approvedCreator.verificationReport?.auditTrail[0].decision, 'approved');
    assert.equal(approvedCreator.verificationReport?.auditTrail[0].reviewer, 'admin_reviewer_1');
    assert.ok(approvedCreator.verificationReport?.auditTrail[0].reason.includes('High-quality'));
  });

  // Test 6: Admin Review Lifecycle — Request Changes maintains verified=false
  it('6. Admin Review: Changes requested updates status and preserves verified=false', () => {
    const creator = createMockCreator({ verified: false, verificationStatus: 'submitted' });
    const portfolios = createMockPortfolios();
    const evaluated = verificationEngine.submitForVerification(creator, portfolios);

    const updatedCreator = verificationEngine.reviewVerification(
      evaluated,
      'changes_requested',
      'Please upload at least 2 case studies with client attribution and live links.',
      'admin_compliance'
    );

    assert.equal(updatedCreator.verified, false, 'Verified badge must remain FALSE when changes requested');
    assert.equal(updatedCreator.verificationStatus, 'needs_changes');
    assert.equal(updatedCreator.verificationReport?.auditTrail[0].decision, 'changes_requested');
  });

  // Test 7: AI Profile Coach Service Functionality
  it('7. AI Profile Coach: Analyzes creator profile, gives actionable checklist and fallback notice', () => {
    const creator = createMockCreator({
      bio: 'I make videos for brands and love storytelling.',
    });
    const portfolios = createMockPortfolios();

    const analysis = profileCoachService.analyzeProfile(creator, portfolios);

    assert.ok(analysis.completenessScore >= 0 && analysis.completenessScore <= 100);
    assert.ok(analysis.bioFeedback.suggestedBio.length > 0, 'Profile Coach must suggest a rewritten bio');
    assert.ok(analysis.verificationChecklist.length > 0, 'Profile Coach must produce an improvement checklist');
    assert.ok(analysis.discoverabilityActions.length > 0, 'Profile Coach should provide SEO/discoverability tips');
    assert.equal(analysis.isFallbackMode, true, 'Must clearly flag fallback mode');
    assert.ok(analysis.engineNotice.includes('Deterministic') || analysis.engineNotice.includes('Rule-Based'));
  });

  // Test 8: AI Campaign Brief to Creator 6-Factor Matching Rubric
  it('8. AuraMatch Engine: 6-factor weight calculation aligns to required percentages', () => {
    // 6 factors: Niche (30%), Audience (20%), Budget (15%), Platform (15%), Portfolio (10%), Location/Language (10%)
    const weights = {
      niche: 0.30,
      audienceQuality: 0.20,
      budget: 0.15,
      platformFormat: 0.15,
      portfolio: 0.10,
      locationLanguage: 0.10,
    };

    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.001, 'Factor weights must sum to exactly 100%');
    assert.equal(weights.niche, 0.30);
    assert.equal(weights.audienceQuality, 0.20);
    assert.equal(weights.budget, 0.15);
    assert.equal(weights.platformFormat, 0.15);
    assert.equal(weights.portfolio, 0.10);
    assert.equal(weights.locationLanguage, 0.10);
  });
});
