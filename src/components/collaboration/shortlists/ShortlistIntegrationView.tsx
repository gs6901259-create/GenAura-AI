import React, { useState } from 'react';
import {
  Shortlist,
  CreatorProfile,
} from '@/contracts/discoveryContract';
import { CollaborationProject } from '@/contracts/collaborationContract';
import { StatusBadge } from '@/components/collaboration/common/StatusBadge';
import {
  Users,
  Sparkles,
  ExternalLink,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  Plus,
  TrendingUp,
  Tag,
} from 'lucide-react';

interface ShortlistIntegrationViewProps {
  shortlists: Shortlist[];
  creators: CreatorProfile[];
  projects: CollaborationProject[];
  onInitiateCollaboration: (creator: CreatorProfile, shortlist?: Shortlist) => void;
  onSelectProject: (project: CollaborationProject) => void;
}

export const ShortlistIntegrationView: React.FC<ShortlistIntegrationViewProps> = ({
  shortlists,
  creators,
  projects,
  onInitiateCollaboration,
  onSelectProject,
}) => {
  const [selectedShortlistId, setSelectedShortlistId] = useState<string>(
    shortlists[0]?.id || ''
  );

  const activeShortlist =
    shortlists.find((s) => s.id === selectedShortlistId) || shortlists[0];

  const creatorMap = new Map(creators.map((c) => [c.id, c]));

  // Find active project for a creator if one exists
  const getCreatorProject = (creatorId: string) => {
    return projects.find((p) => p.creatorId === creatorId);
  };

  return (
    <div className="space-y-6">
      {/* Shortlist Integration Header */}
      <div className="glass-card flex flex-col gap-3 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-purple-950/80 p-1.5 text-purple-400 border border-purple-800">
              <Users className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-bold text-navy-50">
              Discovery Shortlist Integration
            </h2>
            <span className="rounded-full bg-navy-800 px-2.5 py-0.5 text-[11px] font-semibold text-navy-300">
              Contract: IDiscoveryService
            </span>
          </div>
          <p className="mt-1 text-xs text-navy-400 max-w-2xl">
            Vetted creator shortlists synced from the Discovery Owner engine. Directly transition shortlisted talent into formal brief-linked project requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-navy-400 font-medium">Select Shortlist:</span>
          <select
            value={selectedShortlistId}
            onChange={(e) => setSelectedShortlistId(e.target.value)}
            className="glass-dropdown rounded-xl px-3 py-2 text-xs font-semibold focus:border-purple-500 focus:outline-none"
          >
            {shortlists.map((sl) => (
              <option key={sl.id} value={sl.id}>
                {sl.name} ({sl.creatorIds.length} creators)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Shortlist Detail Banner */}
      {activeShortlist && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {activeShortlist.name}
                </h3>
                <span className="rounded-md bg-purple-950 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-800 uppercase">
                  {activeShortlist.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {activeShortlist.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {activeShortlist.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-[11px] text-slate-300 flex items-center gap-1"
                >
                  <Tag className="h-3 w-3 text-purple-400" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs text-slate-400">
            <span>Source: {activeShortlist.createdBy}</span>
            <span>Target Campaign: {activeShortlist.campaignTarget || 'General'}</span>
          </div>
        </div>
      )}

      {/* Shortlisted Creators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeShortlist?.creatorIds.map((cId) => {
          const creator = creatorMap.get(cId);
          if (!creator) return null;

          const existingProject = getCreatorProject(creator.id);

          return (
            <div
              key={creator.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-md shadow-md transition-all hover:border-purple-500/50 hover:bg-slate-900"
            >
              <div>
                {/* Creator Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={creator.avatarUrl}
                        alt={creator.name}
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-purple-500/30"
                      />
                      {creator.verified && (
                        <span className="absolute bottom-0 right-0 rounded-full bg-purple-600 p-0.5 text-white ring-1 ring-slate-900">
                          <CheckCircle className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {creator.name}
                      </h4>
                      <p className="text-xs text-slate-400">{creator.handle}</p>
                      <span className="inline-block rounded-md bg-slate-800 px-1.5 py-0.2 text-[10px] text-purple-300 capitalize mt-0.5">
                        {creator.tier} tier
                      </span>
                    </div>
                  </div>

                  {/* Collaboration Status Pill */}
                  {existingProject ? (
                    <div
                      onClick={() => onSelectProject(existingProject)}
                      className="cursor-pointer"
                      title="Click to view collaboration details"
                    >
                      <StatusBadge status={existingProject.status} size="sm" />
                    </div>
                  ) : (
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 border border-slate-700">
                      Not Contacted
                    </span>
                  )}
                </div>

                {/* Bio & Niche */}
                <p className="mt-3 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {creator.bio}
                </p>

                <div className="mt-2.5 flex flex-wrap gap-1">
                  {creator.niche.map((n) => (
                    <span
                      key={n}
                      className="rounded-md bg-slate-950 px-2 py-0.5 text-[10px] text-slate-400 border border-slate-800"
                    >
                      {n}
                    </span>
                  ))}
                </div>

                {/* Platform Metrics */}
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-3 text-xs">
                  <div className="rounded-xl bg-slate-950/80 p-2.5">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">
                      Primary Platform
                    </span>
                    <div className="font-bold text-white capitalize flex items-center gap-1.5 mt-0.5">
                      {creator.primaryPlatform}
                    </div>
                    <div className="text-[11px] text-purple-400">
                      {creator.platforms[0]?.followers.toLocaleString()} followers
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-950/80 p-2.5">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">
                      Engagement & Rate
                    </span>
                    <div className="font-bold text-emerald-400 mt-0.5">
                      ${creator.baseRateUSD.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {creator.platforms[0]?.engagementRate}% eng. rate
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 border-t border-slate-800/80 pt-3">
                {existingProject ? (
                  <button
                    onClick={() => onSelectProject(existingProject)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-purple-800 bg-purple-950/60 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-900 transition-colors"
                  >
                    Manage Active Collaboration
                  </button>
                ) : (
                  <button
                    onClick={() => onInitiateCollaboration(creator, activeShortlist)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/20 hover:from-purple-500 hover:to-indigo-500 transition-all active:scale-98"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send Brief Collaboration Request
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


