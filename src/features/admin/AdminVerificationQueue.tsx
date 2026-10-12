/**
 * GenAura AI — Admin Verification Queue
 * =====================================
 * Clearly labeled demo admin review screen.
 * Allows authorized reviewers to inspect applicant profiles, evaluate
 * algorithmic rubric scores, and approve, request changes, or reject profiles.
 *
 * Enforces audit logging and guarantees that verified badges only appear
 * following explicit reviewer approval.
 */
import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  Award,
  Filter,
  User,
  FolderKanban,
  ExternalLink,
  MessageSquare,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { Creator, VerificationStatus } from '@/types';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Avatar,
  StatCard,
  EmptyState,
} from '@/components/ui';
import { formatUSD, cn } from '@/lib/utils';
import { verificationEngine } from '@/services/verificationEngine';
import { VERIFICATION_RUBRIC } from '@/config/verificationRubric';

export function AdminVerificationQueue() {
  const navigate = useNavigate();
  const { creators, portfolios, reviewCreatorVerification } = useAppStore();

  const [filterTab, setFilterTab] = useState<'pending' | 'verified' | 'needs_changes' | 'rejected' | 'all'>('pending');
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [reviewerName, setReviewerName] = useState('Editorial Reviewer');
  const [reviewReason, setReviewReason] = useState('Meets professional portfolio and originality criteria.');

  // Resolved list with reports
  const creatorsWithReports = useMemo(() => {
    return creators.map((c) => {
      const creatorPortfolios = portfolios.filter((p) => p.creatorId === c.id);
      const report = c.verificationReport || verificationEngine.evaluateCreator(c, creatorPortfolios);
      return { creator: c, report, portfolios: creatorPortfolios };
    });
  }, [creators, portfolios]);

  // Filtered by tab
  const filteredCreators = useMemo(() => {
    return creatorsWithReports.filter(({ creator: c }) => {
      const status = c.verificationStatus || (c.verified ? 'verified' : 'draft');
      if (filterTab === 'pending') {
        return status === 'submitted' || status === 'under_review';
      }
      if (filterTab === 'verified') {
        return status === 'verified' || c.verified;
      }
      if (filterTab === 'needs_changes') {
        return status === 'needs_changes';
      }
      if (filterTab === 'rejected') {
        return status === 'rejected';
      }
      return true;
    });
  }, [creatorsWithReports, filterTab]);

  // Metrics
  const metrics = useMemo(() => {
    const pending = creators.filter((c) => c.verificationStatus === 'submitted' || c.verificationStatus === 'under_review').length;
    const verified = creators.filter((c) => c.verified || c.verificationStatus === 'verified').length;
    const needsChanges = creators.filter((c) => c.verificationStatus === 'needs_changes').length;
    return { pending, verified, needsChanges };
  }, [creators]);

  // Review Actions
  const handleDecision = (decision: 'approved' | 'changes_requested' | 'rejected') => {
    if (!selectedCreator) return;

    reviewCreatorVerification(
      selectedCreator.id,
      decision,
      reviewReason || (decision === 'approved' ? 'Profile verified.' : 'Changes requested by editorial review.'),
      reviewerName || 'Editorial Reviewer'
    );

    setSelectedCreator(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── Demo Notice Banner ── */}
      <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-500/30 text-xs text-violet-300 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-violet-400" />
          <strong>Demo Administration View:</strong> This workflow demonstrates human-in-the-loop verification approval for hackathon evaluation.
        </span>
        <span className="text-[11px] text-navy-400">Restricted role simulation</span>
      </div>

      {/* ── Page Header ── */}
      <PageHeader
        title="Creator Verification Review Queue"
        subtitle="Review submitted creator applications, inspect algorithmic 100-point rubric scores, and approve or request changes."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={User}
              onClick={() => navigate('/studio')}
            >
              Open Creator Studio
            </Button>
            <Button
              variant="secondary"
              icon={Eye}
              onClick={() => navigate('/creators')}
            >
              Browse Directory
            </Button>
          </div>
        }
      />

      {/* ── Metrics Summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Pending Applications"
          value={metrics.pending}
          icon={Clock}
          accent="amber"
        />
        <StatCard
          label="Verified Partners"
          value={metrics.verified}
          icon={CheckCircle2}
          accent="emerald"
        />
        <StatCard
          label="Changes Requested"
          value={metrics.needsChanges}
          icon={AlertTriangle}
          accent="rose"
        />
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-2 border-b border-navy-800 pb-2 overflow-x-auto">
        {[
          { id: 'pending', label: 'Pending Review', count: metrics.pending },
          { id: 'verified', label: 'Verified Creators', count: metrics.verified },
          { id: 'needs_changes', label: 'Needs Changes', count: metrics.needsChanges },
          { id: 'all', label: 'All Profiles', count: creators.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id as any)}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer',
              filterTab === tab.id
                ? 'bg-navy-800 text-white border border-navy-700'
                : 'text-navy-400 hover:text-navy-200'
            )}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-navy-900 border border-navy-700">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Creators Queue Table / Cards ── */}
      {filteredCreators.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No applications in this view"
          description="Creators submitted through Creator Studio will appear here for editorial inspection and approval."
          action={
            <Button variant="secondary" onClick={() => setFilterTab('all')}>
              View All Creators
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredCreators.map(({ creator, report, portfolios }) => {
            const scoreColor =
              report.overallScore >= 85
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                : report.overallScore >= 65
                ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

            return (
              <Card
                key={creator.id}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 hover:border-navy-600 transition-colors"
              >
                {/* Creator info */}
                <div className="flex items-center gap-4 min-w-[280px]">
                  <Avatar src={creator.avatarUrl} alt={creator.name} size="lg" />
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/creators/${creator.id}`}
                        className="font-bold text-sm text-navy-100 hover:text-violet-400"
                      >
                        {creator.name}
                      </Link>
                      {creator.verified && (
                        <CheckCircle2 size={15} className="text-cyan-400" />
                      )}
                    </div>
                    <p className="text-xs text-navy-400">{creator.handle} · {creator.category}</p>
                    <p className="text-xs text-navy-500 mt-1">
                      {portfolios.length} portfolio samples · {creator.location}
                    </p>
                  </div>
                </div>

                {/* Score & Recommendation */}
                <div className="min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('px-2.5 py-0.5 rounded text-xs font-bold border', scoreColor)}>
                      {report.overallScore}/100 Rubric Score
                    </span>
                  </div>
                  <p className="text-[11px] text-navy-400">
                    Recommendation:{' '}
                    <span className="font-semibold text-navy-200 uppercase">
                      {report.recommendedDecision.replace('_', ' ')}
                    </span>
                  </p>
                </div>

                {/* Current Status Badge */}
                <div className="min-w-[130px]">
                  <Badge
                    variant={
                      creator.verified
                        ? 'success'
                        : creator.verificationStatus === 'submitted'
                        ? 'warning'
                        : creator.verificationStatus === 'needs_changes'
                        ? 'danger'
                        : 'default'
                    }
                    dot
                  >
                    {creator.verified ? 'Verified' : creator.verificationStatus || 'Draft'}
                  </Badge>
                </div>

                {/* Inspect & Review Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="primary"
                    icon={ShieldCheck}
                    onClick={() => {
                      setSelectedCreator(creator);
                      setReviewReason(
                        report.overallScore >= 85
                          ? 'Profile exhibits verified client track record, clear creative role definitions, and full portfolio quality.'
                          : 'Please add at least 3 distinct work samples with client context before re-evaluating.'
                      );
                    }}
                  >
                    Review Application
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Review Inspection Modal ── */}
      {selectedCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-navy-800 pb-4">
              <div className="flex items-center gap-3">
                <Avatar src={selectedCreator.avatarUrl} alt={selectedCreator.name} size="md" />
                <div>
                  <h3 className="font-bold text-base text-navy-50">{selectedCreator.name}</h3>
                  <p className="text-xs text-navy-400">{selectedCreator.handle} · {selectedCreator.category}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCreator(null)}
                className="text-navy-400 hover:text-white p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Rubric Breakdown */}
            {(() => {
              const currentPortfolios = portfolios.filter((p) => p.creatorId === selectedCreator.id);
              const rep = selectedCreator.verificationReport || verificationEngine.evaluateCreator(selectedCreator, currentPortfolios);

              return (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-navy-800/80 border border-navy-700/60 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-navy-400 uppercase font-semibold">Automated Rubric Score</p>
                      <p className="text-xl font-bold text-navy-50 mt-0.5">{rep.overallScore}/100 Points</p>
                    </div>
                    <Badge variant={rep.overallScore >= 85 ? 'success' : 'warning'}>
                      {rep.overallScore >= 85 ? 'Eligible for Approval' : 'Review Carefully'}
                    </Badge>
                  </div>

                  {/* 5-Criteria bars */}
                  <div className="space-y-2 text-xs">
                    {[
                      { label: 'Profile Completeness', score: rep.criterionScores.profileCompleteness, max: 20 },
                      { label: 'Portfolio Quality & Depth', score: rep.criterionScores.portfolioQuality, max: 25 },
                      { label: 'Content Originality & Role', score: rep.criterionScores.contentOriginality, max: 20 },
                      { label: 'Professional Readiness', score: rep.criterionScores.professionalReadiness, max: 15 },
                      { label: 'Authenticity & Consistency', score: rep.criterionScores.authenticityConsistency, max: 20 },
                    ].map((c) => (
                      <div key={c.label}>
                        <div className="flex justify-between text-navy-300 mb-0.5">
                          <span>{c.label}</span>
                          <span className="font-semibold text-navy-100">{c.score} / {c.max}</span>
                        </div>
                        <div className="w-full bg-navy-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                            style={{ width: `${(c.score / c.max) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Warnings & Passed list */}
                  <div className="p-3 rounded-lg bg-navy-950 border border-navy-800 text-xs text-navy-300 space-y-1">
                    <p className="font-semibold text-navy-100 mb-1">Audit Findings:</p>
                    {rep.warnings.map((w, i) => (
                      <p key={i} className="text-amber-400">⚠️ {w}</p>
                    ))}
                    {rep.warnings.length === 0 && (
                      <p className="text-emerald-400">✓ All mandatory profile and portfolio criteria verified.</p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Review Decision Form */}
            <div className="space-y-3 pt-3 border-t border-navy-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-navy-300 block mb-1">
                    Reviewer Name
                  </label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="w-full bg-navy-800 border border-navy-700 rounded-lg p-2 text-xs text-navy-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-300 block mb-1">
                  Reviewer Notes & Decision Rationale
                </label>
                <textarea
                  rows={3}
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg p-2.5 text-xs text-navy-100 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-3">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedCreator(null)}
                >
                  Cancel
                </Button>

                <Button
                  variant="danger"
                  icon={XCircle}
                  onClick={() => handleDecision('rejected')}
                >
                  Reject Application
                </Button>

                <Button
                  variant="secondary"
                  icon={AlertTriangle}
                  onClick={() => handleDecision('changes_requested')}
                >
                  Request Changes
                </Button>

                <Button
                  variant="primary"
                  icon={CheckCircle2}
                  onClick={() => handleDecision('approved')}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  Approve as Verified Partner
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
