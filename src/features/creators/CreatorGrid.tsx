import React from 'react';
import type { Creator, PortfolioItem } from '@/types';
import { CreatorCard } from './CreatorCard';
import { EmptyState } from '@/components/ui';
import { Users } from 'lucide-react';

export interface CreatorGridProps {
  creators: Creator[];
  portfolios?: PortfolioItem[];
  onViewProfile: (creator: Creator) => void;
  onShortlist?: (creator: Creator) => void;
  shortlistedIds?: string[];
  loading?: boolean;
}

const SkeletonCard: React.FC = () => (
  <div className="rounded-2xl bg-navy-900 border border-navy-800 p-5 flex flex-col gap-4 animate-pulse">
    <div className="flex items-center gap-3.5">
      <div className="h-14 w-14 rounded-full bg-navy-800 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/5 bg-navy-800 rounded" />
        <div className="h-3 w-2/5 bg-navy-800 rounded" />
      </div>
    </div>
    <div className="h-10 bg-navy-800 rounded" />
    <div className="flex gap-2">
      <div className="h-5 w-16 bg-navy-800 rounded-full" />
      <div className="h-5 w-20 bg-navy-800 rounded-full" />
    </div>
    <div className="h-14 bg-navy-800 rounded-lg mt-auto" />
  </div>
);

export const CreatorGrid: React.FC<CreatorGridProps> = ({
  creators,
  portfolios = [],
  onViewProfile,
  onShortlist,
  shortlistedIds = [],
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (creators.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No creators found"
        description="Try adjusting your search criteria, category filters, or explore all available creators."
      />
    );
  }

  return (
    <div
      role="feed"
      aria-label="Creator directory"
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
    >
      {creators.map((creator) => {
        const creatorPortfolios = portfolios.filter((p) => p.creatorId === creator.id);
        return (
          <CreatorCard
            key={creator.id}
            creator={creator}
            portfolioPreviews={creatorPortfolios}
            onViewProfile={onViewProfile}
            onShortlist={onShortlist}
            isShortlisted={shortlistedIds.includes(creator.id)}
          />
        );
      })}
    </div>
  );
};
