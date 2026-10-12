import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import {
  Users, FileText, Bookmark, FolderKanban, Zap, TrendingUp,
  Plus, Search, Star, ArrowRight, Clock, CheckCircle2, CircleDot,
  Sparkles, Wallet,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  StatCard, Card, Button, Badge, Avatar,
  PageHeader, StarRating,
} from '@/components/ui';
import { ROUTES } from '@/types';
import { timeAgo, formatUSD, formatRupees } from '@/lib/utils';

// ── Status badge helpers ──────────────────────────────────────────
function creatorStatusBadge(status: string) {
  if (status === 'available') return <Badge variant="success" dot>Available</Badge>;
  if (status === 'busy')      return <Badge variant="warning" dot>Busy</Badge>;
  return                            <Badge variant="default" dot>On Leave</Badge>;
}

function projectStatusBadge(status: string) {
  const map: Record<string, { variant: 'info' | 'violet' | 'success' | 'warning' | 'default' | 'danger'; label: string }> = {
    pending:     { variant: 'warning', label: 'Pending' },
    accepted:    { variant: 'info',    label: 'Accepted' },
    'in-progress':{ variant: 'violet', label: 'In Progress' },
    review:      { variant: 'info',    label: 'In Review' },
    completed:   { variant: 'success', label: 'Completed' },
    cancelled:   { variant: 'danger',  label: 'Cancelled' },
  };
  const m = map[status] ?? { variant: 'default' as const, label: status };
  return <Badge variant={m.variant} dot>{m.label}</Badge>;
}

