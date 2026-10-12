import React, { useState } from 'react';
import { Deal, DealRole, DealTerms, DeliverableItem } from '@/types/deal';
import { diffDealTerms } from '@/services/dealService';
import { TermsComparisonView } from './TermsComparisonView';
import {
  X,
  GitPullRequest,
  Plus,
  Trash2,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui';

interface CounterofferModalProps {
  deal: Deal;
  currentRole: DealRole;
  currentUserName: string;
  onClose: () => void;
  onSubmitCounteroffer: (proposedTerms: DealTerms, summaryNotes: string) => void;
}

export const CounterofferModal: React.FC<CounterofferModalProps> = ({
  deal,
  currentRole,
  currentUserName,
  onClose,
  onSubmitCounteroffer,
}) => {
  // Initialize editable state with copies of current terms
  const [budget, setBudget] = useState<number>(deal.currentTerms.budget);
  const [currency, setCurrency] = useState<string>(deal.currentTerms.currency);
  const [startDate, setStartDate] = useState<string>(deal.currentTerms.startDate);
  const [deadline, setDeadline] = useState<string>(deal.currentTerms.deadline);
  const [revisionAllowance, setRevisionAllowance] = useState<number>(
    deal.currentTerms.revisionAllowance
  );
  const [durationDays, setDurationDays] = useState<number>(
    deal.currentTerms.usageRights.durationDays
  );
  const [digitalAdsAllowed, setDigitalAdsAllowed] = useState<boolean>(
    deal.currentTerms.usageRights.digitalAdsAllowed
  );
  const [organicWhitelisting, setOrganicWhitelisting] = useState<boolean>(
    deal.currentTerms.usageRights.organicWhitelisting
  );
  const [notes, setNotes] = useState<string>('');
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>(
    deal.currentTerms.deliverables.map((d) => ({ ...d }))
  );

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Compute proposed terms on the fly
  const proposedTerms: DealTerms = {
    budget,
    currency,
    deliverables,
    startDate,
    deadline,
    revisionAllowance,
    usageRights: {
      durationDays,
      digitalAdsAllowed,
      organicWhitelisting,
      notes: deal.currentTerms.usageRights.notes,
    },
    notes: notes.trim(),
    referenceLinks: deal.currentTerms.referenceLinks,
  };

  const diff = diffDealTerms(deal.currentTerms, proposedTerms);

  const handleAddDeliverable = () => {
    const newId = `del_${Date.now()}`;
    setDeliverables([
      ...deliverables,
      {
        id: newId,
        title: 'Additional Asset',
        format: 'Short Video (9:16)',
        quantity: 1,
        requirements: '',
      },
    ]);
  };

  const handleRemoveDeliverable = (index: number) => {
    if (deliverables.length <= 1) {
      setValidationError('Deal must contain at least one deliverable.');
      return;
    }
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  const handleUpdateDeliverable = (
    index: number,
    field: keyof DeliverableItem,
    value: string | number
  ) => {
    const updated = [...deliverables];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setDeliverables(updated);
  };

  const handleValidateAndReview = () => {
    setValidationError(null);
    if (!budget || budget <= 0) {
      setValidationError('Budget must be a positive number greater than 0.');
      return;
    }
    if (!deadline) {
      setValidationError('Delivery deadline is required.');
      return;
    }
    if (new Date(deadline) <= new Date(startDate)) {
      setValidationError('Deadline must be set after the campaign start date.');
      return;
    }
    if (deliverables.some((d) => !d.title.trim())) {
      setValidationError('All deliverables must have a title specified.');
      return;
    }
    if (!diff.hasChanges) {
      setValidationError(
        'No terms were modified. A counteroffer must adjust at least one commercial term (budget, deadline, deliverables, revisions, or usage rights).'
      );
      return;
    }

    setActiveTab('preview');
  };

  const handleFinalSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      onSubmitCounteroffer(proposedTerms, notes || `Counteroffer submitted by ${currentUserName}`);
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="counteroffer-title"
      className="fixed inset-0 z-50 bg-navy-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-navy-900 border border-violet-500/30 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-navy-800 flex items-center justify-between bg-navy-950/60">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
              <GitPullRequest className="h-5 w-5" />
            </div>
            <div>
              <h3 id="counteroffer-title" className="text-base font-bold text-white">
                Submit Counteroffer — Version {deal.versions.length + 1}
              </h3>
              <p className="text-xs text-navy-400">
                Adjust terms for &ldquo;{deal.title}&rdquo;. Original version will be preserved in negotiation history.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-navy-950 border border-navy-800 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  activeTab === 'editor'
                    ? 'bg-violet-600 text-white'
                    : 'text-navy-400 hover:text-navy-200'
                }`}
              >
                1. Edit Terms
              </button>
              <button
                type="button"
                onClick={handleValidateAndReview}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  activeTab === 'preview'
                    ? 'bg-violet-600 text-white'
                    : 'text-navy-400 hover:text-navy-200'
                }`}
              >
                2. Side-by-Side Review
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-navy-400 hover:text-white p-1 rounded-lg hover:bg-navy-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Validation Alert */}
        {validationError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'editor' ? (
            <div className="space-y-6">
              {/* Diff summary indicator */}
              <div className="p-3 rounded-xl bg-navy-950/70 border border-navy-800 flex items-center justify-between text-xs">
                <span className="text-navy-300">
                  {diff.hasChanges ? (
                    <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Detected modifications: changes will be highlighted to {deal.awaitingActionFrom === 'brand' ? deal.creator.name : deal.brand.name}
                    </span>
                  ) : (
                    <span className="text-navy-400">
                      Edit the fields below to adjust terms (budget, deliverables, dates, revisions, etc.)
                    </span>
                  )}
                </span>
                <span className="font-mono text-navy-400 text-[11px]">
                  Current active: v{deal.activeVersionNumber} → Target: v{deal.versions.length + 1}
                </span>
              </div>

              {/* Section 1: Financial & Timeline Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-300 mb-1.5">
                    Proposed Budget ({currency}) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500 text-xs font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className={`w-full rounded-xl border bg-navy-950 pl-7 pr-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-violet-500 ${
                        diff.budgetChanged ? 'border-amber-500/80 bg-amber-950/20' : 'border-navy-700'
                      }`}
                    />
                  </div>
                  {diff.budgetChanged && (
                    <p className="text-[11px] text-amber-400 mt-1">
                      Original: ${deal.currentTerms.budget.toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-300 mb-1.5">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-navy-700 bg-navy-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-300 mb-1.5">
                    Delivery Deadline *
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className={`w-full rounded-xl border bg-navy-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 font-mono ${
                      diff.deadlineChanged ? 'border-amber-500/80 bg-amber-950/20' : 'border-navy-700'
                    }`}
                  />
                  {diff.deadlineChanged && (
                    <p className="text-[11px] text-amber-400 mt-1">
                      Original: {deal.currentTerms.deadline}
                    </p>
                  )}
                </div>
              </div>

              {/* Section 2: Deliverables */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-navy-200 uppercase tracking-wider">
                      Deliverables List
                    </h4>
                    <p className="text-[11px] text-navy-400">
                      Add, remove, or modify items required for this campaign.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    icon={Plus}
                    onClick={handleAddDeliverable}
                  >
                    Add Deliverable
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {deliverables.map((d, index) => (
                    <div
                      key={d.id || index}
                      className="p-3.5 rounded-xl border border-navy-800 bg-navy-950/80 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          value={d.title}
                          onChange={(e) =>
                            handleUpdateDeliverable(index, 'title', e.target.value)
                          }
                          placeholder="e.g. Dedicated YouTube Review"
                          className="w-full rounded-lg border border-navy-700 bg-navy-900 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <select
                          value={d.format}
                          onChange={(e) =>
                            handleUpdateDeliverable(index, 'format', e.target.value)
                          }
                          className="w-full rounded-lg border border-navy-700 bg-navy-900 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                        >
                          <option value="Reel">Instagram Reel (9:16)</option>
                          <option value="4K AI Video">4K Cinematic Video</option>
                          <option value="Dedicated Video">Dedicated Long-form Video</option>
                          <option value="UGC Short">UGC Short / TikTok</option>
                          <option value="Carousel Post">Carousel Post (4:5)</option>
                          <option value="AI Image (1:1 & 4:5)">AI Image Pack</option>
                          <option value="Story Pack">Story Pack (3 slides)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-navy-400">Qty:</span>
                          <input
                            type="number"
                            min="1"
                            value={d.quantity}
                            onChange={(e) =>
                              handleUpdateDeliverable(
                                index,
                                'quantity',
                                Math.max(1, Number(e.target.value))
                              )
                            }
                            className="w-14 rounded-lg border border-navy-700 bg-navy-900 px-2 py-1.5 text-xs font-mono text-center text-white focus:outline-none focus:border-violet-500"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveDeliverable(index)}
                          className="text-navy-500 hover:text-rose-400 p-1.5 rounded transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Revisions & Usage Rights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-navy-800">
                <div>
                  <label className="block text-xs font-semibold text-navy-300 mb-1.5">
                    Revision Allowance
                  </label>
                  <select
                    value={revisionAllowance}
                    onChange={(e) => setRevisionAllowance(Number(e.target.value))}
                    className="w-full rounded-xl border border-navy-700 bg-navy-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value={1}>1 Revision Cycle</option>
                    <option value={2}>2 Revision Cycles (Standard)</option>
                    <option value={3}>3 Revision Cycles</option>
                    <option value={99}>Unlimited Minor Revisions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-300 mb-1.5">
                    Usage Rights Duration
                  </label>
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full rounded-xl border border-navy-700 bg-navy-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value={30}>30 Days (Digital)</option>
                    <option value={90}>90 Days (Quarterly Campaign)</option>
                    <option value={180}>180 Days (6 Months)</option>
                    <option value={365}>365 Days (1 Year)</option>
                    <option value={0}>Perpetual Rights</option>
                  </select>
                </div>
              </div>

              {/* Section 4: Counteroffer Rationale / Notes */}
              <div>
                <label className="block text-xs font-semibold text-navy-300 mb-1.5">
                  Reasoning & Negotiation Notes (Visible to Counterparty)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Explain why you are adjusting the budget, timeline, or deliverable scope (e.g. 'Added sound design & upscaling requirements', 'Extended deadline to accommodate render schedules')..."
                  className="w-full rounded-xl border border-navy-700 bg-navy-950 p-3 text-xs text-white focus:outline-none focus:border-violet-500 leading-relaxed"
                />
              </div>
            </div>
          ) : (
            /* Side-by-Side Review Tab */
            <div className="space-y-4">
              <TermsComparisonView
                originalTerms={deal.currentTerms}
                proposedTerms={proposedTerms}
                originalLabel={`Current Active Offer (v${deal.activeVersionNumber})`}
                proposedLabel={`Your Proposed Counteroffer (v${deal.versions.length + 1})`}
                diff={diff}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-navy-800 bg-navy-950/80 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          <div className="flex items-center gap-2.5">
            {activeTab === 'editor' ? (
              <Button size="sm" onClick={handleValidateAndReview}>
                Review Changes Side-by-Side →
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab('editor')}
                  disabled={isSubmitting}
                >
                  ← Back to Editor
                </Button>
                <Button
                  size="sm"
                  icon={GitPullRequest}
                  onClick={() => setShowConfirm(true)}
                  disabled={!diff.hasChanges || isSubmitting}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
                >
                  Submit Counteroffer
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4"
        >
          <div className="bg-navy-900 border border-violet-500/40 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="h-12 w-12 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400 mx-auto">
              <GitPullRequest className="h-6 w-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-white">Confirm Counteroffer Submission</h4>
              <p className="text-xs text-navy-300 leading-relaxed">
                This will increment the deal to <strong className="text-white">Version {deal.versions.length + 1}</strong> with proposed budget of <strong className="text-cyan-400">${budget.toLocaleString()}</strong> and transfer decision control to {deal.awaitingActionFrom === 'brand' ? deal.creator.name : deal.brand.name}.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
              >
                Go Back
              </Button>
              <Button
                fullWidth
                onClick={handleFinalSubmit}
                loading={isSubmitting}
                className="bg-violet-600 hover:bg-violet-500"
              >
                Confirm & Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
