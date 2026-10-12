import React from 'react';
import { DealActivity } from '@/types/deal';
import {
  Send,
  Sparkles,
  GitPullRequest,
  CheckCircle2,
  XCircle,
  RotateCcw,
  PlayCircle,
  Award,
  MessageSquare,
  FileCheck,
  Clock,
} from 'lucide-react';

interface DealActivityTimelineProps {
  activities: DealActivity[];
}

const activityIconMap: Record<string, React.FC<{ className?: string }>> = {
  created: Sparkles,
  sent: Send,
  counteroffered: GitPullRequest,
  accepted: CheckCircle2,
  declined: XCircle,
  withdrawn: RotateCcw,
  in_progress: PlayCircle,
  completed: Award,
  message_added: MessageSquare,
  amended: FileCheck,
};

const activityColorMap: Record<string, { bg: string; text: string; border: string }> = {
  created: { bg: 'bg-navy-800', text: 'text-navy-300', border: 'border-navy-700' },
  sent: { bg: 'bg-amber-950/60', text: 'text-amber-400', border: 'border-amber-800/80' },
  counteroffered: { bg: 'bg-violet-950/70', text: 'text-violet-400', border: 'border-violet-700/80' },
  accepted: { bg: 'bg-emerald-950/60', text: 'text-emerald-400', border: 'border-emerald-800/80' },
  declined: { bg: 'bg-rose-950/60', text: 'text-rose-400', border: 'border-rose-800/80' },
  withdrawn: { bg: 'bg-zinc-900', text: 'text-zinc-400', border: 'border-zinc-700' },
  in_progress: { bg: 'bg-cyan-950/60', text: 'text-cyan-400', border: 'border-cyan-800/80' },
  completed: { bg: 'bg-teal-950/60', text: 'text-teal-400', border: 'border-teal-800/80' },
  message_added: { bg: 'bg-navy-800/80', text: 'text-blue-400', border: 'border-navy-700' },
  amended: { bg: 'bg-indigo-950/60', text: 'text-indigo-400', border: 'border-indigo-800' },
};

export const DealActivityTimeline: React.FC<DealActivityTimelineProps> = ({ activities }) => {
  if (activities.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-navy-400">
        No activities recorded yet for this deal.
      </div>
    );
  }

  return (
    <div className="space-y-4 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-navy-800/80">
      {activities.map((act) => {
        const Icon = activityIconMap[act.type] || Clock;
        const color = activityColorMap[act.type] || {
          bg: 'bg-navy-800',
          text: 'text-navy-400',
          border: 'border-navy-700',
        };

        const formattedDate = new Date(act.timestamp).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div key={act.id} className="relative flex items-start gap-3.5 pl-1 group">
            {/* Timeline node */}
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 border z-10 transition-transform group-hover:scale-110 ${color.bg} ${color.text} ${color.border}`}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>

            {/* Event content */}
            <div className="flex-1 bg-navy-900/60 border border-navy-800/60 rounded-xl p-3 space-y-1 transition-all group-hover:border-navy-700">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-navy-100">{act.actorName}</span>
                  <span
                    className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${
                      act.actorRole === 'brand'
                        ? 'bg-violet-950/80 text-violet-300 border border-violet-800/60'
                        : act.actorRole === 'creator'
                        ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                        : 'bg-navy-800 text-navy-400'
                    }`}
                  >
                    {act.actorRole}
                  </span>
                </div>
                <span className="text-[11px] text-navy-400 font-mono">{formattedDate}</span>
              </div>

              <p className="text-xs text-navy-300 leading-relaxed">{act.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
