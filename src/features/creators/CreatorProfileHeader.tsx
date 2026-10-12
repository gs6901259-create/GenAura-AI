import React, { useState } from 'react';
import type { Creator } from '@/types';
import { Badge, Button, StarRating } from '@/components/ui';
import {
  MapPin,
  Briefcase,
  Star,
  ShieldCheck,
  Edit3,
  Plus,
  Send,
  Handshake,
} from 'lucide-react';

export interface CreatorProfileHeaderProps {
  creator: Creator;
  isOwner?: boolean;
  onEditProfile?: () => void;
  onAddPortfolio?: () => void;
  onShortlist?: () => void;
  isShortlisted?: boolean;
  onContact?: () => void;
  onInitiateDeal?: () => void;
}

const AVATAR_FALLBACK = 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback';

export const CreatorProfileHeader: React.FC<CreatorProfileHeaderProps> = ({
  creator,
  isOwner = false,
  onEditProfile,
  onAddPortfolio,
  onShortlist,
  isShortlisted = false,
  onContact,
  onInitiateDeal,
}) => {
  const [avatarError, setAvatarError] = useState(false);

  const getStatusBadge = () => {
    switch (creator.status) {
      case 'available':
        return <Badge variant="success" dot>Available for Hire</Badge>;
      case 'busy':
        return <Badge variant="warning" dot>High Workload</Badge>;
      case 'on-leave':
      default:
        return <Badge variant="default" dot>On Leave</Badge>;
    }
  };

  return (
    <header className="relative rounded-2xl bg-navy-900 border border-navy-700/60 p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start overflow-hidden">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />

      {/* Avatar Column */}
      <div className="relative shrink-0">
        <img
          src={avatarError ? AVATAR_FALLBACK : creator.avatarUrl}
          alt={creator.name}
          onError={() => setAvatarError(true)}
          className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover border-2 border-violet-500/40 bg-navy-800 shadow-xl"
        />
        {creator.verified && (
          <div
            title="Verified Creator"
            className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-violet-600 text-white flex items-center gap-1 text-[11px] font-semibold shadow-md"
          >
            <ShieldCheck size={12} />
            <span>Verified</span>
          </div>
        )}
      </div>

      {/* Info Column */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-50">
            {creator.name}
          </h1>
          <span className="text-sm text-navy-400 font-mono">{creator.handle}</span>
          {getStatusBadge()}
          <Badge variant="violet" className="capitalize">
            {creator.category.replace('-', ' ')}
          </Badge>
        </div>

        <p className="text-base text-cyan-400 font-medium mb-3">
          {creator.tagline}
        </p>

        <p className="text-sm text-navy-300 leading-relaxed max-w-3xl mb-4 whitespace-pre-line">
          {creator.bio}
        </p>

        {/* Badges / Metrics bar */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-navy-400 pt-2 border-t border-navy-800">
          <div className="flex items-center gap-1.5">
            <StarRating rating={creator.rating} size={14} />
            <span className="text-navy-200 font-bold">{creator.rating}</span>
            <span>({creator.reviewCount} reviews)</span>
          </div>

          <div className="flex items-center gap-1.5 text-navy-300 font-medium">
            <Briefcase size={14} className="text-navy-500" />
            <span>{creator.completedProjects} Projects Completed</span>
          </div>

          {creator.location && (
            <div className="flex items-center gap-1.5 text-navy-300">
              <MapPin size={14} className="text-navy-500" />
              <span>{creator.location}</span>
            </div>
          )}

          <div className="text-navy-100 font-semibold ml-auto text-sm">
            ${creator.hourlyRate} <span className="text-navy-400 text-xs font-normal">/ hour</span>
          </div>
        </div>
      </div>

      {/* Actions Column */}
      <div className="flex md:flex-col gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0">
        {isOwner ? (
          <>
            {onInitiateDeal && (
              <Button
                icon={Handshake}
                onClick={onInitiateDeal}
                fullWidth
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-950/40"
              >
                Initiate Deal
              </Button>
            )}
            {onEditProfile && (
              <Button variant="secondary" icon={Edit3} onClick={onEditProfile} fullWidth>
                Edit Profile
              </Button>
            )}
            {onAddPortfolio && (
              <Button icon={Plus} onClick={onAddPortfolio} fullWidth>
                Add Project
              </Button>
            )}
          </>
        ) : (
          <>
            {onInitiateDeal && (
              <Button
                icon={Handshake}
                onClick={onInitiateDeal}
                fullWidth
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-950/40"
              >
                Initiate Deal
              </Button>
            )}
            {onContact && (
              <Button variant="secondary" icon={Send} onClick={onContact} fullWidth>
                Request Project
              </Button>
            )}
            {onShortlist && (
              <Button
                variant={isShortlisted ? 'outline' : 'secondary'}
                icon={Star}
                onClick={onShortlist}
                fullWidth
              >
                {isShortlisted ? 'Shortlisted' : 'Add to Shortlist'}
              </Button>
            )}
          </>
        )}
      </div>
    </header>
  );
};
