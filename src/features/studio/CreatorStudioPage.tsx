/**
 * GenAura AI — Creator Studio (Onboarding, Portfolio Builder, AI Coach & Verification)
 * ====================================================================================
 * Comprehensive workspace for creators:
 * - Step A: Profile Onboarding & Editing with real-time validation
 * - Step B: Portfolio Builder with CRUD, reordering, role tagging, and media previews
 * - Step C: Public Profile Preview & AI Profile Coach
 * - Step D: Verification Status Report & Resubmission
 */
import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  User,
  Image as ImageIcon,
  FolderKanban,
  Plus,
  Trash2,
  ExternalLink,
  Edit3,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
  Target,
  DollarSign,
  HelpCircle,
  Eye,
  Award,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type {
  Creator,
  PortfolioItem,
  CreatorCategory,
  asPortfolioId,
} from '@/types';
import { asPortfolioId as castPortfolioId } from '@/types';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Avatar,
  Input,
  StatCard,
  EmptyState,
} from '@/components/ui';
import { formatUSD, cn, uid } from '@/lib/utils';
import { profileCoachService, ProfileCoachAnalysis } from '@/services/profileCoach';
import { verificationEngine } from '@/services/verificationEngine';
import { VERIFICATION_RUBRIC } from '@/config/verificationRubric';

const CATEGORIES: { label: string; value: CreatorCategory }[] = [
  { label: 'Copywriting & Content', value: 'copywriter' },
  { label: 'Graphic & Brand Design', value: 'graphic-designer' },
  { label: 'Motion & 3D Animation', value: 'motion-designer' },
  { label: 'Video Editing & Reels', value: 'video-editor' },
  { label: 'Commercial Photography', value: 'photographer' },
  { label: 'Social Media Management', value: 'social-media-manager' },
  { label: 'UI/UX & Product Design', value: 'ux-designer' },
  { label: 'Illustration & Art', value: 'illustrator' },
  { label: 'Content Strategy', value: 'content-strategist' },
];

