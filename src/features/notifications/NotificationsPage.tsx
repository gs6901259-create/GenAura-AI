/**
 * GenAura AI — Notifications Page
 * ================================
 * Displays categorized alerts for verification updates,
 * collaboration requests, and campaign brief matches.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import {
  Bell,
  CheckCheck,
  ShieldCheck,
  FileText,
  Users,
  Info,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function NotificationsPage() {
  const navigate = useNavigate();
  const notifications = useAppStore((s) => s.notifications) || [];
  const markNotificationRead = useAppStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useAppStore((s) => s.markAllNotificationsRead);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'verification':
        return <ShieldCheck size={16} className="text-amber-400" />;
      case 'brief':
        return <FileText size={16} className="text-cyan-400" />;
      case 'collaboration':
        return <Users size={16} className="text-violet-400" />;
      default:
        return <Info size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-50">Notifications</h1>
          <p className="text-xs text-navy-400 mt-1">
            Real-time activity across creator verifications, campaign briefs, and collaborations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-navy-950 p-1 border border-navy-800">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-md transition-all',
                filter === 'all'
                  ? 'bg-violet-600 text-white'
                  : 'text-navy-400 hover:text-navy-200'
              )}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-md transition-all',
                filter === 'unread'
                  ? 'bg-violet-600 text-white'
                  : 'text-navy-400 hover:text-navy-200'
              )}
            >
              Unread ({notifications.filter((n) => !n.read).length})
            </button>
          </div>

          <button
            onClick={() => markAllNotificationsRead()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy-900 border border-navy-700 text-navy-300 hover:text-white transition-all"
          >
            <CheckCheck size={14} />
            <span>Mark all read</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-navy-900 border border-navy-800 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-navy-800 text-navy-400 flex items-center justify-center mx-auto">
            <Bell size={24} />
          </div>
          <h3 className="font-bold text-sm text-navy-100">No notifications</h3>
          <p className="text-xs text-navy-400 max-w-sm mx-auto">
            You're all caught up! New alerts regarding campaign proposals and verification updates
            will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={cn(
                'p-4 rounded-xl border transition-all flex items-start justify-between gap-4',
                item.read
                  ? 'bg-navy-900/60 border-navy-800 text-navy-300'
                  : 'bg-navy-900 border-violet-500/40 text-navy-100 shadow-sm'
              )}
            >
              <div className="flex items-start gap-3.5">
                <div className="h-9 w-9 rounded-xl bg-navy-950 border border-navy-800 flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-navy-100">{item.title}</h3>
                    {!item.read && (
                      <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-navy-400 mt-1 leading-relaxed">{item.message}</p>
                  <span className="text-[10px] text-navy-500 mt-2 block">{item.timestamp}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.linkTo && (
                  <button
                    onClick={() => {
                      markNotificationRead(item.id);
                      navigate(item.linkTo!);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600/20 text-violet-300 hover:bg-violet-600 hover:text-white border border-violet-500/30 transition-all"
                  >
                    <span>View</span>
                    <ArrowRight size={13} />
                  </button>
                )}
                {!item.read && (
                  <button
                    onClick={() => markNotificationRead(item.id)}
                    className="p-1.5 text-navy-500 hover:text-navy-300"
                    title="Mark as read"
                  >
                    <CheckCheck size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
