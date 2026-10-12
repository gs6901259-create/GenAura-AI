import React, { useState } from 'react';
import {
  CollaborationProject,
  DeclineCategory,
} from '@/contracts/collaborationContract';
import { CreatorProfile } from '@/contracts/discoveryContract';
import { CampaignBrief } from '@/contracts/briefContract';
import { StatusBadge } from '@/components/collaboration/common/StatusBadge';
import { storageService } from '@/services/storageService';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  Calendar,
  Clock,
  Sparkles,
  MessageSquare,
  Shield,
  Send,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

interface CreatorPortalViewProps {
  creators: CreatorProfile[];
  briefs: CampaignBrief[];
  projects: CollaborationProject[];
  viewingCreatorId: string;
  onViewingCreatorChange: (id: string) => void;
  onRefresh: () => void;
}

export const CreatorPortalView: React.FC<CreatorPortalViewProps> = ({
  creators,
  briefs,
  projects,
  viewingCreatorId,
  onViewingCreatorChange,
  onRefresh,
}) => {
  const currentCreator =
    creators.find((c) => c.id === viewingCreatorId) || creators[0];

  const briefMap = new Map(briefs.map((b) => [b.id, b]));

  // Projects relevant to this creator
  const creatorProjects = projects.filter(
    (p) => p.creatorId === currentCreator?.id
  );

  const pendingOffers = creatorProjects.filter((p) => p.status === 'sent');
  const activeCollaborations = creatorProjects.filter((p) =>
    ['accepted', 'in_progress', 'submitted', 'revision_requested'].includes(p.status)
  );
  const completedOrDeclined = creatorProjects.filter((p) =>
    ['completed', 'declined', 'cancelled'].includes(p.status)
  );

  // Modal states for Accept and Decline actions
  const [acceptModalProject, setAcceptModalProject] = useState<CollaborationProject | null>(null);
  const [acceptNote, setAcceptNote] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [declineModalProject, setDeclineModalProject] = useState<CollaborationProject | null>(null);
  const [declineCategory, setDeclineCategory] = useState<DeclineCategory>('schedule_conflict');
  const [declineNote, setDeclineNote] = useState('');

  // Draft URL submission state for in-progress deliverables
  const [submittingDelivId, setSubmittingDelivId] = useState<string | null>(null);
  const [draftUrlInput, setDraftUrlInput] = useState('');

  // Handle Accept Action
  const handleConfirmAccept = () => {
    if (!acceptModalProject || !currentCreator) return;

    const note =
      acceptNote.trim() ||
      'Accepted collaboration proposal! Excited to partner on this campaign.';

    const res = storageService.updateStatus(
      acceptModalProject.id,
      'accepted',
      'creator',
      currentCreator.name,
      note
    );

    if (res.success) {
      // Auto-transition to in_progress to activate deliverable work
      storageService.updateStatus(
        acceptModalProject.id,
        'in_progress',
        'system',
        'Workflow Automation',
        'Project moved to In Progress upon creator agreement signoff.'
      );
    }

    setAcceptModalProject(null);
    setAcceptNote('');
    onRefresh();
  };

  // Handle Decline Action
  const handleConfirmDecline = () => {
    if (!declineModalProject || !currentCreator) return;

    const note =
      declineNote.trim() ||
      `Declined with reason: ${declineCategory.replace('_', ' ')}`;

    storageService.updateStatus(
      declineModalProject.id,
      'declined',
      'creator',
      currentCreator.name,
      note,
      {
        category: declineCategory,
        note: declineNote,
      }
    );

    setDeclineModalProject(null);
    setDeclineNote('');
    onRefresh();
  };

  // Submit Draft URL
  const handleSubmitDraftUrl = (projectId: string, deliverableId: string) => {
    if (!draftUrlInput.trim()) return;

    storageService.updateDeliverable(projectId, deliverableId, {
      status: 'submitted',
      draftUrl: draftUrlInput.trim(),
      submittedAt: new Date().toISOString(),
    });

    storageService.updateStatus(
      projectId,
      'submitted',
      'creator',
      currentCreator?.name || 'Creator',
      `Submitted content preview link: ${draftUrlInput.trim()}`
    );

    setSubmittingDelivId(null);
    setDraftUrlInput('');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Simulation Banner & Creator Profile Switcher */}
      <div className="flex flex-col gap-4 rounded-2xl border border-emerald-800/80 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-purple-950/40 p-6 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <img
            src={currentCreator?.avatarUrl}
            alt={currentCreator?.name}
            className="h-14 w-14 rounded-full object-cover ring-2 ring-emerald-500 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-700 uppercase">
                Creator Portal Simulation Mode
              </span>
              <span className="text-xs text-slate-400">
                Viewing as <span className="font-bold text-white">{currentCreator?.name}</span>
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
              Creator Collaboration Hub
            </h2>
            <p className="text-xs text-slate-300">
              Review brief-linked invitations, accept terms, decline with feedback, and submit content previews.
            </p>
          </div>
        </div>

        {/* Creator Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Simulate Profile:</span>
          <select
            value={viewingCreatorId}
            onChange={(e) => onViewingCreatorChange(e.target.value)}
            className="rounded-xl border border-emerald-700/80 bg-slate-950 px-3 py-2 text-xs font-semibold text-emerald-200 focus:border-emerald-500 focus:outline-none"
          >
            {creators.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.handle})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION 1: PENDING INVITATIONS (ACCEPT / DECLINE ACTIONS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-amber-950 p-1.5 text-amber-400 border border-amber-800">
              <Clock className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Pending Collaboration Requests ({pendingOffers.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Action required: Review brief and Accept or Decline
          </span>
        </div>

        {pendingOffers.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-400">
            No pending collaboration requests for {currentCreator?.name}. Switch creator profile above to test incoming invitations (e.g., Marcus Vance).
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {pendingOffers.map((p) => {
              const brief = briefMap.get(p.briefId);

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-amber-800/80 bg-slate-900/90 p-6 shadow-xl transition-all space-y-5"
                >
                  {/* Top Bar: Brand & Brief */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-purple-950/80 border border-purple-800 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                          {brief?.brandName || 'Brand Sponsor'}
                        </span>
                        <StatusBadge status={p.status} size="sm" />
                      </div>
                      <h4 className="mt-1.5 text-base font-bold text-white">
                        {p.title}
                      </h4>
                      {brief && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Linked Brief: <span className="font-semibold text-slate-200">{brief.title}</span>
                        </p>
                      )}
                    </div>

                    <div className="text-right sm:border-l sm:border-slate-800 sm:pl-5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Proposed Compensation
                      </span>
                      <div className="text-2xl font-bold text-emerald-400">
                        ${p.compensation.amount.toLocaleString()}{' '}
                        <span className="text-xs font-normal text-slate-400">
                          {p.compensation.currency}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 capitalize">
                        {p.compensation.type} payment
                      </div>
                    </div>
                  </div>

                  {/* Brand Personal Note */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
                    <span className="text-[11px] font-semibold text-purple-400 flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" /> Note from Brand Campaign Manager:
                    </span>
                    <p className="text-xs text-slate-300 italic leading-relaxed">
                      "{p.personalizedMessage}"
                    </p>
                  </div>

                  {/* Campaign Objectives & Scope */}
                  {brief && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs text-slate-300 space-y-1">
                      <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
                        Campaign Goal & Key Messages
                      </span>
                      <p className="text-xs text-slate-300">
                        {brief.objectives}
                      </p>
                    </div>
                  )}

                  {/* Requested Deliverables List */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Requested Deliverables ({p.deliverables.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {p.deliverables.map((deliv) => (
                        <div
                          key={deliv.id}
                          className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{deliv.title}</span>
                            <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-purple-300 capitalize">
                              {deliv.platform}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{deliv.description}</p>
                          <div className="text-[10px] text-slate-500 pt-1">
                            Draft Deadline: {new Date(deliv.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Usage Terms */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                    <div>
                      Usage Duration: <span className="text-slate-200 font-semibold">{p.usageRights.durationDays} days</span> | Digital Ads Whitelisting: <span className="text-slate-200 font-semibold">{p.usageRights.digitalAdsAllowed ? 'Included' : 'Organic Only'}</span>
                    </div>
                    <div>
                      Target Draft: <span className="text-slate-200 font-semibold">{new Date(p.targetDraftDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* ACTION BUTTONS: ACCEPT / DECLINE */}
                  <div className="flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-800/80 pt-4">
                    <button
                      onClick={() => setDeclineModalProject(p)}
                      className="flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-rose-800/80 bg-rose-950/40 px-5 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-900/60 transition-colors shadow-sm"
                    >
                      <XCircle className="h-4 w-4" />
                      Decline Request
                    </button>

                    <button
                      onClick={() => setAcceptModalProject(p)}
                      className="flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-95"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Accept Brief & Terms
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: ACTIVE COLLABORATIONS & DRAFT SUBMISSION */}
      <div className="space-y-4 pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-blue-950 p-1.5 text-blue-400 border border-blue-800">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Active Collaborations in Production ({activeCollaborations.length})
          </h3>
        </div>

        {activeCollaborations.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center text-xs text-slate-400">
            No active collaborations in progress for this creator.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {activeCollaborations.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{p.title}</h4>
                      <StatusBadge status={p.status} size="sm" />
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Fee: ${p.compensation.amount.toLocaleString()} | Target Publish: {new Date(p.targetPublishDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Deliverables checklist */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400">
                    Deliverables Progress:
                  </div>
                  {p.deliverables.map((deliv) => (
                    <div
                      key={deliv.id}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{deliv.title}</span>
                          <span className="rounded-md bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300 capitalize font-mono">
                            {deliv.platform}
                          </span>
                        </div>
                        {deliv.draftUrl && (
                          <div className="text-[11px] text-purple-400 font-mono mt-0.5">
                            Draft URL: {deliv.draftUrl}
                          </div>
                        )}
                        {deliv.feedback && (
                          <div className="text-[11px] text-orange-300 mt-1 italic">
                            Brand Feedback: "{deliv.feedback}"
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                            deliv.status === 'approved'
                              ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                              : deliv.status === 'submitted'
                              ? 'bg-purple-950 border-purple-700 text-purple-300'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          {deliv.status}
                        </span>

                        {deliv.status !== 'approved' && (
                          <button
                            onClick={() => {
                              setSubmittingDelivId(deliv.id);
                              setDraftUrlInput(
                                deliv.draftUrl || `https://creator-preview.genaura.ai/v/${currentCreator?.handle.replace('@', '')}/draft_1`
                              );
                            }}
                            className="rounded-lg bg-purple-950/80 border border-purple-800 px-2.5 py-1 text-[11px] font-semibold text-purple-300 hover:bg-purple-900 transition-colors"
                          >
                            Submit Draft Link
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input area if submitting link */}
                {submittingDelivId && p.deliverables.some((d) => d.id === submittingDelivId) && (
                  <div className="rounded-xl border border-purple-800 bg-purple-950/40 p-3 space-y-2 animate-in fade-in">
                    <span className="text-xs font-semibold text-purple-300">
                      Submit Draft Review URL for Deliverable:
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={draftUrlInput}
                        onChange={(e) => setDraftUrlInput(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 rounded-lg border border-purple-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                      />
                      <button
                        onClick={() => handleSubmitDraftUrl(p.id, submittingDelivId)}
                        className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-500"
                      >
                        Send to Brand
                      </button>
                      <button
                        onClick={() => setSubmittingDelivId(null)}
                        className="text-xs text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: ACCEPT CONFIRMATION MODAL */}
      {acceptModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-emerald-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Accept Collaboration Agreement
                </h3>
              </div>
              <button
                onClick={() => setAcceptModalProject(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              <p>
                You are officially accepting the proposal for{' '}
                <span className="font-bold text-white">
                  "{acceptModalProject.title}"
                </span>.
              </p>
              <div className="rounded-xl bg-slate-950 p-3 text-xs space-y-1 border border-slate-800">
                <div>
                  Agreed Fee:{' '}
                  <span className="font-bold text-emerald-400">
                    ${acceptModalProject.compensation.amount.toLocaleString()} {acceptModalProject.compensation.currency}
                  </span>
                </div>
                <div>
                  Deliverables:{' '}
                  <span className="font-semibold text-white">
                    {acceptModalProject.deliverables.length} Items
                  </span>
                </div>
                <div>
                  Draft Deadline:{' '}
                  <span className="font-semibold text-white">
                    {new Date(acceptModalProject.targetDraftDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Optional Creator Acceptance Note:
              </label>
              <textarea
                value={acceptNote}
                onChange={(e) => setAcceptNote(e.target.value)}
                rows={2}
                placeholder="e.g. Terms look good, I will have the rough cut ready by next week!"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>I agree to campaign brief guidelines and usage terms.</span>
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setAcceptModalProject(null)}
                className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                disabled={!agreeTerms}
                onClick={handleConfirmAccept}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-lg hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
              >
                Confirm & Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DECLINE MODAL WITH CATEGORY & REASON */}
      {declineModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-rose-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">
                  Decline Collaboration Proposal
                </h3>
              </div>
              <button
                onClick={() => setDeclineModalProject(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Please choose a reason for declining{' '}
              <span className="font-bold text-white">
                "{declineModalProject.title}"
              </span>. This assists the brand with future offer calibration.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Decline Reason Category
              </label>
              <select
                value={declineCategory}
                onChange={(e) => setDeclineCategory(e.target.value as DeclineCategory)}
                className="w-full rounded-xl border border-rose-800/80 bg-slate-950 p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="schedule_conflict">Schedule / Timeline Conflict</option>
                <option value="rate_mismatch">Rate Below Standard / Budget Mismatch</option>
                <option value="brand_mismatch">Brand or Product Audience Mismatch</option>
                <option value="exclusivity_conflict">Exclusivity Conflict with Existing Sponsor</option>
                <option value="creative_differences">Creative Direction Incompatibility</option>
                <option value="other">Other / Personal Availability</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Optional Feedback to Brand Manager:
              </label>
              <textarea
                value={declineNote}
                onChange={(e) => setDeclineNote(e.target.value)}
                rows={3}
                placeholder="e.g. Currently booked for Q4, would love to reconsider in Q1 2027!"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setDeclineModalProject(null)}
                className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Keep Proposal Open
              </button>
              <button
                onClick={handleConfirmDecline}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-lg hover:bg-rose-500 transition-colors"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


