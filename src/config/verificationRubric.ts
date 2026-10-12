/**
 * GenAura AI — Creator Verification Rubric Configuration
 * ========================================================
 * Configurable 100-point rubric for AI-assisted creator evaluation.
 * Weights, criteria, and decision thresholds can be customized here.
 */

export interface RubricCriterionConfig {
  id: string;
  name: string;
  maxPoints: number;
  description: string;
  mandatoryChecks: string[];
}

export interface VerificationRubricConfig {
  version: string;
  totalPoints: number;
  thresholds: {
    approvalEligible: number; // >= 85: Eligible for admin approval
    needsImprovement: number; // 65–84: Needs changes or additional evidence
    insufficient: number;     // < 65: Incomplete profile or insufficient work samples
  };
  weights: {
    profileCompleteness: number;      // 20 points
    portfolioQuality: number;         // 25 points
    contentOriginality: number;       // 20 points
    professionalReadiness: number;    // 15 points
    authenticityConsistency: number;  // 20 points
  };
  criteria: RubricCriterionConfig[];
}

export const VERIFICATION_RUBRIC: VerificationRubricConfig = {
  version: '1.0.0',
  totalPoints: 100,
  thresholds: {
    approvalEligible: 85,
    needsImprovement: 65,
    insufficient: 64,
  },
  weights: {
    profileCompleteness: 20,
    portfolioQuality: 25,
    contentOriginality: 20,
    professionalReadiness: 15,
    authenticityConsistency: 20,
  },
  criteria: [
    {
      id: 'profileCompleteness',
      name: 'Profile Completeness',
      maxPoints: 20,
      description: 'Evaluates whether all essential creator profile fields, niche definitions, bio, and platforms are filled.',
      mandatoryChecks: [
        'Creator name and handle are present',
        'Bio is informative (minimum 40 characters)',
        'Primary niche / category is declared',
        'At least one active social platform link provided',
        'Location (country & city) is specified',
      ],
    },
    {
      id: 'portfolioQuality',
      name: 'Portfolio Quality & Depth',
      maxPoints: 25,
      description: 'Evaluates the depth, descriptions, and niche relevance of uploaded or linked portfolio work samples.',
      mandatoryChecks: [
        'At least three relevant portfolio entries recommended',
        'Every portfolio item includes a clear title and description',
        'Portfolio format and category align with creator declared niche',
        'Valid media URL or preview thumbnail provided',
      ],
    },
    {
      id: 'contentOriginality',
      name: 'Content Originality & Role Clarity',
      maxPoints: 20,
      description: 'Evaluates creator attribution, role transparency, and credible context across work samples.',
      mandatoryChecks: [
        'Creator role is articulated for each work sample (e.g. Director, Copywriter, Editor)',
        'Credible campaign or client context provided where applicable',
        'No duplicate or placeholder descriptions detected',
      ],
    },
    {
      id: 'professionalReadiness',
      name: 'Professional Readiness & Commercial Terms',
      maxPoints: 15,
      description: 'Evaluates the clarity of collaboration terms, pricing rates, and contact readiness.',
      mandatoryChecks: [
        'Clear hourly rate or deliverable rate declared',
        'Preferred collaboration formats specified (e.g. Sponsored Posts, Retainers, UGC)',
        'Years of experience or professional history stated',
      ],
    },
    {
      id: 'authenticityConsistency',
      name: 'Authenticity & Data Consistency',
      maxPoints: 20,
      description: 'Evaluates consistency between declared metrics, handle formats, and profile claims.',
      mandatoryChecks: [
        'Platform handles follow standard URL/username conventions',
        'Engagement rate and follower metrics fall within reasonable plausible ranges',
        'No conflicting claims across bio, niche, and portfolio items',
      ],
    },
  ],
};

// Validate that weights sum to exactly 100 points
const computedTotal = Object.values(VERIFICATION_RUBRIC.weights).reduce((a, b) => a + b, 0);
if (computedTotal !== 100) {
  throw new Error(`Verification rubric weights must total 100 (current: ${computedTotal})`);
}
