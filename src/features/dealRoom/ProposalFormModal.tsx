import React, { useState } from 'react';
import { Deal, DealTerms, DeliverableItem } from '@/types/deal';
import { Creator, CreativeBrief } from '@/types';
import { validateProposalTerms } from '@/services/dealService';
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  DollarSign,
  Calendar,
  Layers,
  Repeat,
  ShieldCheck,
  Send,
  Save,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui';

interface ProposalFormModalProps {
  creators: Creator[];
  briefs: CreativeBrief[];
  preselectedCreator?: Creator | null;
  preselectedBrief?: CreativeBrief | null;
  onClose: () => void;
  onSubmit: (params: {
    title: string;
    campaignObjective: string;
    creator: Creator;
    brief?: CreativeBrief;
    terms: DealTerms;
    asDraft: boolean;
  }) => void;
}

export const ProposalFormModal: React.FC<ProposalFormModalProps> = ({
  creators,
  briefs,
  preselectedCreator,
  preselectedBrief,
  onClose,
  onSubmit,
}) => {
  // Step 1: Basics
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>(
    preselectedCreator?.id || (creators[0]?.id as string) || ''
  );
  const [selectedBriefId, setSelectedBriefId] = useState<string>(
    preselectedBrief?.id || ''
  );
  const [title, setTitle] = useState(
    preselectedBrief ? `${preselectedBrief.title} — Collaboration` : ''
  );
  const [campaignObjective, setCampaignObjective] = useState(
    preselectedBrief?.description || ''
  );

  // Step 2: Commercial Terms
  const [budget, setBudget] = useState<number>(1500);
  const [currency, setCurrency] = useState('USD');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0]
  );
  const [revisionAllowance, setRevisionAllowance] = useState<number>(2);
  const [durationDays, setDurationDays] = useState<number>(90);
  const [digitalAdsAllowed, setDigitalAdsAllowed] = useState(true);
  const [organicWhitelisting, setOrganicWhitelisting] = useState(true);
  const [notes, setNotes] = useState('');
  const [referenceLinksStr, setReferenceLinksStr] = useState('');

  // Deliverables
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>([
    {
      id: 'del_init_1',
      title: 'Dedicated Campaign Feature',
      format: '4K AI Video',
      quantity: 1,
      requirements: 'High-res creative export with sound design',
    },
    {
      id: 'del_init_2',
      title: 'Short-Form Hook Snippets',
      format: 'Reel',
      quantity: 2,
      requirements: 'Vertical 9:16 optimized for Instagram & TikTok',
    },
  ]);

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCreator = creators.find((c) => (c.id as string) === selectedCreatorId);
  const selectedBrief = briefs.find((b) => (b.id as string) === selectedBriefId);

  // Deliverable modifiers
  const handleAddDeliverable = () => {
    setDeliverables([
      ...deliverables,
      {
        id: `del_${Date.now()}`,
        title: 'Social Asset',
        format: 'Reel',
        quantity: 1,
        requirements: '',
      },
    ]);
  };

  const handleRemoveDeliverable = (index: number) => {
    if (deliverables.length <= 1) {
      setFieldErrors({ deliverables: 'Proposal must include at least one deliverable' });
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
    updated[index] = { ...updated[index], [field]: value };
    setDeliverables(updated);
  };

  const validateCurrentStep = (): boolean => {
    const currentTerms: DealTerms = {
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
      },
      notes,
    };

    const res = validateProposalTerms(title, campaignObjective, currentTerms);
    setFieldErrors(res.errors);

    if (step === 1) {
      if (!title.trim() || !campaignObjective.trim()) return false;
      return true;
    }
    if (step === 2) {
      if (!budget || budget <= 0 || !deadline || !startDate) return false;
      if (new Date(deadline) <= new Date(startDate)) return false;
      if (deliverables.some((d) => !d.title.trim() || d.quantity <= 0)) return false;
      return true;
    }
    return res.isValid;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setStep((prev) => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : prev));
  };

  const handleBack = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : prev));
  };

  const handleFinalSubmit = (asDraft: boolean) => {
    if (!validateCurrentStep() || !selectedCreator || isSubmitting) return;

    setIsSubmitting(true);
    const links = referenceLinksStr
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('http'));

    const terms: DealTerms = {
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
      },
      notes: notes.trim(),
      referenceLinks: links,
    };

    try {
      onSubmit({
        title: title.trim(),
        campaignObjective: campaignObjective.trim(),
        creator: selectedCreator,
        brief: selectedBrief,
        terms,
        asDraft,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="proposal-modal-title"
      className="fixed inset-0 z-50 bg-navy-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-navy-900 border border-violet-500/30 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-navy-800 flex items-center justify-between bg-navy-950/60">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 id="proposal-modal-title" className="text-base font-bold text-white">
                Initiate Smart Deal Proposal
              </h3>
              <p className="text-xs text-navy-400">
                Step {step} of 4 — {step === 1 && 'Basics & Creator Target'}
                {step === 2 && 'Commercial Terms & Deliverables'}
                {step === 3 && 'Usage Rights & Revisions'}
                {step === 4 && 'Pre-Dispatch Review'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-navy-400 hover:text-white p-1 rounded-lg hover:bg-navy-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Wizard Progress Bar */}
        <div className="w-full bg-navy-950 h-1">
          <div
            className="bg-gradient-to-r from-violet-600 to-cyan-500 h-1 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* STEP 1: BASICS */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Creator Selector */}
              <div>
                <label className="block text-xs font-semibold text-navy-300 mb-1.5">
                  Target Creator *
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedCreatorId}
                    onChange={(e) => setSelectedCreatorId(e.target.value)}
                    className="flex-1 rounded-xl border border-navy-700 bg-navy-950 p-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    {creators.map((c) => (
                      <option key={c.id as string} value={c.id as string}>
                        {c.name} ({c.handle}) — ${c.hourlyRate}/hr ({c.category})
                      </option>
                    ))}
                  </select>

                  {selectedCreator && (
                    <img
                      src={selectedCreator.avatarUrl}
                      alt={selectedCreator.name}
                      className="h-9 w-9 rounded-full object-cover border border-violet-500/40"
                    />
                  )}
                </div>
              </div>

              {/* Linked Brief (optional) */}
              <div>
                <label className="block text-xs font-semibold text-navy-300 mb-1.5">
                  Linked Campaign Brief (Optional)
                </label>
                <select
                  value={selectedBriefId}
                  onChange={(e) => {
                    const bId = e.target.value;
                    setSelectedBriefId(bId);
                    const b = briefs.find((x) => (x.id as string) === bId);
                    if (b && !title) setTitle(`${b.title} — Collaboration`);
                    if (b && !campaignObjective) setCampaignObjective(b.description);
                  }}
                  className="w-full rounded-xl border border-navy-700 bg-navy-950 p-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="">No linked brief (Direct proposal)</option>
                  {briefs.map((b) => (
                    <option key={b.id as string} value={b.id as string}>
                      {b.title} (${b.budget.min} - ${b.budget.max})
                    </option>
                  ))}
                </select>
              </div>

              {/* Campaign Title */}
              <div>
                <label className="block text-xs font-semibold text-navy-300 mb-1.5">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Neon Dusk — Luxury Autumn Brand Film"
                  className={`w-full rounded-xl border bg-navy-950 p-2.5 text-xs text-white focus:outline-none focus:border-violet-500 ${
                    fieldErrors.title ? 'border-rose-500' : 'border-navy-700'
                  }`}
                />
                {fieldErrors.title && (
                  <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.title}</p>
                )}
              </div>

              {/* Campaign Objective */}
              <div>
                <label className="block text-xs font-semibold text-navy-300 mb-1.5">
                  Campaign Objective & Creative Scope *
                </label>
                <textarea
                  value={campaignObjective}
                  onChange={(e) => setCampaignObjective(e.target.value)}
                  rows={4}
                  placeholder="Outline the campaign goals, visual style, key themes, and what you expect the creator to produce..."
                  className={`w-full rounded-xl border bg-navy-950 p-3 text-xs text-white focus:outline-none focus:border-violet-500 leading-relaxed ${
                    fieldErrors.objective ? 'border-rose-500' : 'border-navy-700'
                  }`}
                />
                {fieldErrors.objective && (
                  <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.objective}</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: COMMERCIAL TERMS & DELIVERABLES */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Budget & Timeline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-navy-300 mb-1.5">
                    Proposed Budget (USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500 text-xs font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="w-full rounded-xl border border-navy-700 bg-navy-950 pl-7 pr-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  {fieldErrors.budget && (
                    <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.budget}</p>
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
                      fieldErrors.deadline ? 'border-rose-500' : 'border-navy-700'
                    }`}
                  />
                  {fieldErrors.deadline && (
                    <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.deadline}</p>
                  )}
                </div>
              </div>

              {/* Deliverables List */}
              <div className="space-y-3 pt-2 border-t border-navy-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-navy-200 uppercase tracking-wider">
                      Deliverables & Quantities *
                    </h4>
                    <p className="text-[11px] text-navy-400">
                      Specify exact formats and counts agreed upon.
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
                      className="p-3 rounded-xl border border-navy-800 bg-navy-950/80 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                    >
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          value={d.title}
                          onChange={(e) =>
                            handleUpdateDeliverable(index, 'title', e.target.value)
                          }
                          placeholder="Deliverable title"
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
                          <option value="4K AI Video">4K Cinematic Video</option>
                          <option value="Reel">Instagram Reel (9:16)</option>
                          <option value="UGC Short">UGC Short / TikTok</option>
                          <option value="Carousel Post">Carousel Post (4:5)</option>
                          <option value="AI Image">AI Image Set</option>
                          <option value="Dedicated Video">Dedicated Video</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 flex items-center gap-1">
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
                          className="w-12 rounded-lg border border-navy-700 bg-navy-900 px-2 py-1.5 text-xs font-mono text-center text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>

                      <div className="sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveDeliverable(index)}
                          className="text-navy-500 hover:text-rose-400 p-1 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: USAGE RIGHTS & REVISIONS */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-300 mb-1.5">
                    Revision Cycles Allowance *
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
                    Usage Rights Duration *
                  </label>
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full rounded-xl border border-navy-700 bg-navy-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value={30}>30 Days</option>
                    <option value={90}>90 Days (Quarterly Campaign)</option>
                    <option value={180}>180 Days (6 Months)</option>
                    <option value={365}>365 Days (1 Year)</option>
                    <option value={0}>Perpetual Rights</option>
                  </select>
                </div>
              </div>

              {/* Rights Checkboxes */}
              <div className="p-3.5 rounded-xl border border-navy-800 bg-navy-950/60 space-y-2">
                <label className="flex items-center gap-2.5 text-xs text-navy-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={digitalAdsAllowed}
                    onChange={(e) => setDigitalAdsAllowed(e.target.checked)}
                    className="rounded border-navy-700 text-violet-600 focus:ring-violet-500"
                  />
                  <span>Permit Paid Digital Ads Whitelisting (Meta, TikTok, Google)</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-navy-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={organicWhitelisting}
                    onChange={(e) => setOrganicWhitelisting(e.target.checked)}
                    className="rounded border-navy-700 text-violet-600 focus:ring-violet-500"
                  />
                  <span>Allow Brand Organic Reposting on Official Channels</span>
                </label>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-semibold text-navy-300 mb-1.5">
                  Commercial Notes & Special Clauses (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Special instructions, mood board references, delivery file types..."
                  className="w-full rounded-xl border border-navy-700 bg-navy-950 p-3 text-xs text-white focus:outline-none focus:border-violet-500 leading-relaxed"
                />
              </div>

              {/* Reference Links */}
              <div>
                <label className="block text-xs font-semibold text-navy-300 mb-1.5">
                  Reference Links (One per line)
                </label>
                <textarea
                  value={referenceLinksStr}
                  onChange={(e) => setReferenceLinksStr(e.target.value)}
                  rows={2}
                  placeholder="https://vimeo.com/...&#10;https://pinterest.com/..."
                  className="w-full rounded-xl border border-navy-700 bg-navy-950 p-2.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW STEP (PRE-DISPATCH) */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-violet-950/40 border border-violet-800/80 text-xs text-violet-200 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 text-violet-400" />
                <span>
                  Please review the complete proposal terms below. Once sent, the creator will be notified and can accept, decline, or counteroffer.
                </span>
              </div>

              <div className="rounded-xl border border-navy-700 bg-navy-950/80 p-4 space-y-3.5 text-xs">
                <div className="flex items-start justify-between pb-3 border-b border-navy-800">
                  <div>
                    <span className="text-[10px] text-navy-400 uppercase font-semibold">
                      Target Creator
                    </span>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {selectedCreator?.name} ({selectedCreator?.handle})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-navy-400 uppercase font-semibold">
                      Proposed Budget
                    </span>
                    <p className="text-base font-bold text-cyan-400 font-mono mt-0.5">
                      ${budget.toLocaleString()} {currency}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-navy-400 uppercase font-semibold">Campaign</span>
                  <p className="font-semibold text-navy-100">{title}</p>
                  <p className="text-navy-300 text-[11px] mt-0.5 leading-relaxed">
                    {campaignObjective}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-navy-800">
                  <div>
                    <span className="text-[10px] text-navy-400 uppercase font-semibold">Timeline</span>
                    <p className="text-navy-200 font-mono text-[11px]">
                      {startDate} → <strong className="text-white">{deadline}</strong>
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-navy-400 uppercase font-semibold">
                      Revisions & Rights
                    </span>
                    <p className="text-navy-200 text-[11px]">
                      {revisionAllowance === 99 ? 'Unlimited' : `${revisionAllowance} rounds`} |{' '}
                      {durationDays === 0 ? 'Perpetual' : `${durationDays}d`}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-navy-800">
                  <span className="text-[10px] text-navy-400 uppercase font-semibold mb-1 block">
                    Deliverables ({deliverables.reduce((a, b) => a + b.quantity, 0)} total)
                  </span>
                  <div className="space-y-1">
                    {deliverables.map((d, i) => (
                      <div key={i} className="text-navy-200 text-[11px]">
                        • <strong className="text-cyan-300">{d.quantity}x</strong> {d.title} ({d.format})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-navy-800 bg-navy-950/80 flex items-center justify-between">
          <div>
            {step > 1 ? (
              <Button variant="secondary" size="sm" onClick={handleBack} disabled={isSubmitting}>
                ← Back
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {step < 4 ? (
              <Button size="sm" onClick={handleNext}>
                Continue to Step {step + 1} →
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Save}
                  onClick={() => handleFinalSubmit(true)}
                  disabled={isSubmitting}
                >
                  Save as Draft
                </Button>
                <Button
                  size="sm"
                  icon={Send}
                  onClick={() => handleFinalSubmit(false)}
                  loading={isSubmitting}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
                >
                  Send Proposal
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
