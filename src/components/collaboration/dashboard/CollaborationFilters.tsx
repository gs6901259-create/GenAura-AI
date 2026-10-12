import React from 'react';
import {
  Search,
  Filter,
  Plus,
  Kanban,
  Table as TableIcon,
  X,
} from 'lucide-react';
import {
  CollaborationStatus,
  CollaborationFilterOptions,
} from '@/contracts/collaborationContract';
import { CampaignBrief } from '@/contracts/briefContract';
import { STATUS_METADATA } from '@/utils/statusTransitions';

interface CollaborationFiltersProps {
  filters: CollaborationFilterOptions;
  onFilterChange: (filters: CollaborationFilterOptions) => void;
  briefs: CampaignBrief[];
  viewMode: 'kanban' | 'table';
  onViewModeChange: (mode: 'kanban' | 'table') => void;
  onOpenCreateModal: () => void;
}

export const CollaborationFilters: React.FC<CollaborationFiltersProps> = ({
  filters,
  onFilterChange,
  briefs,
  viewMode,
  onViewModeChange,
  onOpenCreateModal,
}) => {
  const hasActiveFilters =
    (filters.status && filters.status !== 'all') ||
    (filters.briefId && filters.briefId !== 'all') ||
    (filters.search && filters.search.trim() !== '') ||
    (filters.platform && filters.platform !== 'all');

  const clearFilters = () => {
    onFilterChange({
      status: 'all',
      briefId: 'all',
      creatorId: 'all',
      search: '',
      platform: 'all',
    });
  };

  return (
    <div className="glass-card flex flex-col gap-4 rounded-2xl p-4">
      {/* Top row: search + action button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) =>
              onFilterChange({ ...filters, search: e.target.value })
            }
            placeholder="Search by creator name, @handle, project title, or tags..."
            className="glass-input w-full rounded-xl py-2.5 pl-10 pr-4 text-xs transition-colors focus:border-purple-500 focus:outline-none"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* View Toggle & New Request Button */}
        <div className="flex items-center gap-2.5">
          {/* Kanban / Table Toggle */}
          <div className="flex items-center rounded-xl border border-navy-700/60 bg-navy-950/70 p-1">
            <button
              onClick={() => onViewModeChange('kanban')}
              title="Kanban Board View"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-navy-400 hover:text-navy-200'
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              title="Table List View"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-navy-400 hover:text-navy-200'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {/* New Request Modal trigger */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/25 transition-all hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-600/35 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Collaboration Request</span>
          </button>
        </div>
      </div>

      {/* Bottom Filter Controls */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-navy-700/60">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-navy-400 pr-1">
          <Filter className="h-3.5 w-3.5 text-purple-400" />
          <span>Filters:</span>
        </div>

        {/* Status Dropdown */}
        <select
          value={filters.status || 'all'}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              status: e.target.value as CollaborationStatus | 'all',
            })
          }
          className="glass-dropdown rounded-lg px-2.5 py-1.5 text-xs focus:border-purple-500 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_METADATA).map(([st, meta]) => (
            <option key={st} value={st}>
              {meta.label}
            </option>
          ))}
        </select>

        {/* Campaign Brief Dropdown */}
        <select
          value={filters.briefId || 'all'}
          onChange={(e) =>
            onFilterChange({ ...filters, briefId: e.target.value })
          }
          className="glass-dropdown rounded-lg px-2.5 py-1.5 text-xs focus:border-purple-500 focus:outline-none max-w-[200px] truncate"
        >
          <option value="all">All Campaign Briefs</option>
          {briefs.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </select>

        {/* Platform Dropdown */}
        <select
          value={filters.platform || 'all'}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              platform: e.target.value as any,
            })
          }
          className="glass-dropdown rounded-lg px-2.5 py-1.5 text-xs focus:border-purple-500 focus:outline-none"
        >
          <option value="all">All Platforms</option>
          <option value="youtube">YouTube</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="twitter">X / Twitter</option>
        </select>

        {/* Clear Filters Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
          >
            <X className="h-3 w-3" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
};


