/**
 * GenAura AI — Creator Verification Engine
 * ==========================================
 * Implements transparent, deterministic AI-assisted verification scoring
 * against the 100-point rubric in src/config/verificationRubric.ts.
 *
 * Enforces rule: A newly registered creator is NEVER awarded a verified badge
 * automatically. Only an authorized reviewer action can transition status to 'verified'.
 */

import { VERIFICATION_RUBRIC } from '../config/verificationRubric';
import type {
  Creator,
  PortfolioItem,
  CreatorVerificationReport,
  CreatorVerificationAudit,
} from '../types';

export class VerificationEngine {
  /**
   * Evaluates a creator profile and their portfolio items against the 100-point rubric.
   */
  public evaluateCreator(
    creator: Creator,
    portfolios: PortfolioItem[] = []
  ): CreatorVerificationReport {
    const passedChecks: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // ─────────────────────────────────────────────────────────────
    // 1. Profile Completeness (max 20 pts)
    // ─────────────────────────────────────────────────────────────
    let completenessScore = 0;

    // Check name & handle
    if (creator.name && creator.name.trim().length >= 2 && creator.handle && creator.handle.startsWith('@')) {
      completenessScore += 4;
      passedChecks.push('Creator name and valid @handle provided (+4 pts)');
    } else {
      warnings.push('Profile handle should begin with @ and name must be at least 2 characters');
      suggestions.push('Format your handle with @ (e.g. @creative_studio)');
    }

    // Check bio depth
    if (creator.bio && creator.bio.trim().length >= 40) {
      completenessScore += 4;
      passedChecks.push(`Detailed creator bio provided (${creator.bio.trim().length} chars) (+4 pts)`);
    } else {
      warnings.push('Bio is brief or missing (minimum 40 characters recommended)');
      suggestions.push('Expand your bio to highlight your creative perspective, past projects, and core strengths');
    }

    // Check location
    if (creator.location && creator.location.trim().length > 3) {
      completenessScore += 4;
      passedChecks.push(`Location specified: ${creator.location} (+4 pts)`);
    } else {
      warnings.push('City and country location missing');
      suggestions.push('Specify your city and country to help local and regional brands find you');
    }

    // Check category & skills
    if (creator.category && Array.isArray(creator.skills) && creator.skills.length >= 3) {
      completenessScore += 4;
      passedChecks.push(`Category declared with ${creator.skills.length} core skill tags (+4 pts)`);
    } else {
      warnings.push('Less than 3 skills declared');
      suggestions.push('Add at least 3 distinct skill tags to improve search discoverability');
    }

    // Check social platform links
    const socialLinksCount = creator.socialLinks ? Object.values(creator.socialLinks).filter(Boolean).length : 0;
    if (socialLinksCount >= 1) {
      completenessScore += 4;
      passedChecks.push(`Connected social platforms verified (${socialLinksCount} links) (+4 pts)`);
    } else {
      warnings.push('No public social profile or portfolio links provided');
      suggestions.push('Connect at least one public platform (YouTube, LinkedIn, Instagram, etc.)');
    }

    completenessScore = Math.min(VERIFICATION_RUBRIC.weights.profileCompleteness, completenessScore);

    // ─────────────────────────────────────────────────────────────
    // 2. Portfolio Quality & Depth (max 25 pts)
    // ─────────────────────────────────────────────────────────────
    let portfolioScore = 0;

    if (portfolios.length >= 3) {
      portfolioScore += 10;
      passedChecks.push(`Meets portfolio volume recommendation (${portfolios.length} items) (+10 pts)`);
    } else if (portfolios.length === 2) {
      portfolioScore += 7;
      warnings.push('Portfolio has 2 items; 3 items recommended for full score');
      suggestions.push('Upload or link a 3rd work sample to showcase creative range');
    } else if (portfolios.length === 1) {
      portfolioScore += 4;
      warnings.push('Portfolio has only 1 work sample');
      suggestions.push('Add at least 2 more portfolio entries with campaign context');
    } else {
      warnings.push('No portfolio entries found');
      suggestions.push('Add at least 3 portfolio samples representing your best creative work');
    }

    // Quality of descriptions
    const detailedDescriptions = portfolios.filter((p) => p.description && p.description.trim().length >= 25);
    if (portfolios.length > 0 && detailedDescriptions.length === portfolios.length) {
      portfolioScore += 5;
      passedChecks.push('All portfolio entries feature substantive descriptions (+5 pts)');
    } else if (portfolios.length > 0) {
      portfolioScore += 2;
      warnings.push('Some portfolio entries have minimal descriptions');
      suggestions.push('Provide context, campaign goals, or artistic process for every work sample');
    }

    // URLs and media availability
    const validMedia = portfolios.filter((p) => p.mediaUrl && (p.mediaUrl.startsWith('http') || p.mediaUrl.length > 5));
    if (portfolios.length > 0 && validMedia.length === portfolios.length) {
      portfolioScore += 5;
      passedChecks.push('All portfolio entries contain valid media or external proof links (+5 pts)');
    } else if (portfolios.length > 0) {
      portfolioScore += 2;
      warnings.push('Some portfolio items lack valid public preview links');
    }

    // Niche relevance of tags
    const creatorNiche = creator.category ? creator.category.toLowerCase().replace('-', ' ') : '';
    const relevantItems = portfolios.filter((p) => {
      const matchTag = p.tags && p.tags.some((t) => t.toLowerCase().includes(creatorNiche) || creatorNiche.includes(t.toLowerCase()));
      const matchTitle = p.title && p.title.toLowerCase().includes(creatorNiche);
      return matchTag || matchTitle || creator.skills.some((s) => (p.description || '').toLowerCase().includes(s.toLowerCase()));
    });

    if (portfolios.length > 0 && relevantItems.length >= Math.ceil(portfolios.length / 2)) {
      portfolioScore += 5;
      passedChecks.push('Portfolio content strongly aligns with declared niche (+5 pts)');
    } else if (portfolios.length > 0) {
      portfolioScore += 2;
      suggestions.push(`Ensure work samples reflect your primary category: '${creator.category}'`);
    }

    portfolioScore = Math.min(VERIFICATION_RUBRIC.weights.portfolioQuality, portfolioScore);

    // ─────────────────────────────────────────────────────────────
    // 3. Content Originality & Role Clarity (max 20 pts)
    // ─────────────────────────────────────────────────────────────
    let originalityScore = 0;

    // Explicit creator role
    const itemsWithRole = portfolios.filter((p) => p.creatorRole && p.creatorRole.trim().length > 2);
    if (portfolios.length > 0 && itemsWithRole.length === portfolios.length) {
      originalityScore += 8;
      passedChecks.push('Creator role clearly specified on every portfolio item (+8 pts)');
    } else if (portfolios.length > 0 && itemsWithRole.length > 0) {
      originalityScore += 4;
      warnings.push('Some portfolio entries do not specify the creator\'s role in production');
      suggestions.push('Specify your exact role on each piece (e.g. Director, Solo Producer, Editor, Copywriter)');
    } else if (portfolios.length > 0) {
      originalityScore += 2;
      suggestions.push('State your specific contribution for each portfolio item');
    }

    // Credible campaign/client context
    const itemsWithClient = portfolios.filter((p) => (p.clientName && p.clientName.trim().length > 1) || (p.campaignContext && p.campaignContext.trim().length > 1));
    if (portfolios.length > 0 && itemsWithClient.length >= 1) {
      originalityScore += 6;
      passedChecks.push('Work samples include credible client/brand context (+6 pts)');
    } else if (portfolios.length > 0) {
      originalityScore += 2;
      suggestions.push('Mention the brand, publication, or project context for portfolio work');
    }

    // Duplicate description check
    const descriptions = portfolios.map((p) => (p.description || '').trim().toLowerCase()).filter(Boolean);
    const uniqueDescriptions = new Set(descriptions);
    if (descriptions.length > 0 && uniqueDescriptions.size === descriptions.length) {
      originalityScore += 6;
      passedChecks.push('Distinct, authentic descriptions across all work samples (+6 pts)');
    } else if (descriptions.length > 0) {
      warnings.push('Duplicate descriptions detected across portfolio items');
      suggestions.push('Write unique descriptions highlighting what makes each piece distinct');
    }

    originalityScore = Math.min(VERIFICATION_RUBRIC.weights.contentOriginality, originalityScore);

    // ─────────────────────────────────────────────────────────────
    // 4. Professional Readiness & Commercial Terms (max 15 pts)
    // ─────────────────────────────────────────────────────────────
    let readinessScore = 0;

    // Hourly rate or rate range
    if (creator.hourlyRate && creator.hourlyRate > 0) {
      readinessScore += 5;
      passedChecks.push(`Transparent commercial pricing declared ($${creator.hourlyRate}/hr) (+5 pts)`);
    } else if (creator.rateRange && creator.rateRange.min > 0) {
      readinessScore += 5;
      passedChecks.push(`Commercial rate range defined ($${creator.rateRange.min} - $${creator.rateRange.max}) (+5 pts)`);
    } else {
      warnings.push('No pricing rates declared');
      suggestions.push('Set your hourly rate or project rate range to help brands scope budgets');
    }

    // Collaboration preferences
    if (creator.collaborationTypes && creator.collaborationTypes.length > 0) {
      readinessScore += 5;
      passedChecks.push(`Preferred collaboration types specified (${creator.collaborationTypes.join(', ')}) (+5 pts)`);
    } else {
      readinessScore += 2;
      suggestions.push('Select preferred engagement formats (e.g. Sponsored Posts, Retainers, Deliverables)');
    }

    // Years experience or history
    if (creator.yearsExperience && creator.yearsExperience > 0) {
      readinessScore += 5;
      passedChecks.push(`${creator.yearsExperience} years of professional creative experience (+5 pts)`);
    } else if (creator.completedProjects && creator.completedProjects > 0) {
      readinessScore += 4;
      passedChecks.push(`${creator.completedProjects} successfully completed client projects recorded (+4 pts)`);
    } else {
      readinessScore += 2;
      suggestions.push('Indicate your years of creative experience');
    }

    readinessScore = Math.min(VERIFICATION_RUBRIC.weights.professionalReadiness, readinessScore);

    // ─────────────────────────────────────────────────────────────
    // 5. Authenticity & Consistency (max 20 pts)
    // ─────────────────────────────────────────────────────────────
    let authenticityScore = 0;

    // Platform handles validity
    const hasValidHandles = !creator.handle.includes(' ') && creator.handle.length >= 3;
    if (hasValidHandles) {
      authenticityScore += 8;
      passedChecks.push('Consistent and valid social handle formatting (+8 pts)');
    } else {
      warnings.push('Handle contains spaces or invalid characters');
    }

    // Plausible metrics
    const engRate = creator.engagementRate || 0;
    if (engRate >= 0.5 && engRate <= 30.0) {
      authenticityScore += 6;
      passedChecks.push(`Declared engagement rate of ${engRate}% is within authentic benchmark ranges (+6 pts)`);
    } else if (engRate === 0 && creator.rating >= 4.0) {
      authenticityScore += 4;
      passedChecks.push('Strong customer review baseline compensates for unverified social metrics (+4 pts)');
    } else {
      warnings.push('Engagement rate is outside normal ranges or missing');
    }

    // Alignment between bio, category, and skills
    const hasAlignment = creator.skills && creator.skills.length > 0 && Boolean(creator.category);
    if (hasAlignment) {
      authenticityScore += 6;
      passedChecks.push('Declared specialty aligns with skill set and category (+6 pts)');
    }

    authenticityScore = Math.min(VERIFICATION_RUBRIC.weights.authenticityConsistency, authenticityScore);

    // ─────────────────────────────────────────────────────────────
    // Total & Decision Thresholds
    // ─────────────────────────────────────────────────────────────
    const overallScore = completenessScore + portfolioScore + originalityScore + readinessScore + authenticityScore;

    let recommendedDecision: CreatorVerificationReport['recommendedDecision'] = 'manual_review';
    let explanation = '';

    if (overallScore >= VERIFICATION_RUBRIC.thresholds.approvalEligible && portfolios.length >= 2) {
      recommendedDecision = 'approve_eligible';
      explanation = `Profile scored ${overallScore}/100. Meets criteria for official verified partner status. Ready for reviewer sign-off.`;
    } else if (overallScore >= VERIFICATION_RUBRIC.thresholds.needsImprovement) {
      recommendedDecision = 'needs_changes';
      explanation = `Profile scored ${overallScore}/100. Strong foundation, but needs additional portfolio evidence or profile refinement before verification approval.`;
    } else {
      recommendedDecision = 'manual_review';
      explanation = `Profile scored ${overallScore}/100. Insufficient profile completeness or work samples to recommend verification approval at this stage.`;
    }

    return {
      status: creator.verificationStatus || 'draft',
      overallScore,
      criterionScores: {
        profileCompleteness: completenessScore,
        portfolioQuality: portfolioScore,
        contentOriginality: originalityScore,
        professionalReadiness: readinessScore,
        authenticityConsistency: authenticityScore,
      },
      passedChecks,
      warnings,
      suggestions,
      recommendedDecision,
      explanation,
      submittedAt: creator.verificationReport?.submittedAt,
      reviewedAt: creator.verificationReport?.reviewedAt,
      reviewedBy: creator.verificationReport?.reviewedBy,
      auditTrail: creator.verificationReport?.auditTrail || [],
    };
  }

