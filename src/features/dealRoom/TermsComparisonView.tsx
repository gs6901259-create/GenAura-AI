import React from 'react';
import { DealTerms, DealTermsDiff } from '@/types/deal';
import { diffDealTerms } from '@/services/dealService';
import { formatRupees } from '@/lib/utils';
import {
  DollarSign,
  Calendar,
  Layers,
  Repeat,
  ShieldCheck,
  FileText,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface TermsComparisonViewProps {
  originalTerms: DealTerms;
  proposedTerms: DealTerms;
  originalLabel?: string;
  proposedLabel?: string;
  diff?: DealTermsDiff;
}

export const TermsComparisonView: React.FC<TermsComparisonViewProps> = ({
  originalTerms,
  proposedTerms,
  originalLabel = 'Original Offer (v1)',
  proposedLabel = 'Proposed Revision (v2)',
  diff: propDiff,
}) => {
  const diff = propDiff || diffDealTerms(originalTerms, proposedTerms);

  return (
    <div className="space-y-4">
      {/* Diff Banner */}
      <div
        className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
          diff.hasChanges
            ? 'bg-amber-950/40 border-amber-800/80 text-amber-300'
            : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
        }`}
      >
        <div className="flex items-center gap-2">
          {diff.hasChanges ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
          ) : (
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
          )}
          <span>
            {diff.hasChanges
              ? 'Highlighted fields show modifications proposed in this negotiation version.'
              : 'Terms are identical between these two versions.'}
          </span>
        </div>
        <span className="text-[11px] opacity-80 uppercase tracking-wider font-bold">
          Side-by-Side Comparison
        </span>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Original Terms */}
        <div className="rounded-xl border border-navy-700/60 bg-navy-900/70 p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-navy-800">
            <h4 className="text-sm font-bold text-navy-200">{originalLabel}</h4>
            <span className="text-[11px] text-navy-400 font-mono">Baseline</span>
          </div>

          {/* Budget */}
          <div className="space-y-1">
            <span className="text-xs text-navy-400 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-navy-500" />
              Proposed Budget
            </span>
            <div className="text-base font-bold text-navy-100 font-mono">
              {formatRupees(originalTerms.budget)} {originalTerms.currency || 'INR'}
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-1">
            <span className="text-xs text-navy-400 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-navy-500" />
              Timeline & Delivery Deadline
            </span>
            <div className="text-xs text-navy-200 font-mono">
              Start: {originalTerms.startDate} → Deadline: <span className="font-bold">{originalTerms.deadline}</span>
            </div>
          </div>

          {/* Deliverables */}
          <div className="space-y-1.5">
            <span className="text-xs text-navy-400 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-navy-500" />
              Deliverables ({originalTerms.deliverables.reduce((acc, d) => acc + d.quantity, 0)} total)
            </span>
            <div className="space-y-1.5">
              {originalTerms.deliverables.map((d, i) => (
                <div
                  key={d.id || i}
                  className="p-2 rounded-lg bg-navy-950/60 border border-navy-800/80 text-xs text-navy-300"
                >
                  <span className="font-bold text-navy-100">{d.quantity}x</span> {d.title} ({d.format})
                  {d.requirements && (
                    <p className="text-[11px] text-navy-400 mt-0.5">{d.requirements}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Revisions & Rights */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-navy-800/80 text-xs">
            <div>
              <span className="text-navy-400 flex items-center gap-1 mb-1">
                <Repeat className="h-3 w-3" /> Revisions
              </span>
              <p className="font-semibold text-navy-200">
                {originalTerms.revisionAllowance === 99
                  ? 'Unlimited'
                  : `${originalTerms.revisionAllowance} rounds`}
              </p>
            </div>
            <div>
              <span className="text-navy-400 flex items-center gap-1 mb-1">
                <ShieldCheck className="h-3 w-3" /> Usage Rights
              </span>
              <p className="font-semibold text-navy-200">
                {originalTerms.usageRights.durationDays === 0
                  ? 'Perpetual'
                  : `${originalTerms.usageRights.durationDays} days`}
              </p>
            </div>
          </div>

          {originalTerms.notes && (
            <div className="pt-2 border-t border-navy-800/80">
              <span className="text-xs text-navy-400 flex items-center gap-1 mb-1">
                <FileText className="h-3 w-3" /> Terms Notes
              </span>
              <p className="text-xs text-navy-300 leading-relaxed bg-navy-950/40 p-2 rounded-lg border border-navy-800/60">
                {originalTerms.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Proposed Terms (with Diff Highlights) */}
        <div
          className={`rounded-xl border p-4 space-y-4 ${
            diff.hasChanges
              ? 'border-violet-500/50 bg-gradient-to-b from-violet-950/20 to-navy-900/80 shadow-lg shadow-violet-950/30'
              : 'border-navy-700/60 bg-navy-900/70'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-navy-800">
            <h4 className="text-sm font-bold text-violet-300">{proposedLabel}</h4>
            {diff.hasChanges && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold animate-pulse">
                Modifications Active
              </span>
            )}
          </div>

          {/* Budget */}
          <div
            className={`p-2.5 rounded-lg border transition-all ${
              diff.budgetChanged
                ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                : 'bg-navy-950/40 border-navy-800/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-navy-400 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-navy-400" />
                Proposed Budget
              </span>
              {diff.budgetChanged && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  DIFF
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base font-bold font-mono text-white">
                {formatRupees(proposedTerms.budget)} {proposedTerms.currency || 'INR'}
              </span>
              {diff.budgetChanged && (
                <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" />
                  from {formatRupees(originalTerms.budget)}
                </span>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div
            className={`p-2.5 rounded-lg border transition-all ${
              diff.deadlineChanged || diff.startDateChanged
                ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                : 'bg-navy-950/40 border-navy-800/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-navy-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-navy-400" />
                Timeline & Delivery Deadline
              </span>
              {(diff.deadlineChanged || diff.startDateChanged) && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  DIFF
                </span>
              )}
            </div>
            <div className="text-xs text-navy-200 font-mono mt-1">
              Start: {proposedTerms.startDate} → Deadline:{' '}
              <span className="font-bold text-white">{proposedTerms.deadline}</span>
              {diff.deadlineChanged && (
                <span className="ml-2 text-amber-400">
                  (was {originalTerms.deadline})
                </span>
              )}
            </div>
          </div>

          {/* Deliverables */}
          <div
            className={`p-2.5 rounded-lg border transition-all ${
              diff.deliverablesChanged
                ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                : 'bg-navy-950/40 border-navy-800/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-navy-400 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-navy-400" />
                Deliverables ({proposedTerms.deliverables.reduce((acc, d) => acc + d.quantity, 0)} total)
              </span>
              {diff.deliverablesChanged && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  DIFF
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {proposedTerms.deliverables.map((d, i) => (
                <div
                  key={d.id || i}
                  className="p-2 rounded-lg bg-navy-950/80 border border-navy-800 text-xs text-navy-200"
                >
                  <span className="font-bold text-cyan-300">{d.quantity}x</span> {d.title} ({d.format})
                  {d.requirements && (
                    <p className="text-[11px] text-navy-400 mt-0.5">{d.requirements}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Revisions & Rights */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-navy-800/80 text-xs">
            <div
              className={`p-2 rounded-lg border ${
                diff.revisionAllowanceChanged
                  ? 'bg-amber-950/30 border-amber-500/50'
                  : 'border-transparent'
              }`}
            >
              <span className="text-navy-400 flex items-center gap-1 mb-1">
                <Repeat className="h-3 w-3" /> Revisions
                {diff.revisionAllowanceChanged && (
                  <span className="text-[9px] font-bold px-1 rounded bg-amber-500/20 text-amber-300">
                    DIFF
                  </span>
                )}
              </span>
              <p className="font-semibold text-white">
                {proposedTerms.revisionAllowance === 99
                  ? 'Unlimited'
                  : `${proposedTerms.revisionAllowance} rounds`}
              </p>
            </div>

            <div
              className={`p-2 rounded-lg border ${
                diff.usageRightsChanged
                  ? 'bg-amber-950/30 border-amber-500/50'
                  : 'border-transparent'
              }`}
            >
              <span className="text-navy-400 flex items-center gap-1 mb-1">
                <ShieldCheck className="h-3 w-3" /> Usage Rights
                {diff.usageRightsChanged && (
                  <span className="text-[9px] font-bold px-1 rounded bg-amber-500/20 text-amber-300">
                    DIFF
                  </span>
                )}
              </span>
              <p className="font-semibold text-white">
                {proposedTerms.usageRights.durationDays === 0
                  ? 'Perpetual'
                  : `${proposedTerms.usageRights.durationDays} days`}
              </p>
            </div>
          </div>

          {proposedTerms.notes && (
            <div
              className={`pt-2 border-t border-navy-800/80 p-2 rounded-lg ${
                diff.notesChanged ? 'bg-amber-950/20 border border-amber-800/50' : ''
              }`}
            >
              <span className="text-xs text-navy-400 flex items-center gap-1 mb-1">
                <FileText className="h-3 w-3" /> Counteroffer Notes
              </span>
              <p className="text-xs text-navy-200 leading-relaxed bg-navy-950/60 p-2.5 rounded-lg border border-navy-800">
                {proposedTerms.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
