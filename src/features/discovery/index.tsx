/**
 * GenAura AI — Discovery & AI Matching Studio (Member 3 Integrated)
 * =================================================================
 * Features:
 * - Keyword search across name, handle, bio, skills, and categories
 * - Combined filters: Platforms, Categories, Rate Caps, Ratings, Verified Only
 * - Active Campaign Brief selector: dynamically calculates deterministic AI match scores
 * - Explainable Match Breakdown Modal showing factor weights & justifications
 * - Full Shortlist integration: add/remove, update status, edit campaign notes
 * - Campaign aggregate analytics: total budget, average match, potential reach
 * - CSV export for exportable client deliverables
 * - One-click bridge to Project Collaboration (Member 5)
 */
import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  SlidersHorizontal,
  Star,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  X,
  Download,
  Trash2,
  Users,
  Target,
  DollarSign,
  ShieldCheck,
  FolderKanban,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { Creator, CreativeBrief, ShortlistEntry } from '@/types';
import { asShortlistId } from '@/types';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Avatar,
  Input,
  StatCard,
  EmptyState,
  StarRating,
} from '@/components/ui';
import { cn, formatUSD } from '@/lib/utils';

// ────────────────────────────────────────────────────────────────────────────
// Match Scoring Engine (Integrated from Member 3's deterministic scoring engine)
// ────────────────────────────────────────────────────────────────────────────
export interface MatchExplanation {
  factor: string;
  score: number;
  type: 'positive' | 'neutral' | 'warning';
  detail: string;
}

export interface MatchAnalysis {
  overallScore: number;
  matchTier: 'Exceptional Match' | 'Strong Match' | 'Moderate Match' | 'Low Match';
  breakdown: {
    nicheRelevance: number;       // 30%
    audienceTargetFit: number;    // 20%
    budgetCompatibility: number;  // 15%
    platformFormatFit: number;    // 15%
    portfolioRelevance: number;   // 10%
    locationLanguageFit: number;  // 10%
  };
  missingCriteria: string[];
  explanations: MatchExplanation[];
}

