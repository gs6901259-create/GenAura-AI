import React, { useEffect, useState } from 'react';
import type { PortfolioItem } from '@/types';
import { Badge, Button } from '@/components/ui';
import { X, ExternalLink, UserCheck, ShieldCheck } from 'lucide-react';
import { MEDIA_TYPE_LABELS } from './portfolioUtils';

export interface PortfolioDetailProps {
  item: PortfolioItem | null;
  creatorName?: string;
  onClose: () => void;
  onEdit?: (item: PortfolioItem) => void;
  onDelete?: (item: PortfolioItem) => void;
  isOwner?: boolean;
}

const FALLBACK_MEDIA = 'https://picsum.photos/seed/placeholder/1200/675';

export const PortfolioDetail: React.FC<PortfolioDetailProps> = ({
  item,
  creatorName,
  onClose,
  onEdit,
  onDelete,
  isOwner = false,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="portfolio-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-navy-950/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl bg-navy-900 border border-navy-700/60 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-800 bg-navy-950/60">
          <div className="flex items-center gap-3">
            <Badge variant="violet">{MEDIA_TYPE_LABELS[item.mediaType]}</Badge>
            {creatorName && <span className="text-xs text-navy-400">By {creatorName}</span>}
          </div>

          <div className="flex items-center gap-2">
            {isOwner && onEdit && (
              <Button size="sm" variant="ghost" onClick={() => onEdit(item)}>
                Edit
              </Button>
            )}
            {isOwner && onDelete && (
              <Button size="sm" variant="danger" onClick={() => onDelete(item)}>
                Delete
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-lg text-navy-400 hover:text-navy-100 hover:bg-navy-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto p-6 flex flex-col gap-6">
          {/* Large Preview */}
          <div className="relative aspect-video w-full rounded-xl bg-navy-950 overflow-hidden border border-navy-800 flex items-center justify-center">
            {item.mediaType === 'video' ? (
              <video
                src={item.mediaUrl}
                poster={item.thumbnailUrl}
                controls
                className="w-full h-full object-contain"
              >
                Your browser does not support HTML video.
              </video>
            ) : (
              <img
                src={imgError ? FALLBACK_MEDIA : item.mediaUrl || item.thumbnailUrl}
                alt={item.title}
                onError={() => setImgError(true)}
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Title & Client */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h2 id="portfolio-modal-title" className="text-2xl font-bold text-navy-50">
                {item.title}
              </h2>
              {item.clientName && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 font-medium">
                  <UserCheck size={14} />
                  <span>Client: {item.clientName}</span>
                </div>
              )}
            </div>

            <p className="mt-3 text-sm text-navy-300 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-navy-800/60 border border-navy-700/40 text-xs">
            <div>
              <span className="text-navy-500 block font-medium mb-1">Format</span>
              <span className="text-navy-100 font-semibold">{MEDIA_TYPE_LABELS[item.mediaType]}</span>
            </div>
            <div>
              <span className="text-navy-500 block font-medium mb-1">Published</span>
              <span className="text-navy-100 font-semibold">
                {new Date(item.publishedAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div>
              <span className="text-navy-500 block font-medium mb-1">Commercial Rights</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck size={13} /> Full Client License
              </span>
            </div>
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-2.5">
                Tags & Categorization
              </h4>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-navy-800 border border-navy-700/60 text-navy-300 text-xs font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* External Links */}
          {(item.externalUrl || item.mediaType === 'link') && (
            <div className="pt-2 border-t border-navy-800 flex justify-between items-center">
              <a
                href={item.externalUrl || item.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span>View Live Project / Interactive Link</span>
                <ExternalLink size={14} />
              </a>
              <span className="text-xs text-navy-500">Sample verified work</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
