import React from 'react';
import {
  CollaborationProject,
} from '@/contracts/collaborationContract';
import { CreatorProfile } from '@/contracts/discoveryContract';
import { CampaignBrief } from '@/contracts/briefContract';
import { StatusBadge } from '@/components/collaboration/common/StatusBadge';
import {
  ExternalLink,
  Video,
  Calendar,
  DollarSign,
  ArrowRight,
  Eye,
} from 'lucide-react';

interface CollaborationTableProps {
  projects: CollaborationProject[];
  creators: CreatorProfile[];
  briefs: CampaignBrief[];
  onSelectProject: (project: CollaborationProject) => void;
  onSimulateCreatorView: (creatorId: string) => void;
}

export const CollaborationTable: React.FC<CollaborationTableProps> = ({
  projects,
  creators,
  briefs,
  onSelectProject,
  onSimulateCreatorView,
}) => {
  const creatorMap = new Map(creators.map((c) => [c.id, c]));
  const briefMap = new Map(briefs.map((b) => [b.id, b]));

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center backdrop-blur-md">
        <div className="rounded-full bg-slate-800 p-3 text-slate-400">
          <Video className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-slate-200">
          No collaboration workflows found
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          Try resetting your search query or filters, or dispatch a new project request.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-5 py-3.5">Creator & Handle</th>
              <th className="px-5 py-3.5">Project & Linked Brief</th>
              <th className="px-5 py-3.5">Deliverables</th>
              <th className="px-5 py-3.5">Compensation</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Timeline</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {projects.map((p) => {
              const creator = creatorMap.get(p.creatorId);
              const brief = briefMap.get(p.briefId);

              return (
                <tr
                  key={p.id}
                  className="group transition-colors hover:bg-slate-850/80"
                >
                  {/* Creator */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img
                        src={creator?.avatarUrl}
                        alt={creator?.name}
                        className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-700"
                      />
                      <div>
                        <div className="font-semibold text-white">
                          {creator?.name || 'Unknown Creator'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {creator?.handle}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Project & Brief */}
                  <td className="px-5 py-4 max-w-xs">
                    <div className="font-medium text-slate-200 line-clamp-1 group-hover:text-purple-300 transition-colors">
                      {p.title}
                    </div>
                    {brief && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-purple-400">
                        <span className="truncate">📋 {brief.title}</span>
                      </div>
                    )}
                  </td>

                  {/* Deliverables */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-slate-200">
                        {p.deliverables.length} Deliverable{p.deliverables.length > 1 ? 's' : ''}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        {p.deliverables.map((d) => (
                          <span
                            key={d.id}
                            className="rounded-md bg-slate-800 px-1.5 py-0.5 text-slate-300 font-mono"
                          >
                            {d.platform}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>

                  {/* Compensation */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-bold text-emerald-400">
                      ${p.compensation.amount.toLocaleString()}{' '}
                      <span className="text-[10px] font-normal text-slate-400">
                        {p.compensation.currency}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">
                      {p.compensation.type}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <StatusBadge status={p.status} size="sm" />
                  </td>

                  {/* Timeline */}
                  <td className="px-5 py-4 whitespace-nowrap text-[11px] text-slate-400">
                    <div className="flex items-center gap-1 text-slate-300">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      Draft: {new Date(p.targetDraftDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Publish: {new Date(p.targetPublishDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      {p.status === 'sent' && (
                        <button
                          onClick={() => onSimulateCreatorView(p.creatorId)}
                          className="rounded-lg bg-emerald-950/70 border border-emerald-800 px-2.5 py-1 text-[11px] font-medium text-emerald-300 hover:bg-emerald-900 transition-colors"
                          title="Simulate creator accept or decline"
                        >
                          Simulate POV
                        </button>
                      )}

                      <button
                        onClick={() => onSelectProject(p)}
                        className="flex items-center gap-1 rounded-lg bg-purple-950/70 border border-purple-800 px-2.5 py-1 text-[11px] font-semibold text-purple-300 hover:bg-purple-900 hover:text-white transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        Manage
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};


