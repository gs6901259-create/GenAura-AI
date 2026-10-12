import React, { useState, useEffect } from 'react';
import {
  CollaborationProject,
  ProjectDeliverable,
} from '@/contracts/collaborationContract';
import { CreatorProfile, Shortlist } from '@/contracts/discoveryContract';
import { CampaignBrief } from '@/contracts/briefContract';
import { storageService } from '@/services/storageService';
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Video,
  FileText,
  Send,
  Save,
} from 'lucide-react';

interface CreateRequestModalProps {
  creators: CreatorProfile[];
  briefs: CampaignBrief[];
  shortlists: Shortlist[];
  initialCreator?: CreatorProfile | null;
  initialBrief?: CampaignBrief | null;
  initialShortlist?: Shortlist | null;
  onClose: () => void;
  onSuccess: (project: CollaborationProject) => void;
}

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  creators,
  briefs,
  shortlists,
  initialCreator,
  initialBrief,
  initialShortlist,
  onClose,
  onSuccess,
}) => {
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>(
    initialCreator?.id || creators[0]?.id || ''
  );
  const [selectedBriefId, setSelectedBriefId] = useState<string>(
    initialBrief?.id || briefs[0]?.id || ''
  );
  const [selectedShortlistId, setSelectedShortlistId] = useState<string>(
    initialShortlist?.id || shortlists[0]?.id || ''
  );

  const [title, setTitle] = useState('');
  const [personalizedMessage, setPersonalizedMessage] = useState('');
  const [amount, setAmount] = useState<number>(2000);
  const [currency, setCurrency] = useState('USD');
  const [compensationType, setCompensationType] = useState<
    'fixed' | 'milestone' | 'gift_plus_commission'
  >('fixed');
  const [targetDraftDate, setTargetDraftDate] = useState('2026-10-30');
  const [targetPublishDate, setTargetPublishDate] = useState('2026-11-06');
  const [durationDays, setDurationDays] = useState(90);
  const [digitalAdsAllowed, setDigitalAdsAllowed] = useState(true);

  const [deliverables, setDeliverables] = useState<ProjectDeliverable[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const selectedCreator = creators.find((c) => c.id === selectedCreatorId);
  const selectedBrief = briefs.find((b) => b.id === selectedBriefId);

  // Auto-populate when creator or brief changes
  useEffect(() => {
    if (selectedCreator && selectedBrief) {
      setTitle(`${selectedCreator.name} - ${selectedBrief.title}`);
      setPersonalizedMessage(
        `Hi ${selectedCreator.name.split(' ')[0]}, we are thrilled by your recent content in ${selectedCreator.niche.join(', ')}. We'd love to partner with you on our "${selectedBrief.title}" campaign.`
      );
      setAmount(selectedCreator.baseRateUSD || 2000);

      // Populate default deliverables from brief template
      const defaultDelivs: ProjectDeliverable[] = selectedBrief.standardDeliverables.map(
        (tmpl, idx) => ({
          id: `del_${Date.now()}_${idx}`,
          title: tmpl.title,
          platform: tmpl.platform,
          format: tmpl.format,
          description: tmpl.guidelines,
          dueDate: targetDraftDate,
          status: 'pending',
        })
      );
      setDeliverables(defaultDelivs);
    }
  }, [selectedCreatorId, selectedBriefId]);

  const addDeliverable = () => {
    setDeliverables([
      ...deliverables,
      {
        id: `del_${Date.now()}_${deliverables.length}`,
        title: 'New Video Content',
        platform: 'youtube',
        format: 'Dedicated Video',
        description: 'Key feature demonstration according to brief dos and donts.',
        dueDate: targetDraftDate,
        status: 'pending',
      },
    ]);
  };

  const removeDeliverable = (id: string) => {
    setDeliverables(deliverables.filter((d) => d.id !== id));
  };

  const updateDeliverable = (
    id: string,
    field: keyof ProjectDeliverable,
    val: any
  ) => {
    setDeliverables(
      deliverables.map((d) => (d.id === id ? { ...d, [field]: val } : d))
    );
  };

  const handleSubmit = (asSent: boolean) => {
    setValidationError(null);

    if (!title.trim()) {
      setValidationError('Please enter a project title.');
      return;
    }
    if (!selectedCreatorId) {
      setValidationError('Please select a creator.');
      return;
    }
    if (!selectedBriefId) {
      setValidationError('Please select a linked campaign brief.');
      return;
    }
    if (deliverables.length === 0) {
      setValidationError('Please add at least one deliverable to the project.');
      return;
    }
    if (amount <= 0) {
      setValidationError('Please specify a valid compensation amount.');
      return;
    }

    const projectId = `proj_${Date.now()}`;
    const initialStatus = asSent ? 'sent' : 'draft';

    const newProject: CollaborationProject = {
      id: projectId,
      briefId: selectedBriefId,
      creatorId: selectedCreatorId,
      shortlistId: selectedShortlistId,
      title,
      personalizedMessage,
      deliverables,
      compensation: {
        amount,
        currency,
        type: compensationType,
        paymentTerms: compensationType === 'fixed' ? 'Net-15 after live publication' : 'Milestone-based release',
      },
      usageRights: {
        durationDays,
        digitalAdsAllowed,
        organicWhitelisting: true,
        exclusivityCategory: selectedBrief?.usageRightsDefault.exclusivityCategory,
      },
      status: initialStatus,
      statusHistory: [
        {
          id: `log_${Date.now()}_1`,
          fromStatus: null,
          toStatus: 'draft',
          timestamp: new Date().toISOString(),
          actorRole: 'brand',
          actorName: 'Campaign Manager',
          note: `Project proposal initialized linking brief "${selectedBrief?.title}".`,
        },
        ...(asSent
          ? [
              {
                id: `log_${Date.now()}_2`,
                fromStatus: 'draft' as const,
                toStatus: 'sent' as const,
                timestamp: new Date().toISOString(),
                actorRole: 'brand' as const,
                actorName: 'Campaign Manager',
                note: `Dispatched brief-linked collaboration proposal to ${selectedCreator?.name}.`,
              },
            ]
          : []),
      ],
      targetDraftDate,
      targetPublishDate,
      tags: [selectedCreator?.primaryPlatform || 'collab', 'Campaign'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storageService.saveCollaboration(newProject);
    onSuccess(newProject);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-navy-700/60 bg-navy-950/60 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-purple-950 p-2 text-purple-400 border border-purple-800">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-50">
                Create Brief-Linked Collaboration Request
              </h3>
              <p className="text-xs text-navy-400">
                Formally link a Campaign Brief to a Shortlisted Creator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-navy-400 hover:bg-navy-800 hover:text-navy-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {validationError && (
            <div className="rounded-xl border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-300">
              {validationError}
            </div>
          )}

          {/* Step 1: Creator & Campaign Brief Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Creator (Discovery Owner)
              </label>
              <select
                value={selectedCreatorId}
                onChange={(e) => setSelectedCreatorId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                {creators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.handle}) - ${c.baseRateUSD} base
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Linked Campaign Brief (BriefGen / Lead)
              </label>
              <select
                value={selectedBriefId}
                onChange={(e) => setSelectedBriefId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                {briefs.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.brandName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Project Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Collaboration Request Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sarah Jenkins - GenAura 2.0 Dedicated Review"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Personalized Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Personalized Creator Pitch / Note
            </label>
            <textarea
              value={personalizedMessage}
              onChange={(e) => setPersonalizedMessage(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-purple-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Compensation & Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Compensation Amount ($)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-purple-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Draft Deadline
              </label>
              <input
                type="date"
                value={targetDraftDate}
                onChange={(e) => setTargetDraftDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Publish Deadline
              </label>
              <input
                type="date"
                value={targetPublishDate}
                onChange={(e) => setTargetPublishDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Usage Rights */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3.5 space-y-2">
            <div className="text-xs font-semibold text-slate-300">
              Usage Rights Terms
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={digitalAdsAllowed}
                  onChange={(e) => setDigitalAdsAllowed(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span>Allow Paid Digital Ads (Whitelisting)</span>
              </label>

              <div className="flex items-center gap-2">
                <span>Usage Duration:</span>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                >
                  <option value={30}>30 Days</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={180}>180 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Deliverables Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Requested Deliverables ({deliverables.length})
              </span>
              <button
                type="button"
                onClick={addDeliverable}
                className="flex items-center gap-1 rounded-lg border border-purple-800 bg-purple-950/60 px-2.5 py-1 text-xs font-semibold text-purple-300 hover:bg-purple-900 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add Deliverable
              </button>
            </div>

            <div className="space-y-2.5">
              {deliverables.map((d, idx) => (
                <div
                  key={d.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={d.title}
                      onChange={(e) =>
                        updateDeliverable(d.id, 'title', e.target.value)
                      }
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white"
                      placeholder="Deliverable title"
                    />

                    <select
                      value={d.platform}
                      onChange={(e) =>
                        updateDeliverable(d.id, 'platform', e.target.value)
                      }
                      className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white"
                    >
                      <option value="youtube">YouTube</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="twitter">X / Twitter</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => removeDeliverable(d.id)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <textarea
                    value={d.description}
                    onChange={(e) =>
                      updateDeliverable(d.id, 'description', e.target.value)
                    }
                    rows={1}
                    placeholder="Specific guidelines for this piece..."
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 placeholder-slate-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 bg-slate-950/90 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="flex items-center gap-1.5 rounded-xl border border-purple-800 bg-purple-950 px-4 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-900 transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            Save as Draft
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-600/25 hover:from-purple-500 hover:to-indigo-500 transition-all active:scale-95"
          >
            <Send className="h-3.5 w-3.5" />
            Dispatch Request to Creator
          </button>
        </div>
      </div>
    </div>
  );
};