// ── Quick Action Button ───────────────────────────────────────────
function QuickAction({
  icon: Icon,
  label,
  description,
  to,
  accent,
}: {
  icon: React.FC<{ size?: number; className?: string }>;
  label: string;
  description: string;
  to: string;
  accent: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className={`group flex items-center gap-4 rounded-xl p-4 border transition-all duration-150 cursor-pointer text-left w-full
        bg-navy-900 border-navy-700/50 hover:border-navy-600 hover:bg-navy-800`}
    >
      <div className={`rounded-lg p-2.5 shrink-0 ${accent}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-navy-100 text-sm group-hover:text-white transition-colors">{label}</p>
        <p className="text-xs text-navy-500 truncate">{description}</p>
      </div>
      <ArrowRight size={16} className="text-navy-600 group-hover:text-navy-400 ml-auto shrink-0 transition-colors" />
    </button>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────
export function DashboardPage() {
  const navigate = useNavigate();

  // All data from the single source of truth
  const creators  = useAppStore((s) => s.creators);
  const briefs    = useAppStore((s) => s.briefs);
  const shortlist = useAppStore((s) => s.shortlist);
  const projects  = useAppStore((s) => s.projects);

  // Derived stats memoized from store slices
  const stats = useMemo(() => ({
    totalCreators:       creators.length,
    availableCreators:   creators.filter((c) => c.status === 'available').length,
    publishedBriefs:     briefs.filter((b) => b.status === 'published').length,
    shortlistedCreators: shortlist.length,
    pendingRequests:     projects.filter((p) => p.status === 'pending').length,
    activeEngagements:   projects.filter(
      (p) => p.status === 'in-progress' || p.status === 'review'
    ).length,
  }), [creators, briefs, shortlist, projects]);

  // Derived views
  const featuredCreators = useMemo(
    () => creators.filter((c) => c.featured).slice(0, 3),
    [creators]
  );
  const recentBriefs = useMemo(
    () =>
      [...briefs]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4),
    [briefs]
  );
  const recentProjects = useMemo(
    () =>
      [...projects]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 4),
    [projects]
  );

  // For project activity: resolve creator + brief names efficiently
  const creatorMap = useMemo(() => new Map(creators.map((c) => [c.id, c])), [creators]);
  const briefMap   = useMemo(() => new Map(briefs.map((b) => [b.id, b])), [briefs]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* ── Header ── */}
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back — here's what's happening with your creative projects."
        actions={
          <Button icon={Plus} onClick={() => navigate(ROUTES.briefNew)}>
            New Brief
          </Button>
        }
      />

      {/* ── Stat Cards ── */}
      <section aria-label="Overview statistics">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            label="Total Creators"
            value={stats.totalCreators}
            icon={Users}
            accent="violet"
          />
          <StatCard
            label="Available Now"
            value={stats.availableCreators}
            icon={CheckCircle2}
            accent="emerald"
          />
          <StatCard
            label="Published Briefs"
            value={stats.publishedBriefs}
            icon={FileText}
            accent="cyan"
          />
          <StatCard
            label="Shortlisted"
            value={stats.shortlistedCreators}
            icon={Bookmark}
            accent="amber"
          />
          <StatCard
            label="Pending Requests"
            value={stats.pendingRequests}
            icon={CircleDot}
            accent="rose"
          />
          <StatCard
            label="Active Engagements"
            value={stats.activeEngagements}
            icon={Zap}
            accent="violet"
          />
        </div>
      </section>

      {/* ── Quick Actions ── */}
      <section aria-label="Quick actions">
        <h2 className="text-base font-semibold text-navy-200 mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-violet-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <QuickAction
            icon={Users}
            label="Explore Creators"
            description="Browse and discover talented creators"
            to={ROUTES.creators}
            accent="bg-violet-600"
          />
          <QuickAction
            icon={Plus}
            label="Create Brief"
            description="Define your creative requirements"
            to={ROUTES.briefNew}
            accent="bg-cyan-600"
          />
          <QuickAction
            icon={Bookmark}
            label="View Shortlist"
            description="Review your saved creators"
            to={ROUTES.shortlist}
            accent="bg-amber-600"
          />
          <QuickAction
            icon={FolderKanban}
            label="View Projects"
            description="Track active collaborations"
            to={ROUTES.projects}
            accent="bg-indigo-600"
          />
          <QuickAction
            icon={Wallet}
            label="INR Wallet & Payouts"
            description="Manage funds, escrows & payouts"
            to={ROUTES.wallet}
            accent="bg-emerald-600"
          />
        </div>
      </section>

      {/* ── Middle: Featured Creators + Recent Briefs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Featured Creators (3 cols) */}
        <section className="lg:col-span-3" aria-label="Featured creators">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-navy-200 flex items-center gap-2">
              <Star size={16} className="text-amber-400" />
              Featured Creators
            </h2>
            <Button
              variant="ghost"
              size="sm"
              iconRight={ArrowRight}
              onClick={() => navigate(ROUTES.creators)}
            >
              View all
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {featuredCreators.map((creator) => {
              const isShortlisted = shortlist.some((s) => s.creatorId === creator.id);
              return (
                <Card
                  key={creator.id}
                  hoverable
                  onClick={() => navigate(`/creators/${creator.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <Avatar src={creator.avatarUrl} alt={creator.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-navy-100">{creator.name}</p>
                        {creator.verified && (
                          <Badge variant="info">✓ Verified</Badge>
                        )}
                        {isShortlisted && (
                          <Badge variant="warning">
                            Shortlisted
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-navy-400 truncate mt-0.5">{creator.tagline}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <StarRating rating={creator.rating} />
                        <span className="text-xs text-navy-400">
                          {creator.rating} ({creator.reviewCount})
                        </span>
                        <span className="text-xs text-navy-500">
                          {formatUSD(creator.hourlyRate)}/hr
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">{creatorStatusBadge(creator.status)}</div>
                  </div>
                </Card>
              );
            })}
            {featuredCreators.length === 0 && (
              <Card>
                <p className="text-navy-500 text-sm text-center py-4">No featured creators yet.</p>
              </Card>
            )}
          </div>
        </section>

        {/* Recent Briefs (2 cols) */}
        <section className="lg:col-span-2" aria-label="Recent briefs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-navy-200 flex items-center gap-2">
              <FileText size={16} className="text-cyan-400" />
              Recent Briefs
            </h2>
            <Button
              variant="ghost"
              size="sm"
              iconRight={ArrowRight}
              onClick={() => navigate(ROUTES.briefs)}
            >
              View all
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {recentBriefs.map((brief) => (
              <Card
                key={brief.id}
                hoverable
                onClick={() => navigate(`/briefs/${brief.id}`)}
                padding="sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy-100 truncate">{brief.title}</p>
                    <p className="text-xs text-navy-500 mt-0.5">{timeAgo(brief.createdAt)}</p>
                  </div>
                  <div className="shrink-0 mt-0.5">
                    {brief.status === 'published' ? (
                      <Badge variant="success">Published</Badge>
                    ) : brief.status === 'draft' ? (
                      <Badge variant="default">Draft</Badge>
                    ) : (
                      <Badge variant="default">{brief.status}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="info">
                    {formatUSD(brief.budget.min)} – {formatUSD(brief.budget.max)}
                  </Badge>
                </div>
              </Card>
            ))}
            {recentBriefs.length === 0 && (
              <Card padding="sm">
                <p className="text-navy-500 text-sm text-center py-4">
                  No briefs yet.{' '}
                  <button
                    onClick={() => navigate(ROUTES.briefNew)}
                    className="text-violet-400 underline hover:text-violet-300"
                  >
                    Create one
                  </button>
                </p>
              </Card>
            )}
          </div>
        </section>
      </div>

      {/* ── Recent Project Activity ── */}
      <section aria-label="Recent project activity">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-navy-200 flex items-center gap-2">
            <TrendingUp size={16} className="text-violet-400" />
            Recent Project Activity
          </h2>
          <Button
            variant="ghost"
            size="sm"
            iconRight={ArrowRight}
            onClick={() => navigate(ROUTES.projects)}
          >
            View all
          </Button>
        </div>
        <Card padding="none">
          <div className="divide-y divide-navy-700/50">
            {recentProjects.map((project) => {
              const creator = creatorMap.get(project.creatorId);
              const brief   = briefMap.get(project.briefId);
              const unread  = project.messages.filter((m) => !m.read && m.senderType === 'creator').length;
              return (
                <div
                  key={project.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-navy-800/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter') && navigate(`/projects/${project.id}`)}
                >
                  <Avatar
                    src={creator?.avatarUrl}
                    alt={creator?.name ?? 'Creator'}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-100 truncate">
                      {brief?.title ?? 'Unknown Brief'}
                    </p>
                    <p className="text-xs text-navy-400 flex items-center gap-1 mt-0.5">
                      <Clock size={11} />
                      {creator?.name} · Updated {timeAgo(project.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {unread > 0 && (
                      <span className="h-5 w-5 rounded-full bg-violet-600 text-white text-[10px] flex items-center justify-center font-bold">
                        {unread}
                      </span>
                    )}
                    {projectStatusBadge(project.status)}
                  </div>
                </div>
              );
            })}
            {recentProjects.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-navy-500 text-sm">No project activity yet.</p>
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* ── Recommended Next Actions ── */}
      {(stats.publishedBriefs === 0 || stats.shortlistedCreators === 0 || stats.pendingRequests > 0) && (
        <section aria-label="Recommended next actions">
          <h2 className="text-base font-semibold text-navy-200 mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-cyan-400" />
            Recommended Actions
          </h2>
          <div className="flex flex-col gap-2">
            {stats.publishedBriefs === 0 && (
              <Card className="flex items-center gap-4 border-cyan-500/30 bg-cyan-500/5" padding="sm">
                <div className="h-8 w-8 rounded-lg bg-cyan-600 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-100">Publish your first brief</p>
                  <p className="text-xs text-navy-400">Let creators discover your project requirements.</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.briefNew)}>
                  Create Brief
                </Button>
              </Card>
            )}
            {stats.shortlistedCreators === 0 && (
              <Card className="flex items-center gap-4 border-amber-500/30 bg-amber-500/5" padding="sm">
                <div className="h-8 w-8 rounded-lg bg-amber-600 flex items-center justify-center shrink-0">
                  <Search size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-100">Discover creators</p>
                  <p className="text-xs text-navy-400">Find the perfect match for your project.</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.discovery)}>
                  Explore
                </Button>
              </Card>
            )}
            {stats.pendingRequests > 0 && (
              <Card className="flex items-center gap-4 border-rose-500/30 bg-rose-500/5" padding="sm">
                <div className="h-8 w-8 rounded-lg bg-rose-600 flex items-center justify-center shrink-0">
                  <FolderKanban size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-100">
                    {stats.pendingRequests} project request{stats.pendingRequests > 1 ? 's' : ''} awaiting your response
                  </p>
                  <p className="text-xs text-navy-400">Review and accept to start collaborating.</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.projects)}>
                  Review
                </Button>
              </Card>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
