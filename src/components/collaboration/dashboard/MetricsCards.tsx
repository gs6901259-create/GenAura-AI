import React from 'react';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { CollaborationDashboardMetrics } from '@/contracts/collaborationContract';

interface MetricsCardsProps {
  metrics: CollaborationDashboardMetrics;
  onFilterStatus?: (status: string) => void;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  metrics,
  onFilterStatus,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5">
      {/* Active Collaborations */}
      <div
        onClick={() => onFilterStatus && onFilterStatus('in_progress')}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition-all hover:border-purple-500/50 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-purple-950/20"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Active Collaborations</span>
          <span className="rounded-xl bg-purple-950/70 p-2 text-purple-400 ring-1 ring-purple-800/80 group-hover:scale-110 transition-transform">
            <Sparkles className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white sm:text-3xl tracking-tight">
            {metrics.activeProjects}
          </span>
          <span className="text-xs text-purple-400 flex items-center font-medium">
            In production
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
          <span>Total projects: {metrics.totalProjects}</span>
          <span className="text-purple-400 group-hover:underline flex items-center">
            View active <ArrowUpRight className="h-3 w-3 ml-0.5" />
          </span>
        </div>
      </div>

      {/* Pending Creator Decisions */}
      <div
        onClick={() => onFilterStatus && onFilterStatus('sent')}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition-all hover:border-amber-500/50 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-amber-950/20"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Awaiting Creator Decision</span>
          <span className="rounded-xl bg-amber-950/70 p-2 text-amber-400 ring-1 ring-amber-800/80 group-hover:scale-110 transition-transform">
            <Clock className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white sm:text-3xl tracking-tight">
            {metrics.pendingResponses}
          </span>
          <span className="text-xs text-amber-400 flex items-center font-medium">
            Dispatched invites
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
          <span>Sent to shortlists</span>
          <span className="text-amber-400 group-hover:underline flex items-center">
            Review sent <ArrowUpRight className="h-3 w-3 ml-0.5" />
          </span>
        </div>
      </div>

      {/* Creator Acceptance Rate */}
      <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition-all hover:border-emerald-500/50 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-emerald-950/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Acceptance Rate</span>
          <span className="rounded-xl bg-emerald-950/70 p-2 text-emerald-400 ring-1 ring-emerald-800/80 group-hover:scale-110 transition-transform">
            <TrendingUp className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white sm:text-3xl tracking-tight">
            {metrics.acceptanceRate}%
          </span>
          <span className="text-xs text-emerald-400 flex items-center font-medium">
            High conversion
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
          <span>Brief match efficiency</span>
          <span className="text-emerald-400">Benchmark: &gt;75%</span>
        </div>
      </div>

      {/* Committed Budget & Deliverables */}
      <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition-all hover:border-blue-500/50 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-blue-950/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Committed Budget</span>
          <span className="rounded-xl bg-blue-950/70 p-2 text-blue-400 ring-1 ring-blue-800/80 group-hover:scale-110 transition-transform">
            <DollarSign className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white sm:text-3xl tracking-tight">
            ${metrics.totalBudgetCommitted.toLocaleString()}
          </span>
          <span className="text-xs text-blue-400 flex items-center font-medium">
            USD allocated
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
          <span>
            Deliverables: {metrics.totalDeliverablesCompleted} completed
          </span>
          <span className="text-blue-400 font-medium">
            {metrics.totalDeliverablesPending} pending
          </span>
        </div>
      </div>
    </div>
  );
};