export function CreatorStudioPage() {
  const navigate = useNavigate();
  const {
    creators,
    portfolios,
    currentCreatorId,
    setCurrentCreatorId,
    updateCreator,
    addPortfolio,
    updatePortfolio,
    removePortfolio,
    reorderPortfolios,
    submitCreatorVerification,
  } = useAppStore();

  // Active creator profile being managed
  const creator = useMemo(() => {
    return (
      creators.find((c) => c.id === currentCreatorId) ||
      creators[0]
    );
  }, [creators, currentCreatorId]);

  // Portfolios for active creator
  const creatorPortfolios = useMemo(() => {
    if (!creator) return [];
    return portfolios.filter((p) => p.creatorId === creator.id);
  }, [portfolios, creator]);

  // Studio tabs
  const [activeTab, setActiveTab] = useState<'profile' | 'portfolio' | 'preview' | 'verification'>('profile');

  // ── Profile Form State ──
  const [formData, setFormData] = useState({
    name: creator?.name || '',
    handle: creator?.handle || '',
    email: creator?.email || '',
    avatarUrl: creator?.avatarUrl || '',
    category: creator?.category || 'copywriter',
    tagline: creator?.tagline || '',
    bio: creator?.bio || '',
    country: creator?.country || 'United States',
    city: creator?.city || 'San Francisco',
    hourlyRate: creator?.hourlyRate || 75,
    skills: (creator?.skills || []).join(', '),
    yearsExperience: creator?.yearsExperience || 4,
    instagram: creator?.socialLinks?.instagram || '',
    youtube: creator?.socialLinks?.youtube || '',
    linkedin: creator?.socialLinks?.linkedin || '',
    twitter: creator?.socialLinks?.twitter || '',
    tiktok: creator?.socialLinks?.tiktok || '',
    collaborationTypes: (creator?.collaborationTypes || ['Brand Sponsorships', 'Deliverables']).join(', '),
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Portfolio Modal State ──
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null);
  const [portfolioForm, setPortfolioForm] = useState({
    title: '',
    description: '',
    mediaType: 'image' as PortfolioItem['mediaType'],
    mediaUrl: '',
    thumbnailUrl: '',
    clientName: '',
    creatorRole: 'Lead Creator',
    tags: '',
  });

  // ── AI Profile Coach State ──
  const [isCoachAnalyzing, setIsCoachAnalyzing] = useState(false);
  const [coachAnalysis, setCoachAnalysis] = useState<ProfileCoachAnalysis | null>(null);
  const [appliedBio, setAppliedBio] = useState(false);

  // Synchronize formData when creator changes
  const handleCreatorChange = (newCreatorId: any) => {
    setCurrentCreatorId(newCreatorId);
    const target = creators.find((c) => c.id === newCreatorId);
    if (target) {
      setFormData({
        name: target.name,
        handle: target.handle,
        email: target.email || '',
        avatarUrl: target.avatarUrl,
        category: target.category,
        tagline: target.tagline,
        bio: target.bio,
        country: target.country || 'United States',
        city: target.city || 'San Francisco',
        hourlyRate: target.hourlyRate,
        skills: target.skills.join(', '),
        yearsExperience: target.yearsExperience || 3,
        instagram: target.socialLinks?.instagram || '',
        youtube: target.socialLinks?.youtube || '',
        linkedin: target.socialLinks?.linkedin || '',
        twitter: target.socialLinks?.twitter || '',
        tiktok: target.socialLinks?.tiktok || '',
        collaborationTypes: (target.collaborationTypes || []).join(', '),
      });
      setCoachAnalysis(null);
      setAppliedBio(false);
    }
  };

  // Profile validation
  const validateProfile = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.length < 2) {
      errors.name = 'Full name must be at least 2 characters';
    }
    if (!formData.handle.trim() || !formData.handle.startsWith('@')) {
      errors.handle = 'Handle must start with @ (e.g. @your_name)';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please provide a valid email address';
    }
    if (!formData.bio.trim() || formData.bio.length < 30) {
      errors.bio = 'Bio must be at least 30 characters to explain your creative services';
    }
    if (!formData.city.trim() || !formData.country.trim()) {
      errors.location = 'City and country are required';
    }
    if (Number(formData.hourlyRate) <= 0) {
      errors.hourlyRate = 'Please provide a valid hourly rate greater than $0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = () => {
    if (!validateProfile() || !creator) return;

    const skillArray = formData.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const collabArray = formData.collaborationTypes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    updateCreator(creator.id, {
      name: formData.name,
      handle: formData.handle,
      email: formData.email,
      avatarUrl: formData.avatarUrl,
      category: formData.category as CreatorCategory,
      tagline: formData.tagline,
      bio: formData.bio,
      country: formData.country,
      city: formData.city,
      location: `${formData.city}, ${formData.country}`,
      hourlyRate: Number(formData.hourlyRate),
      skills: skillArray,
      yearsExperience: Number(formData.yearsExperience),
      collaborationTypes: collabArray,
      socialLinks: {
        instagram: formData.instagram || undefined,
        youtube: formData.youtube || undefined,
        linkedin: formData.linkedin || undefined,
        twitter: formData.twitter || undefined,
        tiktok: formData.tiktok || undefined,
      },
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Run AI Profile Coach
  const handleRunProfileCoach = () => {
    if (!creator) return;
    setIsCoachAnalyzing(true);
    setTimeout(() => {
      const result = profileCoachService.analyzeProfile(creator, creatorPortfolios);
      setCoachAnalysis(result);
      setIsCoachAnalyzing(false);
    }, 600);
  };

  const handleApplySuggestedBio = (newBio: string) => {
    setFormData((prev) => ({ ...prev, bio: newBio }));
    if (creator) {
      updateCreator(creator.id, { bio: newBio });
    }
    setAppliedBio(true);
  };

  // Portfolio actions
  const handleOpenPortfolioModal = (item?: PortfolioItem) => {
    if (item) {
      setEditingPortfolioId(item.id);
      setPortfolioForm({
        title: item.title,
        description: item.description,
        mediaType: item.mediaType,
        mediaUrl: item.mediaUrl,
        thumbnailUrl: item.thumbnailUrl || '',
        clientName: item.clientName || '',
        creatorRole: item.creatorRole || 'Lead Creator',
        tags: item.tags.join(', '),
      });
    } else {
      setEditingPortfolioId(null);
      setPortfolioForm({
        title: '',
        description: '',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: '',
        clientName: 'Featured Project',
        creatorRole: 'Solo Producer & Editor',
        tags: 'Branding, Campaign',
      });
    }
    setIsPortfolioModalOpen(true);
  };

  const handleSavePortfolioItem = () => {
    if (!creator || !portfolioForm.title.trim()) return;

    const tagArray = portfolioForm.tags.split(',').map((t) => t.trim()).filter(Boolean);

    if (editingPortfolioId) {
      updatePortfolio(castPortfolioId(editingPortfolioId), {
        title: portfolioForm.title,
        description: portfolioForm.description,
        mediaType: portfolioForm.mediaType,
        mediaUrl: portfolioForm.mediaUrl,
        thumbnailUrl: portfolioForm.thumbnailUrl || undefined,
        clientName: portfolioForm.clientName,
        creatorRole: portfolioForm.creatorRole,
        tags: tagArray,
      });
    } else {
      const newId = castPortfolioId(`p_${uid()}`);
      addPortfolio({
        id: newId,
        creatorId: creator.id,
        title: portfolioForm.title,
        description: portfolioForm.description,
        mediaType: portfolioForm.mediaType,
        mediaUrl: portfolioForm.mediaUrl,
        thumbnailUrl: portfolioForm.thumbnailUrl || undefined,
        tags: tagArray,
        clientName: portfolioForm.clientName,
        creatorRole: portfolioForm.creatorRole,
        publishedAt: new Date().toISOString(),
        featured: creatorPortfolios.length === 0,
      });
    }

    setIsPortfolioModalOpen(false);
  };

  const handleMovePortfolio = (index: number, direction: 'up' | 'down') => {
    if (!creator) return;
    const items = [...creatorPortfolios];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;

    reorderPortfolios(creator.id, items.map((i) => i.id));
  };

  // Submit for Verification
  const handleSubmitVerification = () => {
    if (!creator) return;
    submitCreatorVerification(creator.id);
    setActiveTab('verification');
  };

  // Verification Report Calculation
  const verificationReport = useMemo(() => {
    if (!creator) return null;
    return creator.verificationReport || verificationEngine.evaluateCreator(creator, creatorPortfolios);
  }, [creator, creatorPortfolios]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Creator Studio & Verification"
        subtitle="Manage your profile, showcase portfolio work, leverage the AI Coach, and apply for verified partner status."
        actions={
          <div className="flex items-center gap-3">
            {/* Creator switcher for demonstration */}
            <div className="flex items-center gap-2 bg-navy-900 border border-navy-700/80 px-3 py-1.5 rounded-xl">
              <span className="text-xs text-navy-400">Editing Creator:</span>
              <select
                value={creator?.id}
                onChange={(e) => handleCreatorChange(e.target.value)}
                className="bg-transparent text-xs text-navy-100 font-semibold focus:outline-none cursor-pointer"
              >
                {creators.map((c) => (
                  <option key={c.id} value={c.id} className="bg-navy-900 text-navy-100">
                    {c.name} ({c.verificationStatus || 'draft'})
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="outline"
              icon={Eye}
              onClick={() => navigate(`/creators/${creator?.id}`)}
            >
              Public Profile
            </Button>
          </div>
        }
      />

      {/* ── Tab Navigation ── */}
      <div className="flex items-center border-b border-navy-800 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('profile')}
          className={cn(
            'flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0',
            activeTab === 'profile'
              ? 'border-violet-500 text-white bg-navy-900/40 rounded-t-lg'
              : 'border-transparent text-navy-400 hover:text-navy-200'
          )}
        >
          <User size={15} /> 1. Profile & Onboarding
        </button>

        <button
          onClick={() => setActiveTab('portfolio')}
          className={cn(
            'flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0',
            activeTab === 'portfolio'
              ? 'border-violet-500 text-white bg-navy-900/40 rounded-t-lg'
              : 'border-transparent text-navy-400 hover:text-navy-200'
          )}
        >
          <FolderKanban size={15} /> 2. Portfolio Builder ({creatorPortfolios.length})
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={cn(
            'flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0',
            activeTab === 'preview'
              ? 'border-violet-500 text-white bg-navy-900/40 rounded-t-lg'
              : 'border-transparent text-navy-400 hover:text-navy-200'
          )}
        >
          <Sparkles size={15} /> 3. Profile Preview & AI Coach
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={cn(
            'flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0',
            activeTab === 'verification'
              ? 'border-violet-500 text-white bg-navy-900/40 rounded-t-lg'
              : 'border-transparent text-navy-400 hover:text-navy-200'
          )}
        >
          <ShieldCheck size={15} /> 4. Verification Report
          {creator?.verified ? (
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          ) : creator?.verificationStatus === 'submitted' ? (
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          ) : null}
        </button>
      </div>

      {/* ── TAB 1: PROFILE & ONBOARDING ── */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-5">
              <h2 className="text-base font-bold text-navy-100 flex items-center gap-2">
                <User size={18} className="text-violet-400" /> Basic Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Creator / Brand Name"
                  placeholder="e.g. Elena Rostova"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={formErrors.name}
                />
                <Input
                  label="Handle"
                  placeholder="e.g. @elena_tech"
                  value={formData.handle}
                  onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                  error={formErrors.handle}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email (Private for Invoicing & Verification)"
                  type="email"
                  placeholder="creator@domain.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={formErrors.email}
                />
                <Input
                  label="Avatar Image URL"
                  placeholder="https://..."
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-navy-300 block mb-1.5">
                    Primary Creative Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-xs text-navy-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Hourly Rate (USD)"
                  type="number"
                  placeholder="75"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                  error={formErrors.hourlyRate}
                />
              </div>

              <Input
                label="Headline Tagline"
                placeholder="e.g. AI educator breaking down machine learning workflows"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              />

              <div>
                <label className="text-xs font-semibold text-navy-300 block mb-1.5">
                  Bio & Creative Perspective
                </label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Describe your creative background, formats produced, and brand client experiences..."
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg p-3 text-xs text-navy-100 placeholder:text-navy-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                {formErrors.bio && <p className="text-xs text-rose-400 mt-1">{formErrors.bio}</p>}
                <p className="text-[11px] text-navy-500 mt-1 flex justify-between">
                  <span>Minimum 30 characters recommended for verification.</span>
                  <span>{formData.bio.length} characters</span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="City"
                  placeholder="San Francisco"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <Input
                  label="Country"
                  placeholder="United States"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>

              <Input
                label="Skills & Tools (comma separated)"
                placeholder="e.g. After Effects, 3D Motion, Premiere, Storyboarding"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              />

              <Input
                label="Collaboration Formats (comma separated)"
                placeholder="e.g. Sponsored Posts, Retainers, Deliverables, Creative Direction"
                value={formData.collaborationTypes}
                onChange={(e) => setFormData({ ...formData, collaborationTypes: e.target.value })}
              />
            </Card>

            <Card className="p-6 space-y-4">
              <h2 className="text-base font-bold text-navy-100 flex items-center gap-2">
                <ExternalLink size={18} className="text-cyan-400" /> Connected Social Profiles
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="YouTube Channel URL"
                  placeholder="https://youtube.com/@channel"
                  value={formData.youtube}
                  onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                />
                <Input
                  label="LinkedIn Profile URL"
                  placeholder="https://linkedin.com/in/profile"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                />
                <Input
                  label="Instagram Profile URL"
                  placeholder="https://instagram.com/handle"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                />
                <Input
                  label="X (Twitter) Profile URL"
                  placeholder="https://x.com/handle"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-navy-800">
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  {saveSuccess && (
                    <span className="flex items-center gap-1 font-semibold animate-fadeIn">
                      <CheckCircle2 size={14} /> Profile changes saved successfully!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="primary" onClick={handleSaveProfile}>
                    Save Changes
                  </Button>
                  <Button variant="secondary" onClick={() => setActiveTab('portfolio')}>
                    Next: Portfolio Builder →
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Studio Sidebar */}
          <div className="space-y-4">
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-navy-100 flex items-center gap-2">
                <ShieldCheck size={16} className="text-violet-400" /> Verification Status
              </h3>
              <div className="p-3 rounded-xl bg-navy-800/80 border border-navy-700/60 flex items-center justify-between">
                <div>
                  <p className="text-xs text-navy-400">Current Stage</p>
                  <p className="text-sm font-bold capitalize text-navy-100">
                    {creator?.verificationStatus || 'draft'}
                  </p>
                </div>
                <Badge
                  variant={
                    creator?.verified
                      ? 'success'
                      : creator?.verificationStatus === 'submitted'
                      ? 'warning'
                      : creator?.verificationStatus === 'needs_changes'
                      ? 'danger'
                      : 'default'
                  }
                  dot
                >
                  {creator?.verified ? 'Verified Partner' : creator?.verificationStatus || 'Draft'}
                </Badge>
              </div>

              <p className="text-xs text-navy-400 leading-relaxed">
                Verification requires completing profile fields, adding at least 3 portfolio samples, and achieving an 85+ rubric score for reviewer approval.
              </p>

              <Button
                variant="outline"
                className="w-full text-xs"
                onClick={() => setActiveTab('verification')}
              >
                Inspect Rubric Report
              </Button>
            </Card>

            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-navy-100 flex items-center gap-2">
                <Sparkles size={16} className="text-cyan-400" /> AI Profile Coach
              </h3>
              <p className="text-xs text-navy-400">
                Run our deterministic AI analysis to check profile completeness, optimize your bio, and receive personalized suggestions before submitting.
              </p>
              <Button
                variant="secondary"
                icon={Sparkles}
                className="w-full text-xs"
                onClick={() => {
                  setActiveTab('preview');
                  handleRunProfileCoach();
                }}
              >
                Analyze with AI Coach
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB 2: PORTFOLIO BUILDER ── */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-navy-50">Portfolio Work Samples</h2>
              <p className="text-xs text-navy-400">
                Showcase your best creative work. High-quality samples with clear roles directly elevate your verification score.
              </p>
            </div>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => handleOpenPortfolioModal()}
            >
              Add Work Sample
            </Button>
          </div>

          {creatorPortfolios.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title="No portfolio items uploaded"
              description="Upload or link at least 3 pieces of content to showcase your skills and qualify for verified creator approval."
              action={
                <Button variant="primary" icon={Plus} onClick={() => handleOpenPortfolioModal()}>
                  Add First Portfolio Item
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {creatorPortfolios.map((item, index) => (
                <Card
                  key={item.id}
                  className="flex flex-col justify-between overflow-hidden p-0 border border-navy-700/80 group hover:border-navy-600 transition-colors"
                >
                  <div className="relative aspect-video w-full bg-navy-950 overflow-hidden">
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-medium">
                      {item.mediaType.toUpperCase()}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm text-navy-100">{item.title}</h3>
                        <span className="text-[10px] font-semibold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                          {item.creatorRole || 'Creator'}
                        </span>
                      </div>
                      <p className="text-xs text-navy-400 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                      {item.clientName && (
                        <p className="text-[11px] text-navy-500 mt-1">
                          Client: <span className="text-navy-300 font-medium">{item.clientName}</span>
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-navy-800 flex items-center justify-between">
                      {/* Reorder controls */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMovePortfolio(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-navy-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Move up"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          onClick={() => handleMovePortfolio(index, 'down')}
                          disabled={index === creatorPortfolios.length - 1}
                          className="p-1 text-navy-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Move down"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>

                      {/* Edit / Delete */}
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Edit3}
                          onClick={() => handleOpenPortfolioModal(item)}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Trash2}
                          onClick={() => removePortfolio(item.id)}
                          className="text-navy-400 hover:text-rose-400"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-navy-800">
            <Button variant="secondary" onClick={() => setActiveTab('profile')}>
              ← Back to Profile
            </Button>
            <Button variant="primary" onClick={() => setActiveTab('preview')}>
              Next: Profile Preview & AI Coach →
            </Button>
          </div>
        </div>
      )}

      {/* ── TAB 3: PROFILE PREVIEW & AI COACH ── */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          {/* AI Coach Action Bar */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-950/80 via-navy-900 to-navy-900 border border-violet-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300 shrink-0">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="font-bold text-base text-navy-50">GenAura AI Profile Coach</h3>
                <p className="text-xs text-navy-400">
                  Analyze your profile to receive optimization tips, bio enhancements, and verification readiness checks.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              icon={Sparkles}
              loading={isCoachAnalyzing}
              onClick={handleRunProfileCoach}
            >
              Analyze My Profile
            </Button>
          </div>

          {/* AI Coach Analysis Results Card */}
          {coachAnalysis && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  label="Profile Completeness"
                  value={`${coachAnalysis.completenessScore}%`}
                  icon={User}
                  accent="violet"
                />
                <StatCard
                  label="Bio Clarity Level"
                  value={coachAnalysis.bioFeedback.clarityLevel}
                  icon={Sparkles}
                  accent={coachAnalysis.bioFeedback.clarityLevel === 'High' ? 'emerald' : 'amber'}
                />
                <StatCard
                  label="Portfolio Items"
                  value={`${creatorPortfolios.length} Samples`}
                  icon={FolderKanban}
                  accent={creatorPortfolios.length >= 3 ? 'emerald' : 'rose'}
                />
              </div>

              {/* Bio Optimization Suggestion */}
              <Card className="p-5 space-y-3 border-violet-500/30 bg-violet-950/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-violet-300 font-bold text-sm">
                    <Sparkles size={16} /> Recommended High-Impact Bio
                  </div>
                  {appliedBio ? (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <Check size={14} /> Applied to Profile!
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleApplySuggestedBio(coachAnalysis.bioFeedback.suggestedBio)}
                    >
                      Apply Suggested Bio
                    </Button>
                  )}
                </div>

                <p className="text-xs text-navy-200 p-3 bg-navy-900 rounded-lg border border-navy-800 leading-relaxed font-mono">
                  "{coachAnalysis.bioFeedback.suggestedBio}"
                </p>

                <p className="text-[11px] text-navy-400">
                  <strong>Why this works:</strong> {coachAnalysis.bioFeedback.rationale}
                </p>
              </Card>

              {/* Verification Checklist */}
              <Card className="p-5 space-y-3">
                <h4 className="text-sm font-bold text-navy-100 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" /> Verification Readiness Audit
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {coachAnalysis.verificationChecklist.map((item, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'p-3 rounded-lg border text-xs flex items-start gap-2.5',
                        item.passed
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                      )}
                    >
                      <div className="font-bold shrink-0 mt-0.5">
                        {item.passed ? '✓' : '⚠️'}
                      </div>
                      <div>
                        <p className="font-semibold">{item.label}</p>
                        <p className="text-[11px] opacity-80 mt-0.5">{item.tip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Discoverability Actions */}
              <div className="p-4 rounded-xl bg-navy-900 border border-navy-800 flex items-center justify-between text-xs text-navy-400">
                <span>{coachAnalysis.engineNotice}</span>
                <span className="text-violet-400 font-medium">Ready to submit?</span>
              </div>
            </div>
          )}

          {/* Public Profile Preview Card */}
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-navy-800 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-400">
                Public Profile Live Preview
              </span>
              <Badge variant={creator?.verified ? 'success' : 'default'} dot>
                {creator?.verified ? 'Verified Creator' : creator?.verificationStatus || 'Unverified'}
              </Badge>
            </div>

            {/* Profile Header Preview */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <Avatar src={creator?.avatarUrl} alt={creator?.name || ''} size="xl" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-navy-50">{creator?.name}</h2>
                  {creator?.verified && <CheckCircle2 size={18} className="text-cyan-400" />}
                </div>
                <p className="text-xs text-navy-400">{creator?.handle} · {creator?.category}</p>
                <p className="text-xs text-navy-300 mt-2 max-w-2xl leading-relaxed">
                  {creator?.bio}
                </p>
                <div className="flex items-center gap-4 text-xs text-navy-400 pt-2">
                  <span className="font-bold text-emerald-400">{formatUSD(creator?.hourlyRate || 0)}/hr</span>
                  <span>·</span>
                  <span>{creator?.location}</span>
                  <span>·</span>
                  <span>★ {creator?.rating} ({creator?.reviewCount} reviews)</span>
                </div>
              </div>
            </div>

            {/* Submit Verification Action */}
            <div className="pt-6 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-navy-100">Ready for Verified Partner Status?</p>
                <p className="text-xs text-navy-400">
                  Submitting initiates an algorithmic audit. An editorial reviewer will review your work samples.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => setActiveTab('profile')}>
                  Edit Profile
                </Button>
                <Button
                  variant="primary"
                  icon={ShieldCheck}
                  onClick={handleSubmitVerification}
                  disabled={creator?.verificationStatus === 'submitted'}
                >
                  {creator?.verificationStatus === 'submitted'
                    ? 'Under Review'
                    : 'Submit for Verification'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 4: VERIFICATION REPORT & STATUS ── */}
      {activeTab === 'verification' && verificationReport && (
        <div className="space-y-6">
          {/* Status Banner */}
          <div
            className={cn(
              'p-6 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
              creator?.verified
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                : creator?.verificationStatus === 'submitted'
                ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                : creator?.verificationStatus === 'needs_changes'
                ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                : 'bg-navy-900 border-navy-700 text-navy-200'
            )}
          >
            <div>
              <p className="text-xs uppercase font-bold tracking-wider opacity-80">
                Official Verification Status
              </p>
              <h2 className="text-2xl font-black mt-1 flex items-center gap-2">
                {creator?.verified ? (
                  <>
                    <CheckCircle2 size={24} className="text-emerald-400" />
                    Verified Partner
                  </>
                ) : (
                  <>
                    <Clock size={24} className="text-amber-400" />
                    Status: <span className="capitalize">{creator?.verificationStatus || 'Draft'}</span>
                  </>
                )}
              </h2>
              <p className="text-xs opacity-90 mt-1 max-w-xl">
                {verificationReport.explanation}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="px-4 py-2 rounded-xl bg-black/40 border border-current/20 text-center">
                <p className="text-[10px] uppercase font-bold">Rubric Score</p>
                <p className="text-2xl font-extrabold">{verificationReport.overallScore}/100</p>
              </div>

              {creator?.verificationStatus === 'needs_changes' && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={RotateCcw}
                  onClick={handleSubmitVerification}
                >
                  Resubmit for Review
                </Button>
              )}
            </div>
          </div>

          {/* 100-Point Rubric Breakdown */}
          <Card className="p-6 space-y-5">
            <h3 className="text-base font-bold text-navy-100 flex items-center gap-2">
              <Award size={18} className="text-violet-400" /> 100-Point Verification Rubric Results
            </h3>

            <div className="space-y-4">
              {[
                {
                  name: '1. Profile Completeness',
                  score: verificationReport.criterionScores.profileCompleteness,
                  max: VERIFICATION_RUBRIC.weights.profileCompleteness,
                  desc: 'Evaluates required fields, bio depth, niche declaration, and connected social channels.',
                },
                {
                  name: '2. Portfolio Quality & Depth',
                  score: verificationReport.criterionScores.portfolioQuality,
                  max: VERIFICATION_RUBRIC.weights.portfolioQuality,
                  desc: 'Evaluates volume (3+ samples recommended), clear descriptions, media links, and niche relevance.',
                },
                {
                  name: '3. Content Originality & Role Clarity',
                  score: verificationReport.criterionScores.contentOriginality,
                  max: VERIFICATION_RUBRIC.weights.contentOriginality,
                  desc: 'Evaluates explicit creator role specification, client context, and distinct authentic content.',
                },
                {
                  name: '4. Professional Readiness',
                  score: verificationReport.criterionScores.professionalReadiness,
                  max: VERIFICATION_RUBRIC.weights.professionalReadiness,
                  desc: 'Evaluates commercial pricing transparency, collaboration formats, and stated experience.',
                },
                {
                  name: '5. Authenticity & Consistency',
                  score: verificationReport.criterionScores.authenticityConsistency,
                  max: VERIFICATION_RUBRIC.weights.authenticityConsistency,
                  desc: 'Evaluates handle validity, plausible performance metrics, and alignment across specialties.',
                },
              ].map((crit) => (
                <div key={crit.name} className="p-4 rounded-xl bg-navy-800/60 border border-navy-700/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-navy-100">{crit.name}</span>
                    <span className="font-bold text-violet-400">
                      {crit.score} / {crit.max} pts
                    </span>
                  </div>
                  <div className="w-full bg-navy-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full"
                      style={{ width: `${(crit.score / crit.max) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-navy-400">{crit.desc}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Passed Checks and Actionable Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card className="p-5 space-y-3">
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 size={16} /> Passed Checklist Criteria ({verificationReport.passedChecks.length})
              </h4>
              <div className="space-y-2">
                {verificationReport.passedChecks.map((check, idx) => (
                  <div key={idx} className="text-xs text-navy-300 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{check}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <AlertTriangle size={16} /> Actionable Recommendations ({verificationReport.suggestions.length})
              </h4>
              <div className="space-y-2">
                {verificationReport.suggestions.map((sug, idx) => (
                  <div key={idx} className="text-xs text-navy-300 flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{sug}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Review Audit Trail */}
          {verificationReport.auditTrail && verificationReport.auditTrail.length > 0 && (
            <Card className="p-5 space-y-3">
              <h4 className="text-sm font-bold text-navy-100 flex items-center gap-2">
                <Clock size={16} className="text-violet-400" /> Reviewer Audit Trail
              </h4>
              <div className="divide-y divide-navy-800">
                {verificationReport.auditTrail.map((audit, idx) => (
                  <div key={idx} className="py-2.5 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-navy-200">
                        Decision: <span className="uppercase text-violet-400">{audit.decision}</span> by {audit.reviewer}
                      </p>
                      <p className="text-navy-400 text-[11px] mt-0.5">{audit.reason}</p>
                    </div>
                    <span className="text-navy-500 text-[11px]">
                      {new Date(audit.reviewedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quick link to Admin Queue */}
          <div className="p-4 rounded-xl bg-navy-900 border border-navy-800 flex items-center justify-between text-xs text-navy-400">
            <span>Want to test the reviewer approval flow?</span>
            <Button
              size="sm"
              variant="outline"
              icon={ShieldCheck}
              onClick={() => navigate('/admin/verification')}
            >
              Open Admin Review Queue →
            </Button>
          </div>
        </div>
      )}

      {/* ── Portfolio Add/Edit Modal ── */}
      {isPortfolioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <h3 className="text-base font-bold text-navy-100">
              {editingPortfolioId ? 'Edit Work Sample' : 'Add New Work Sample'}
            </h3>

            <div className="space-y-3">
              <Input
                label="Sample Title"
                placeholder="e.g. AuraFlow 2.0 Global Launch Video"
                value={portfolioForm.title}
                onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-navy-300 block mb-1">
                    Media Format
                  </label>
                  <select
                    value={portfolioForm.mediaType}
                    onChange={(e) =>
                      setPortfolioForm({
                        ...portfolioForm,
                        mediaType: e.target.value as any,
                      })
                    }
                    className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-xs text-navy-100 focus:outline-none"
                  >
                    <option value="image">Image / Graphic</option>
                    <option value="video">Video / Reel</option>
                    <option value="link">Web / Public Link</option>
                    <option value="pdf">Case Study PDF</option>
                  </select>
                </div>

                <Input
                  label="Your Creator Role"
                  placeholder="e.g. Lead Director & Editor"
                  value={portfolioForm.creatorRole}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, creatorRole: e.target.value })}
                />
              </div>

              <Input
                label="Public Media / Content URL"
                placeholder="https://..."
                value={portfolioForm.mediaUrl}
                onChange={(e) => setPortfolioForm({ ...portfolioForm, mediaUrl: e.target.value })}
              />

              <Input
                label="Client / Campaign Name"
                placeholder="e.g. Acme Corp Summer Campaign"
                value={portfolioForm.clientName}
                onChange={(e) => setPortfolioForm({ ...portfolioForm, clientName: e.target.value })}
              />

              <div>
                <label className="text-xs font-semibold text-navy-300 block mb-1">
                  Description & Artistic Process
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain your creative execution, audience response, and project objectives..."
                  value={portfolioForm.description}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg p-2.5 text-xs text-navy-100 focus:outline-none"
                />
              </div>

              <Input
                label="Tags (comma separated)"
                placeholder="e.g. Motion, 3D, Product Launch"
                value={portfolioForm.tags}
                onChange={(e) => setPortfolioForm({ ...portfolioForm, tags: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-800">
              <Button variant="secondary" onClick={() => setIsPortfolioModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSavePortfolioItem}>
                Save Sample
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
