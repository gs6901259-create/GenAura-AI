import React, { useState } from 'react';
import {
  CollaborationProject,
  CollaborationStatus,
  ProjectDeliverable,
} from '@/contracts/collaborationContract';
import { CreatorProfile } from '@/contracts/discoveryContract';
import { CampaignBrief } from '@/contracts/briefContract';
import { StatusBadge } from '@/components/collaboration/common/StatusBadge';
import {
  canTransition,
  getAvailableTransitions,
  STATUS_METADATA,
} from '@/utils/statusTransitions';
import { storageService } from '@/services/storageService';
import {
  X,
  Calendar,
  DollarSign,
  Video,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  MessageSquare,
  History,
  Send,
  User,
} from 'lucide-react';

interface ProjectDetailModalProps {
  project: CollaborationProject;
  creators: CreatorProfile[];
  briefs: CampaignBrief[];
  onClose: () => void;
  onRefresh: () => void;
  onSimulateCreatorView: (creatorId: string) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  creators,
  briefs,
  onClose,
  onRefresh,
  onSimulateCreatorView,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'deliverables' | 'audit'>('overview');
  const [revisionNote, setRevisionNote] = useState('');
  const [isRevisionInputOpen, setIsRevisionInputOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const creator = creators.find((c) => c.id === project.creatorId);
  const brief = briefs.find((b) => b.id === project.briefId);

  // Status transition handler
  const handleTransition = (
    target: CollaborationStatus,
    note?: string
  ) => {
    setActionError(null);
    const defaultNote =
      note || `Brand manager updated project status to ${STATUS_METADATA[target].label}.`;

    const res = storageService.updateStatus(
      project.id,
      target,
      'brand',
      'Brand Campaign Manager',
      defaultNote
    );

    if (!res.success) {
      setActionError(res.error || 'Failed to update status');
    } else {
      onRefresh();
    }
  };

  // Deliverable status update
  const handleDeliverableStatus = (
    delivId: string,
    status: ProjectDeliverable['status'],
    feedback?: string
  ) => {
    storageService.updateDeliverable(project.id, delivId, {
      status,
      feedback,
      approvedAt: status === 'approved' ? new Date().toISOString() : undefined,
    });
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <img
              src={creator?.avatarUrl}
              alt={creator?.name}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-purple-500/40"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {project.title}
                </h3>
                <StatusBadge status={project.status} size="sm" />
              </div>
              <p className="text-xs text-slate-400">
                Partner: <span className="font-medium text-slate-200">{creator?.name}</span> ({creator?.handle})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`border-b-2 py-3 transition-colors ${
              activeTab === 'overview'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview & Contract
          </button>
          <button
            onClick={() => setActiveTab('deliverables')}
            className={`flex items-center gap-1.5 border-b-2 py-3 transition-colors ${
              activeTab === 'deliverables'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Deliverables Tracker
            <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300">
              {project.deliverables.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 border-b-2 py-3 transition-colors ${
              activeTab === 'audit'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            Audit Trail ({project.statusHistory.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {actionError && (
            <div className="rounded-xl border border-rose-800 bg-rose-950/50 p-3 text-xs text-rose-300">
              {actionError}
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Decline Reason Banner if declined */}
              {project.status === 'declined' && project.declineReason && (
                <div className="rounded-2xl border border-rose-800/80 bg-rose-950/40 p-4">
                  <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                    Creator Declined Invitation
                  </div>
                  <div className="mt-2 text-xs text-rose-200/90">
                    <span className="font-semibold">Reason Category:</span>{' '}
                    <span className="capitalize">{project.declineReason.category.replace('_', ' ')}</span>
                  </div>
                  {project.declineReason.note && (
                    <p className="mt-1 text-xs text-rose-300/80 italic">
                      "{project.declineReason.note}"
                    </p>
                  )}
                  <div className="mt-3">
                    <button
                      onClick={() => handleTransition('sent', 'Re-sent updated proposal to creator after addressing feedback.')}
                      className="rounded-lg bg-rose-900/60 border border-rose-700 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-800 transition-colors"
                    >
                      Re-Invite Creator with Adjusted Terms
                    </button>
                  </div>
                </div>
              )}

              {/* Creator Pending Simulator Banner if sent */}
              {project.status === 'sent' && (
                <div className="flex items-center justify-between rounded-2xl border border-amber-800/70 bg-amber-950/30 p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-amber-400 animate-pulse" />
                    <div>
                      <div className="text-xs font-semibold text-amber-300">
                        Proposal Dispatched — Awaiting Creator Decision
                      </div>
                      <p className="text-[11px] text-amber-400/80">
                        Sarah Jenkins has received the brief and can Accept or Decline.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onSimulateCreatorView(project.creatorId)}
                    className="rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-amber-500 transition-all"
                  >
                    Switch to Creator POV & Decide
                  </button>
                </div>
              )}

              {/* Grid: Brief + Creator */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Linked Campaign Brief Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                      Linked Campaign Brief
                    </span>
                    <span className="rounded-full bg-purple-950/80 px-2 py-0.5 text-[10px] text-purple-300 border border-purple-800/60">
                      BriefGen Contract
                    </span>
                  </div>
                  {brief ? (
                    <div>
                      <h4 className="text-sm font-bold text-white">{brief.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {brief.objectives}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-[11px] border-t border-slate-800/80 pt-2 text-slate-400">
                        <span>Brand: {brief.brandName}</span>
                        <span>Total Budget: ${brief.budgetTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Brief not found</p>
                  )}
                </div>

                {/* Creator Profile Summary */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                      Creator Discovery Fit
                    </span>
                    <span className="rounded-full bg-indigo-950/80 px-2 py-0.5 text-[10px] text-indigo-300 border border-indigo-800/60">
                      Discovery Score: {creator?.contentQualityScore || 95}%
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <img
                      src={creator?.avatarUrl}
                      alt={creator?.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{creator?.name}</div>
                      <div className="text-[11px] text-slate-400">{creator?.bio}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {creator?.niche.map((n) => (
                      <span
                        key={n}
                        className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Compensation & Usage Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4.5 space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Compensation & Payment
                  </span>
                  <div className="text-xl font-bold text-emerald-400">
                    ${project.compensation.amount.toLocaleString()}{' '}
                    <span className="text-xs text-slate-400 font-normal">
                      {project.compensation.currency} ({project.compensation.type})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Terms: {project.compensation.paymentTerms}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4.5 space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Usage Rights & Exclusivity
                  </span>
                  <div className="text-xs text-slate-300 space-y-1">
                    <div>
                      Duration: <span className="font-semibold text-white">{project.usageRights.durationDays} days</span>
                    </div>
                    <div>
                      Digital Ads Usage:{' '}
                      <span className="font-semibold text-white">
                        {project.usageRights.digitalAdsAllowed ? 'Included' : 'Organic Only'}
                      </span>
                    </div>
                    {project.usageRights.exclusivityCategory && (
                      <div>
                        Exclusivity Category:{' '}
                        <span className="font-semibold text-purple-300">
                          {project.usageRights.exclusivityCategory}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Personalized Note */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 space-y-1.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
                  Personalized Pitch to Creator
                </span>
                <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  "{project.personalizedMessage}"
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: DELIVERABLES */}
          {activeTab === 'deliverables' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Manage and verify individual campaign content items.</span>
                <span className="font-semibold text-slate-300">
                  {project.deliverables.filter((d) => d.status === 'approved').length} of{' '}
                  {project.deliverables.length} Approved
                </span>
              </div>

              {project.deliverables.map((deliv) => (
                <div
                  key={deliv.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-purple-950/70 border border-purple-800 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-300">
                          {deliv.platform}
                        </span>
                        <h4 className="text-xs font-bold text-white">
                          {deliv.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {deliv.description}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                        deliv.status === 'approved'
                          ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                          : deliv.status === 'submitted'
                          ? 'bg-purple-950 border-purple-700 text-purple-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {deliv.status}
                    </span>
                  </div>

                  {deliv.draftUrl && (
                    <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400">Draft preview:</span>
                      <a
                        href={deliv.draftUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                      >
                        {deliv.draftUrl} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {deliv.liveUrl && (
                    <div className="flex items-center gap-2 text-xs text-slate-300 bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-800/60">
                      <span className="text-emerald-400 font-medium">Verified Live URL:</span>
                      <a
                        href={deliv.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-300 hover:underline flex items-center gap-1 font-mono text-[11px]"
                      >
                        {deliv.liveUrl} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {/* Brand Action Buttons for deliverable */}
                  <div className="flex flex-wrap items-center justify-between border-t border-slate-800/80 pt-2.5 gap-2">
                    <span className="text-[11px] text-slate-500">
                      Due: {new Date(deliv.dueDate).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      {deliv.status !== 'approved' && (
                        <button
                          onClick={() => handleDeliverableStatus(deliv.id, 'approved')}
                          className="flex items-center gap-1 rounded-lg bg-emerald-950/70 border border-emerald-800 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-900 transition-colors"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Approve Deliverable
                        </button>
                      )}

                      {deliv.status === 'submitted' && (
                        <button
                          onClick={() =>
                            handleDeliverableStatus(
                              deliv.id,
                              'revision',
                              'Please adjust intro hook and highlight dashboard.'
                            )
                          }
                          className="rounded-lg bg-orange-950/70 border border-orange-800 px-2.5 py-1 text-[11px] font-semibold text-orange-300 hover:bg-orange-900 transition-colors"
                        >
                          Request Revision
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Immutable chronological log of all collaboration lifecycle transitions.
              </div>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {project.statusHistory.map((log) => (
                  <div key={log.id} className="relative group">
                    <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-slate-900 bg-purple-500" />
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {log.actorName}
                          </span>
                          <span className="rounded-md bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-400 uppercase">
                            {log.actorRole}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                        {log.fromStatus && (
                          <>
                            <span className="text-slate-400">{STATUS_METADATA[log.fromStatus].label}</span>
                            <span>→</span>
                          </>
                        )}
                        <span className="text-purple-300">{STATUS_METADATA[log.toStatus].label}</span>
                      </div>
                      {log.note && (
                        <p className="text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                          {log.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Brand Action Toolbar */}
        <div className="border-t border-slate-800 bg-slate-950/90 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Current Status: <StatusBadge status={project.status} size="sm" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* If In Progress, can advance to submitted or complete */}
            {project.status === 'in_progress' && (
              <button
                onClick={() =>
                  handleTransition(
                    'submitted',
                    'Content deliverables received from creator and submitted for team review.'
                  )
                }
                className="rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-purple-500 transition-colors"
              >
                Mark Content as Submitted
              </button>
            )}

            {/* If Submitted, Brand can Approve & Complete or Request Revision */}
            {project.status === 'submitted' && (
              <>
                <button
                  onClick={() => setIsRevisionInputOpen(!isRevisionInputOpen)}
                  className="rounded-xl bg-orange-950/80 border border-orange-800 px-3.5 py-2 text-xs font-semibold text-orange-300 hover:bg-orange-900 transition-colors"
                >
                  Request Revision
                </button>
                <button
                  onClick={() =>
                    handleTransition(
                      'completed',
                      'All deliverables verified and approved. Collaboration successfully finalized.'
                    )
                  }
                  className="rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-teal-500 transition-colors"
                >
                  Approve Deliverables & Complete Project
                </button>
              </>
            )}

            {/* If Draft, Brand can Send */}
            {project.status === 'draft' && (
              <button
                onClick={() =>
                  handleTransition(
                    'sent',
                    `Dispatched formal collaboration proposal to ${creator?.name}.`
                  )
                }
                className="rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-purple-500 transition-colors"
              >
                Dispatch Proposal to Creator
              </button>
            )}

            {/* Cancel Button if active */}
            {['draft', 'sent', 'accepted', 'in_progress'].includes(project.status) && (
              <button
                onClick={() =>
                  handleTransition(
                    'cancelled',
                    'Collaboration cancelled by brand manager.'
                  )
                }
                className="rounded-xl border border-slate-800 px-3.5 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              >
                Cancel Project
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Revision note drawer */}
        {isRevisionInputOpen && (
          <div className="border-t border-orange-900/60 bg-orange-950/40 p-4 space-y-2 animate-in slide-in-from-bottom-2">
            <div className="text-xs font-semibold text-orange-300">
              Provide revision feedback for creator:
            </div>
            <textarea
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="e.g. Please update the video intro to include the live dashboard URL around minute 1..."
              className="w-full rounded-xl border border-orange-800/80 bg-slate-950 p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsRevisionInputOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleTransition(
                    'revision_requested',
                    revisionNote || 'Brand requested revisions on submitted deliverables.'
                  );
                  setIsRevisionInputOpen(false);
                }}
                className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-500"
              >
                Submit Revision Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


