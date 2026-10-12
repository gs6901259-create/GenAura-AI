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
import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
  Globe,
  Languages,
  MapPin,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { Creator, CreativeBrief, ShortlistEntry, PortfolioItem } from '@/types';
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
import { cn, formatRupees } from '@/lib/utils';
import {
  auraMatchEngine,
  AuraMatchAnalysis,
  MatchExplanation,
  AuraMatchBreakdown,
} from '@/services/auraMatchEngine';
import {
  toneMatchingService,
  STANDARD_CONTENT_TONES,
  ToneMatchResult,
} from '@/services/toneMatchingService';
import { SUPPORTED_BRIEF_LANGUAGES } from '@/services/multilingualBriefService';

export type { MatchExplanation };
export type MatchAnalysis = AuraMatchAnalysis;

/**
 * Public wrapper preserving backward compatibility for other modules and legacy tests
 */
export function computeCreatorMatch(
  creator: Creator,
  brief: CreativeBrief | null,
  portfolios: PortfolioItem[] = []
): AuraMatchAnalysis {
  return auraMatchEngine.computeMatch(creator, brief, portfolios);
}

// ────────────────────────────────────────────────────────────────────────────
// Match Explanation Modal (Upgraded with 7-Factor AuraMatch & Tone Evidence)
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
  const [activeTab, setActiveTab] = useState<'factors' | 'tone' | 'regional'>('factors');

  const tierColor = !match.isFullyQualified
    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    : match.overallScore >= 88
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    : match.overallScore >= 75
    ? 'text-violet-400 bg-violet-500/10 border-violet-500/30'
    : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-navy-900 border border-navy-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-navy-400 hover:text-white p-1 rounded-lg cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Creator Info Header */}
        <div className="flex items-center gap-4 mb-5">
          <Avatar src={creator.avatarUrl} alt={creator.name} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-navy-50">{creator.name}</h2>
              {creator.verified && <CheckCircle2 size={16} className="text-cyan-400" />}
            </div>
            <p className="text-xs text-navy-400">
              {creator.handle} · {creator.category} · {creator.location || 'Global'}
            </p>
            {brief && (
              <p className="text-xs text-violet-300 mt-1 flex items-center gap-1 font-medium">
                <Target size={12} /> Matching against: <span className="underline">{brief.title}</span>
              </p>
            )}
          </div>
        </div>

        {/* Mandatory Constraint Violation Warning */}
        {!match.isFullyQualified && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 mb-4 flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider text-[11px]">Mandatory Campaign Criteria Failed</p>
              <ul className="list-disc pl-4 mt-1 space-y-0.5">
                {match.mandatoryViolations.map((v, idx) => (
                  <li key={idx}>{v}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Overall Score Banner */}
        <div className={cn('p-4 rounded-xl border flex items-center justify-between mb-5', tierColor)}>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold opacity-80">
              AuraMatch 7-Factor Compatibility ({match.algorithmVersion})
            </p>
            <p className="text-2xl font-extrabold mt-0.5">
              {match.overallScore}% · {match.matchTier}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full border-2 border-current flex items-center justify-center font-bold text-lg">
            {match.overallScore}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-navy-800 pb-2 mb-4 text-xs">
          <button
            onClick={() => setActiveTab('factors')}
            className={cn(
              'px-3 py-1.5 rounded-lg font-medium transition-colors',
              activeTab === 'factors'
                ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                : 'text-navy-400 hover:text-navy-200'
            )}
          >
            📊 7-Factor Breakdown
          </button>
          <button
            onClick={() => setActiveTab('tone')}
            className={cn(
              'px-3 py-1.5 rounded-lg font-medium transition-colors',
              activeTab === 'tone'
                ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                : 'text-navy-400 hover:text-navy-200'
            )}
          >
            🎭 Tone & Style Fit ({match.breakdown.toneCompatibility}%)
          </button>
          <button
            onClick={() => setActiveTab('regional')}
            className={cn(
              'px-3 py-1.5 rounded-lg font-medium transition-colors',
              activeTab === 'regional'
                ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                : 'text-navy-400 hover:text-navy-200'
            )}
          >
            🌍 Regional & Language Context
          </button>
        </div>

        {/* TAB 1: 7-FACTOR BREAKDOWN */}
        {activeTab === 'factors' && (
          <div className="space-y-4 mb-5">
            <h3 className="text-xs uppercase font-bold text-navy-400 tracking-wider">
              Normalized Factor Scores (100% Weight Sum)
            </h3>
            <div className="space-y-2.5">
              {[
                { label: 'Campaign Niche Relevance (25%)', score: match.breakdown.nicheRelevance },
                { label: 'Audience & Target-Market Fit (20%)', score: match.breakdown.audienceTargetFit },
                { label: 'Language Compatibility (15%)', score: match.breakdown.languageCompatibility },
                { label: 'Campaign Tone Compatibility (15%)', score: match.breakdown.toneCompatibility },
                { label: 'Budget Compatibility in ₹ INR (10%)', score: match.breakdown.budgetCompatibility },
                { label: 'Platform & Format Fit (10%)', score: match.breakdown.platformFormatFit },
                { label: 'Regional Campaign Experience (5%)', score: match.breakdown.regionalExperience },
              ].map((item) => (
                <div key={item.label} className="text-xs">
                  <div className="flex justify-between text-navy-300 mb-1">
                    <span>{item.label}</span>
                    <span className="font-semibold text-navy-100">{item.score}/100</span>
                  </div>
                  <div className="w-full bg-navy-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Missing Criteria */}
            {match.missingCriteria.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 mt-4 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Info size={13} /> Sub-optimal or Unverified Criteria:
                </p>
                {match.missingCriteria.map((m, idx) => (
                  <p key={idx}>• {m}</p>
                ))}
              </div>
            )}

            {/* Explanations List */}
            <h3 className="text-xs uppercase font-bold text-navy-400 tracking-wider pt-2">
              Explainable Factor Insights
            </h3>
            <div className="space-y-2">
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
          </div>
        )}

        {/* TAB 2: TONE & STYLE FIT */}
        {activeTab === 'tone' && match.toneDetails && (
          <div className="space-y-4 mb-5 text-xs">
            <div className="p-3.5 rounded-xl bg-navy-800/80 border border-navy-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-navy-100">Tone Compatibility Score:</span>
                <Badge variant={match.toneDetails.score >= 80 ? 'success' : 'violet'}>
                  {match.toneDetails.score}% ({match.toneDetails.matchTier})
                </Badge>
              </div>
              <p className="text-navy-400">
                Confidence Level: <strong className="text-navy-200">{match.toneDetails.confidenceLevel}</strong> ·
                Provenance: <span className="font-mono text-cyan-400">{match.toneDetails.provenance}</span>
              </p>
            </div>

            {/* Matched Characteristics */}
            <div>
              <h4 className="font-bold text-emerald-400 mb-1.5">✓ Matched Style Characteristics:</h4>
              {match.toneDetails.matchedCharacteristics.length > 0 ? (
                <ul className="space-y-1 text-navy-200 pl-3">
                  {match.toneDetails.matchedCharacteristics.map((c, i) => (
                    <li key={i}>• {c}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-navy-500 italic pl-3">No direct tone characteristics matched.</p>
              )}
            </div>

            {/* Potential Mismatches */}
            {match.toneDetails.potentialMismatches.length > 0 && (
              <div>
                <h4 className="font-bold text-amber-400 mb-1.5">⚠ Potential Tone Variations:</h4>
                <ul className="space-y-1 text-navy-300 pl-3">
                  {match.toneDetails.potentialMismatches.map((m, i) => (
                    <li key={i}>• {m}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Supporting Portfolio Samples */}
            {match.toneDetails.supportingPortfolioExamples.length > 0 && (
              <div>
                <h4 className="font-bold text-cyan-400 mb-1.5">📁 Supporting Portfolio Evidence:</h4>
                <ul className="space-y-1 text-navy-300 pl-3">
                  {match.toneDetails.supportingPortfolioExamples.map((ex, i) => (
                    <li key={i}>• {ex}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Evidence Disclaimer */}
            {match.toneDetails.missingEvidence.length > 0 && (
              <div className="p-3 rounded-lg bg-navy-800 border border-navy-700/60 text-navy-400 space-y-1">
                <p className="font-semibold text-navy-300">ℹ Insufficient Evidence Disclosures (Not Penalized as Mismatch):</p>
                {match.toneDetails.missingEvidence.map((ev, i) => (
                  <p key={i}>• {ev}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REGIONAL & LANGUAGE CONTEXT */}
        {activeTab === 'regional' && (
          <div className="space-y-4 mb-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-navy-800 border border-navy-700">
                <p className="text-navy-400 text-[11px] uppercase tracking-wider font-semibold">1. Creator Physical Location</p>
                <p className="font-bold text-navy-100 text-sm mt-0.5">
                  📍 {creator.city ? `${creator.city}, ${creator.country || ''}` : creator.location || 'Declared Global'}
                </p>
                <p className="text-navy-400 text-[11px] mt-1">
                  Timezone: {creator.timezone || 'Asia/Kolkata'} · Remote Collaboration: {creator.remoteAvailable !== false ? '✅ Available' : '❌ On-site Only'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-navy-800 border border-navy-700">
                <p className="text-navy-400 text-[11px] uppercase tracking-wider font-semibold">2. Creator Audience Geography</p>
                <p className="font-bold text-navy-100 text-sm mt-0.5">
                  👥 {creator.audienceRegions?.join(', ') || 'Estimated from profile'}
                </p>
                <p className="text-navy-400 text-[11px] mt-1">
                  Primary Market: {creator.primaryMarket || 'General / Global'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-violet-950/30 border border-violet-500/30">
              <p className="text-violet-300 font-bold uppercase tracking-wider text-[11px] mb-1">
                3. Campaign Target Market Fit
              </p>
              <p className="text-navy-200">
                Target Regions: <strong className="text-white">{brief?.regionalPreferences?.targetCountries?.join(', ') || 'Global'}</strong> ·
                Audience Region Alignment: <span className={match.regionalSummary.audienceRegionMatched ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {match.regionalSummary.audienceRegionMatched ? 'Direct Audience Match' : 'Estimated / Indirect Fit'}
                </span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-navy-800 border border-navy-700">
              <p className="text-navy-400 font-bold uppercase tracking-wider text-[11px] mb-1">
                Language Fluency & Deliverables
              </p>
              <p className="text-navy-200">
                Supported Content Languages: <strong className="text-cyan-400">{match.regionalSummary.languageCoverage || 'English'}</strong>
              </p>
              {creator.regionalExpertise && (
                <p className="text-navy-400 mt-2">
                  Regional Content Specialization: <span className="text-navy-300">{creator.regionalExpertise.join(' · ')}</span>
                </p>
              )}
            </div>
          </div>
        )}

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
  const [searchParams, setSearchParams] = useSearchParams();
  const { creators, briefs, shortlist, addToShortlist, removeFromShortlist } = useAppStore();

  // Search & Filter State (synced from URL search params)
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [selectedBriefId, setSelectedBriefId] = useState<string>(() => searchParams.get('brief') || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>(() => searchParams.get('cat') || 'all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>(() => searchParams.get('plat') || 'all');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(() => searchParams.get('ver') === '1');
  const [remoteOnly, setRemoteOnly] = useState<boolean>(() => searchParams.get('rem') === '1');
  const [selectedCountry, setSelectedCountry] = useState<string>(() => searchParams.get('country') || 'all');
  const [selectedAudienceRegion, setSelectedAudienceRegion] = useState<string>(() => searchParams.get('aud') || 'all');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(() => {
    const raw = searchParams.get('lang');
    return raw ? raw.split(',').filter(Boolean) : [];
  });
  const [languageMode, setLanguageMode] = useState<'AND' | 'OR'>(() => {
    return (searchParams.get('langMode') as 'AND' | 'OR') || 'OR';
  });
  const [selectedTone, setSelectedTone] = useState<string>(() => searchParams.get('tone') || 'all');
  const [maxHourlyRate, setMaxHourlyRate] = useState<number>(() => {
    const r = searchParams.get('rate');
    return r ? Number(r) : 25000;
  });
  const [sortBy, setSortBy] = useState<'match' | 'rating' | 'rate-asc' | 'rate-desc'>(() => {
    return (searchParams.get('sort') as any) || 'match';
  });

  // Expandable Advanced Filters drawer
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

  // Selected creator for Match Modal
  const [modalCreator, setModalCreator] = useState<Creator | null>(null);

  // Sync state to URL search params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedBriefId !== 'all') params.set('brief', selectedBriefId);
    if (selectedCategory !== 'all') params.set('cat', selectedCategory);
    if (selectedPlatform !== 'all') params.set('plat', selectedPlatform);
    if (verifiedOnly) params.set('ver', '1');
    if (remoteOnly) params.set('rem', '1');
    if (selectedCountry !== 'all') params.set('country', selectedCountry);
    if (selectedAudienceRegion !== 'all') params.set('aud', selectedAudienceRegion);
    if (selectedLanguages.length > 0) {
      params.set('lang', selectedLanguages.join(','));
      params.set('langMode', languageMode);
    }
    if (selectedTone !== 'all') params.set('tone', selectedTone);
    if (maxHourlyRate < 25000) params.set('rate', String(maxHourlyRate));
    if (sortBy !== 'match') params.set('sort', sortBy);

    setSearchParams(params, { replace: true });
  }, [
    searchQuery,
    selectedBriefId,
    selectedCategory,
    selectedPlatform,
    verifiedOnly,
    remoteOnly,
    selectedCountry,
    selectedAudienceRegion,
    selectedLanguages,
    languageMode,
    selectedTone,
    maxHourlyRate,
    sortBy,
    setSearchParams,
  ]);

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

  // Available unique countries and regions from creators + standard set
  const availableCountries = useMemo(() => {
    const set = new Set<string>(['India', 'United States', 'United Kingdom', 'France', 'Germany', 'Canada', 'Australia', 'Japan']);
    creators.forEach((c) => {
      if (c.country) set.add(c.country);
    });
    return Array.from(set).sort();
  }, [creators]);

  const availableAudienceRegions = useMemo(() => {
    return [
      'India / South Asia',
      'North America',
      'Europe',
      'East Asia',
      'Southeast Asia',
      'Middle East / MENA',
      'Latin America',
      'Global / Worldwide',
    ];
  }, []);

  const commonFilterLanguages = useMemo(() => {
    return [
      'Hindi',
      'English',
      'Telugu',
      'Tamil',
      'Kannada',
      'Malayalam',
      'Bengali',
      'Marathi',
      'Gujarati',
      'Spanish',
      'French',
      'German',
      'Japanese',
    ];
  }, []);

  // Count active advanced filters
  const activeAdvancedFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCountry !== 'all') count++;
    if (selectedAudienceRegion !== 'all') count++;
    if (selectedLanguages.length > 0) count++;
    if (selectedTone !== 'all') count++;
    if (remoteOnly) count++;
    return count;
  }, [selectedCountry, selectedAudienceRegion, selectedLanguages, selectedTone, remoteOnly]);

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  // Filter and Score Creators
  const scoredCreators = useMemo(() => {
    return creators
      .map((c) => {
        const match = computeCreatorMatch(c, activeBrief);
        return { creator: c, match };
      })
      .filter(({ creator: c }) => {
        // Search filter (name, handle, tagline, bio, skills, location, languages, expertise)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesQuery =
            c.name.toLowerCase().includes(q) ||
            c.handle.toLowerCase().includes(q) ||
            c.tagline.toLowerCase().includes(q) ||
            c.bio.toLowerCase().includes(q) ||
            c.skills.some((s) => s.toLowerCase().includes(q)) ||
            (c.country && c.country.toLowerCase().includes(q)) ||
            (c.city && c.city.toLowerCase().includes(q)) ||
            (c.languagesSpoken && c.languagesSpoken.some((l) => l.toLowerCase().includes(q))) ||
            (c.contentLanguages && c.contentLanguages.some((l) => l.toLowerCase().includes(q))) ||
            (c.culturalSpecialization &&
              (Array.isArray(c.culturalSpecialization)
                ? c.culturalSpecialization.some((cs: string) => cs.toLowerCase().includes(q))
                : typeof c.culturalSpecialization === 'string' &&
                  (c.culturalSpecialization as string).toLowerCase().includes(q))) ||
            (c.regionalExpertise && c.regionalExpertise.some((re) => re.toLowerCase().includes(q)));
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

        // Remote only
        if (remoteOnly && c.remoteAvailable === false) {
          return false;
        }

        // Max hourly rate in INR
        if (c.hourlyRate > maxHourlyRate) {
          return false;
        }

        // Geographic Country Filter (Creator Location)
        if (selectedCountry !== 'all') {
          const countryMatch =
            (c.country && c.country.toLowerCase() === selectedCountry.toLowerCase()) ||
            (c.location && c.location.toLowerCase().includes(selectedCountry.toLowerCase()));
          if (!countryMatch) return false;
        }

        // Audience Region Filter (Audience Geography)
        if (selectedAudienceRegion !== 'all') {
          const creatorAudienceMatches =
            (c.primaryMarket && c.primaryMarket.toLowerCase().includes(selectedAudienceRegion.toLowerCase())) ||
            (c.audienceRegions && c.audienceRegions.some((r) => r.toLowerCase().includes(selectedAudienceRegion.toLowerCase()))) ||
            (c.audienceDistribution && Object.keys(c.audienceDistribution).some((k) => k.toLowerCase().includes(selectedAudienceRegion.toLowerCase())));
          if (!creatorAudienceMatches) return false;
        }

        // Language Filter (Multi-select with AND / OR modes)
        if (selectedLanguages.length > 0) {
          const creatorLangs = new Set<string>([
            ...(c.languagesSpoken || []).map((l) => l.toLowerCase()),
            ...(c.contentLanguages || []).map((l) => l.toLowerCase()),
            ...(c.deliverableLanguages || []).map((l) => l.toLowerCase()),
          ]);

          if (creatorLangs.size === 0) {
            // Default English if none declared
            creatorLangs.add('english');
          }

          if (languageMode === 'AND') {
            const hasAll = selectedLanguages.every((target) =>
              creatorLangs.has(target.toLowerCase())
            );
            if (!hasAll) return false;
          } else {
            const hasAny = selectedLanguages.some((target) =>
              creatorLangs.has(target.toLowerCase())
            );
            if (!hasAny) return false;
          }
        }

        // Tone Selector Filter
        if (selectedTone !== 'all') {
          const declaredTone = c.toneProfile?.primaryTone?.toLowerCase();
          const secondaryTones = (c.toneProfile?.secondaryTones || []).map((t) => t.toLowerCase());
          const targetTone = selectedTone.toLowerCase();
          const matchesTone =
            declaredTone === targetTone ||
            secondaryTones.includes(targetTone) ||
            c.tagline.toLowerCase().includes(targetTone) ||
            c.bio.toLowerCase().includes(targetTone);
          if (!matchesTone) return false;
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
    remoteOnly,
    selectedCountry,
    selectedAudienceRegion,
    selectedLanguages,
    languageMode,
    selectedTone,
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
        notes: activeBrief ? `Matched with brief: ${activeBrief.title}` : 'Discovered in global matching studio',
        addedAt: new Date().toISOString(),
        matchScore,
      });
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedBriefId('all');
    setSelectedCategory('all');
    setSelectedPlatform('all');
    setVerifiedOnly(false);
    setRemoteOnly(false);
    setSelectedCountry('all');
    setSelectedAudienceRegion('all');
    setSelectedLanguages([]);
    setLanguageMode('OR');
    setSelectedTone('all');
    setMaxHourlyRate(25000);
    setSortBy('match');
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Global Creator Discovery & AI Matching"
        subtitle="Discover verified creators worldwide, filter by language fluency, audience demographics, content tone, and match with campaign briefs."
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
              Active AuraMatch Engine Target (7-Factor Scoring)
            </p>
            <p className="text-sm font-semibold text-navy-100">
              {activeBrief
                ? `Matching against: ${activeBrief.title} (${activeBrief.briefLanguage || 'English'})`
                : 'Showing baseline algorithmic fit (Select a campaign brief to personalize weights)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedBriefId}
            onChange={(e) => setSelectedBriefId(e.target.value)}
            className="w-full md:w-72 bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-xs text-navy-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="all">⚡ Baseline Fit (No brief selected)</option>
            {briefs.map((b) => (
              <option key={b.id} value={b.id}>
                🎯 {b.title} ({formatRupees(b.budget.max)} cap)
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
      <div className="bg-navy-900 border border-navy-700/60 rounded-xl p-4 space-y-4 shadow-lg">
        {/* Main Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search bar */}
          <div className="md:col-span-5 relative">
            <Input
              icon={Search}
              placeholder="Search creators, skills, languages, city, country, culture..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-navy-800 text-sm"
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
              <option value="match">Sort: AuraMatch Score</option>
              <option value="rating">Sort: Client Rating</option>
              <option value="rate-asc">Sort: Rate: Low to High</option>
              <option value="rate-desc">Sort: Rate: High to Low</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row with Advanced Drawer Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-navy-800 text-xs text-navy-300">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Verified toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="rounded border-navy-700 bg-navy-800 text-violet-600 focus:ring-violet-500"
              />
              <span className="flex items-center gap-1">
                <CheckCircle2 size={13} className="text-cyan-400" /> Verified Only
              </span>
            </label>

            {/* Remote collaboration toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="rounded border-navy-700 bg-navy-800 text-violet-600 focus:ring-violet-500"
              />
              <span className="flex items-center gap-1">
                <Globe size={13} className="text-emerald-400" /> Remote Available
              </span>
            </label>

            {/* Max Hourly Rate Slider in INR */}
            <div className="flex items-center gap-2">
              <span>Max Rate:</span>
              <input
                type="range"
                min="1000"
                max="25000"
                step="500"
                value={maxHourlyRate}
                onChange={(e) => setMaxHourlyRate(Number(e.target.value))}
                className="w-24 accent-violet-500 cursor-pointer"
              />
              <span className="font-semibold text-navy-100">{formatRupees(maxHourlyRate)}/hr</span>
            </div>

            {/* Advanced Filters Toggle Button */}
            <button
              onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-colors cursor-pointer text-xs font-medium',
                isAdvancedFiltersOpen || activeAdvancedFilterCount > 0
                  ? 'bg-violet-950/70 text-violet-200 border-violet-600/50'
                  : 'bg-navy-800/80 text-navy-300 border-navy-700 hover:text-navy-100'
              )}
            >
              <SlidersHorizontal size={13} />
              <span>Advanced Filters (Geo, Languages & Tone)</span>
              {activeAdvancedFilterCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-violet-600 text-white font-bold ml-0.5">
                  {activeAdvancedFilterCount}
                </span>
              )}
              {isAdvancedFiltersOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
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

        {/* ── Expandable Advanced Geographic & Multilingual Drawer ── */}
        {isAdvancedFiltersOpen && (
          <div className="pt-4 border-t border-navy-800 space-y-4 bg-navy-950/40 p-3.5 rounded-lg border border-navy-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Creator Physical Geography */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-navy-200 flex items-center gap-1.5">
                  <MapPin size={13} className="text-rose-400" /> Creator Country / Base
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-xs text-navy-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="all">Any Creator Country</option>
                  {availableCountries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-navy-400">
                  Filters where the creator physically resides or produces content.
                </p>
              </div>

              {/* 2. Target Audience Geography */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-navy-200 flex items-center gap-1.5">
                  <Users size={13} className="text-cyan-400" /> Primary Audience Region
                </label>
                <select
                  value={selectedAudienceRegion}
                  onChange={(e) => setSelectedAudienceRegion(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-xs text-navy-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="all">Any Audience Demographics</option>
                  {availableAudienceRegions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-navy-400">
                  Separates creator location from where followers and campaign reach reside.
                </p>
              </div>

              {/* 3. Content Tone Preference */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-navy-200 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-400" /> Brand & Content Tone
                </label>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-xs text-navy-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="all">Any Content Tone</option>
                  {STANDARD_CONTENT_TONES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-navy-400">
                  Match voice styling (humorous, inspirational, educational, luxury, etc.).
                </p>
              </div>
            </div>

            {/* 4. Language Multi-Select & Logic Mode (AND vs OR) */}
            <div className="pt-2 border-t border-navy-800/80 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-semibold text-navy-200 flex items-center gap-1.5">
                  <Languages size={13} className="text-emerald-400" /> Language Fluency & Deliverables
                  {selectedLanguages.length > 0 && (
                    <span className="text-[11px] text-violet-300 font-normal">
                      ({selectedLanguages.length} selected)
                    </span>
                  )}
                </label>

                {/* AND / OR Logic Switch */}
                <div className="flex items-center gap-2 bg-navy-900 border border-navy-700 rounded-lg p-0.5 text-xs">
                  <span className="text-[11px] text-navy-400 pl-1.5">Match Logic:</span>
                  <button
                    type="button"
                    onClick={() => setLanguageMode('OR')}
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer',
                      languageMode === 'OR'
                        ? 'bg-violet-600 text-white'
                        : 'text-navy-400 hover:text-navy-200'
                    )}
                    title="Creator matches if they speak ANY selected language"
                  >
                    ANY (OR)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguageMode('AND')}
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer',
                      languageMode === 'AND'
                        ? 'bg-violet-600 text-white'
                        : 'text-navy-400 hover:text-navy-200'
                    )}
                    title="Creator must speak ALL selected languages"
                  >
                    ALL (AND)
                  </button>
                </div>
              </div>

              {/* Language Chips */}
              <div className="flex flex-wrap gap-1.5">
                {commonFilterLanguages.map((lang) => {
                  const isSelected = selectedLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer',
                        isSelected
                          ? 'bg-violet-600 text-white border-violet-500 shadow-sm'
                          : 'bg-navy-800 text-navy-300 border-navy-700/80 hover:bg-navy-750 hover:text-navy-100'
                      )}
                    >
                      {isSelected && <Check size={11} />}
                      {lang}
                    </button>
                  );
                })}
                {selectedLanguages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedLanguages([])}
                    className="text-xs text-rose-400 hover:text-rose-300 underline px-1 py-1 cursor-pointer"
                  >
                    Clear languages
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Creator Match Cards Grid ── */}
      {scoredCreators.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No creators match your current criteria"
          description="We couldn't find creators meeting all the active filters. Review the relaxation suggestions below:"
          action={
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-navy-900 border border-navy-800 text-left text-xs text-navy-300 space-y-2 max-w-md mx-auto">
                <p className="font-semibold text-navy-100 flex items-center gap-1.5">
                  <Info size={14} className="text-violet-400" /> Quick Relaxation Tips:
                </p>
                {languageMode === 'AND' && selectedLanguages.length > 1 && (
                  <p>
                    • Switch Language Match from <strong>ALL (AND)</strong> to <strong>ANY (OR)</strong> so creators fluent in any selected language appear.
                  </p>
                )}
                {selectedCountry !== 'all' && (
                  <p>• Set Creator Country to <strong>Any Country</strong> to view remote-friendly global creators.</p>
                )}
                {selectedAudienceRegion !== 'all' && (
                  <p>• Set Audience Region to <strong>Any Demographics</strong> to expand creator reach.</p>
                )}
                {selectedTone !== 'all' && (
                  <p>• Try resetting the Content Tone filter to include versatile creators.</p>
                )}
                {maxHourlyRate < 25000 && (
                  <p>• Increase the Max Hourly Rate slider above {formatRupees(maxHourlyRate)}/hr.</p>
                )}
              </div>

              <Button variant="secondary" onClick={handleClearFilters}>
                Reset All Filters
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scoredCreators.map(({ creator, match }) => {
            const isShortlisted = shortlistedIds.has(creator.id);
            const scoreColor = !match.isFullyQualified
              ? 'text-rose-400 border-rose-500/40 bg-rose-500/10'
              : match.overallScore >= 88
              ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
              : match.overallScore >= 75
              ? 'text-violet-400 border-violet-500/40 bg-violet-500/10'
              : 'text-amber-400 border-amber-500/40 bg-amber-500/10';

            const displayLanguages = creator.languagesSpoken || ['English'];
            const locationText = creator.city && creator.country
              ? `${creator.city}, ${creator.country}`
              : creator.country || creator.location || 'Global';

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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            to={`/creators/${creator.id}`}
                            className="font-bold text-sm text-navy-100 hover:text-violet-400 transition-colors"
                          >
                            {creator.name}
                          </Link>
                          {creator.verified && (
                            <span title="Verified Creator">
                              <CheckCircle2 size={14} className="text-cyan-400 shrink-0" />
                            </span>
                          )}
                          {creator.remoteAvailable !== false && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Remote
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-navy-400">{creator.handle}</p>
                      </div>
                    </div>

                    {/* 7-Factor AuraMatch Score Badge button */}
                    <button
                      onClick={() => setModalCreator(creator)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 shrink-0',
                        scoreColor
                      )}
                      title="Click to inspect 7-factor AuraMatch & tone breakdown"
                    >
                      <Sparkles size={11} />
                      {match.overallScore}% Fit
                    </button>
                  </div>

                  {/* Category & Tagline */}
                  <p className="text-xs text-navy-200 font-medium mb-1 capitalize">
                    {creator.category.replace('-', ' ')}
                  </p>
                  <p className="text-xs text-navy-400 line-clamp-2 mb-2">
                    {creator.tagline || creator.bio}
                  </p>

                  {/* Geographic & Multilingual Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5 text-[11px]">
                    {/* Location */}
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-navy-800 text-navy-300 border border-navy-700/50">
                      <MapPin size={11} className="text-rose-400" />
                      {locationText}
                    </span>

                    {/* Languages */}
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-navy-800 text-navy-300 border border-navy-700/50">
                      <Languages size={11} className="text-emerald-400" />
                      {displayLanguages.slice(0, 2).join(', ')}
                      {displayLanguages.length > 2 && ` +${displayLanguages.length - 2}`}
                    </span>

                    {/* Primary Market / Tone */}
                    {creator.primaryMarket && (
                      <span className="px-1.5 py-0.5 rounded bg-navy-800 text-cyan-400 border border-cyan-500/20 text-[10px]">
                        {creator.primaryMarket}
                      </span>
                    )}
                    {creator.toneProfile?.primaryTone && (
                      <span className="px-1.5 py-0.5 rounded bg-violet-950/60 text-violet-300 border border-violet-500/20 text-[10px]">
                        {creator.toneProfile.primaryTone}
                      </span>
                    )}
                  </div>

                  {/* Skills Pills */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {creator.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded text-[10px] bg-navy-800/80 text-navy-300 border border-navy-700/40"
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

                {/* Footer with Rate in INR, Rating & Action Buttons */}
                <div className="pt-3 border-t border-navy-800/80">
                  <div className="flex items-center justify-between text-xs text-navy-300 mb-3">
                    <div className="flex items-center gap-1">
                      <Star size={13} className="text-amber-400 fill-amber-400" />
                      <span className="font-semibold text-navy-100">{creator.rating}</span>
                      <span className="text-navy-500">({creator.reviewCount})</span>
                    </div>
                    <div className="font-bold text-navy-100">
                      {formatRupees(creator.hourlyRate)}/hr
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
          value={formatRupees(metrics.totalRate)}
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
                        {formatRupees(creator.hourlyRate)}/hr
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
