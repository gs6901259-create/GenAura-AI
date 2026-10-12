import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Deal, DealFilterOptions, DealRole } from '@/types/deal';
import { dealService } from '@/services/dealService';
import { useAppStore } from '@/lib/store';
import { DealCard } from './DealCard';
import { ProposalFormModal } from './ProposalFormModal';
import {
  PageHeader,
  StatCard,
  Button,
  EmptyState,
} from '@/components/ui';
import {
  Search,
  Plus,
  Filter,
  DollarSign,
  Clock,
  Sparkles,
  GitPullRequest,
  CheckCircle2,
  FolderKanban,
  UserCheck,
  RefreshCw,
  Archive,
  Inbox,
  Send,
} from 'lucide-react';

export const DealRoomOverview: React.FC = () => {
  const navigate = useNavigate();
  const creators = useAppStore((s) => s.creators);
  const briefs = useAppStore((s) => s.briefs);
  const authUser = useAppStore((s) => s.authUser);
  const addNotification = useAppStore((s) => s.addNotification);

  // Simulation persona
  const [currentRole, setCurrentRole] = useState<DealRole>(
    authUser?.role === 'creator' ? 'creator' : 'brand'
  );

  // Active view tab
  const [viewTab, setViewTab] = useState<
    'all' | 'incoming' | 'sent' | 'negotiating' | 'completed' | 'declined'
  >('all');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<
    'lastActivity' | 'budgetHigh' | 'budgetLow' | 'deadline' | 'title'
  >('lastActivity');

  const [deals, setDeals] = useState<Deal[]>([]);
  const [metrics, setMetrics] = useState(dealService.getMetrics());
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const refreshDeals = () => {
    setIsLoading(true);
    const filterOptions: DealFilterOptions = {
      roleView: viewTab,
      status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
      search: search.trim() || undefined,
      sortBy,
    };
    const data = dealService.getDeals(filterOptions, currentRole);
    setDeals(data);
    setMetrics(dealService.getMetrics());
    setIsLoading(false);
  };

  useEffect(() => {
    dealService.ensureInitialized();
    refreshDeals();
    const unsub = dealService.subscribe(() => {
      refreshDeals();
    });
    return unsub;
  }, [viewTab, statusFilter, search, sortBy, currentRole]);

  const handleCreateProposal = (params: any) => {
    const res = dealService.createProposal({
      title: params.title,
      campaignObjective: params.campaignObjective,
      briefId: params.brief?.id,
      briefTitle: params.brief?.title,
      brand: {
        id: 'brand-current',
        role: 'brand',
        name: authUser?.name || 'GenAura Brand Sponsor',
        handle: `@${authUser?.username || 'genaurabrand'}`,
        avatarUrl: authUser?.avatarUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=brand',
        email: authUser?.email,
      },
      creator: {
        id: params.creator.id,
        role: 'creator',
        name: params.creator.name,
        handle: params.creator.handle,
        avatarUrl: params.creator.avatarUrl,
        email: params.creator.email,
      },
      terms: params.terms,
      asDraft: params.asDraft,
      senderRole: 'brand',
      senderName: authUser?.name || 'Brand Lead',
    });

    if (res.success && res.deal) {
      addNotification({
        id: `notif_${Date.now()}`,
        title: params.asDraft ? 'Proposal Draft Saved' : 'Proposal Dispatched',
        message: `Proposal "${res.deal.title}" was ${params.asDraft ? 'saved as draft' : 'sent to ' + params.creator.name}.`,
        type: 'collaboration',
        timestamp: new Date().toISOString(),
        read: false,
        linkTo: `/deals/${res.deal.id}`,
      });
      setIsProposalModalOpen(false);
      refreshDeals();
      navigate(`/deals/${res.deal.id}`);
    }
  };

  const incomingCount = useMemo(
    () =>
      dealService.getDeals({ roleView: 'incoming' }, currentRole).length,
    [currentRole, deals]
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header & POV Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Smart Deal Room"
          subtitle="Collaborative commercial negotiations, side-by-side terms diffing, immutable version audits, and contract agreement."
          actions={
            <div className="flex items-center gap-2.5">
              {/* POV Persona Switcher */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-navy-900 border border-navy-700/80 text-xs">
                <UserCheck className="h-3.5 w-3.5 text-cyan-400 ml-1" />
                <span className="text-navy-400 mr-1 hidden md:inline">POV:</span>
                <button
                  onClick={() => setCurrentRole('brand')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    currentRole === 'brand'
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-navy-400 hover:text-navy-200'
                  }`}
                >
                  Brand POV
                </button>
                <button
                  onClick={() => setCurrentRole('creator')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    currentRole === 'creator'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-navy-400 hover:text-navy-200'
                  }`}
                >
                  Creator POV
                </button>
              </div>

              {/* Reset to Seed Button */}
              <Button
                variant="ghost"
                size="sm"
                icon={RefreshCw}
                onClick={() => {
                  dealService.resetToSeed();
                  refreshDeals();
                }}
                title="Reset deals to demo seed"
                className="text-navy-400 hover:text-white"
              >
                Reset Demo
              </Button>

              {/* Create Proposal CTA */}
              <Button
                icon={Plus}
                onClick={() => setIsProposalModalOpen(true)}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-950/40"
              >
                Initiate Proposal
              </Button>
            </div>
          }
        />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Proposals"
          value={metrics.totalDeals}
          icon={FolderKanban}
          accent="violet"
        />
        <StatCard
          label="In Negotiation"
          value={metrics.activeNegotiations}
          icon={GitPullRequest}
          accent="amber"
        />
        <StatCard
          label="Agreed & In Production"
          value={metrics.acceptedOrActive}
          icon={CheckCircle2}
          accent="cyan"
        />
        <StatCard
          label="Committed Budget"
          value={`$${metrics.totalCommittedBudget.toLocaleString()}`}
          icon={DollarSign}
          accent="emerald"
        />
      </div>

      {/* View Tabs Bar */}
      <div className="flex border-b border-navy-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setViewTab('all')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            viewTab === 'all'
              ? 'border-violet-500 text-white'
              : 'border-transparent text-navy-400 hover:text-navy-200'
          }`}
        >
          <FolderKanban className="h-4 w-4" />
          <span>All Deals</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-navy-800 text-navy-300 font-mono">
            {metrics.totalDeals}
          </span>
        </button>

        <button
          onClick={() => setViewTab('incoming')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            viewTab === 'incoming'
              ? 'border-cyan-500 text-white'
              : 'border-transparent text-navy-400 hover:text-navy-200'
          }`}
        >
          <Inbox className="h-4 w-4 text-cyan-400" />
          <span>Incoming (Action Needed)</span>
          {incomingCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-bold animate-pulse">
              {incomingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setViewTab('sent')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            viewTab === 'sent'
              ? 'border-violet-500 text-white'
              : 'border-transparent text-navy-400 hover:text-navy-200'
          }`}
        >
          <Send className="h-4 w-4" />
          <span>Sent Proposals</span>
        </button>

        <button
          onClick={() => setViewTab('negotiating')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            viewTab === 'negotiating'
              ? 'border-amber-500 text-white'
              : 'border-transparent text-navy-400 hover:text-navy-200'
          }`}
        >
          <GitPullRequest className="h-4 w-4 text-amber-400" />
          <span>Negotiation Details</span>
        </button>

        <button
          onClick={() => setViewTab('completed')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            viewTab === 'completed'
              ? 'border-teal-500 text-white'
              : 'border-transparent text-navy-400 hover:text-navy-200'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 text-teal-400" />
          <span>Completed Deals</span>
        </button>

        <button
          onClick={() => setViewTab('declined')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            viewTab === 'declined'
              ? 'border-rose-500 text-white'
              : 'border-transparent text-navy-400 hover:text-navy-200'
          }`}
        >
          <Archive className="h-4 w-4 text-rose-400" />
          <span>Declined & Withdrawn</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-navy-900 border border-navy-700/60 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500 h-4 w-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deals by title, brand, creator..."
            className="w-full bg-navy-950 border border-navy-700 rounded-xl pl-9 pr-3 py-2 text-xs text-navy-100 placeholder:text-navy-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Status & Sort */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-navy-700 bg-navy-950 px-3 py-2 text-xs text-navy-200 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="counteroffered">Counteroffered</option>
            <option value="accepted">Accepted</option>
            <option value="in_progress">In Production</option>
            <option value="completed">Completed</option>
            <option value="declined">Declined</option>
            <option value="withdrawn">Withdrawn</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-navy-700 bg-navy-950 px-3 py-2 text-xs text-navy-200 focus:outline-none focus:border-violet-500"
          >
            <option value="lastActivity">Sort: Recent Activity</option>
            <option value="budgetHigh">Sort: Highest Budget</option>
            <option value="budgetLow">Sort: Lowest Budget</option>
            <option value="deadline">Sort: Deadline</option>
            <option value="title">Sort: Campaign Title</option>
          </select>
        </div>
      </div>

      {/* Deals Grid */}
      {deals.length === 0 ? (
        <div className="rounded-2xl border border-navy-800 bg-navy-900/40 p-12 text-center">
          <EmptyState
            icon={FolderKanban}
            title="No matching deals found"
            description={
              search
                ? `No deals matched your search "${search}". Try resetting your filters.`
                : viewTab === 'incoming'
                ? `No incoming proposals requiring action for ${currentRole}.`
                : 'Initiate a proposal with a creator to start negotiating commercial terms.'
            }
            action={
              <Button
                size="sm"
                icon={Plus}
                onClick={() => setIsProposalModalOpen(true)}
                className="mt-3"
              >
                Create New Proposal
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              currentRole={currentRole}
              onSelectDeal={(d) => navigate(`/deals/${d.id}`)}
            />
          ))}
        </div>
      )}

      {/* Proposal Creation Modal */}
      {isProposalModalOpen && (
        <ProposalFormModal
          creators={creators}
          briefs={briefs}
          onClose={() => setIsProposalModalOpen(false)}
          onSubmit={handleCreateProposal}
        />
      )}
    </div>
  );
};