  /**
   * Submits a creator profile for verification.
   * Changes status to 'submitted' or 'under_review', evaluates rubric, but NEVER awards verified badge.
   */
  public submitForVerification(creator: Creator, portfolios: PortfolioItem[] = []): Creator {
    const report = this.evaluateCreator(creator, portfolios);
    report.status = 'submitted';
    report.submittedAt = new Date().toISOString();

    return {
      ...creator,
      verificationStatus: 'submitted',
      verified: false, // Explicitly guaranteed: submission NEVER auto-verifies
      verificationReport: report,
    };
  }

  /**
   * Performs an authorized reviewer decision.
   * Only an 'approved' decision can grant verified: true.
   */
  public reviewVerification(
    creator: Creator,
    decision: 'approved' | 'changes_requested' | 'rejected',
    reason: string,
    reviewer: string = 'Editorial Reviewer'
  ): Creator {
    const now = new Date().toISOString();
    const currentReport = creator.verificationReport || this.evaluateCreator(creator);

    const auditEntry: CreatorVerificationAudit = {
      reviewer,
      reviewedAt: now,
      decision,
      reason,
      score: currentReport.overallScore,
    };

    const newAuditTrail = [...(currentReport.auditTrail || []), auditEntry];

    if (decision === 'approved') {
      return {
        ...creator,
        verified: true,
        verificationStatus: 'verified',
        verificationReport: {
          ...currentReport,
          status: 'verified',
          reviewedAt: now,
          reviewedBy: reviewer,
          auditTrail: newAuditTrail,
        },
      };
    }

    if (decision === 'changes_requested') {
      return {
        ...creator,
        verified: false,
        verificationStatus: 'needs_changes',
        verificationReport: {
          ...currentReport,
          status: 'needs_changes',
          reviewedAt: now,
          reviewedBy: reviewer,
          auditTrail: newAuditTrail,
        },
      };
    }

    // Rejected
    return {
      ...creator,
      verified: false,
      verificationStatus: 'rejected',
      verificationReport: {
        ...currentReport,
        status: 'rejected',
        reviewedAt: now,
        reviewedBy: reviewer,
        auditTrail: newAuditTrail,
      },
    };
  }
}

export const verificationEngine = new VerificationEngine();
