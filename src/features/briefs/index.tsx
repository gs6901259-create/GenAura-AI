/**
 * GenAura AI — BriefGen Module (Member 4)
 * ========================================
 * Features:
 * - Validated campaign brief forms with real-time feedback
 * - Deterministic template-based generation without API credentials
 * - Clearly labeled demo-mode generation
 * - Fully editable output
 * - Full CRUD lifecycle: Create / Edit / Publish / Duplicate / Delete
 * - Brief list and comprehensive detail views
 * - Zustand persistence backed by localStorage
 */
import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  Edit3,
  Copy,
  Trash2,
  DollarSign,
  Download,
  ExternalLink,
  Target,
  Users,
  ArrowLeft,
  Save,
  Globe,
  Languages,
  MapPin,
  Layers,
  Check,
  ArrowRightLeft,
  BookOpen,
  AlertCircle,
  Split,
  X,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatRupees, cn } from '@/lib/utils';
import {
  CreativeBrief,
  BriefStatus,
  ContentType,
  asBriefId,
  RegionalCampaignPreferences,
  CampaignTonePreferences,
  BriefLanguageVariant,
} from '@/types';
import {
  PageHeader,
  Button,
  Badge,
  Card,
  StatCard,
  EmptyState,
} from '@/components/ui';
import { generateDeterministicBriefContent } from './deterministicGenerator';
import { DemoBadgeBanner } from './DemoBadgeBanner';
import {
  multilingualBriefService,
  SUPPORTED_BRIEF_LANGUAGES,
  SupportedLanguage,
  BriefComparisonResult,
} from '@/services/multilingualBriefService';
import { STANDARD_CONTENT_TONES } from '@/services/toneMatchingService';

