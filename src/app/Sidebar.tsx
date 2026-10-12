import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Search,
  Bookmark,
  FileText,
  FolderKanban,
  Settings,
  Sparkles,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/types';
import { useState } from 'react';
import { useAppStore } from '@/lib/store';

interface NavItem {
  label: string;
  to: string;
  icon: React.FC<{ size?: number; className?: string }>;
  badge?: number | string;
  badgeColor?: string;
}

const BRAND_ITEMS: NavItem[] = [
  { label: 'Dashboard',  to: ROUTES.dashboard,  icon: LayoutDashboard },
  { label: 'Creators',   to: ROUTES.creators,   icon: Users },
  { label: 'Discovery',  to: ROUTES.discovery,  icon: Search },
  { label: 'Shortlist',  to: ROUTES.shortlist,  icon: Bookmark },
  { label: 'Briefs',     to: ROUTES.briefs,     icon: FileText },
  { label: 'Projects',   to: ROUTES.projects,   icon: FolderKanban },
];

const CREATOR_ITEMS: NavItem[] = [
  { label: 'Creator Studio', to: ROUTES.studio, icon: Sparkles, badge: 'PRO', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: 'Settings', to: ROUTES.settings, icon: Settings },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-5 shrink-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand shadow-[0_0_12px_rgba(139,92,246,0.5)]">
        <Sparkles size={16} className="text-white" />
      </div>
      <span className="font-bold text-lg tracking-tight">
        <span className="gradient-brand-text">GenAura</span>
        <span className="text-navy-300"> AI</span>
      </span>
    </div>
  );
}

function NavItemRow({ item, collapsed }: { item: NavItem; collapsed?: boolean }) {
  const location = useLocation();
  const isActive =
    item.to === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(item.to);

  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={cn(
        'group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
          : 'text-navy-400 hover:text-navy-100 hover:bg-navy-800 border border-transparent'
      )}
      title={collapsed ? item.label : undefined}
    >
      <div className="flex items-center gap-3">
        <item.icon
          size={18}
          className={cn(
            'shrink-0 transition-colors duration-150',
            isActive ? 'text-violet-400' : 'text-navy-500 group-hover:text-navy-300'
          )}
        />
        {!collapsed && <span>{item.label}</span>}
      </div>
      {!collapsed && item.badge && (
        <span
          className={cn(
            'px-1.5 py-0.5 rounded text-[10px] font-semibold border',
            item.badgeColor || 'bg-violet-500/20 text-violet-300 border-violet-500/30'
          )}
        >
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

// ── Desktop Sidebar ───────────────────────────────────────────────
export function Sidebar() {
  const creators = useAppStore((s) => s.creators);
  const pendingCount = creators.filter((c) => c.verificationStatus === 'submitted').length;

  const adminItems: NavItem[] = [
    {
      label: 'Admin Review',
      to: ROUTES.adminVerification,
      icon: ShieldCheck,
      badge: pendingCount > 0 ? pendingCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
  ];

  return (
    <aside
      className="hidden lg:flex flex-col h-screen w-60 bg-navy-900 border-r border-navy-700/50 sticky top-0"
      aria-label="Main navigation"
    >
      <Logo />

      <div className="px-3 pb-1 flex-1 overflow-y-auto space-y-4">
        <div>
          <p className="px-3 text-[10px] uppercase tracking-widest text-navy-500 font-bold mb-1.5">
            Brand Portal
          </p>
          <nav className="flex flex-col gap-0.5">
            {BRAND_ITEMS.map((item) => (
              <NavItemRow key={item.to} item={item} />
            ))}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[10px] uppercase tracking-widest text-navy-500 font-bold mb-1.5">
            Creator Workspace
          </p>
          <nav className="flex flex-col gap-0.5">
            {CREATOR_ITEMS.map((item) => (
              <NavItemRow key={item.to} item={item} />
            ))}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[10px] uppercase tracking-widest text-navy-500 font-bold mb-1.5">
            Administration
          </p>
          <nav className="flex flex-col gap-0.5">
            {adminItems.map((item) => (
              <NavItemRow key={item.to} item={item} />
            ))}
          </nav>
        </div>
      </div>

      <div className="mt-auto px-3 pb-4 pt-2 border-t border-navy-700/50">
        <nav className="flex flex-col gap-0.5">
          {BOTTOM_ITEMS.map((item) => (
            <NavItemRow key={item.to} item={item} />
          ))}
        </nav>
      </div>
    </aside>
  );
}

// ── Mobile Top Bar + Drawer ───────────────────────────────────────
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const creators = useAppStore((s) => s.creators);
  const pendingCount = creators.filter((c) => c.verificationStatus === 'submitted').length;

  const adminItems: NavItem[] = [
    {
      label: 'Admin Review',
      to: ROUTES.adminVerification,
      icon: ShieldCheck,
      badge: pendingCount > 0 ? pendingCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
  ];

  return (
    <>
      {/* Top bar */}
      <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-navy-900 border-b border-navy-700/50 sticky top-0 z-40">
        <Logo />
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-800 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal
          aria-label="Navigation"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex flex-col w-64 bg-navy-900 border-r border-navy-700/50 h-full shadow-xl">
            <div className="flex items-center justify-between px-4 py-5">
              <Logo />
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-navy-400 hover:text-white hover:bg-navy-800 transition-colors"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-3 flex-1 overflow-y-auto space-y-4">
              <div>
                <p className="px-3 text-[10px] uppercase tracking-widest text-navy-500 font-bold mb-1.5">
                  Brand Portal
                </p>
                <nav className="flex flex-col gap-0.5" onClick={() => setOpen(false)}>
                  {BRAND_ITEMS.map((item) => (
                    <NavItemRow key={item.to} item={item} />
                  ))}
                </nav>
              </div>

              <div>
                <p className="px-3 text-[10px] uppercase tracking-widest text-navy-500 font-bold mb-1.5">
                  Creator Workspace
                </p>
                <nav className="flex flex-col gap-0.5" onClick={() => setOpen(false)}>
                  {CREATOR_ITEMS.map((item) => (
                    <NavItemRow key={item.to} item={item} />
                  ))}
                </nav>
              </div>

              <div>
                <p className="px-3 text-[10px] uppercase tracking-widest text-navy-500 font-bold mb-1.5">
                  Administration
                </p>
                <nav className="flex flex-col gap-0.5" onClick={() => setOpen(false)}>
                  {adminItems.map((item) => (
                    <NavItemRow key={item.to} item={item} />
                  ))}
                </nav>
              </div>
            </div>

            <div className="px-3 pb-4 pt-2 border-t border-navy-700/50">
              <nav className="flex flex-col gap-0.5" onClick={() => setOpen(false)}>
                {BOTTOM_ITEMS.map((item) => (
                  <NavItemRow key={item.to} item={item} />
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
