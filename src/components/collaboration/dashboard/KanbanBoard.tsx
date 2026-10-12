import React from 'react';
import {
  CollaborationProject,
  CollaborationStatus,
} from '@/contracts/collaborationContract';
import { CreatorProfile } from '@/contracts/discoveryContract';
import { CampaignBrief } from '@/contracts/briefContract';
import { StatusBadge } from '@/components/collaboration/common/StatusBadge';
import {
  Clock,
  DollarSign,
  Video,
  FileCheck,
  Calendar,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface KanbanBoardProps {
  projects: CollaborationProject[];
  creators: CreatorProfile[];
  briefs: CampaignBrief[];
  onSelectProject: (project: CollaborationProject) => void;
}

interface ColumnConfig {
  id: string;
  title: string;
  statuses: CollaborationStatus[];
  badgeColor: string;
}

const KANBAN_COLUMNS: ColumnConfig[] = [
  {
    id: 'sent',
    title: 'Awaiting Decision',
    statuses: ['sent'],
    badgeColor: 'border-amber-700/60 bg-amber-950/40 text-amber-300',
  },
  {
    id: 'active',
    title: 'Accepted & In Progress',
    statuses: ['accepted', 'in_progress'],
    badgeColor: 'border-blue-700/60 bg-blue-950/40 text-blue-300',
  },
  {
    id: 'review',
    title: 'Content Review',
    statuses: ['submitted', 'revision_requested'],
    badgeColor: 'border-purple-700/60 bg-purple-950/40 text-purple-300',
  },
  {
    id: 'completed',
    title: 'Completed & Live',
    statuses: ['completed'],
    badgeColor: 'border-teal-700/60 bg-teal-950/40 text-teal-300',
  },
  {
    id: 'declined',
    title: 'Declined / Other',
    statuses: ['declined', 'cancelled', 'draft'],
    badgeColor: 'border-rose-700/60 bg-rose-950/40 text-rose-300',
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projects,
  creators,
  briefs,
  onSelectProject,
}) => {
  const creatorMap = new Map(creators.map((c) => [c.id, c]));
  const briefMap = new Map(briefs.map((b) => [b.id, b]));

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-5">
      {KANBAN_COLUMNS.map((col) => {
        const columnProjects = projects.filter((p) =>
          col.statuses.includes(p.status)
        );

        return (
          <div
            key={col.id}
            className="glass-card flex flex-col rounded-2xl p-3.5"
          >
            {/* Column Header */}
            <div className="mb-3.5 flex items-center justify-between pb-2 border-b border-navy-700/60">
              <span className="text-xs font-semibold text-navy-200">
                {col.title}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold border ${col.badgeColor}`}
              >
                {columnProjects.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="flex flex-col gap-3 min-h-[300px]">
              {columnProjects.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-navy-700/60 p-4 text-center text-xs text-navy-400">
                  No projects in this stage
                </div>
              ) : (
                columnProjects.map((project) => {
                  const creator = creatorMap.get(project.creatorId);
                  const brief = briefMap.get(project.briefId);

                  return (
                    <div
                      key={project.id}
                      onClick={() => onSelectProject(project)}
                      className="group cursor-pointer rounded-xl border border-navy-700/60 bg-navy-900/90 p-4 shadow-md transition-all hover:-translate-y-0.5 hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-950/20"
                    >
                      {/* Creator info header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={creator?.avatarUrl}
                            alt={creator?.name}
                            className="h-7 w-7 rounded-full object-cover ring-1 ring-navy-600"
                          />
                          <div className="truncate">
                            <h4 className="text-xs font-bold text-navy-50 truncate max-w-[120px]">
                              {creator?.name}
                            </h4>
                            <p className="text-[10px] text-navy-400">
                              {creator?.handle}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={project.status} size="sm" />
                      </div>

                      {/* Project title */}
                      <h5 className="mt-3 text-xs font-semibold text-navy-100 line-clamp-2 leading-relaxed">
                        {project.title}
                      </h5>

                      {/* Brief pill */}
                      {brief && (
                        <div className="mt-2.5">
                          <span className="inline-block rounded-md bg-purple-950/60 px-2 py-0.5 text-[10px] font-medium text-purple-300 border border-purple-800/50 truncate max-w-full">
                            📋 {brief.title}
                          </span>
                        </div>
                      )}

                      {/* Deliverables summary */}
                      <div className="mt-3 flex items-center gap-3 text-[11px] text-navy-400 border-t border-navy-700/60 pt-2.5">
                        <span className="flex items-center gap-1 font-medium text-navy-200">
                          <Video className="h-3.5 w-3.5 text-purple-400" />
                          {project.deliverables.length} deliv.
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-emerald-400">
                          ${project.compensation.amount.toLocaleString()}
                        </span>
                      </div>

                      {/* Timeline notice */}
                      <div className="mt-2 flex items-center justify-between text-[10px] text-navy-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-navy-500" />
                          Due: {new Date(project.targetDraftDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>

                        <span className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center font-medium">
                          Details <ArrowRight className="h-3 w-3 ml-0.5" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};