// ────────────────────────────────────────────────────────────────────────────
// Presets for rapid demo form pre-fill
// ────────────────────────────────────────────────────────────────────────────
const PRESETS = [
  {
    id: 'saas-launch',
    name: 'SaaS 2.0 Launch',
    category: 'Tech & SaaS',
    data: {
      title: 'AuraFlow 2.0 Global Rollout',
      brandName: 'AuraFlow Technologies',
      category: 'Tech & SaaS',
      contentType: 'video-script' as ContentType,
      description: 'Coordinated influencer rollout for our asynchronous workflow automation app.',
      demographics: 'Remote software engineers, tech leads, founders, and productivity creators',
      painPoints: 'Context switching across 10 apps, manual task scheduling, meeting fatigue',
      budgetMin: 30000,
      budgetMax: 45000,
      channels: ['YouTube', 'LinkedIn', 'X (Twitter)'],
      tone: 'Educational & Authoritative',
      callToAction: 'Click the link in bio to start your free 30-day extended trial with code AURA26',
      requiredSkills: ['Screen Recording', 'Software Walkthrough', 'Technical Scripting'],
    },
  },
  {
    id: 'skincare-glow',
    name: 'Skincare Barrier Glow',
    category: 'Beauty & Skincare',
    data: {
      title: 'LumiGlow Hyaluronic Barrier Defense',
      brandName: 'LumiGlow Botanicals',
      category: 'Beauty & Skincare',
      contentType: 'social-post' as ContentType,
      description: 'Aesthetic short-form routine campaign showing daily glass-skin barrier recovery.',
      demographics: 'Skincare enthusiasts, clean beauty shoppers, Gen Z & Millennial consumers',
      painPoints: 'Dry winter skin, heavy pore-clogging creams, redness from active acids',
      budgetMin: 20000,
      budgetMax: 30000,
      channels: ['TikTok', 'Instagram'],
      tone: 'Authentic & Relatable',
      callToAction: 'Use code GLOWUP for 20% off your first bottle at lumiglow.com',
      requiredSkills: ['GRWM Routine', 'High-Res Macro Photography', 'Aesthetic Reels'],
    },
  },
  {
    id: 'fitness-challenge',
    name: 'Fitness 30-Day Push',
    category: 'Fitness & Wellness',
    data: {
      title: 'ApexPulse New Year Transformation',
      brandName: 'ApexPulse Labs',
      category: 'Fitness & Wellness',
      contentType: 'ad-creative' as ContentType,
      description: 'Contagious energy campaign driving mobile training app installations.',
      demographics: 'Active gym-goers, marathoners, wearable-tech trackers aged 22-40',
      painPoints: 'Plateaued progress, inconsistent hydration, lack of structured workout splits',
      budgetMin: 35000,
      budgetMax: 50000,
      channels: ['Instagram', 'TikTok', 'YouTube'],
      tone: 'High Energy & Bold',
      callToAction: 'Download ApexPulse today for a 14-day free trial',
      requiredSkills: ['Workout Filming', 'Energy Voiceover', 'Heart Rate Overlay'],
    },
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Briefs List Page
// ────────────────────────────────────────────────────────────────────────────
export function BriefsPage() {
  const navigate = useNavigate();
  const briefs = useAppStore((s) => s.briefs);
  const updateBrief = useAppStore((s) => s.updateBrief);
  const removeBrief = useAppStore((s) => s.removeBrief);
  const addBrief = useAppStore((s) => s.addBrief);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [briefToDelete, setBriefToDelete] = useState<CreativeBrief | null>(null);

  // Derived metrics
  const metrics = useMemo(() => {
    const total = briefs.length;
    const published = briefs.filter((b) => b.status === 'published').length;
    const drafts = briefs.filter((b) => b.status === 'draft').length;
    const demoGenerated = briefs.filter((b) => b.isDemoGenerated).length;
    const totalBudget = briefs.reduce((acc, b) => acc + (b.budget.max || b.budget.min || 0), 0);
    return { total, published, drafts, demoGenerated, totalBudget };
  }, [briefs]);

  // Filtering
  const filteredBriefs = useMemo(() => {
    return briefs.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && b.category !== categoryFilter && b.contentType !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchDesc = b.description.toLowerCase().includes(q);
        const matchBrand = (b.brandName || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchBrand) return false;
      }
      return true;
    });
  }, [briefs, search, statusFilter, categoryFilter]);

  const handlePublishToggle = (b: CreativeBrief, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus: BriefStatus = b.status === 'published' ? 'draft' : 'published';
    const now = new Date().toISOString();
    updateBrief(b.id, { status: nextStatus, updatedAt: now });
  };

  const handleDuplicate = (b: CreativeBrief, e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date().toISOString();
    const copy: CreativeBrief = {
      ...JSON.parse(JSON.stringify(b)),
      id: asBriefId(`b-${Date.now()}`),
      title: `${b.title} (Copy)`,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
    addBrief(copy);
  };

  const handleDelete = (b: CreativeBrief, e: React.MouseEvent) => {
    e.stopPropagation();
    setBriefToDelete(b);
  };

  const confirmDelete = () => {
    if (briefToDelete) {
      removeBrief(briefToDelete.id);
      setBriefToDelete(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Creative Briefs"
        subtitle="Design, synthesize, edit, and publish campaign briefs with deterministic AI."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              icon={Sparkles}
              onClick={() => navigate('/briefs/new?mode=demo')}
            >
              Generate with AI (Demo)
            </Button>
            <Button
              icon={Plus}
              onClick={() => navigate('/briefs/new')}
            >
              New Brief
            </Button>
          </div>
        }
      />

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Briefs" value={metrics.total} icon={FileText} accent="violet" />
        <StatCard label="Published Active" value={metrics.published} icon={CheckCircle2} accent="emerald" />
        <StatCard label="Drafts in Pipeline" value={metrics.drafts} icon={Edit3} accent="amber" />
        <StatCard label="Pipeline Budget" value={formatRupees(metrics.totalBudget)} icon={DollarSign} accent="cyan" />
        <StatCard label="Demo AI Generated" value={metrics.demoGenerated} icon={Sparkles} accent="rose" />
      </div>

      {/* Filters Bar */}
      <Card className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            placeholder="Search briefs by title, brand, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-navy-950 border border-navy-800 rounded-lg pl-9 pr-3 py-2 text-sm text-navy-100 placeholder-navy-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-navy-950 border border-navy-800 rounded-lg px-3 py-2 text-sm text-navy-200 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-navy-950 border border-navy-800 rounded-lg px-3 py-2 text-sm text-navy-200 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Types</option>
            <option value="video-script">Video Script</option>
            <option value="social-post">Social Post</option>
            <option value="ad-creative">Ad Creative</option>
            <option value="brand-identity">Brand Identity</option>
            <option value="Tech & SaaS">Tech & SaaS</option>
            <option value="Beauty & Skincare">Beauty & Skincare</option>
            <option value="Fitness & Wellness">Fitness & Wellness</option>
          </select>
        </div>
      </Card>

      {/* Briefs Cards Grid */}
      {filteredBriefs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No briefs found"
          description={
            search || statusFilter !== 'all'
              ? 'No briefs match your active filter criteria.'
              : 'Start by creating your first creative brief or generate one with demo AI.'
          }
          action={
            <Button icon={Plus} onClick={() => navigate('/briefs/new')}>
              Create Brief
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBriefs.map((b) => (
            <div
              key={b.id}
              onClick={() => navigate(`/briefs/${b.id}`)}
              className="bg-navy-900/70 border border-navy-800 hover:border-violet-500/50 rounded-xl p-5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-950/20 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                    {b.brandName || b.contentType}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={b.status === 'published' ? 'success' : b.status === 'draft' ? 'warning' : 'default'}>
                      {b.status}
                    </Badge>
                    {b.isDemoGenerated && (
                      <Badge variant="violet">
                        ⚡ Demo
                      </Badge>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-navy-50 line-clamp-1 mb-1.5 hover:text-violet-300 transition-colors">
                  {b.title}
                </h3>
                <p className="text-xs text-navy-400 line-clamp-2 leading-relaxed">
                  {b.generatedContent?.executiveSummary || b.description}
                </p>
              </div>

              <div className="bg-navy-950 border border-navy-800/80 rounded-lg p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-navy-500 block text-[10px] uppercase font-semibold">Budget</span>
                  <span className="text-emerald-400 font-bold">
                    {formatRupees(b.budget.max || b.budget.min)} {b.budget.currency || 'INR'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-navy-500 block text-[10px] uppercase font-semibold">Timeline</span>
                  <span className="text-navy-300 font-medium">
                    {b.timeline.startDate} → {b.timeline.deadline}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-navy-800/60 text-xs">
                <span className="text-violet-400 font-medium flex items-center gap-1 hover:underline">
                  View Brief <ExternalLink size={12} />
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handlePublishToggle(b, e)}
                    className={`p-1.5 rounded-md hover:bg-navy-800 ${b.status === 'published' ? 'text-emerald-400' : 'text-navy-400'}`}
                    title={b.status === 'published' ? 'Unpublish' : 'Publish'}
                  >
                    <CheckCircle2 size={15} />
                  </button>
                  <button
                    onClick={(e) => handleDuplicate(b, e)}
                    className="p-1.5 rounded-md hover:bg-navy-800 text-navy-400 hover:text-navy-200"
                    title="Duplicate brief"
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/briefs/${b.id}/edit`);
                    }}
                    className="p-1.5 rounded-md hover:bg-navy-800 text-navy-400 hover:text-navy-200"
                    title="Edit brief"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(b, e)}
                    className="p-1.5 rounded-md hover:bg-rose-950/40 text-navy-400 hover:text-rose-400"
                    title="Delete brief"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {briefToDelete && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-navy-50">Delete Creative Brief</h3>
            <p className="text-sm text-navy-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-navy-100">"{briefToDelete.title}"</strong>? This will permanently remove the brief from storage.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setBriefToDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Create New Brief Page (Validated Form + AI Generator)
// ────────────────────────────────────────────────────────────────────────────
export function BriefNewPage() {
  const navigate = useNavigate();
  const addBrief = useAppStore((s) => s.addBrief);

  const [title, setTitle] = useState('');
  const [brandName, setBrandName] = useState('');
  const [category, setCategory] = useState('Tech & SaaS');
  const [contentType, setContentType] = useState<ContentType>('video-script');
  const [description, setDescription] = useState('');
  const [demographics, setDemographics] = useState('Remote software professionals and team leads');
  const [painPoints, setPainPoints] = useState('Too many meetings, complex workflow coordination');
  const [budgetMin, setBudgetMin] = useState(25000);
  const [budgetMax, setBudgetMax] = useState(40000);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState(() => new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [tone, setTone] = useState('Educational & Authoritative');
  const [channels] = useState<string[]>(['YouTube', 'LinkedIn']);
  const [requiredSkills, setRequiredSkills] = useState('Scriptwriting, Screen Demo, Editing');
  const [callToAction, setCallToAction] = useState('Start your 30-day free trial');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Language & Regional Intelligence (18 Languages) ──
  const [briefLanguageCode, setBriefLanguageCode] = useState('en');
  const [targetCountries, setTargetCountries] = useState('India');
  const [targetRegions, setTargetRegions] = useState('Pan-India (Tier 1 & Tier 2 Hubs)');
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>(['Hindi', 'English']);
  const [regionalThemes, setRegionalThemes] = useState('Festive Season & Modern Tech Lifestyle');
  const [localTerminology, setLocalTerminology] = useState('');
  const [localizedCTA, setLocalizedCTA] = useState('');
  const [formalityLevel, setFormalityLevel] = useState<'casual' | 'conversational' | 'formal'>('conversational');
  const [energyLevel, setEnergyLevel] = useState<'low' | 'balanced' | 'high'>('balanced');

  const toggleLanguage = (lang: string) => {
    setPreferredLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleApplyPreset = (presetId: string) => {
    const p = PRESETS.find((item) => item.id === presetId);
    if (!p) return;
    setTitle(p.data.title);
    setBrandName(p.data.brandName);
    setCategory(p.data.category);
    setContentType(p.data.contentType);
    setDescription(p.data.description);
    setDemographics(p.data.demographics);
    setPainPoints(p.data.painPoints);
    setBudgetMin(p.data.budgetMin);
    setBudgetMax(p.data.budgetMax);
    setTone(p.data.tone);
    setCallToAction(p.data.callToAction);
    setRequiredSkills(p.data.requiredSkills.join(', '));
    setErrors({});

    if (presetId === 'saas-launch') {
      setBriefLanguageCode('en');
      setTargetCountries('India, USA, UK');
      setTargetRegions('Metropolitan Tech Hubs');
      setPreferredLanguages(['English']);
      setRegionalThemes('Modern Remote Engineering & Asynchronous Productivity');
      setLocalizedCTA('Start your 30-day extended trial today with code AURA26');
      setFormalityLevel('conversational');
      setEnergyLevel('balanced');
    } else if (presetId === 'skincare-glow') {
      setBriefLanguageCode('hi');
      setTargetCountries('India');
      setTargetRegions('Delhi-NCR, Mumbai, Bangalore, Pune');
      setPreferredLanguages(['Hindi', 'English']);
      setRegionalThemes('Festive Glow & Winter Barrier Defense');
      setLocalizedCTA('Use code GLOWUP for 20% off at lumiglow.in');
      setFormalityLevel('casual');
      setEnergyLevel('balanced');
    } else if (presetId === 'fitness-challenge') {
      setBriefLanguageCode('en');
      setTargetCountries('India');
      setTargetRegions('Bangalore, Hyderabad, Mumbai, Delhi');
      setPreferredLanguages(['English', 'Hindi']);
      setRegionalThemes('New Year transformation & fitness consistency');
      setLocalizedCTA('Download ApexPulse today for a 14-day free trial');
      setFormalityLevel('casual');
      setEnergyLevel('high');
    }
  };

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 3) err.title = 'Title must be at least 3 characters.';
    if (!brandName.trim()) err.brandName = 'Brand name is required.';
    if (!description.trim()) err.description = 'Campaign description is required.';
    if (budgetMax <= 0 || budgetMin <= 0) err.budget = 'Budget must be greater than zero.';
    if (budgetMax < budgetMin) err.budget = 'Max budget cannot be lower than min budget.';
    if (new Date(deadline) < new Date(startDate)) err.deadline = 'Deadline must be after start date.';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (withAI: boolean) => {
    if (!validate()) return;

    const now = new Date().toISOString();
    const langInfo = SUPPORTED_BRIEF_LANGUAGES.find((l) => l.code === briefLanguageCode) || SUPPORTED_BRIEF_LANGUAGES[0];

    const regionalPreferences: RegionalCampaignPreferences = {
      targetCountries: targetCountries.split(',').map((s) => s.trim()).filter(Boolean),
      targetRegions: targetRegions.split(',').map((s) => s.trim()).filter(Boolean),
      preferredContentLanguages: preferredLanguages,
      regionalThemes: regionalThemes ? regionalThemes.split(',').map((s) => s.trim()).filter(Boolean) : [],
      localTerminology: localTerminology ? localTerminology.split(',').map((s) => s.trim()).filter(Boolean) : [],
      localizedCallToAction: localizedCTA || callToAction,
      regionalBudgetAllocation: { [targetCountries || 'India']: budgetMax },
    };

    const tonePreferences: CampaignTonePreferences = {
      campaignTone: tone,
      formalityLevel,
      energyLevel,
      brandVoiceKeywords: [tone, category],
    };

    let generatedContent = undefined;

    if (withAI) {
      const detailed = multilingualBriefService.generateDetailedBrief({
        title,
        brandName,
        category,
        objective: 'product_launch',
        contentType,
        demographics,
        painPoints,
        budgetTotal: budgetMax,
        currency: 'INR',
        channels,
        tone,
        startDate,
        deadline,
        callToAction: localizedCTA || callToAction,
        languageCode: briefLanguageCode,
        regionalPreferences,
        tonePreferences,
      });

      generatedContent = {
        ...detailed.structuredContent,
        executiveSummary: detailed.executiveSummary,
        targetPersonaNarrative: detailed.targetAudience,
        keyMessagingPillars: detailed.keyMessaging || [
          {
            pillar: 'Core Solution & Authenticity',
            description: detailed.executiveSummary,
            hookExamples: [
              `"If you're still dealing with ${painPoints.split(',')[0] || 'this issue'}, watch this immediately..."`,
              `"Here is what happened when I tested ${brandName} for 7 days straight:"`,
            ],
          },
        ],
        timelinePhases: [
          { phase: 'Creator Outreach & Briefing', duration: 'Week 1', milestone: 'Creators selected & contracts signed' },
          { phase: 'Content Production & Review', duration: 'Week 2', milestone: 'Drafts approved by brand' },
          { phase: 'Campaign Go-Live & Tracking', duration: 'Weeks 3-4', milestone: 'Content published & metrics analyzed' },
        ],
        creatorRequirements: [
          `Fluent in ${preferredLanguages.join(', ')}`,
          `Audience concentrated in ${targetCountries}`,
          `Style matching ${tone} tone with ${formalityLevel} delivery`,
        ],
      };
    }

    const newBrief: CreativeBrief = {
      id: asBriefId(`b-${Date.now()}`),
      title: `${title} [${langInfo.name}]`,
      brandName,
      category,
      contentType,
      description,
      requiredSkills: requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
      budget: {
        min: budgetMin,
        max: budgetMax,
        currency: 'INR',
      },
      timeline: {
        startDate,
        deadline,
      },
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      channels,
      tone,
      briefLanguage: langInfo.name,
      regionalPreferences,
      tonePreferences,
      targetAudience: {
        demographics,
        ageRange: '20-45',
        painPoints: [painPoints],
      },
      guidelines: {
        dos: ['Highlight genuine product value', `Include clear CTA: ${localizedCTA || callToAction}`],
        donts: ['No unverified claims', 'Do not mention direct competitors'],
        callToAction: localizedCTA || callToAction,
      },
      generatedContent,
      isDemoGenerated: withAI,
      languageVariants: [],
    };

    addBrief(newBrief);
    navigate(`/briefs/${newBrief.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/briefs')}
            className="inline-flex items-center gap-1.5 text-xs text-navy-400 hover:text-navy-200 mb-2 cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Briefs
          </button>
          <h1 className="text-2xl font-bold text-navy-50">Create Campaign Brief</h1>
          <p className="text-xs text-navy-400 mt-1">
            Configure campaign parameters, target geography, multilingual requirements, and synthesize briefs with deterministic AI.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/briefs')}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => handleSubmit(false)}>
            Save Draft
          </Button>
          <Button icon={Sparkles} onClick={() => handleSubmit(true)}>
            Generate Multilingual Brief (AI)
          </Button>
        </div>
      </div>

      <DemoBadgeBanner />

      {/* Preset Bar */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold text-violet-300 flex items-center gap-1.5">
          <Sparkles size={14} /> Quick-Fill Strategy Preset:
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleApplyPreset(p.id)}
              className="px-3 py-1.5 text-xs bg-navy-800 hover:bg-navy-700 text-navy-200 border border-navy-700 rounded-lg cursor-pointer transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </Card>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Card 1: Overview & Primary Language */}
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-navy-50 flex items-center gap-2">
            <span className="h-5 w-5 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center">1</span>
            Campaign Overview & Primary Brief Language
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-navy-300 mb-1.5">Campaign Title *</label>
              <input
                type="text"
                placeholder="e.g. AuraFlow 2.0 Global Rollout"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg px-3.5 py-2 text-sm text-navy-100 placeholder-navy-500 focus:outline-none focus:border-violet-500"
              />
              {errors.title && <span className="text-rose-400 text-xs mt-1 block">{errors.title}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-300 mb-1.5">Brand Name *</label>
              <input
                type="text"
                placeholder="e.g. AuraFlow Technologies"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg px-3.5 py-2 text-sm text-navy-100 placeholder-navy-500 focus:outline-none focus:border-violet-500"
              />
              {errors.brandName && <span className="text-rose-400 text-xs mt-1 block">{errors.brandName}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-300 mb-1.5">Primary Brief Language (18 Supported) *</label>
              <select
                value={briefLanguageCode}
                onChange={(e) => setBriefLanguageCode(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg px-3.5 py-2 text-sm text-navy-100 focus:outline-none focus:border-violet-500"
              >
                {SUPPORTED_BRIEF_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name} — {l.nativeName} {l.isRegionalIndian ? '(Regional Indian)' : '(Global)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-300 mb-1.5">Content Type *</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg px-3.5 py-2 text-sm text-navy-100 focus:outline-none focus:border-violet-500"
              >
                <option value="video-script">Video Script</option>
                <option value="social-post">Social Post</option>
                <option value="ad-creative">Ad Creative</option>
                <option value="brand-identity">Brand Identity</option>
                <option value="product-photography">Product Photography</option>
                <option value="motion-graphics">Motion Graphics</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-navy-300 mb-1.5">Brief Description / Objective *</label>
              <textarea
                rows={2}
                placeholder="Describe the campaign intent, background, and deliverables..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg px-3.5 py-2 text-sm text-navy-100 placeholder-navy-500 focus:outline-none focus:border-violet-500"
              />
              {errors.description && <span className="text-rose-400 text-xs mt-1 block">{errors.description}</span>}
            </div>
          </div>
        </Card>

        {/* Card 2: Regional Preferences & Cultural Context */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-navy-50 flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center">2</span>
              Regional Preferences & Cultural Context
            </h2>
            <span className="text-[11px] text-cyan-400 font-medium flex items-center gap-1">
              <Globe size={13} /> Intended Audience Geography vs Creator Base
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy-300 mb-1.5">Target Countries</label>
              <input
                type="text"
                placeholder="e.g. India, United States"
                value={targetCountries}
                onChange={(e) => setTargetCountries(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg px-3.5 py-2 text-sm text-navy-100 placeholder-navy-500 focus:outline-none focus:border-violet-500"
              />
              <p className="text-[11px] text-navy-500 mt-1">Countries where the intended audience is located.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-300 mb-1.5">Target Regions / States / Hubs</label>
              <input
                type="text"
                placeholder="e.g. Pan-India, Tier 1 Metros, Maharashtra"
                value={targetRegions}
                onChange={(e) => setTargetRegions(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg px-3.5 py-2 text-sm text-navy-100 placeholder-navy-500 focus:outline-none focus:border-violet-500"
              />
              <p className="text-[11px] text-navy-500 mt-1">Specific regional markets or urban concentrations.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-navy-300 mb-1.5">
                Preferred Content Languages (Creators must deliver in)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
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
                ].map((lang) => {
                  const isSelected = preferredLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1 cursor-pointer transition-colors',
                        isSelected
                          ? 'bg-violet-600 text-white border-violet-500'
                          : 'bg-navy-900 text-navy-400 border-navy-800 hover:text-navy-200'
                      )}
                    >
                      {isSelected && <Check size={11} />}
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-300 mb-1.5">Regional Themes / Cultural Occasions</label>
              <input
                type="text"
                placeholder="e.g. Festive Season, Back to Campus, IPL"
                value={regionalThemes}
                onChange={(e) => setRegionalThemes(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg px-3.5 py-2 text-sm text-navy-100 placeholder-navy-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-300 mb-1.5">Localized Call-to-Action (CTA)</label>
              <input
                type="text"
                placeholder="e.g. Abhi order karein aur paayein 20% discount"
                value={localizedCTA}
                onChange={(e) => setLocalizedCTA(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg px-3.5 py-2 text-sm text-navy-100 placeholder-navy-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-navy-300 mb-1.5">Vernacular Slang / Local Terminology to Include or Avoid</label>
              <input
                type="text"
                placeholder="e.g. Include friendly everyday greetings; Avoid formal corporate jargon"
                value={localTerminology}
                onChange={(e) => setLocalTerminology(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg px-3.5 py-2 text-sm text-navy-100 placeholder-navy-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </Card>

        {/* Card 3: Audience, Tone & Voice */}
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-navy-50 flex items-center gap-2">
            <span className="h-5 w-5 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center">3</span>
            Audience Demographics & Brand Tone
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy-300 mb-1.5">Target Demographics</label>
              <input
                type="text"
                value={demographics}
                onChange={(e) => setDemographics(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg px-3.5 py-2 text-sm text-navy-100 placeholder-navy-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-300 mb-1.5">Campaign Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg px-3.5 py-2 text-sm text-navy-100 focus:outline-none focus:border-violet-500"
              >
                {STANDARD_CONTENT_TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-300 mb-1.5">Formality Level</label>
              <select
                value={formalityLevel}
                onChange={(e) => setFormalityLevel(e.target.value as any)}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg px-3.5 py-2 text-sm text-navy-100 focus:outline-none focus:border-violet-500"
              >
                <option value="casual">Casual (Friendly, colloquial, relatable)</option>
                <option value="conversational">Conversational (Warm, balanced, peer-to-peer)</option>
                <option value="formal">Formal (Professional, authoritative, corporate)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-300 mb-1.5">Energy Cadence</label>
              <select
                value={energyLevel}
                onChange={(e) => setEnergyLevel(e.target.value as any)}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg px-3.5 py-2 text-sm text-navy-100 focus:outline-none focus:border-violet-500"
              >
                <option value="low">Low (Calm, soothing, intimate, reflective)</option>
                <option value="balanced">Balanced (Engaging, steady, clear)</option>
                <option value="high">High (Energetic, urgent, enthusiastic, fast-paced)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-navy-300 mb-1.5">Customer Friction & Pain Points</label>
              <input
                type="text"
                value={painPoints}
                onChange={(e) => setPainPoints(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg px-3.5 py-2 text-sm text-navy-100 placeholder-navy-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </Card>

        {/* Card 4: Budget & Flight Timeline */}
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-navy-50 flex items-center gap-2">
            <span className="h-5 w-5 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center">4</span>
            Budget in Indian Rupees (₹ INR) & Flight Window
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy-300 mb-1.5">Min Budget (₹ INR) *</label>
              <input
                type="number"
                min={1}
                value={budgetMin}
                onChange={(e) => setBudgetMin(Number(e.target.value))}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg px-3.5 py-2 text-sm text-navy-100 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-300 mb-1.5">Max Budget (₹ INR) *</label>
              <input
                type="number"
                min={1}
                value={budgetMax}
                onChange={(e) => setBudgetMax(Number(e.target.value))}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg px-3.5 py-2 text-sm text-navy-100 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-300 mb-1.5">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg px-3.5 py-2 text-sm text-navy-100 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-300 mb-1.5">Deadline *</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg px-3.5 py-2 text-sm text-navy-100 focus:outline-none focus:border-violet-500"
              />
            </div>

            {errors.budget && <div className="md:col-span-4 text-rose-400 text-xs">{errors.budget}</div>}
            {errors.deadline && <div className="md:col-span-4 text-rose-400 text-xs">{errors.deadline}</div>}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => navigate('/briefs')}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => handleSubmit(false)}>
            Save as Draft
          </Button>
          <Button icon={Sparkles} onClick={() => handleSubmit(true)}>
            Generate Complete Multilingual Brief (AI)
          </Button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Brief Detail & Editor Page (With Multilingual Intelligence & Comparison)
// ────────────────────────────────────────────────────────────────────────────
export function BriefDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const brief = useAppStore((s) => s.getBriefById(asBriefId(id || '')));
  const updateBrief = useAppStore((s) => s.updateBrief);
  const removeBrief = useAppStore((s) => s.removeBrief);
  const addBrief = useAppStore((s) => s.addBrief);

  const [isEditing, setIsEditing] = useState(false);
  const [copiedHook, setCopiedHook] = useState<string | null>(null);

  // Edit fields initialized from brief
  const [editTitle, setEditTitle] = useState(() => brief?.title || '');
  const [editExecSummary, setEditExecSummary] = useState(() => brief?.generatedContent?.executiveSummary || '');
  const [editMaxBudget, setEditMaxBudget] = useState(() => brief?.budget.max || 0);

  // Multilingual Translation & Comparison Modals
  const [isTranslateModalOpen, setIsTranslateModalOpen] = useState(false);
  const [targetTranslateLang, setTargetTranslateLang] = useState('hi');
  const [translationNotes, setTranslationNotes] = useState('');
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [comparisonVariant, setComparisonVariant] = useState<BriefLanguageVariant | null>(null);
  const [comparisonResult, setComparisonResult] = useState<BriefComparisonResult | null>(null);

  if (!brief) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <EmptyState
          icon={FileText}
          title="Brief not found"
          description="The requested creative brief does not exist or has been removed."
          action={
            <Button onClick={() => navigate('/briefs')}>
              Back to Briefs
            </Button>
          }
        />
      </div>
    );
  }

  const handleSaveEdit = () => {
    updateBrief(brief.id, {
      title: editTitle,
      description: brief.description,
      status: brief.status,
      budget: { ...brief.budget, max: editMaxBudget },
      generatedContent: brief.generatedContent
        ? { ...brief.generatedContent, executiveSummary: editExecSummary }
        : undefined,
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  };

  const handlePublishToggle = () => {
    const nextStatus: BriefStatus = brief.status === 'published' ? 'draft' : 'published';
    updateBrief(brief.id, { status: nextStatus, updatedAt: new Date().toISOString() });
  };

  const handleDuplicate = () => {
    const now = new Date().toISOString();
    const copy: CreativeBrief = {
      ...JSON.parse(JSON.stringify(brief)),
      id: asBriefId(`b-${Date.now()}`),
      title: `${brief.title} (Copy)`,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
    addBrief(copy);
    navigate(`/briefs/${copy.id}`);
  };

  const handleDelete = () => {
    removeBrief(brief.id);
    navigate('/briefs');
  };

  const handleCopyHook = (hook: string) => {
    navigator.clipboard.writeText(hook);
    setCopiedHook(hook);
    setTimeout(() => setCopiedHook(null), 2000);
  };

  const handleCreateVariant = () => {
    const variant = multilingualBriefService.createLanguageVariant(
      brief,
      targetTranslateLang,
      translationNotes || undefined
    );
    const existing = brief.languageVariants || [];
    updateBrief(brief.id, {
      languageVariants: [...existing.filter((v) => v.languageCode !== targetTranslateLang), variant],
      updatedAt: new Date().toISOString(),
    });
    setIsTranslateModalOpen(false);
    setTranslationNotes('');
  };

  const handleOpenComparison = (variant: BriefLanguageVariant) => {
    const res = multilingualBriefService.compareVariants(brief, variant);
    setComparisonVariant(variant);
    setComparisonResult(res);
    setIsComparisonModalOpen(true);
  };

  const handleExportMarkdown = () => {
    const md = `# BRIEF: ${brief.title.toUpperCase()}
Brand: ${brief.brandName || 'N/A'}
Language: ${brief.briefLanguage || 'English'}
Status: ${brief.status}
Budget: ₹${brief.budget.max.toLocaleString('en-IN')} ${brief.budget.currency || 'INR'}
Timeline: ${brief.timeline.startDate} to ${brief.timeline.deadline}

${brief.isDemoGenerated ? '⚡ DEMO-MODE GENERATION (Deterministic Multilingual AI - 18 Languages)\n' : ''}
## Executive Summary
${brief.generatedContent?.executiveSummary || brief.description}

## Target Audience & Regional Nuance
${brief.generatedContent?.targetPersonaNarrative || brief.targetAudience?.demographics || 'N/A'}
Target Countries: ${brief.regionalPreferences?.targetCountries?.join(', ') || 'N/A'}
Target Regions: ${brief.regionalPreferences?.targetRegions?.join(', ') || 'N/A'}
Content Languages: ${brief.regionalPreferences?.preferredContentLanguages?.join(', ') || 'N/A'}

## Key Messaging Pillars
${brief.generatedContent?.keyMessagingPillars.map((p, i) => `### ${i + 1}. ${p.pillar}\n${p.description}\nHooks:\n${p.hookExamples.map((h) => `- ${h}`).join('\n')}`).join('\n\n') || 'N/A'}
`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${brief.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-brief.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const variants = brief.languageVariants || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Navigation & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate('/briefs')}
          className="inline-flex items-center gap-1.5 text-xs text-navy-400 hover:text-navy-200 cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Briefs List
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" icon={Languages} onClick={() => setIsTranslateModalOpen(true)}>
            Translate / Localize Brief
          </Button>
          {variants.length > 0 && (
            <Button variant="secondary" icon={Split} onClick={() => handleOpenComparison(variants[0])}>
              Compare Versions ({variants.length})
            </Button>
          )}
          <Button variant="secondary" icon={Download} onClick={handleExportMarkdown}>
            Export .MD
          </Button>
          <Button variant="secondary" icon={Copy} onClick={handleDuplicate}>
            Duplicate
          </Button>
          <Button
            variant={brief.status === 'published' ? 'secondary' : 'primary'}
            icon={brief.status === 'published' ? XCircle : CheckCircle2}
            onClick={handlePublishToggle}
          >
            {brief.status === 'published' ? 'Move to Draft' : 'Publish Brief'}
          </Button>
          <Button
            variant={isEditing ? 'ghost' : 'secondary'}
            icon={Edit3}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel Edit' : 'Edit Brief'}
          </Button>
          <Button variant="danger" icon={Trash2} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      {/* Main Brief Header Card */}
      <Card className="p-6 space-y-4 bg-gradient-to-br from-navy-900/90 to-navy-950 border-navy-700">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
                {brief.brandName || 'Brand Campaign'}
              </span>
              <span className="text-navy-600">•</span>
              <Badge variant="info">{brief.contentType}</Badge>
              <Badge variant={brief.status === 'published' ? 'success' : 'warning'}>
                ● {brief.status}
              </Badge>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-600/20 text-violet-300 border border-violet-500/30">
                <Languages size={12} /> {brief.briefLanguage || 'English'}
              </span>
              {brief.isDemoGenerated && (
                <Badge variant="violet">
                  ⚡ Multilingual AI Output
                </Badge>
              )}
            </div>

            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-2xl font-bold bg-navy-950 border border-navy-700 rounded-lg px-3 py-1.5 text-navy-50 w-full"
              />
            ) : (
              <h1 className="text-2xl md:text-3xl font-extrabold text-navy-50">
                {brief.title}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[10px] text-navy-400 uppercase font-semibold block">Budget Ceiling</span>
              {isEditing ? (
                <input
                  type="number"
                  value={editMaxBudget}
                  onChange={(e) => setEditMaxBudget(Number(e.target.value))}
                  className="bg-navy-950 border border-navy-700 rounded px-2 py-1 text-sm text-emerald-400 w-28 text-right font-bold"
                />
              ) : (
                <span className="text-xl font-bold text-emerald-400">
                  {formatRupees(brief.budget.max)} {brief.budget.currency || 'INR'}
                </span>
              )}
            </div>

            <div className="border-l border-navy-800 pl-6 text-right">
              <span className="text-[10px] text-navy-400 uppercase font-semibold block">Flight Window</span>
              <span className="text-xs font-semibold text-navy-300">
                {brief.timeline.startDate} → {brief.timeline.deadline}
              </span>
            </div>
          </div>
        </div>

        {/* Demo Mode Notice Banner */}
        {brief.isDemoGenerated && <DemoBadgeBanner />}
      </Card>

      {/* Multilingual Variants & Localization Hub Strip */}
      {variants.length > 0 && (
        <Card className="p-4 bg-navy-950/70 border border-violet-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Languages size={16} className="text-violet-400" />
              <h3 className="text-xs font-bold text-navy-100 uppercase tracking-wider">
                Linked Language Variants ({variants.length})
              </h3>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">
              ✓ Canonical Campaign ID & INR Budget Intact
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {variants.map((v) => (
              <div
                key={v.languageCode}
                className="bg-navy-900 border border-navy-800 rounded-lg p-3 space-y-2 hover:border-violet-500/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                    <Globe size={13} /> {v.languageName}
                  </span>
                  <Badge variant="outline" size="xs">
                    {v.languageCode.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs font-semibold text-navy-100 line-clamp-1">{v.localizedTitle}</p>
                <p className="text-[11px] text-navy-400 line-clamp-2">{v.executiveSummary}</p>
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-navy-500">CTA: {v.localizedCallToAction || 'Default'}</span>
                  <button
                    onClick={() => handleOpenComparison(v)}
                    className="text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Split size={12} /> Compare
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Detail Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Strategic Brief */}
        <div className="lg:col-span-2 space-y-6">
          {/* Executive Strategy Summary */}
          <Card className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-navy-100 flex items-center gap-2">
                <Target size={16} className="text-violet-400" />
                Strategic Executive Summary ({brief.briefLanguage || 'English'})
              </h2>
            </div>
            {isEditing ? (
              <textarea
                rows={4}
                value={editExecSummary}
                onChange={(e) => setEditExecSummary(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg p-3 text-xs text-navy-100 leading-relaxed"
              />
            ) : (
              <p className="text-xs text-navy-300 leading-relaxed">
                {brief.generatedContent?.executiveSummary || brief.description}
              </p>
            )}
          </Card>

          {/* Regional Preferences & Cultural Context Card */}
          <Card className="p-6 space-y-3">
            <h2 className="text-sm font-bold text-navy-100 flex items-center gap-2">
              <Globe size={16} className="text-cyan-400" />
              Regional Preferences & Cultural Context
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
              <div className="bg-navy-950 p-3 rounded-lg border border-navy-800">
                <span className="text-[11px] font-semibold text-navy-400 uppercase block mb-1">
                  Target Countries
                </span>
                <span className="text-navy-100 font-medium">
                  {brief.regionalPreferences?.targetCountries?.join(', ') || 'India, Global'}
                </span>
              </div>
              <div className="bg-navy-950 p-3 rounded-lg border border-navy-800">
                <span className="text-[11px] font-semibold text-navy-400 uppercase block mb-1">
                  Target Regions / Metros
                </span>
                <span className="text-navy-100 font-medium">
                  {brief.regionalPreferences?.targetRegions?.join(', ') || 'Metropolitan Tier 1/2 Cities'}
                </span>
              </div>
              <div className="bg-navy-950 p-3 rounded-lg border border-navy-800">
                <span className="text-[11px] font-semibold text-navy-400 uppercase block mb-1">
                  Required Content Languages
                </span>
                <span className="text-emerald-400 font-medium">
                  {brief.regionalPreferences?.preferredContentLanguages?.join(', ') || brief.briefLanguage || 'English'}
                </span>
              </div>
              <div className="bg-navy-950 p-3 rounded-lg border border-navy-800">
                <span className="text-[11px] font-semibold text-navy-400 uppercase block mb-1">
                  Regional Themes & Occasions
                </span>
                <span className="text-amber-300 font-medium">
                  {brief.regionalPreferences?.regionalThemes?.join(', ') || 'Modern Lifestyle'}
                </span>
              </div>
              <div className="md:col-span-2 bg-navy-950 p-3 rounded-lg border border-navy-800">
                <span className="text-[11px] font-semibold text-navy-400 uppercase block mb-1">
                  Localized Call-to-Action (CTA)
                </span>
                <span className="text-cyan-300 font-semibold">
                  "{brief.regionalPreferences?.localizedCallToAction || brief.guidelines?.callToAction || 'Visit official link'}"
                </span>
              </div>
            </div>
          </Card>

          {/* Target Persona Narrative */}
          <Card className="p-6 space-y-3">
            <h2 className="text-sm font-bold text-navy-100 flex items-center gap-2">
              <Users size={16} className="text-cyan-400" />
              Target Persona & Audience Psychographics
            </h2>
            <p className="text-xs text-navy-300 leading-relaxed">
              {brief.generatedContent?.targetPersonaNarrative || brief.targetAudience?.demographics || 'Focused audience defined in brief parameters.'}
            </p>
          </Card>

          {/* Key Messaging Pillars with Copyable Hooks */}
          {brief.generatedContent?.keyMessagingPillars && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-navy-100 flex items-center gap-2">
                  <Sparkles size={16} className="text-violet-400" />
                  Key Messaging Pillars & Hook Angles
                </h2>
                <span className="text-[10px] text-navy-500">Click hook to copy</span>
              </div>

              <div className="space-y-4">
                {brief.generatedContent.keyMessagingPillars.map((p, idx) => (
                  <div key={idx} className="bg-navy-950 border border-navy-800 rounded-lg p-4 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-violet-600/30 text-violet-300 text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h3 className="text-xs font-bold text-navy-100">{p.pillar}</h3>
                    </div>
                    <p className="text-[11px] text-navy-400">{p.description}</p>

                    <div className="space-y-1.5 pt-1">
                      {p.hookExamples.map((hook, hIdx) => {
                        const isCopied = copiedHook === hook;
                        return (
                          <div
                            key={hIdx}
                            onClick={() => handleCopyHook(hook)}
                            className="bg-navy-900 border border-dashed border-navy-700/80 rounded px-3 py-1.5 text-xs text-violet-200 font-mono flex items-center justify-between cursor-pointer hover:border-violet-500 transition-colors"
                          >
                            <span className="line-clamp-1">{hook}</span>
                            <span className="text-[10px] text-navy-400 shrink-0 ml-2">
                              {isCopied ? '✓ Copied' : 'Copy'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Required Skills & Deliverables */}
          <Card className="p-6 space-y-3">
            <h2 className="text-sm font-bold text-navy-100">Deliverables & Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {brief.requiredSkills.map((skill, idx) => (
                <Badge key={idx} variant="default">
                  {skill}
                </Badge>
              ))}
            </div>
          </Card>
        </div>

        {/* Right 1 Col: KPIs, Budget in INR, Matching Readiness */}
        <div className="space-y-6">
          {/* Creator Matching Readiness Card (Interoperability with Discovery) */}
          <Card className="p-5 space-y-3 border-violet-500/40 bg-gradient-to-br from-navy-900 to-violet-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy-100 flex items-center gap-1.5">
                <Sparkles size={14} className="text-violet-400" /> 7-Factor AuraMatch Readiness
              </span>
              <Badge variant="success">100% Ready</Badge>
            </div>
            <p className="text-xs text-navy-300 leading-relaxed">
              This campaign brief has complete language, regional requirements, and INR budget contracts ready for creator discovery.
            </p>
            <Link to={`/discovery?brief=${brief.id}`}>
              <Button size="sm" icon={ExternalLink} className="w-full mt-2">
                Match Creators in Discovery
              </Button>
            </Link>
          </Card>

          {/* Budget Allocation Breakdown in INR */}
          {brief.generatedContent?.budgetBreakdown && (
            <Card className="p-5 space-y-3">
              <h3 className="text-xs font-bold text-navy-100 flex items-center gap-1.5">
                <DollarSign size={14} className="text-emerald-400" /> Budget Allocation (₹ INR)
              </h3>
              <div className="space-y-3 pt-1">
                {brief.generatedContent.budgetBreakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-navy-300">{item.category}</span>
                      <span className="font-semibold text-navy-100">
                        {formatRupees(item.amount)} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-navy-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* KPI Targets */}
          {brief.generatedContent?.kpiBenchmarks && (
            <Card className="p-5 space-y-3">
              <h3 className="text-xs font-bold text-navy-100 flex items-center gap-1.5">
                <Target size={14} className="text-cyan-400" /> Target KPI Benchmarks
              </h3>
              <div className="space-y-2">
                {brief.generatedContent.kpiBenchmarks.map((kpi, idx) => (
                  <div key={idx} className="bg-navy-950 border border-navy-800 rounded p-2.5 flex items-center justify-between text-xs">
                    <span className="text-navy-400">{kpi.metric}</span>
                    <span className="font-bold text-cyan-300">{kpi.target}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ── Translation Modal ── */}
      {isTranslateModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-navy-50 flex items-center gap-2">
                <Languages size={18} className="text-violet-400" />
                Translate / Localize Campaign Brief
              </h3>
              <button
                onClick={() => setIsTranslateModalOpen(false)}
                className="text-navy-400 hover:text-navy-200"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-navy-300">
              Generate a linked localized variant in another language. Preserves the canonical campaign ID and INR budget.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-navy-300 mb-1.5">
                  Select Target Language (18 Supported)
                </label>
                <select
                  value={targetTranslateLang}
                  onChange={(e) => setTargetTranslateLang(e.target.value)}
                  className="w-full bg-navy-950 border border-navy-800 rounded-lg px-3 py-2 text-xs text-navy-100 focus:outline-none focus:border-violet-500"
                >
                  {SUPPORTED_BRIEF_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} — {l.nativeName} {l.isRegionalIndian ? '(Regional Indian)' : '(Global)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-300 mb-1.5">
                  Cultural Nuance Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Focus on Diwali festive gifting and colloquial youth greetings"
                  value={translationNotes}
                  onChange={(e) => setTranslationNotes(e.target.value)}
                  className="w-full bg-navy-950 border border-navy-800 rounded-lg px-3 py-2 text-xs text-navy-100 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setIsTranslateModalOpen(false)}>
                Cancel
              </Button>
              <Button icon={Sparkles} onClick={handleCreateVariant}>
                Generate Localized Variant
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Side-by-Side Comparison Modal ── */}
      {isComparisonModalOpen && comparisonVariant && (
        <div className="fixed inset-0 z-50 bg-navy-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-navy-800">
              <div className="flex items-center gap-2">
                <Split size={20} className="text-violet-400" />
                <div>
                  <h3 className="text-base font-bold text-navy-50">
                    Side-by-Side Multilingual Comparison
                  </h3>
                  <p className="text-xs text-navy-400">
                    Comparing Base Brief vs {comparisonVariant.languageName} localized variant.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsComparisonModalOpen(false)}
                className="text-navy-400 hover:text-navy-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Integrity Assurance Strip */}
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
              <span className="flex items-center gap-1.5 font-semibold">
                <Check size={14} /> Canonical Campaign ID: {brief.id}
              </span>
              <span className="font-semibold">
                Budget Preserved: {formatRupees(brief.budget.max)} INR
              </span>
            </div>

            {/* Side-by-side Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Base Brief */}
              <div className="bg-navy-950 border border-navy-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy-200 uppercase tracking-wider">
                    Base Brief ({brief.briefLanguage || 'English'})
                  </span>
                  <Badge variant="outline" size="xs">Original</Badge>
                </div>
                <div>
                  <label className="text-[11px] text-navy-400 block font-semibold">Title</label>
                  <p className="text-sm font-bold text-navy-100">{brief.title}</p>
                </div>
                <div>
                  <label className="text-[11px] text-navy-400 block font-semibold">Executive Summary</label>
                  <p className="text-xs text-navy-300 leading-relaxed">
                    {brief.generatedContent?.executiveSummary || brief.description}
                  </p>
                </div>
                <div>
                  <label className="text-[11px] text-navy-400 block font-semibold">Call to Action (CTA)</label>
                  <p className="text-xs text-cyan-400 font-mono">
                    "{brief.guidelines?.callToAction || 'Default CTA'}"
                  </p>
                </div>
              </div>

              {/* Right Column: Localized Variant */}
              <div className="bg-navy-950 border border-violet-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">
                    {comparisonVariant.languageName} ({comparisonVariant.languageCode})
                  </span>
                  <Badge variant="violet" size="xs">Localized Variant</Badge>
                </div>
                <div>
                  <label className="text-[11px] text-navy-400 block font-semibold">Adapted Title</label>
                  <p className="text-sm font-bold text-navy-100">{comparisonVariant.localizedTitle}</p>
                </div>
                <div>
                  <label className="text-[11px] text-navy-400 block font-semibold">Executive Summary</label>
                  <p className="text-xs text-navy-300 leading-relaxed">
                    {comparisonVariant.executiveSummary}
                  </p>
                </div>
                <div>
                  <label className="text-[11px] text-navy-400 block font-semibold">Localized CTA</label>
                  <p className="text-xs text-emerald-400 font-mono">
                    "{comparisonVariant.localizedCallToAction || 'Localized CTA'}"
                  </p>
                </div>
                {comparisonVariant.culturalAdaptationNotes && (
                  <div className="pt-2 border-t border-navy-800">
                    <label className="text-[11px] text-navy-400 block font-semibold">Cultural Adaptation Nuances</label>
                    <p className="text-xs text-amber-300 leading-relaxed">
                      {comparisonVariant.culturalAdaptationNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-800">
              <Button variant="secondary" onClick={() => setIsComparisonModalOpen(false)}>
                Close Comparison
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Button if in edit mode */}
      {isEditing && (
        <div className="fixed bottom-6 right-6 z-40 bg-navy-900 border border-violet-500 rounded-xl p-3 flex items-center gap-3 shadow-2xl">
          <Button variant="ghost" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button icon={Save} onClick={handleSaveEdit}>
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
