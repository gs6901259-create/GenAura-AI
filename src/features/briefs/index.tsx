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
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatRupees } from '@/lib/utils';
import {
  CreativeBrief,
  BriefStatus,
  ContentType,
  asBriefId,
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
    let generatedContent = undefined;

    if (withAI) {
      generatedContent = generateDeterministicBriefContent({
        title,
        brandName,
        category,
        objective: 'product_launch',
        contentType,
        demographics,
        painPoints,
        budgetTotal: budgetMax,
        currency: 'USD',
        channels,
        tone,
        startDate,
        deadline,
        callToAction,
      });
    }

    const newBrief: CreativeBrief = {
      id: asBriefId(`b-${Date.now()}`),
      title,
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
      targetAudience: {
        demographics,
        ageRange: '20-45',
        painPoints: [painPoints],
      },
      guidelines: {
        dos: ['Highlight genuine product value', 'Include clear CTA in caption'],
        donts: ['No unverified claims', 'Do not mention competitors'],
        callToAction,
      },
      generatedContent,
      isDemoGenerated: withAI,
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
            Configure campaign parameters or synthesize a brief instantly via the deterministic template engine.
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
            Generate (Demo AI)
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
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-navy-50 flex items-center gap-2">
            <span className="h-5 w-5 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center">1</span>
            Campaign Overview
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

        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-navy-50 flex items-center gap-2">
            <span className="h-5 w-5 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center">2</span>
            Audience & Tone
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
              <label className="block text-xs font-semibold text-navy-300 mb-1.5">Voice & Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg px-3.5 py-2 text-sm text-navy-100 focus:outline-none focus:border-violet-500"
              >
                <option value="Educational & Authoritative">Educational & Authoritative</option>
                <option value="Authentic & Relatable">Authentic & Relatable</option>
                <option value="High Energy & Bold">High Energy & Bold</option>
                <option value="Humorous & Entertaining">Humorous & Entertaining</option>
                <option value="Aspirational & Luxury">Aspirational & Luxury</option>
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

        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-navy-50 flex items-center gap-2">
            <span className="h-5 w-5 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center">3</span>
            Budget & Flight Timeline
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
            Generate Complete Brief (Demo AI Engine)
          </Button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Brief Detail & Editor Page
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

  const handleExportMarkdown = () => {
    const md = `# BRIEF: ${brief.title.toUpperCase()}
Brand: ${brief.brandName || 'N/A'}
Status: ${brief.status}
Budget: ₹${brief.budget.max.toLocaleString('en-IN')} ${brief.budget.currency || 'INR'}
Timeline: ${brief.timeline.startDate} to ${brief.timeline.deadline}

${brief.isDemoGenerated ? '⚡ DEMO-MODE GENERATION (Deterministic Template Engine - No API Credentials)\n' : ''}
## Executive Summary
${brief.generatedContent?.executiveSummary || brief.description}

## Target Audience
${brief.generatedContent?.targetPersonaNarrative || brief.targetAudience?.demographics || 'N/A'}

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
              {brief.isDemoGenerated && (
                <Badge variant="violet">
                  ⚡ Demo AI Output
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
              <span className="text-[10px] text-navy-400 uppercase font-semibold block">Budget Envelope</span>
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

      {/* Detail Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Strategic Brief */}
        <div className="lg:col-span-2 space-y-6">
          {/* Executive Strategy Summary */}
          <Card className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-navy-100 flex items-center gap-2">
                <Target size={16} className="text-violet-400" />
                Strategic Executive Summary
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

        {/* Right 1 Col: KPIs, Budget, Matching Readiness */}
        <div className="space-y-6">
          {/* Creator Matching Readiness Card (Interoperability with Discovery) */}
          <Card className="p-5 space-y-3 border-violet-500/40 bg-gradient-to-br from-navy-900 to-violet-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy-100 flex items-center gap-1.5">
                <Sparkles size={14} className="text-violet-400" /> Matching Readiness
              </span>
              <Badge variant="success">100% Ready</Badge>
            </div>
            <p className="text-xs text-navy-300 leading-relaxed">
              This campaign brief has complete deliverables and budget contracts ready for creator matching.
            </p>
            <Link to="/discovery">
              <Button size="sm" icon={ExternalLink} className="w-full mt-2">
                Match Creators in Discovery
              </Button>
            </Link>
          </Card>

          {/* Budget Allocation Breakdown */}
          {brief.generatedContent?.budgetBreakdown && (
            <Card className="p-5 space-y-3">
              <h3 className="text-xs font-bold text-navy-100 flex items-center gap-1.5">
                <DollarSign size={14} className="text-emerald-400" /> Budget Allocation
              </h3>
              <div className="space-y-3 pt-1">
                {brief.generatedContent.budgetBreakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-navy-300">{item.category}</span>
                      <span className="font-semibold text-navy-100">
                        ${item.amount.toLocaleString()} ({item.percentage}%)
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
