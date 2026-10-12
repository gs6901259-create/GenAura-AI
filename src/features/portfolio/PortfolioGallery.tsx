import React, { useState, useMemo } from 'react';
import type { PortfolioItem, PortfolioMediaType } from '@/types';
import { Button, EmptyState } from '@/components/ui';
import { Plus, Image as ImageIcon } from 'lucide-react';
import { PortfolioCard } from './PortfolioCard';
import { PortfolioDetail } from './PortfolioDetail';
import { MEDIA_TYPE_LABELS } from './portfolioUtils';

export interface PortfolioGalleryProps {
  items: PortfolioItem[];
  creatorName?: string;
  isOwner?: boolean;
  onAddItem?: () => void;
  onEditItem?: (item: PortfolioItem) => void;
  onDeleteItem?: (item: PortfolioItem) => void;
  title?: string;
}

export const PortfolioGallery: React.FC<PortfolioGalleryProps> = ({
  items,
  creatorName,
  isOwner = false,
  onAddItem,
  onEditItem,
  onDeleteItem,
  title = 'AI Creative Portfolio',
}) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [activeItem, setActiveItem] = useState<PortfolioItem | null>(null);

  const formats = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => set.add(item.mediaType));
    return Array.from(set);
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedFormat === 'all') return items;
    return items.filter((item) => item.mediaType === selectedFormat);
  }, [items, selectedFormat]);

  return (
    <section aria-label="Portfolio Gallery" className="flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-50 flex items-center gap-2">
            <span>{title}</span>
            <span className="text-sm font-normal text-navy-400">
              ({filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'})
            </span>
          </h2>
          <p className="text-xs text-navy-400 mt-0.5">
            Verified AI outputs, creative deliverables, and generative workflows.
          </p>
        </div>

        {isOwner && onAddItem && (
          <Button icon={Plus} size="sm" onClick={onAddItem}>
            Add Project
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      {formats.length > 1 && (
        <div className="flex flex-wrap gap-2 pb-1" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={selectedFormat === 'all'}
            onClick={() => setSelectedFormat('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              selectedFormat === 'all'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-navy-800 text-navy-300 hover:text-white border border-navy-700/60'
            }`}
          >
            All Works ({items.length})
          </button>

          {formats.map((fmt) => {
            const count = items.filter((i) => i.mediaType === fmt).length;
            const isSelected = selectedFormat === fmt;
            return (
              <button
                key={fmt}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedFormat(fmt)}
                className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-navy-800 text-navy-300 hover:text-white border border-navy-700/60'
                }`}
              >
                {MEDIA_TYPE_LABELS[fmt as PortfolioMediaType] || fmt} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No portfolio items found"
          description="This creator has not published projects in this category yet."
          action={
            isOwner && onAddItem ? (
              <Button icon={Plus} size="sm" onClick={onAddItem} className="mt-2">
                Add First Item
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <PortfolioCard
              key={item.id}
              item={item}
              creatorName={creatorName}
              onSelect={setActiveItem}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
              isOwner={isOwner}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {activeItem && (
        <PortfolioDetail
          item={activeItem}
          creatorName={creatorName}
          onClose={() => setActiveItem(null)}
          onEdit={onEditItem}
          onDelete={onDeleteItem}
          isOwner={isOwner}
        />
      )}
    </section>
  );
};
