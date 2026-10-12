import React from 'react';
import { Deal, DealRole } from '@/types/deal';
import { DealStatusBadge } from './DealStatusBadge';
import {
  Calendar,
  DollarSign,
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DealCardProps {
  deal: Deal;
  currentRole: DealRole;
  onSelectDeal: (deal: Deal) => void;
}

export const DealCard: React.FC<DealCardProps> = ({ deal, currentRole, onSelectDeal }) => {
  const totalDeliverablesCount = deal.currentTerms.deliverables.reduce(
    (sum, d) => sum + d.quantity,
    0
  );

  const formattedActivityTime = new Date(deal.lastActivityAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isMyTurn = deal.awaitingActionFrom === currentRole;

  return (
    <article
      onClick={() => onSelectDeal(deal)}
      className="group relative rounded-2xl border border-navy-700/60 bg-gradient-to-br from-navy-900/90 to-navy-950/90 p-5 shadow-lg transition-all duration-200 hover:border-violet-500/50 hover:shadow-violet-950/20 hover:shadow-2xl cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      {/* Top Banner: Status & Action Indicator */}
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <DealStatusBadge status={deal.status} size="sm" />

        {isMyTurn && (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold uppercase tracking-wider animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Action Required
          </span>
        )}
      </div>

      {/* Main Info */}
      <div className="space-y-2 mb-4">
        {deal.briefTitle && (
          <div className="text-[11px] text-violet-400 font-medium truncate flex items-center gap-1">
            <Sparkles className="h-3 w-3 shrink-0" />
            <span>Brief: {deal.briefTitle}</span>
          </div>
        )}

        <h3 className="text-base font-bold text-white group-hover:text-violet-200 transition-colors line-clamp-1">
          {deal.title}
        </h3>

        <p className="text-xs text-navy-400 line-clamp-2 leading-relaxed">
          {deal.campaignObjective}
        </p>
      </div>

      {/* Participants Row */}
      <div className="grid grid-cols-2 gap-3 py-3 border-y border-navy-800/80 mb-4 bg-navy-950/30 -mx-5 px-5">
        {/* Brand */}
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={deal.brand.avatarUrl}
            alt={deal.brand.name}
            className="h-8 w-8 rounded-full object-cover border border-navy-700 shrink-0"
          />
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-navy-500 block">Brand</span>
            <span className="text-xs font-semibold text-navy-200 truncate block">
              {deal.brand.name}
            </span>
          </div>
        </div>

        {/* Creator */}
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={deal.creator.avatarUrl}
            alt={deal.creator.name}
            className="h-8 w-8 rounded-full object-cover border border-violet-500/30 shrink-0"
          />
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-navy-500 block">Creator</span>
            <Link
              to={`/creators/${deal.creator.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-semibold text-cyan-300 hover:underline truncate block"
            >
              {deal.creator.name}
            </Link>
          </div>
        </div>
      </div>

      {/* Commercial Terms Summary */}
      <div className="grid grid-cols-3 gap-2 text-xs mb-4">
        <div className="p-2 rounded-xl bg-navy-950/60 border border-navy-800/60">
          <span className="text-[10px] text-navy-500 uppercase font-semibold flex items-center gap-1">
            <DollarSign className="h-3 w-3" /> Budget
          </span>
          <div className="text-sm font-bold text-cyan-400 font-mono mt-0.5">
            ${deal.currentTerms.budget.toLocaleString()}
          </div>
        </div>

        <div className="p-2 rounded-xl bg-navy-950/60 border border-navy-800/60">
          <span className="text-[10px] text-navy-500 uppercase font-semibold flex items-center gap-1">
            <Layers className="h-3 w-3" /> Assets
          </span>
          <div className="text-sm font-bold text-navy-200 font-mono mt-0.5">
            {totalDeliverablesCount} items
          </div>
        </div>

        <div className="p-2 rounded-xl bg-navy-950/60 border border-navy-800/60">
          <span className="text-[10px] text-navy-500 uppercase font-semibold flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Deadline
          </span>
          <div className="text-xs font-bold text-navy-200 font-mono mt-1 truncate">
            {deal.currentTerms.deadline}
          </div>
        </div>
      </div>

      {/* Next Required Action Box */}
      <div className="p-2.5 rounded-xl bg-navy-950 border border-navy-800 text-[11px] mb-3">
        <span className="text-navy-400 font-semibold block mb-0.5">Next Required Action:</span>
        <span
          className={`leading-snug line-clamp-1 ${
            isMyTurn ? 'text-cyan-300 font-bold' : 'text-navy-300'
          }`}
        >
          {deal.nextRequiredAction}
        </span>
      </div>

      {/* Footer: Last Activity & Button */}
      <div className="flex items-center justify-between text-[11px] text-navy-400 pt-2 border-t border-navy-800/60">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-navy-500" />
          {formattedActivityTime}
        </span>

        <span className="text-violet-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
          Enter Deal Room <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </article>
  );
};