export function computeCreatorMatch(creator: Creator, brief: CreativeBrief | null): MatchAnalysis {
  if (!brief) {
    return {
      overallScore: 84,
      matchTier: 'Strong Match',
      breakdown: {
        nicheRelevance: 85,
        audienceTargetFit: 80,
        budgetCompatibility: 90,
        platformFormatFit: 85,
        portfolioRelevance: 80,
        locationLanguageFit: 85,
      },
      missingCriteria: ['Select a specific campaign brief to calculate personalized alignment.'],
      explanations: [
        {
          factor: 'General Profile Quality',
          score: Math.round(creator.rating * 18),
          type: 'positive',
          detail: `High creator rating (${creator.rating}/5.0) across ${creator.completedProjects} verified projects.`,
        },
      ],
    };
  }

  const explanations: MatchExplanation[] = [];
  const missingCriteria: string[] = [];

  // 1. Niche Relevance (30%)
  let nicheRelevance = 45;
  const preferredCats = brief.preferredCategories || [];
  const requiredSkills = (brief.requiredSkills || []).map((s) => s.toLowerCase());
  const creatorSkills = (creator.skills || []).map((s) => s.toLowerCase());

  const matchingSkills = creatorSkills.filter((s) =>
    requiredSkills.some((req) => req.includes(s) || s.includes(req))
  );

  const categoryMatch =
    preferredCats.length === 0 ||
    preferredCats.includes(creator.category) ||
    preferredCats.some((c) => c.toLowerCase().includes(creator.category.toLowerCase()));

  if (categoryMatch && matchingSkills.length > 0) {
    nicheRelevance = 98;
    explanations.push({
      factor: 'Niche Relevance (30%)',
      score: 98,
      type: 'positive',
      detail: `Direct specialty match in '${creator.category}' with ${matchingSkills.length} matching skills (${matchingSkills.slice(0, 3).join(', ')}).`,
    });
  } else if (categoryMatch) {
    nicheRelevance = 85;
    explanations.push({
      factor: 'Niche Relevance (30%)',
      score: 85,
      type: 'positive',
      detail: `Specialty aligns with target category '${creator.category}'.`,
    });
  } else if (matchingSkills.length > 0) {
    nicheRelevance = 65;
    explanations.push({
      factor: 'Niche Relevance (30%)',
      score: 65,
      type: 'neutral',
      detail: `Shares ${matchingSkills.length} requested skills, though primary category is ${creator.category}.`,
    });
  } else {
    nicheRelevance = 35;
    missingCriteria.push(`Creator category '${creator.category}' differs from requested campaign focus`);
    explanations.push({
      factor: 'Niche Relevance (30%)',
      score: 35,
      type: 'warning',
      detail: `Category '${creator.category}' does not directly target requested campaign disciplines.`,
    });
  }

  // 2. Audience & Target-Market Fit (20%)
  let audienceTargetFit = 75;
  const ratingPct = Math.min(100, Math.round((creator.rating / 5) * 100));
  const reviewBonus = Math.min(10, Math.round(creator.reviewCount / 10));
  audienceTargetFit = Math.min(100, ratingPct + reviewBonus);

  if (creator.rating >= 4.8) {
    explanations.push({
      factor: 'Audience & Quality Fit (20%)',
      score: audienceTargetFit,
      type: 'positive',
      detail: `Outstanding audience reception rating of ${creator.rating}★ across ${creator.reviewCount} reviews.`,
    });
  } else {
    explanations.push({
      factor: 'Audience & Quality Fit (20%)',
      score: audienceTargetFit,
      type: 'neutral',
      detail: `Solid audience satisfaction rating of ${creator.rating}★.`,
    });
  }

  // 3. Budget Compatibility (15%)
  const maxBudget = brief.budget?.max || 5000;
  const estimatedCost = creator.hourlyRate * 25;
  let budgetCompatibility = 100;

  if (estimatedCost <= maxBudget) {
    budgetCompatibility = 100;
    explanations.push({
      factor: 'Budget Compatibility (15%)',
      score: 100,
      type: 'positive',
      detail: `Estimated deliverable pricing (${formatUSD(creator.hourlyRate)}/hr) fits comfortably within campaign budget ($${maxBudget.toLocaleString()}).`,
    });
  } else if (estimatedCost <= maxBudget * 1.25) {
    budgetCompatibility = 75;
    missingCriteria.push(`Rate (${formatUSD(creator.hourlyRate)}/hr) slightly exceeds target budget cap`);
    explanations.push({
      factor: 'Budget Compatibility (15%)',
      score: 75,
      type: 'warning',
      detail: `Creator rate slightly exceeds target campaign cap. Opportunity for bundle rate adjustment.`,
    });
  } else {
    budgetCompatibility = 40;
    missingCriteria.push(`Deliverable cost exceeds campaign budget by >25%`);
    explanations.push({
      factor: 'Budget Compatibility (15%)',
      score: 40,
      type: 'warning',
      detail: `Above campaign cap ($${creator.hourlyRate}/hr vs $${maxBudget.toLocaleString()} max project budget).`,
    });
  }

  // 4. Platform & Content-Format Fit (15%)
  let platformFormatFit = 70;
  const briefChannels = brief.channels || [];
  const socialPlatforms = creator.socialLinks ? Object.keys(creator.socialLinks).map((s) => s.toLowerCase()) : [];

  const platformMatches = briefChannels.filter((c) =>
    socialPlatforms.some((p) => p.includes(c.toLowerCase()) || c.toLowerCase().includes(p))
  );

  if (platformMatches.length > 0) {
    platformFormatFit = 95;
    explanations.push({
      factor: 'Platform & Format Fit (15%)',
      score: 95,
      type: 'positive',
      detail: `Active on target campaign channels: ${platformMatches.join(', ')}.`,
    });
  } else if (socialPlatforms.length >= 2) {
    platformFormatFit = 85;
    explanations.push({
      factor: 'Platform & Format Fit (15%)',
      score: 85,
      type: 'positive',
      detail: `Multi-channel distribution active across ${socialPlatforms.join(', ')}.`,
    });
  } else {
    platformFormatFit = 65;
    explanations.push({
      factor: 'Platform & Format Fit (15%)',
      score: 65,
      type: 'neutral',
      detail: `Deliverable format compatible with campaign specifications.`,
    });
  }

  // 5. Portfolio Relevance (10%)
  const portfolioRelevance = creator.portfolioIds && creator.portfolioIds.length >= 3 ? 95 : creator.portfolioIds?.length ? 75 : 50;
  if (creator.portfolioIds && creator.portfolioIds.length >= 3) {
    explanations.push({
      factor: 'Portfolio Depth & Evidence (10%)',
      score: 95,
      type: 'positive',
      detail: `Verified portfolio with ${creator.portfolioIds.length} work samples demonstrating commercial versatility.`,
    });
  } else {
    explanations.push({
      factor: 'Portfolio Depth & Evidence (10%)',
      score: portfolioRelevance,
      type: 'neutral',
      detail: `Portfolio contains ${creator.portfolioIds?.length || 0} work samples.`,
    });
  }

  // 6. Location & Language Fit (10%)
  let locationLanguageFit = 85;
  const targetLocations = brief.targetAudience?.locations || [];
  const matchesLocation = targetLocations.some((loc) =>
    creator.location.toLowerCase().includes(loc.toLowerCase())
  );

  if (matchesLocation || targetLocations.length === 0) {
    locationLanguageFit = 95;
    explanations.push({
      factor: 'Location & Language Fit (10%)',
      score: 95,
      type: 'positive',
      detail: `Geographic market (${creator.location}) aligns with campaign distribution region.`,
    });
  } else {
    locationLanguageFit = 75;
    explanations.push({
      factor: 'Location & Language Fit (10%)',
      score: 75,
      type: 'neutral',
      detail: `Available for remote collaboration in ${creator.timezone || 'target timezone'}.`,
    });
  }

  // Weighted overall calculation: 30% + 20% + 15% + 15% + 10% + 10% = 100%
  const weighted =
    nicheRelevance * 0.30 +
    audienceTargetFit * 0.20 +
    budgetCompatibility * 0.15 +
    platformFormatFit * 0.15 +
    portfolioRelevance * 0.10 +
    locationLanguageFit * 0.10;

  const overallScore = Math.min(100, Math.max(30, Math.round(weighted)));

  let matchTier: MatchAnalysis['matchTier'] = 'Low Match';
  if (overallScore >= 88) matchTier = 'Exceptional Match';
  else if (overallScore >= 75) matchTier = 'Strong Match';
  else if (overallScore >= 55) matchTier = 'Moderate Match';

  return {
    overallScore,
    matchTier,
    breakdown: {
      nicheRelevance,
      audienceTargetFit,
      budgetCompatibility,
      platformFormatFit,
      portfolioRelevance,
      locationLanguageFit,
    },
    missingCriteria,
    explanations,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Match Explanation Modal
// ────────────────────────────────────────────────────────────────────────────
function MatchBreakdownModal({
  creator,
  brief,
  match,
  onClose,
  onShortlistToggle,
  isShortlisted,
}: {
  creator: Creator;
  brief: CreativeBrief | null;
  match: MatchAnalysis;
  onClose: () => void;
  onShortlistToggle: () => void;
  isShortlisted: boolean;
}) {
  const tierColor =
    match.overallScore >= 88
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : match.overallScore >= 75
      ? 'text-violet-400 bg-violet-500/10 border-violet-500/30'
      : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-navy-900 border border-navy-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-navy-400 hover:text-white p-1 rounded-lg cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-4 mb-5">
          <Avatar src={creator.avatarUrl} alt={creator.name} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-navy-50">{creator.name}</h2>
              {creator.verified && <CheckCircle2 size={16} className="text-cyan-400" />}
            </div>
            <p className="text-xs text-navy-400">{creator.handle} · {creator.category}</p>
            {brief && (
              <p className="text-xs text-violet-300 mt-1 flex items-center gap-1 font-medium">
                <Target size={12} /> Matching against: <span className="underline">{brief.title}</span>
              </p>
            )}
          </div>
        </div>

        {/* Overall Score Banner */}
        <div className={cn('p-4 rounded-xl border flex items-center justify-between mb-5', tierColor)}>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold opacity-80">AuraMatch 6-Factor Fit</p>
            <p className="text-2xl font-extrabold mt-0.5">{match.overallScore}% · {match.matchTier}</p>
          </div>
          <div className="h-12 w-12 rounded-full border-2 border-current flex items-center justify-center font-bold text-lg">
            {match.overallScore}
          </div>
        </div>

        {/* 6-Dimension Score Breakdown */}
        <h3 className="text-xs uppercase font-bold text-navy-400 tracking-wider mb-2.5">
          Score Breakdown by Criteria
        </h3>
        <div className="space-y-2.5 mb-5">
          {[
            { label: 'Niche Relevance (30%)', score: match.breakdown.nicheRelevance },
            { label: 'Audience & Quality Fit (20%)', score: match.breakdown.audienceTargetFit },
            { label: 'Budget Compatibility (15%)', score: match.breakdown.budgetCompatibility },
            { label: 'Platform & Format Fit (15%)', score: match.breakdown.platformFormatFit },
            { label: 'Portfolio Relevance (10%)', score: match.breakdown.portfolioRelevance },
            { label: 'Location & Language Fit (10%)', score: match.breakdown.locationLanguageFit },
          ].map((item) => (
            <div key={item.label} className="text-xs">
              <div className="flex justify-between text-navy-300 mb-1">
                <span>{item.label}</span>
                <span className="font-semibold text-navy-100">{item.score}/100</span>
              </div>
              <div className="w-full bg-navy-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full"
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Missing or Uncertain Criteria */}
        {match.missingCriteria.length > 0 && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 mb-4 space-y-1">
            <p className="font-bold">Missing or Sub-optimal Criteria:</p>
            {match.missingCriteria.map((m, idx) => (
              <p key={idx}>• {m}</p>
            ))}
          </div>
        )}

        {/* Explanations List */}
        <h3 className="text-xs uppercase font-bold text-navy-400 tracking-wider mb-2">
          Match Insights & Rationale
        </h3>
        <div className="space-y-2 mb-6">
          {match.explanations.map((exp, idx) => (
            <div
              key={idx}
              className={cn(
                'p-3 rounded-lg text-xs border flex items-start gap-2.5',
                exp.type === 'positive'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : exp.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                  : 'bg-navy-800 border-navy-700 text-navy-300'
              )}
            >
              <div className="font-bold shrink-0 mt-0.5">•</div>
              <div>
                <span className="font-bold">{exp.factor}:</span> {exp.detail}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-navy-800">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            variant={isShortlisted ? 'secondary' : 'primary'}
            icon={isShortlisted ? BookmarkCheck : Bookmark}
            onClick={onShortlistToggle}
          >
            {isShortlisted ? 'In Shortlist' : 'Add to Shortlist'}
          </Button>
        </div>
      </div>
    </div>
  );
}


// ────────────────────────────────────────────────────────────────────────────
// DISCOVERY PAGE COMPONENT
// ────────────────────────────────────────────────────────────────────────────
export function DiscoveryPage() {
  const navigate = useNavigate();
  const { creators, briefs, shortlist, addToShortlist, removeFromShortlist } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBriefId, setSelectedBriefId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [maxHourlyRate, setMaxHourlyRate] = useState<number>(200);
  const [sortBy, setSortBy] = useState<'match' | 'rating' | 'rate-asc' | 'rate-desc'>('match');

  // Selected creator for Match Modal
  const [modalCreator, setModalCreator] = useState<Creator | null>(null);

  // Active brief for scoring
  const activeBrief = useMemo(
    () => briefs.find((b) => b.id === selectedBriefId) || null,
    [briefs, selectedBriefId]
  );

  // Shortlisted ID lookup
  const shortlistedIds = useMemo(
    () => new Set(shortlist.map((s) => s.creatorId)),
    [shortlist]
  );

  // Filter and Score Creators
  const scoredCreators = useMemo(() => {
    return creators
      .map((c) => {
        const match = computeCreatorMatch(c, activeBrief);
        return { creator: c, match };
      })
      .filter(({ creator: c, match }) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesQuery =
            c.name.toLowerCase().includes(q) ||
            c.handle.toLowerCase().includes(q) ||
            c.tagline.toLowerCase().includes(q) ||
            c.bio.toLowerCase().includes(q) ||
            c.skills.some((s) => s.toLowerCase().includes(q));
          if (!matchesQuery) return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && c.category !== selectedCategory) {
          return false;
        }

        // Platform filter
        if (selectedPlatform !== 'all') {
          if (!c.socialLinks || !(selectedPlatform in c.socialLinks)) {
            return false;
          }
        }

        // Verified only
        if (verifiedOnly && !c.verified) {
          return false;
        }

        // Max hourly rate
        if (c.hourlyRate > maxHourlyRate) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'match') {
          return b.match.overallScore - a.match.overallScore;
        }
        if (sortBy === 'rating') {
          return b.creator.rating - a.creator.rating;
        }
        if (sortBy === 'rate-asc') {
          return a.creator.hourlyRate - b.creator.hourlyRate;
        }
        if (sortBy === 'rate-desc') {
          return b.creator.hourlyRate - a.creator.hourlyRate;
        }
        return 0;
      });
  }, [
    creators,
    activeBrief,
    searchQuery,
    selectedCategory,
    selectedPlatform,
    verifiedOnly,
    maxHourlyRate,
    sortBy,
  ]);

  const handleToggleShortlist = (creator: Creator, matchScore: number) => {
    const existing = shortlist.find((s) => s.creatorId === creator.id);
    if (existing) {
      removeFromShortlist(existing.id);
    } else {
      addToShortlist({
        id: asShortlistId(`sl_${Date.now()}`),
        creatorId: creator.id,
        briefId: activeBrief ? activeBrief.id : undefined,
        status: 'saved',
        notes: activeBrief ? `Matched with brief: ${activeBrief.title}` : 'Discovered in matching studio',
        addedAt: new Date().toISOString(),
        matchScore,
      });
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedPlatform('all');
    setVerifiedOnly(false);
    setMaxHourlyRate(200);
    setSortBy('match');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Creator Discovery & Matching"
        subtitle="Match creators against your campaign briefs using deterministic AI fit scoring."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={Bookmark}
              onClick={() => navigate('/shortlist')}
            >
              Shortlist ({shortlist.length})
            </Button>
            <Button
              variant="secondary"
              icon={FolderKanban}
              onClick={() => navigate('/projects')}
            >
              Collaboration Board
            </Button>
          </div>
        }
      />

      {/* ── Active Campaign Selector Banner ── */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-violet-950/70 via-navy-900 to-navy-900 border border-violet-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-violet-600/30 border border-violet-500/40 flex items-center justify-center shrink-0 text-violet-400">
            <Target size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-violet-300">
              Active Match Engine Target
            </p>
            <p className="text-sm font-semibold text-navy-100">
              {activeBrief
                ? `Matching against: ${activeBrief.title}`
                : 'Showing baseline algorithmic scores (Select a campaign brief to personalize)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedBriefId}
            onChange={(e) => setSelectedBriefId(e.target.value)}
            className="w-full md:w-64 bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-xs text-navy-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="all">⚡ Baseline Fit (No brief selected)</option>
            {briefs.map((b) => (
              <option key={b.id} value={b.id}>
                🎯 {b.title} ({formatUSD(b.budget.max)} cap)
              </option>
            ))}
          </select>

          {activeBrief && (
            <Link
              to={`/briefs/${activeBrief.id}`}
              className="text-xs text-violet-400 hover:text-violet-300 underline shrink-0"
            >
              View Brief
            </Link>
          )}
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="bg-navy-900 border border-navy-700/60 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search bar */}
          <div className="md:col-span-5 relative">
            <Input
              icon={Search}
              placeholder="Search by creator name, @handle, bio, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-navy-800"
            />
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-xs text-navy-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">All Specialties & Niches</option>
              <option value="copywriter">Copywriting & Content</option>
              <option value="graphic-designer">Graphic & Brand Design</option>
              <option value="motion-designer">Motion Design & 3D</option>
              <option value="video-editor">Video Editing & Reels</option>
              <option value="photographer">Commercial Photography</option>
              <option value="social-media-manager">Social Media & Growth</option>
              <option value="ux-designer">UX/UI & Product Design</option>
            </select>
          </div>

          {/* Platform Dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-xs text-navy-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">All Platforms</option>
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">X / Twitter</option>
              <option value="instagram">Instagram</option>
              <option value="behance">Behance</option>
              <option value="dribbble">Dribbble</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-xs text-navy-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="match">Sort: Match Score (Highest)</option>
              <option value="rating">Sort: Client Rating</option>
              <option value="rate-asc">Sort: Rate: Low to High</option>
              <option value="rate-desc">Sort: Rate: High to Low</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-navy-800 text-xs text-navy-300">
          <div className="flex items-center gap-6 flex-wrap">
            {/* Verified toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="rounded border-navy-700 bg-navy-800 text-violet-600 focus:ring-violet-500"
              />
              <span className="flex items-center gap-1">
                <CheckCircle2 size={13} className="text-cyan-400" /> Verified Partners Only
              </span>
            </label>

            {/* Max Hourly Rate Slider */}
            <div className="flex items-center gap-2">
              <span>Max Rate:</span>
              <input
                type="range"
                min="50"
                max="250"
                step="10"
                value={maxHourlyRate}
                onChange={(e) => setMaxHourlyRate(Number(e.target.value))}
                className="w-24 accent-violet-500 cursor-pointer"
              />
              <span className="font-semibold text-navy-100">${maxHourlyRate}/hr</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-navy-400">
              Found <strong className="text-navy-100">{scoredCreators.length}</strong> matching creators
            </span>
            <button
              onClick={handleClearFilters}
              className="text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} /> Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* ── Creator Match Cards Grid ── */}
      {scoredCreators.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No creators match your filters"
          description="Try broadening your search keywords, increasing the max hourly rate, or resetting your filter criteria."
          action={
            <Button variant="secondary" onClick={handleClearFilters}>
              Reset All Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scoredCreators.map(({ creator, match }) => {
            const isShortlisted = shortlistedIds.has(creator.id);
            const scoreColor =
              match.overallScore >= 88
                ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
                : match.overallScore >= 75
                ? 'text-violet-400 border-violet-500/40 bg-violet-500/10'
                : 'text-amber-400 border-amber-500/40 bg-amber-500/10';

            return (
              <Card
                key={creator.id}
                className="flex flex-col justify-between hover:border-navy-600 transition-all duration-200 relative group"
              >
                <div>
                  {/* Top Bar with Match Score Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={creator.avatarUrl} alt={creator.name} size="md" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/creators/${creator.id}`}
                            className="font-bold text-sm text-navy-100 hover:text-violet-400 transition-colors"
                          >
                            {creator.name}
                          </Link>
                          {creator.verified && (
                            <CheckCircle2 size={14} className="text-cyan-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-navy-400">{creator.handle}</p>
                      </div>
                    </div>

                    {/* AI Match Score Badge button */}
                    <button
                      onClick={() => setModalCreator(creator)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 cursor-pointer transition-transform hover:scale-105',
                        scoreColor
                      )}
                      title="Click to view AI match breakdown"
                    >
                      <Sparkles size={11} />
                      {match.overallScore}% Match
                    </button>
                  </div>

                  {/* Category & Tagline */}
                  <p className="text-xs text-navy-200 font-medium mb-1 capitalize">
                    {creator.category.replace('-', ' ')}
                  </p>
                  <p className="text-xs text-navy-400 line-clamp-2 mb-3">
                    {creator.tagline || creator.bio}
                  </p>

                  {/* Skills Pills */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {creator.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded text-[10px] bg-navy-800 text-navy-300 border border-navy-700/50"
                      >
                        {skill}
                      </span>
                    ))}
                    {creator.skills.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-navy-800 text-navy-500">
                        +{creator.skills.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer with Rate, Rating & Action Buttons */}
                <div className="pt-3 border-t border-navy-800/80">
                  <div className="flex items-center justify-between text-xs text-navy-300 mb-3">
                    <div className="flex items-center gap-1">
                      <Star size={13} className="text-amber-400 fill-amber-400" />
                      <span className="font-semibold text-navy-100">{creator.rating}</span>
                      <span className="text-navy-500">({creator.reviewCount})</span>
                    </div>
                    <div className="font-bold text-navy-100">
                      {formatUSD(creator.hourlyRate)}/hr
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant={isShortlisted ? 'secondary' : 'outline'}
                      icon={isShortlisted ? BookmarkCheck : Bookmark}
                      onClick={() => handleToggleShortlist(creator, match.overallScore)}
                      className="text-xs"
                    >
                      {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                    </Button>

                    <Button
                      size="sm"
                      variant="primary"
                      iconRight={ArrowRight}
                      onClick={() => navigate(`/creators/${creator.id}`)}
                      className="text-xs"
                    >
                      Profile
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Match Breakdown Modal ── */}
      {modalCreator && (
        <MatchBreakdownModal
          creator={modalCreator}
          brief={activeBrief}
          match={computeCreatorMatch(modalCreator, activeBrief)}
          onClose={() => setModalCreator(null)}
          onShortlistToggle={() =>
            handleToggleShortlist(
              modalCreator,
              computeCreatorMatch(modalCreator, activeBrief).overallScore
            )
          }
          isShortlisted={shortlistedIds.has(modalCreator.id)}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SHORTLIST PAGE COMPONENT
// ────────────────────────────────────────────────────────────────────────────
export function ShortlistPage() {
  const navigate = useNavigate();
  const { shortlist, creators, briefs, updateShortlistEntry, removeFromShortlist } = useAppStore();

  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Resolved list of shortlisted creators
  const enrichedShortlist = useMemo(() => {
    return shortlist
      .map((entry) => {
        const creator = creators.find((c) => c.id === entry.creatorId);
        const brief = entry.briefId ? briefs.find((b) => b.id === entry.briefId) : null;
        return { entry, creator, brief };
      })
      .filter((item) => item.creator !== undefined);
  }, [shortlist, creators, briefs]);

  const filteredShortlist = useMemo(() => {
    if (filterStatus === 'all') return enrichedShortlist;
    return enrichedShortlist.filter((item) => item.entry.status === filterStatus);
  }, [enrichedShortlist, filterStatus]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalCount = enrichedShortlist.length;
    const totalRate = enrichedShortlist.reduce(
      (sum, item) => sum + (item.creator ? item.creator.hourlyRate * 25 : 0),
      0
    );
    const avgMatch =
      totalCount > 0
        ? Math.round(
            enrichedShortlist.reduce(
              (sum, item) => sum + (item.entry.matchScore || 85),
              0
            ) / totalCount
          )
        : 0;

    return { totalCount, totalRate, avgMatch };
  }, [enrichedShortlist]);

  // Export to CSV
  const handleExportCSV = () => {
    if (enrichedShortlist.length === 0) return;

    const headers = ['Creator Name', 'Handle', 'Category', 'Hourly Rate', 'Rating', 'Status', 'Match Score', 'Brief', 'Notes'];
    const rows = enrichedShortlist.map(({ entry, creator, brief }) => [
      `"${creator?.name || ''}"`,
      `"${creator?.handle || ''}"`,
      `"${creator?.category || ''}"`,
      `"${creator?.hourlyRate || ''}"`,
      `"${creator?.rating || ''}"`,
      `"${entry.status}"`,
      `"${entry.matchScore || 'N/A'}"`,
      `"${brief?.title || 'None'}"`,
      `"${entry.notes || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GenAura_Shortlist_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to remove all creators from your shortlist?')) {
      shortlist.forEach((entry) => removeFromShortlist(entry.id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Campaign Shortlist"
        subtitle="Review, manage notes, and initiate project requests with saved talent."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={Download}
              onClick={handleExportCSV}
              disabled={enrichedShortlist.length === 0}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              icon={Search}
              onClick={() => navigate('/discovery')}
            >
              Discover More
            </Button>
          </div>
        }
      />

      {/* ── Summary Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Shortlisted Creators"
          value={metrics.totalCount}
          icon={Users}
          accent="amber"
        />
        <StatCard
          label="Estimated Campaign Budget"
          value={formatUSD(metrics.totalRate)}
          icon={DollarSign}
          accent="emerald"
        />
        <StatCard
          label="Avg. Algorithmic Match"
          value={metrics.avgMatch > 0 ? `${metrics.avgMatch}%` : 'N/A'}
          icon={Sparkles}
          accent="violet"
        />
      </div>

      {/* ── Filter Tabs & Clear Action ── */}
      <div className="flex items-center justify-between border-b border-navy-800 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {['all', 'saved', 'contacted', 'declined'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors',
                filterStatus === tab
                  ? 'bg-navy-800 text-navy-50 border border-navy-700'
                  : 'text-navy-400 hover:text-navy-200'
              )}
            >
              {tab} ({tab === 'all' ? enrichedShortlist.length : enrichedShortlist.filter((i) => i.entry.status === tab).length})
            </button>
          ))}
        </div>

        {enrichedShortlist.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
          >
            <Trash2 size={13} /> Clear Shortlist
          </button>
        )}
      </div>

      {/* ── Shortlist Cards List ── */}
      {filteredShortlist.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title={enrichedShortlist.length === 0 ? 'Your shortlist is currently empty' : 'No creators in this filter status'}
          description="Discover vetted creators and add them to your shortlist with personalized AI campaign match scores."
          action={
            <Button variant="primary" onClick={() => navigate('/discovery')}>
              Explore Creators & Discovery
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredShortlist.map(({ entry, creator, brief }) => {
            if (!creator) return null;

            return (
              <Card
                key={entry.id}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 hover:border-navy-600 transition-colors"
              >
                {/* Creator Details */}
                <div className="flex items-center gap-4 min-w-[280px]">
                  <Avatar src={creator.avatarUrl} alt={creator.name} size="lg" />
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/creators/${creator.id}`}
                        className="font-bold text-sm text-navy-100 hover:text-violet-400 transition-colors"
                      >
                        {creator.name}
                      </Link>
                      {creator.verified && (
                        <CheckCircle2 size={14} className="text-cyan-400" />
                      )}
                    </div>
                    <p className="text-xs text-navy-400">{creator.handle} · {creator.category}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-navy-300">
                      <span className="font-semibold text-emerald-400">
                        {formatUSD(creator.hourlyRate)}/hr
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        {creator.rating}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Match & Campaign Link */}
                <div className="min-w-[180px]">
                  {entry.matchScore && (
                    <Badge variant="violet" className="mb-1">
                      <Sparkles size={11} className="mr-1" /> {entry.matchScore}% AI Fit
                    </Badge>
                  )}
                  {brief ? (
                    <p className="text-xs text-navy-400 flex items-center gap-1">
                      <Target size={11} className="text-violet-400" />
                      Target: <span className="font-medium text-navy-200">{brief.title}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-navy-500">No linked campaign</p>
                  )}
                </div>

                {/* Status & Editable Notes */}
                <div className="flex-1 w-full md:w-auto">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-navy-400">Status:</span>
                    <select
                      value={entry.status}
                      onChange={(e) =>
                        updateShortlistEntry(entry.id, {
                          status: e.target.value as any,
                        })
                      }
                      className="bg-navy-800 border border-navy-700 rounded text-xs text-navy-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    >
                      <option value="saved">Saved</option>
                      <option value="contacted">Contacted</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    defaultValue={entry.notes || ''}
                    placeholder="Add team notes (press Enter to save)..."
                    onBlur={(e) =>
                      updateShortlistEntry(entry.id, { notes: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updateShortlistEntry(entry.id, { notes: (e.target as HTMLInputElement).value });
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="w-full bg-navy-800/60 border border-navy-700/60 rounded px-2.5 py-1 text-xs text-navy-200 placeholder:text-navy-600 focus:outline-none focus:border-violet-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Button
                    size="sm"
                    variant="primary"
                    icon={FolderKanban}
                    onClick={() => navigate('/projects')}
                  >
                    Initiate Request
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Trash2}
                    onClick={() => removeFromShortlist(entry.id)}
                    className="text-navy-400 hover:text-rose-400"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
