import React, { useState } from 'react';
import type { PortfolioItem } from '@/types';
import { Badge } from '@/components/ui';
import { Film, Image as ImageIcon, Link as LinkIcon, FileText } from 'lucide-react';
import { MEDIA_TYPE_LABELS } from './portfolioUtils';

export interface PortfolioCardProps {
  item: PortfolioItem;
  creatorName?: string;
  onSelect: (item: PortfolioItem) => void;
  onEdit?: (item: PortfolioItem) => void;
  onDelete?: (item: PortfolioItem) => void;
  isOwner?: boolean;
}

const FALLBACK_THUMBNAIL = 'https://picsum.photos/seed/placeholder/800/450';

export const PortfolioCard: React.FC<PortfolioCardProps> = ({
  item,
  creatorName,
  onSelect,
  onEdit,
  onDelete,
  isOwner = false,
}) => {
  const [imgError, setImgError] = useState(false);

  const getMediaIcon = () => {
    switch (item.mediaType) {
      case 'video':
        return <Film size={14} className="text-cyan-400" />;
      case 'link':
        return <LinkIcon size={14} className="text-violet-400" />;
      case 'pdf':
        return <FileText size={14} className="text-amber-400" />;
      case 'image':
      default:
        return <ImageIcon size={14} className="text-emerald-400" />;
    }
  };

  return (
    <article
      tabIndex={0}
      role="button"
      aria-label={`View project ${item.title}`}
      onClick={() => onSelect(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item);
        }
      }}
      className="group relative rounded-xl bg-navy-900 border border-navy-700/50 overflow-hidden flex flex-col cursor-pointer transition-all duration-200 hover:border-violet-500/50 hover:bg-navy-850 hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-950/30 focus-visible:outline-2 focus-visible:outline-violet-500"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full bg-navy-950 overflow-hidden">
        <img
          src={imgError ? FALLBACK_THUMBNAIL : item.thumbnailUrl || item.mediaUrl}
          alt={item.title}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Media Type Badge Overlay */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy-950/80 backdrop-blur-md border border-navy-700/60 text-xs font-medium text-navy-200">
          {getMediaIcon()}
          <span>{MEDIA_TYPE_LABELS[item.mediaType]}</span>
        </div>

        {item.featured && (
          <div className="absolute top-2.5 right-2.5">
            <Badge variant="violet" dot>Featured</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2.5">
        <div>
          <h3 className="text-base font-semibold text-navy-50 line-clamp-1 group-hover:text-violet-300 transition-colors">
            {item.title}
          </h3>
          {creatorName && (
            <p className="text-xs text-cyan-400 font-medium mt-0.5">By {creatorName}</p>
          )}
        </div>

        <p className="text-xs text-navy-400 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-2">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded bg-navy-800 text-navy-300 text-[11px] font-medium border border-navy-700/40"
              >
                #{tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-[11px] text-navy-500 self-center">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer / Owner controls */}
        {isOwner && (onEdit || onDelete) && (
          <div
            className="flex items-center justify-end gap-2 pt-2 border-t border-navy-800 mt-2"
            onClick={(e) => e.stopPropagation()}
          >
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="text-xs text-violet-400 hover:text-violet-300 font-medium px-2 py-1 rounded hover:bg-violet-950/40 transition-colors"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(item)}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded hover:bg-rose-950/40 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
