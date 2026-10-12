import React, { useState } from 'react';
import type { Creator, PortfolioItem } from '@/types';
import { Badge, Button, StarRating } from '@/components/ui';
import { Star, ArrowRight } from 'lucide-react';
import { formatRupees } from '@/lib/utils';

export interface CreatorCardProps {
  creator: Creator;
  portfolioPreviews?: PortfolioItem[];
  onViewProfile: (creator: Creator) => void;
  onShortlist?: (creator: Creator) => void;
  isShortlisted?: boolean;
}

const AVATAR_FALLBACK = 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback';

export const CreatorCard: React.FC<CreatorCardProps> = ({
  creator,
  portfolioPreviews = [],
  onViewProfile,
  onShortlist,
  isShortlisted = false,
}) => {
  const [avatarError, setAvatarError] = useState(false);

  const getStatusBadge = () => {
    switch (creator.status) {
      case 'available':
        return <Badge variant="success" dot>Available</Badge>;
      case 'busy':
        return <Badge variant="warning" dot>Busy</Badge>;
      case 'on-leave':
      default:
        return <Badge variant="default" dot>On Leave</Badge>;
    }
  };

  return (
    <article
      tabIndex={0}
      role="region"
      aria-label={`Creator card for ${creator.name}`}
      className="group relative rounded-2xl bg-navy-900 border border-navy-700/60 p-5 flex flex-col gap-4 transition-all duration-200 hover:border-violet-500/50 hover:bg-navy-850 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-950/20"
    >
      {/* Header: Avatar, Name, Handle, Rating, Shortlist button */}
      <div className="flex items-start gap-3.5">
        <div className="relative shrink-0">
          <img
            src={avatarError ? AVATAR_FALLBACK : creator.avatarUrl}
            alt={creator.name}
            onError={() => setAvatarError(true)}
            className="h-14 w-14 rounded-full object-cover border-2 border-violet-500/40 bg-navy-800"
          />
          {creator.verified && (
            <div
              title="Verified Creator"
              className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[11px] shadow-sm"
            >
              ✓
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-navy-50 line-clamp-1 group-hover:text-violet-300 transition-colors">
                {creator.name}
              </h3>
              <p className="text-xs text-navy-400 font-mono">{creator.handle}</p>
            </div>

            {onShortlist && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onShortlist(creator);
                }}
                aria-label={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                aria-pressed={isShortlisted}
                className={`p-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                  isShortlisted
                    ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                    : 'bg-navy-800 border-navy-700/60 text-navy-400 hover:text-white'
                }`}
              >
                <Star size={14} className={isShortlisted ? 'fill-violet-400 text-violet-400' : ''} />
              </button>
            )}
          </div>

          <p className="text-xs text-cyan-400 font-medium mt-1 line-clamp-1">
            {creator.tagline}
          </p>
        </div>
      </div>

      {/* Bio */}
      <p className="text-xs text-navy-300 line-clamp-2 leading-relaxed">
        {creator.bio}
      </p>

      {/* Meta Specs: Category, Status, Rate, Location & Languages */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="violet" className="capitalize">
          {creator.category.replace('-', ' ')}
        </Badge>
        {getStatusBadge()}
        {creator.remoteAvailable !== false && (
          <Badge variant="cyan" className="text-[10px]">Remote</Badge>
        )}
        <span className="text-navy-300 font-semibold ml-auto">
          {formatRupees(creator.hourlyRate)}/hr
        </span>
      </div>

      {/* Location & Languages */}
      {(creator.location || (creator.languages && creator.languages.length > 0)) && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-navy-400">
          {creator.location && (
            <span className="flex items-center gap-1">
              📍 {creator.city ? `${creator.city}, ${creator.country || ''}` : creator.location}
            </span>
          )}
          {creator.languages && creator.languages.length > 0 && (
            <span className="flex items-center gap-1 text-cyan-400/90 font-medium">
              🗣️ {creator.languages.slice(0, 3).join(', ')}
            </span>
          )}
          {creator.toneProfile && creator.toneProfile.declaredTones.length > 0 && (
            <span className="text-violet-400 font-medium ml-auto">
              ✨ {creator.toneProfile.declaredTones[0]}
            </span>
          )}
        </div>
      )}

      {/* Skills */}
      <div>
        <div className="flex flex-wrap gap-1.5">
          {creator.skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="px-2 py-0.5 rounded bg-navy-800 text-navy-300 text-[11px] font-medium border border-navy-700/40"
            >
              {skill}
            </span>
          ))}
          {creator.skills.length > 4 && (
            <span className="text-[11px] text-navy-500 self-center">
              +{creator.skills.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Portfolio Preview Thumbnails */}
      {portfolioPreviews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 pt-1">
          {portfolioPreviews.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="relative aspect-video rounded-lg overflow-hidden bg-navy-950 border border-navy-700/40"
            >
              <img
                src={item.thumbnailUrl || item.mediaUrl}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Footer Metrics & Action */}
      <div className="pt-2 border-t border-navy-800/80 mt-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-navy-300 font-medium">
          <StarRating rating={creator.rating} size={13} />
          <span>({creator.reviewCount})</span>
        </div>

        <Button
          size="sm"
          variant="secondary"
          iconRight={ArrowRight}
          onClick={() => onViewProfile(creator)}
          className="hover:border-violet-500"
        >
          View Profile
        </Button>
      </div>
    </article>
  );
};
