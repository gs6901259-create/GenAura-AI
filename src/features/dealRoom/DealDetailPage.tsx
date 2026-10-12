import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Deal, DealRole, DealTerms, DealVersion } from '@/types/deal';
import { dealService } from '@/services/dealService';
import { useAppStore } from '@/lib/store';
import { DealStatusBadge } from './DealStatusBadge';
import { TermsComparisonView } from './TermsComparisonView';
import { DealActivityTimeline } from './DealActivityTimeline';
import { DealMessagesThread } from './DealMessagesThread';
import { CounterofferModal } from './CounterofferModal';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Layers,
  Repeat,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  GitPullRequest,
  RotateCcw,
  PlayCircle,
  Award,
  Sparkles,
  ExternalLink,
  History,
  AlertTriangle,
  Lock,
  UserCheck,
  MessageSquare,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui';

export const DealDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const authUser = useAppStore((s) => s.authUser);
  const addNotification = useAppStore((s) => s.addNotification);

  // Allow simulating Brand vs Creator POV
  const [simulatedRole, setSimulatedRole] = useState<DealRole>(
    authUser?.role === 'creator' ? 'creator' : 'brand'
  );

  const [deal, setDeal] = useState<Deal | undefined>(() =>
    id ? dealService.getDealById(id) : undefined
  );
  const [activities, setActivities] = useState(() =>
    id ? dealService.getActivities(id) : []
  );
  const [messages, setMessages] = useState(() =>
    id ? dealService.getMessages(id, simulatedRole) : []
  );

  // Modals & confirmation dialogs
  const [isCounterofferOpen, setIsCounterofferOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    'accept' | 'decline' | 'withdraw' | 'start' | 'complete' | null
  >(null);
  const [actionReason, setActionReason] = useState('');
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number>(
    deal ? deal.versions.length - 1 : 0
  );

  const reloadData = () => {
    if (!id) return;
    const current = dealService.getDealById(id);
    setDeal(current);
    setActivities(dealService.getActivities(id));
    setMessages(dealService.getMessages(id, simulatedRole));
    if (current) {
      setSelectedVersionIndex(current.versions.length - 1);
    }
  };

  useEffect(() => {
    dealService.ensureInitialized();
    reloadData();
    const unsub = dealService.subscribe(() => {
      reloadData();
    });
    return unsub;
  }, [id, simulatedRole]);

  if (!deal) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-navy-800 border border-navy-700 flex items-center justify-center text-navy-400 mx-auto">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Deal Not Found</h2>
        <p className="text-xs text-navy-400 max-w-sm mx-auto">
          The requested collaboration deal record does not exist or has been removed.
        </p>
        <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/deals')}>
          Back to Deal Room
        </Button>
      </div>
    );
  }

  const isMyTurn = deal.awaitingActionFrom === simulatedRole;
  const isSender =
    deal.versions[deal.versions.length - 1]?.proposedByRole === simulatedRole;

  // Actions
  const handleAccept = () => {
    const res = dealService.acceptDeal({
      dealId: deal.id,
      acceptedByRole: simulatedRole,
      acceptedByName:
        simulatedRole === 'brand' ? deal.brand.name : deal.creator.name,
    });
    if (res.success) {
      addNotification({
        id: `notif_${Date.now()}`,
        title: 'Deal Accepted!',
        message: `${deal.title} terms accepted by ${simulatedRole}.`,
        type: 'collaboration',
        timestamp: new Date().toISOString(),
        read: false,
        linkTo: `/deals/${deal.id}`,
      });
      setConfirmAction(null);
      reloadData();
    }
  };

  const handleDecline = () => {
    const res = dealService.declineDeal({
      dealId: deal.id,
      declinedByRole: simulatedRole,
      declinedByName:
        simulatedRole === 'brand' ? deal.brand.name : deal.creator.name,
      reason: actionReason,
    });
    if (res.success) {
      addNotification({
        id: `notif_${Date.now()}`,
        title: 'Deal Declined',
        message: `${deal.title} was declined by ${simulatedRole}.`,
        type: 'collaboration',
        timestamp: new Date().toISOString(),
        read: false,
        linkTo: `/deals/${deal.id}`,
      });
      setConfirmAction(null);
      setActionReason('');
      reloadData();
    }
  };

  const handleWithdraw = () => {
    const res = dealService.withdrawDeal({
      dealId: deal.id,
      withdrawnByRole: simulatedRole,
      withdrawnByName:
        simulatedRole === 'brand' ? deal.brand.name : deal.creator.name,
      reason: actionReason,
    });
    if (res.success) {
      addNotification({
        id: `notif_${Date.now()}`,
        title: 'Proposal Withdrawn',
        message: `Proposal for ${deal.title} was withdrawn by ${simulatedRole}.`,
        type: 'collaboration',
        timestamp: new Date().toISOString(),
        read: false,
        linkTo: `/deals/${deal.id}`,
      });
      setConfirmAction(null);
      setActionReason('');
      reloadData();
    }
  };

  const handleStart = () => {
    const res = dealService.startDeal({
      dealId: deal.id,
      startedByRole: simulatedRole,
      startedByName:
        simulatedRole === 'brand' ? deal.brand.name : deal.creator.name,
    });
    if (res.success) {
      addNotification({
        id: `notif_${Date.now()}`,
        title: 'Production Started',
        message: `${deal.title} is now In Progress.`,
        type: 'collaboration',
        timestamp: new Date().toISOString(),
        read: false,
        linkTo: `/deals/${deal.id}`,
      });
      setConfirmAction(null);
      reloadData();
    }
  };

  const handleComplete = () => {
    const res = dealService.completeDeal({
      dealId: deal.id,
      completedByRole: simulatedRole,
      completedByName:
        simulatedRole === 'brand' ? deal.brand.name : deal.creator.name,
      verificationNotes: actionReason,
    });
    if (res.success) {
      addNotification({
        id: `notif_${Date.now()}`,
        title: 'Deal Completed & Verified',
        message: `${deal.title} deliverables approved & archived.`,
        type: 'collaboration',
        timestamp: new Date().toISOString(),
        read: false,
        linkTo: `/deals/${deal.id}`,
      });
      setConfirmAction(null);
      setActionReason('');
      reloadData();
    }
  };

  const handleCounterofferSubmit = (
    proposedTerms: DealTerms,
    summaryNotes: string
  ) => {
    const res = dealService.submitCounteroffer({
      dealId: deal.id,
      proposedTerms,
      counterByRole: simulatedRole,
      counterByName:
        simulatedRole === 'brand' ? deal.brand.name : deal.creator.name,
      summaryNotes,
    });
    if (res.success) {
      addNotification({
        id: `notif_${Date.now()}`,
        title: 'Counteroffer Received',
        message: `New terms proposed for ${deal.title}.`,
        type: 'collaboration',
        timestamp: new Date().toISOString(),
        read: false,
        linkTo: `/deals/${deal.id}`,
      });
      setIsCounterofferOpen(false);
      reloadData();
    }
  };

  const currentVersion = deal.versions[selectedVersionIndex] || deal.versions[0];
  const previousVersion =
    selectedVersionIndex > 0 ? deal.versions[selectedVersionIndex - 1] : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Navigation & POV Simulator Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/deals')}
          className="text-navy-400 hover:text-white"
        >
          Back to Deal Room
        </Button>

        {/* POV Simulator Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-900 border border-navy-700/80 text-xs">
          <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-navy-400">Simulate Role POV:</span>
          <div className="flex rounded-lg bg-navy-950 p-0.5 border border-navy-800">
            <button
              onClick={() => setSimulatedRole('brand')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                simulatedRole === 'brand'
                  ? 'bg-violet-600 text-white'
                  : 'text-navy-400 hover:text-navy-200'
              }`}
            >
              Brand ({deal.brand.name})
            </button>
            <button
              onClick={() => setSimulatedRole('creator')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                simulatedRole === 'creator'
                  ? 'bg-cyan-600 text-white'
                  : 'text-navy-400 hover:text-navy-200'
              }`}
            >
              Creator ({deal.creator.name})
            </button>
          </div>
        </div>
      </div>

      {/* Main Deal Header Card */}
      <div className="rounded-2xl border border-navy-700/80 bg-gradient-to-br from-navy-900 via-navy-900 to-navy-950 p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <DealStatusBadge status={deal.status} size="lg" />
              <span className="text-xs font-mono text-navy-400">ID: {deal.id}</span>
              {deal.briefTitle && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-violet-950/60 border border-violet-800 text-violet-300 font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Linked Brief: {deal.briefTitle}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {deal.title}
            </h1>

            <p className="text-sm text-navy-300 leading-relaxed">
              {deal.campaignObjective}
            </p>
          </div>

          {/* Action Center Buttons */}
          <div className="flex flex-col gap-2.5 shrink-0 w-full md:w-auto min-w-[200px]">
            {/* If deal is pending review and it is my turn: Accept / Counteroffer / Decline */}
            {(deal.status === 'sent' || deal.status === 'counteroffered') && isMyTurn && (
              <>
                <Button
                  icon={CheckCircle2}
                  onClick={() => setConfirmAction('accept')}
                  fullWidth
                  className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50"
                >
                  Accept Terms & Agree
                </Button>

                <Button
                  variant="secondary"
                  icon={GitPullRequest}
                  onClick={() => setIsCounterofferOpen(true)}
                  fullWidth
                  className="border-violet-500/40 hover:bg-violet-950/30 text-violet-300"
                >
                  Submit Counteroffer
                </Button>

                <Button
                  variant="danger"
                  icon={XCircle}
                  onClick={() => setConfirmAction('decline')}
                  fullWidth
                >
                  Decline Proposal
                </Button>
              </>
            )}

            {/* If sender wants to withdraw before acceptance */}
            {(deal.status === 'sent' || deal.status === 'counteroffered') &&
              !isMyTurn &&
              isSender && (
                <Button
                  variant="secondary"
                  icon={RotateCcw}
                  onClick={() => setConfirmAction('withdraw')}
                  fullWidth
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Withdraw Offer
                </Button>
              )}

            {/* If deal is accepted -> Brand can start production */}
            {deal.status === 'accepted' && simulatedRole === 'brand' && (
              <Button
                icon={PlayCircle}
                onClick={() => setConfirmAction('start')}
                fullWidth
                className="bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                Start Production
              </Button>
            )}

            {/* If deal is in progress -> Complete deal */}
            {deal.status === 'in_progress' && simulatedRole === 'brand' && (
              <Button
                icon={Award}
                onClick={() => setConfirmAction('complete')}
                fullWidth
                className="bg-teal-600 hover:bg-teal-500 text-white"
              >
                Approve & Complete Deal
              </Button>
            )}

            {/* Direct 1-Click Milestone Payout in INR */}
            {simulatedRole === 'brand' && (deal.status === 'accepted' || deal.status === 'in_progress') && (
              <Button
                icon={Wallet}
                onClick={() => navigate(`/wallet?action=send&recipient=${deal.creator.id}&deal=${deal.id}`)}
                fullWidth
                className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40"
              >
                Pay via INR Wallet (₹)
              </Button>
            )}

            {/* Workspace Chat Integration */}
            <Button
              variant="secondary"
              icon={MessageSquare}
              onClick={() => navigate(`/chat?recipient=${deal.creator.id}&deal=${deal.id}`)}
              fullWidth
              className="border-violet-500/40 text-violet-300 hover:bg-violet-950/30"
            >
              Workspace Chat
            </Button>
          </div>
        </div>

        {/* Next Required Action Banner */}
        <div
          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs ${
            isMyTurn
              ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
              : 'bg-navy-950/80 border-navy-800 text-navy-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isMyTurn ? 'bg-cyan-400 animate-ping' : 'bg-navy-500'
              }`}
            />
            <span className="font-semibold">Next Required Action:</span>
            <span className="font-bold text-white">{deal.nextRequiredAction}</span>
          </div>

          <span className="text-[11px] text-navy-400 font-mono">
            Awaiting: <strong className="text-white capitalize">{deal.awaitingActionFrom}</strong>
          </span>
        </div>

        {/* Participants Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-navy-800">
          {/* Brand Card */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-navy-950/60 border border-navy-800">
            <img
              src={deal.brand.avatarUrl}
              alt={deal.brand.name}
              className="h-11 w-11 rounded-xl object-cover border border-navy-700"
            />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-navy-500">Brand Sponsor</span>
              <h4 className="text-sm font-bold text-white truncate">{deal.brand.name}</h4>
              <p className="text-xs text-navy-400 font-mono">{deal.brand.handle}</p>
            </div>
          </div>

          {/* Creator Card */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-navy-950/60 border border-navy-800">
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                src={deal.creator.avatarUrl}
                alt={deal.creator.name}
                className="h-11 w-11 rounded-xl object-cover border border-violet-500/40"
              />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-violet-400">Target Creator</span>
                <h4 className="text-sm font-bold text-white truncate">{deal.creator.name}</h4>
                <p className="text-xs text-navy-400 font-mono">{deal.creator.handle}</p>
              </div>
            </div>

            <Link
              to={`/creators/${deal.creator.id}`}
              className="px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/30 text-xs font-semibold flex items-center gap-1 shrink-0"
            >
              <span>Profile</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Commercial Terms & Version History (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Version History Selector */}
          <div className="rounded-2xl border border-navy-700/60 bg-navy-900/80 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-navy-800">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-violet-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Negotiation History ({deal.versions.length} {deal.versions.length === 1 ? 'version' : 'versions'})
                </h3>
              </div>
              <span className="text-[11px] text-navy-400">
                Immutable version audit log
              </span>
            </div>

            {/* Version Tabs */}
            <div className="flex flex-wrap gap-2">
              {deal.versions.map((ver, idx) => {
                const isSelected = selectedVersionIndex === idx;
                const isLatest = idx === deal.versions.length - 1;

                return (
                  <button
                    key={ver.versionNumber}
                    onClick={() => setSelectedVersionIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-violet-600 text-white border-violet-500 shadow-md'
                        : 'bg-navy-950 text-navy-400 border-navy-800 hover:text-white'
                    }`}
                  >
                    <span>Version {ver.versionNumber}</span>
                    <span className="text-[10px] font-mono opacity-80">
                      ({ver.proposedByRole})
                    </span>
                    {isLatest && (
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Version Metadata Callout */}
            <div className="p-3 rounded-xl bg-navy-950 border border-navy-850 text-xs text-navy-300 flex items-center justify-between">
              <div>
                Proposed by{' '}
                <strong className="text-white">{currentVersion.proposedByName}</strong> (
                {currentVersion.proposedByRole}) on{' '}
                <span className="text-navy-400">
                  {new Date(currentVersion.proposedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {currentVersion.summaryNotes && (
                <span className="text-[11px] text-violet-300 font-medium">
                  &ldquo;{currentVersion.summaryNotes}&rdquo;
                </span>
              )}
            </div>

            {/* Terms Display / Side-by-Side Comparison */}
            {selectedVersionIndex > 0 && previousVersion ? (
              <div className="space-y-3 pt-2">
                <TermsComparisonView
                  originalTerms={previousVersion.terms}
                  proposedTerms={currentVersion.terms}
                  originalLabel={`Version ${previousVersion.versionNumber} (${previousVersion.proposedByRole})`}
                  proposedLabel={`Version ${currentVersion.versionNumber} (${currentVersion.proposedByRole})`}
                />
              </div>
            ) : (
              /* Single Version Display (v1 baseline) */
              <div className="rounded-xl border border-navy-800 bg-navy-950/60 p-4 space-y-4">
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-navy-900 border border-navy-800">
                    <span className="text-[10px] text-navy-500 uppercase font-semibold flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Budget
                    </span>
                    <div className="text-base font-bold text-cyan-400 font-mono mt-0.5">
                      ${currentVersion.terms.budget.toLocaleString()} {currentVersion.terms.currency}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-navy-900 border border-navy-800">
                    <span className="text-[10px] text-navy-500 uppercase font-semibold flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Deadline
                    </span>
                    <div className="text-xs font-bold text-navy-200 font-mono mt-1">
                      {currentVersion.terms.deadline}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-navy-900 border border-navy-800">
                    <span className="text-[10px] text-navy-500 uppercase font-semibold flex items-center gap-1">
                      <Repeat className="h-3 w-3" /> Revisions
                    </span>
                    <div className="text-xs font-bold text-navy-200 font-mono mt-1">
                      {currentVersion.terms.revisionAllowance === 99
                        ? 'Unlimited'
                        : `${currentVersion.terms.revisionAllowance} rounds`}
                    </div>
                  </div>
                </div>

                {/* Deliverables List */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-navy-400 uppercase tracking-wider block">
                    Deliverables & Requirements
                  </span>
                  <div className="space-y-1.5">
                    {currentVersion.terms.deliverables.map((d, i) => (
                      <div
                        key={d.id || i}
                        className="p-2.5 rounded-xl bg-navy-900 border border-navy-800 text-xs text-navy-200"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">
                            {d.quantity}x {d.title}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-navy-950 text-cyan-300">
                            {d.format}
                          </span>
                        </div>
                        {d.requirements && (
                          <p className="text-[11px] text-navy-400 mt-1">{d.requirements}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Usage Rights */}
                <div className="p-3 rounded-xl bg-navy-900 border border-navy-800 text-xs text-navy-300">
                  <span className="text-[10px] text-navy-500 uppercase font-semibold block mb-1">
                    Usage Rights & Whitelisting
                  </span>
                  <div>
                    Duration:{' '}
                    <strong className="text-white">
                      {currentVersion.terms.usageRights.durationDays === 0
                        ? 'Perpetual'
                        : `${currentVersion.terms.usageRights.durationDays} days`}
                    </strong>{' '}
                    | Paid Ads:{' '}
                    <strong className="text-white">
                      {currentVersion.terms.usageRights.digitalAdsAllowed ? 'Allowed' : 'Organic Only'}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="rounded-2xl border border-navy-700/60 bg-navy-900/80 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Deal Timeline & Activity Trail
            </h3>
            <DealActivityTimeline activities={activities} />
          </div>
        </div>

        {/* Right Column: Negotiation Chat & Private Notes (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <DealMessagesThread
            messages={messages}
            currentRole={simulatedRole}
            currentUserName={
              simulatedRole === 'brand' ? deal.brand.name : deal.creator.name
            }
            currentUserAvatar={
              simulatedRole === 'brand'
                ? deal.brand.avatarUrl
                : deal.creator.avatarUrl
            }
            privateNotes={
              simulatedRole === 'brand'
                ? deal.privateNotesBrand || ''
                : deal.privateNotesCreator || ''
            }
            onSendMessage={(content, isPrivate) => {
              dealService.addMessage(
                deal.id,
                simulatedRole,
                simulatedRole === 'brand' ? deal.brand.name : deal.creator.name,
                content,
                isPrivate,
                simulatedRole === 'brand'
                  ? deal.brand.avatarUrl
                  : deal.creator.avatarUrl
              );
              reloadData();
            }}
            onSavePrivateNotes={(notes) => {
              dealService.updatePrivateNotes(deal.id, simulatedRole, notes);
              reloadData();
            }}
          />
        </div>
      </div>

      {/* Counteroffer Modal */}
      {isCounterofferOpen && (
        <CounterofferModal
          deal={deal}
          currentRole={simulatedRole}
          currentUserName={
            simulatedRole === 'brand' ? deal.brand.name : deal.creator.name
          }
          onClose={() => setIsCounterofferOpen(false)}
          onSubmitCounteroffer={handleCounterofferSubmit}
        />
      )}

      {/* Confirmation Dialogs for Irreversible Actions */}
      {confirmAction && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-navy-900 border border-violet-500/40 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div
              className={`h-12 w-12 rounded-xl flex items-center justify-center mx-auto ${
                confirmAction === 'accept'
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                  : confirmAction === 'decline'
                  ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40'
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
              }`}
            >
              {confirmAction === 'accept' && <CheckCircle2 className="h-6 w-6" />}
              {confirmAction === 'decline' && <XCircle className="h-6 w-6" />}
              {confirmAction === 'withdraw' && <RotateCcw className="h-6 w-6" />}
              {confirmAction === 'start' && <PlayCircle className="h-6 w-6" />}
              {confirmAction === 'complete' && <Award className="h-6 w-6" />}
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-white capitalize">
                {confirmAction === 'accept' && 'Accept Commercial Terms'}
                {confirmAction === 'decline' && 'Decline Proposal'}
                {confirmAction === 'withdraw' && 'Withdraw Proposal'}
                {confirmAction === 'start' && 'Start Project Production'}
                {confirmAction === 'complete' && 'Approve & Complete Deal'}
              </h4>
              <p className="text-xs text-navy-300 leading-relaxed">
                {confirmAction === 'accept' &&
                  `You are about to accept the current terms of $${deal.currentTerms.budget.toLocaleString()}. This action locks agreed terms.`}
                {confirmAction === 'decline' &&
                  'Are you sure you want to decline this proposal? The deal will be closed.'}
                {confirmAction === 'withdraw' &&
                  'Are you sure you want to withdraw this proposal? The counterparty will no longer be able to accept it.'}
                {confirmAction === 'start' &&
                  'Kick off production for this deal and notify creator.'}
                {confirmAction === 'complete' &&
                  'Mark all deliverables verified and close this collaboration deal.'}
              </p>
            </div>

            {(confirmAction === 'decline' || confirmAction === 'withdraw') && (
              <div>
                <label className="block text-[11px] font-semibold text-navy-400 mb-1">
                  Reason (Optional note)
                </label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="e.g. Schedule conflicts, budget constraints..."
                  className="w-full rounded-xl border border-navy-700 bg-navy-950 p-2 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setConfirmAction(null);
                  setActionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                onClick={() => {
                  if (confirmAction === 'accept') handleAccept();
                  if (confirmAction === 'decline') handleDecline();
                  if (confirmAction === 'withdraw') handleWithdraw();
                  if (confirmAction === 'start') handleStart();
                  if (confirmAction === 'complete') handleComplete();
                }}
                className={
                  confirmAction === 'accept'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : confirmAction === 'decline'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-violet-600 hover:bg-violet-500'
                }
              >
                Confirm Action
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
