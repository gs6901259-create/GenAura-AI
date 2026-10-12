/**
 * GenAura AI — AI Profile Coach Service
 * =====================================
 * Analyzes creator profiles and delivers tailored, actionable recommendations
 * for bio enhancement, portfolio depth, niche positioning, and verification readiness.
 *
 * Clearly indicates when the deterministic rule-based engine is active
 * as a robust local fallback when external LLM credentials are not provided.
 */

import type { Creator, PortfolioItem } from '../types';

export interface VerificationReadinessItem {
  label: string;
  passed: boolean;
  tip: string;
}

export interface ProfileCoachAnalysis {
  completenessScore: number; // 0 - 100
  bioFeedback: {
    currentLength: number;
    clarityLevel: 'High' | 'Moderate' | 'Needs Improvement';
    suggestedBio: string;
    rationale: string;
  };
  missingPortfolioInfo: string[];
  nicheClarityFeedback: string;
  recommendedTags: string[];
  professionalPresentationTips: string[];
  verificationChecklist: VerificationReadinessItem[];
  discoverabilityActions: string[];
  isFallbackMode: boolean;
  engineNotice: string;
}

export class ProfileCoachService {
  /**
   * Evaluates the creator's saved profile and returns structured coaching insights.
   */
  public analyzeProfile(
    creator: Creator,
    portfolios: PortfolioItem[] = []
  ): ProfileCoachAnalysis {
    // 1. Completeness Score
    let points = 0;
    if (creator.name?.trim().length >= 2) points += 10;
    if (creator.handle?.startsWith('@')) points += 10;
    if (creator.bio?.trim().length >= 40) points += 15;
    if (creator.location?.trim().length >= 3) points += 10;
    if (creator.skills?.length >= 3) points += 15;
    if (creator.hourlyRate > 0) points += 10;
    if (creator.socialLinks && Object.values(creator.socialLinks).some(Boolean)) points += 10;
    if (portfolios.length >= 1) points += 10;
    if (portfolios.length >= 3) points += 10;

    const completenessScore = Math.min(100, points);

    // 2. Bio Analysis & Tailored Rewrite
    const bioText = creator.bio || '';
    const bioWords = bioText.trim().split(/\s+/).filter(Boolean).length;
    let clarityLevel: ProfileCoachAnalysis['bioFeedback']['clarityLevel'] = 'Moderate';
    if (bioWords >= 25 && bioText.includes(creator.category?.replace('-', ' '))) {
      clarityLevel = 'High';
    } else if (bioWords < 12) {
      clarityLevel = 'Needs Improvement';
    }

    // Generate intelligent suggested bio using creator's declared traits
    const cleanCategory = (creator.category || 'Content Creator').replace('-', ' ');
    const topSkills = (creator.skills || []).slice(0, 3).join(', ');
    const yearsExp = creator.yearsExperience ? `${creator.yearsExperience}+ years` : 'Experienced';
    const location = creator.location ? `based in ${creator.location}` : '';

    const suggestedBio = `${yearsExp} ${cleanCategory} ${location} specializing in ${topSkills || 'impactful brand storytelling'}. Crafting high-converting creative content, authentic brand partnerships, and deliverables tailored for ambitious brands. Open for commercial collaborations and retainers.`;

    const bioRationale =
      bioWords < 15
        ? 'Your current bio is brief. High-intent brands search for specific deliverables, commercial experience, and collaboration readiness.'
        : 'This suggested bio strengthens your positioning by leading with domain authority, core deliverables, and clear commercial call-to-action.';

    // 3. Missing Portfolio Information
    const missingPortfolio: string[] = [];
    if (portfolios.length === 0) {
      missingPortfolio.push('Zero portfolio items detected. Add at least 3 work samples to qualify for verification.');
    } else {
      if (portfolios.length < 3) {
        missingPortfolio.push(`Add ${3 - portfolios.length} more portfolio piece(s) to reach the recommended 3-item threshold.`);
      }
      const missingRoles = portfolios.filter((p) => !p.creatorRole || p.creatorRole.trim().length === 0);
      if (missingRoles.length > 0) {
        missingPortfolio.push(`${missingRoles.length} work sample(s) lack your specific creator role (e.g. Lead Editor, Solo Producer).`);
      }
      const missingClient = portfolios.filter((p) => !p.clientName && !p.campaignContext);
      if (missingClient.length > 0) {
        missingPortfolio.push(`${missingClient.length} sample(s) lack brand or campaign context.`);
      }
    }

    // 4. Niche Clarity Feedback
    const nicheClarity =
      creator.skills && creator.skills.length >= 4
        ? `Strong niche definition in '${cleanCategory}'. Your core skills align well with brand search queries.`
        : `Consider refining your focus in '${cleanCategory}' by adding 2-3 specific specialization tags (e.g. B2B Case Studies, 4K Product Reels, TikTok Storytelling).`;

    // 5. Recommended Tags tailored to Category
    const tagMap: Record<string, string[]> = {
      'copywriter': ['Brand Voice', 'B2B SaaS', 'Email Sequences', 'Landing Pages', 'Ad Creative'],
      'graphic-designer': ['Brand Identity', 'Packaging', 'Typography', 'Figma', 'Visual Guidelines'],
      'video-editor': ['Premiere Pro', 'Short-Form Reels', 'Color Grading', 'Sound Design', 'Storytelling'],
      'motion-designer': ['After Effects', '3D Animation', 'Kinetic Typography', 'Lottie', 'Logo Reveals'],
      'photographer': ['Product Photography', 'Studio Lighting', 'Lifestyle Shoots', 'Commercial Retouching'],
      'social-media-manager': ['Community Growth', 'Content Calendar', 'Organic Reach', 'TikTok Strategy', 'Analytics'],
      'ux-designer': ['Design Systems', 'Interactive Prototypes', 'User Research', 'Mobile First'],
      'content-strategist': ['Content Audits', 'SEO Strategy', 'Brand Positioning', 'Editorial Calendars'],
    };

    const recommendedTags = tagMap[creator.category] || ['Content Creation', 'Brand Storytelling', 'Social Strategy', 'Creative Direction'];

    // 6. Professional Presentation Tips
    const presentationTips: string[] = [];
    if (!creator.hourlyRate || creator.hourlyRate <= 0) {
      presentationTips.push('Set a transparent hourly rate to help brand managers budget project requests accurately.');
    }
    if (!creator.coverImageUrl) {
      presentationTips.push('Upload a branded header image to make your profile stand out in creator search results.');
    }
    if (!creator.socialLinks?.linkedin && !creator.socialLinks?.twitter && !creator.socialLinks?.youtube) {
      presentationTips.push('Connect at least one verified external channel (YouTube, LinkedIn, or Instagram) to enhance trust.');
    }

    // 7. Verification Readiness Checklist
    const verificationChecklist: VerificationReadinessItem[] = [
      {
        label: 'Informative bio (40+ characters)',
        passed: bioText.trim().length >= 40,
        tip: 'Provide at least 40 characters summarizing your creative domain.',
      },
      {
        label: 'Minimum 3 portfolio entries',
        passed: portfolios.length >= 3,
        tip: 'Showcase at least 3 distinct work samples with clear titles and descriptions.',
      },
      {
        label: 'Creator role specified on portfolio items',
        passed: portfolios.length > 0 && portfolios.every((p) => Boolean(p.creatorRole)),
        tip: 'Specify whether you directed, authored, designed, or edited each piece.',
      },
      {
        label: 'Commercial pricing / rate declared',
        passed: creator.hourlyRate > 0 || (Boolean(creator.rateRange) && (creator.rateRange?.min || 0) > 0),
        tip: 'Declare your hourly rate or project rate range.',
      },
      {
        label: 'At least 1 active platform link',
        passed: Boolean(creator.socialLinks && Object.values(creator.socialLinks).some(Boolean)),
        tip: 'Link your primary social presence (Instagram, YouTube, X, Behance, etc.).',
      },
    ];

    // 8. Discoverability Actions
    const discoverabilityActions: string[] = [
      'Pin your highest-performing work sample as the featured portfolio item.',
      'Declare target deliverables (e.g. 30s Reels, Carousel Guides) in your bio to rank in filtered brand searches.',
      'Keep your availability status up to date to receive direct collaboration invites.',
    ];

    return {
      completenessScore,
      bioFeedback: {
        currentLength: bioWords,
        clarityLevel,
        suggestedBio,
        rationale: bioRationale,
      },
      missingPortfolioInfo: missingPortfolio,
      nicheClarityFeedback: nicheClarity,
      recommendedTags,
      professionalPresentationTips: presentationTips,
      verificationChecklist,
      discoverabilityActions,
      isFallbackMode: true,
      engineNotice: 'GenAura Deterministic Profile Coach Active · No external API key required',
    };
  }
}

export const profileCoachService = new ProfileCoachService();
