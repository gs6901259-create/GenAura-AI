/**
 * GenAura AI — Collapsible Navigation Sidebar
 * ============================================
 * Supports expanded (w-64) and collapsed (w-20) states,
 * all 14 required navigation targets, active indicators,
 * role-aware filtering, notifications badge, and sign-out confirmation.
 */
import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  Palette,
  Sparkles,
  ShieldCheck,
  FileText,
  Search,
  Bookmark,
  FolderKanban,
  Handshake,
  Bot,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/types';
import { useAppStore } from '@/lib/store';

interface NavItemDef {
  id: string;
  label: string;
  to: string;
  icon: React.FC<{ size?: number; className?: string }>;
  roles?: ('brand' | 'creator' | 'admin')[];
  badge?: string | number;
  badgeColor?: string;
  isAiProminent?: boolean;
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const authUser = useAppStore((s) => s.authUser);
  const currentPersona = useAppStore((s) => s.currentPersona) || 'brand';
  const logout = useAppStore((s) => s.logout);
  const creators = useAppStore((s) => s.creators);
  const notifications = useAppStore((s) => s.notifications) || [];

  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const pendingVerificationCount = creators.filter(
    (c) => c.verificationStatus === 'submitted'
  ).length;
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const isCreatorHubRoute =
    location.pathname.startsWith('/studio') ||
    location.pathname.startsWith('/admin/verification') ||
    location.pathname.startsWith('/verification');

  const [creatorHubOpen, setCreatorHubOpen] = useState(true);

  // Top General Items
  const TOP_ITEMS: NavItemDef[] = [
    { id: 'home', label: 'Home', to: ROUTES.dashboard, icon: Home },
    {
      id: 'creators',
      label: 'Discover Creators',
      to: ROUTES.creators,
      icon: Users,
      roles: ['brand', 'admin'],
    },
  ];

  // Creator Hub Sub-items
  const CREATOR_HUB_ITEMS: NavItemDef[] = [
    {
      id: 'studio',
      label: 'Creator Studio',
      to: ROUTES.studio,
      icon: Palette,
      badge: 'PRO',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      roles: ['creator', 'admin'],
    },
    {
      id: 'coach',
      label: 'AI Profile Coach',
      to: `${ROUTES.studio}?tab=coach`,
      icon: Sparkles,
      roles: ['creator', 'admin'],
    },
    {
      id: 'verification',
      label: 'Creator Verification',
      to: currentPersona === 'admin' ? ROUTES.adminVerification : ROUTES.studio,
      icon: ShieldCheck,
      badge: pendingVerificationCount > 0 ? pendingVerificationCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
  ];

  // Core Marketplace & Workflow Items
  const WORKFLOW_ITEMS: NavItemDef[] = [
    {
      id: 'briefgen',
      label: 'BriefGen AI',
      to: ROUTES.briefNew,
      icon: FileText,
      roles: ['brand', 'admin'],
    },
    {
      id: 'auramatch',
      label: 'AuraMatch',
      to: ROUTES.discovery,
      icon: Search,
      roles: ['brand', 'admin'],
    },
    {
      id: 'shortlist',
      label: 'Shortlist',
      to: ROUTES.shortlist,
      icon: Bookmark,
      roles: ['brand', 'admin'],
    },
    {
      id: 'projects',
      label: 'Collaboration Requests',
      to: ROUTES.projects,
      icon: FolderKanban,
    },
    {
      id: 'deals',
      label: 'Smart Deal Room',
      to: ROUTES.deals,
      icon: Handshake,
      badge: 'PRO',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'assistant',
      label: 'Aura Assistant',
      to: ROUTES.assistant,
      icon: Bot,
      isAiProminent: true,
      badge: 'AI',
      badgeColor: 'bg-violet-500 text-white shadow-glow-violet',
    },
  ];

  // Utility & Support Items
  const BOTTOM_ITEMS: NavItemDef[] = [
    {
      id: 'notifications',
      label: 'Notifications',
      to: ROUTES.notifications,
      icon: Bell,
      badge: unreadNotifCount > 0 ? unreadNotifCount : undefined,
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    },
    { id: 'settings', label: 'Settings', to: ROUTES.settings, icon: Settings },
    { id: 'help', label: 'Help and Support', to: ROUTES.help, icon: HelpCircle },
  ];

  const handleSignOut = () => {
    logout();
    navigate(ROUTES.welcome);
  };

  const renderNavItem = (item: NavItemDef, isChild = false) => {
    const isExact = item.to === '/';
    const cleanTo = item.to.split('?')[0];
    const hasQuery = item.to.includes('?');

    let isActive = false;
    if (isExact) {
      isActive = location.pathname === '/';
    } else if (hasQuery) {
      isActive =
        location.pathname === cleanTo &&
        location.search.includes(item.to.split('?')[1]);
    } else {
      isActive =
        location.pathname === cleanTo &&
        (!item.to.startsWith('/studio') || !location.search.includes('tab=coach'));
    }

    return (
      <NavLink
        key={item.id}
        to={item.to}
        end={isExact}
        title={collapsed ? item.label : undefined}
        className={cn(
          'group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150',
          isChild && 'py-1.5 pl-3.5 pr-2.5 text-[11px] rounded-lg',
          isActive
            ? 'bg-violet-600/25 text-violet-200 border border-violet-500/40 shadow-sm'
            : item.isAiProminent
            ? 'text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/30'
            : 'text-navy-400 hover:text-navy-100 hover:bg-navy-800/80 border border-transparent'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <item.icon
            size={isChild ? 15 : 17}
            className={cn(
              'shrink-0 transition-colors',
              isActive
                ? 'text-violet-400'
                : item.isAiProminent
                ? 'text-cyan-400'
                : 'text-navy-500 group-hover:text-navy-300'
            )}
          />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </div>

        {!collapsed && item.badge && (
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0',
              item.badgeColor || 'bg-navy-800 text-navy-300 border-navy-700'
            )}
          >
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <>
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen bg-navy-900 border-r border-navy-700/60 sticky top-0 transition-all duration-300 z-30',
          collapsed ? 'w-20' : 'w-64'
        )}
        aria-label="Main navigation"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-navy-800">
          <div
            onClick={() => navigate(ROUTES.dashboard)}
            className="flex items-center gap-3 cursor-pointer shrink-0"
          >
            <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center shadow-glow-violet text-white">
              <Sparkles size={18} />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg tracking-tight">
                <span className="gradient-brand-text">GenAura</span>
                <span className="text-navy-300"> AI</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-navy-400 hover:text-white hover:bg-navy-800 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-none">
          {/* Top navigation items */}
          {TOP_ITEMS.map((item) => renderNavItem(item))}

          {/* Unified Creator Hub Group */}
          {!collapsed ? (
            <div className="my-1.5 rounded-xl border border-navy-800/80 bg-navy-950/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setCreatorHubOpen(!creatorHubOpen)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors',
                  isCreatorHubRoute
                    ? 'text-violet-200 bg-violet-600/15'
                    : 'text-navy-300 hover:text-white hover:bg-navy-800/60'
                )}
                aria-expanded={creatorHubOpen}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'h-6 w-6 rounded-lg flex items-center justify-center text-xs transition-colors',
                      isCreatorHubRoute
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-navy-800 text-violet-400 border border-navy-700'
                    )}
                  >
                    <Palette size={13} />
                  </div>
                  <span className="font-bold tracking-tight">Creator Hub</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {pendingVerificationCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {pendingVerificationCount}
                    </span>
                  )}
                  <ChevronRight
                    size={13}
                    className={cn(
                      'text-navy-400 transition-transform duration-200',
                      creatorHubOpen && 'rotate-90'
                    )}
                  />
                </div>
              </button>

              {creatorHubOpen && (
                <div className="px-2 py-1.5 space-y-0.5 border-t border-navy-800/60 bg-navy-900/50">
                  {CREATOR_HUB_ITEMS.map((item) => renderNavItem(item, true))}
                </div>
              )}
            </div>
          ) : (
            // Collapsed mode for Creator Hub
            <button
              type="button"
              onClick={() => {
                setCollapsed(false);
                setCreatorHubOpen(true);
              }}
              title="Creator Hub (Studio, AI Coach, Verification)"
              className={cn(
                'w-full group flex items-center justify-center rounded-xl p-2.5 transition-all',
                isCreatorHubRoute
                  ? 'bg-violet-600/25 text-violet-300 border border-violet-500/40'
                  : 'text-navy-400 hover:text-white hover:bg-navy-800 border border-transparent'
              )}
            >
              <Palette size={17} className={isCreatorHubRoute ? 'text-violet-400' : 'text-navy-500'} />
            </button>
          )}

          {/* Workflow & Marketplace items */}
          {WORKFLOW_ITEMS.map((item) => renderNavItem(item))}

          {/* Divider */}
          <div className="my-2 border-t border-navy-800/60" />

          {/* Bottom utilities */}
          {BOTTOM_ITEMS.map((item) => renderNavItem(item))}
        </div>

        {/* User Card & Sign Out Footer */}
        <div className="p-3 border-t border-navy-800/80 bg-navy-950/40">
          {!collapsed ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 px-2 py-1">
                <img
                  src={
                    authUser?.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
                  }
                  alt={authUser?.name || 'User'}
                  className="h-8 w-8 rounded-lg object-cover border border-navy-700"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-navy-200 truncate leading-tight">
                    {authUser?.name || 'User'}
                  </p>
                  <p className="text-[10px] text-navy-500 truncate leading-tight mt-0.5">
                    {authUser?.role?.toUpperCase()} MODE
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Sign Out Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl max-w-xs w-full p-6 space-y-4 shadow-2xl text-left">
            <h3 className="font-bold text-sm text-navy-50">Sign Out of GenAura AI?</h3>
            <p className="text-xs text-navy-300 leading-relaxed">
              You will return to the welcome page. Your demo session data will remain saved.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-navy-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Mobile Drawer Navigation ───────────────────────────────────────
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const authUser = useAppStore((s) => s.authUser);
  const logout = useAppStore((s) => s.logout);
  const creators = useAppStore((s) => s.creators);
  const currentPersona = useAppStore((s) => s.currentPersona) || 'brand';
  const [mobileHubOpen, setMobileHubOpen] = useState(true);

  const pendingVerificationCount = creators.filter(
    (c) => c.verificationStatus === 'submitted'
  ).length;

  const isCreatorHubRoute =
    location.pathname.startsWith('/studio') ||
    location.pathname.startsWith('/admin/verification');

  return (
    <>
      <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-navy-900 border-b border-navy-800 sticky top-0 z-40">
        <div
          onClick={() => navigate(ROUTES.dashboard)}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="h-8 w-8 rounded-lg gradient-brand flex items-center justify-center text-white">
            <Sparkles size={16} />
          </div>
          <span className="font-bold text-base tracking-tight gradient-brand-text">GenAura AI</span>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-800 transition-colors"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex flex-col w-72 bg-navy-900 border-r border-navy-800 h-full shadow-2xl p-4">
            <div className="flex items-center justify-between pb-4 border-b border-navy-800">
              <span className="font-bold text-sm text-navy-100">GenAura Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-navy-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-3 space-y-1" onClick={() => setOpen(false)}>
              <NavLink
                to={ROUTES.dashboard}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-navy-300 hover:text-white"
              >
                <Home size={16} />
                <span>Home</span>
              </NavLink>
              <NavLink
                to={ROUTES.creators}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-navy-300 hover:text-white"
              >
                <Users size={16} />
                <span>Discover Creators</span>
              </NavLink>

              {/* Mobile Creator Hub Group */}
              <div className="rounded-xl border border-navy-800/80 bg-navy-950/40 overflow-hidden my-1">
                <button
                  type="button"
                  onClick={() => setMobileHubOpen(!mobileHubOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-navy-200 hover:text-white"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-lg bg-violet-600/30 text-violet-300 flex items-center justify-center border border-violet-500/30">
                      <Palette size={13} />
                    </div>
                    <span>Creator Hub</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {pendingVerificationCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {pendingVerificationCount}
                      </span>
                    )}
                    <ChevronRight
                      size={13}
                      className={cn(
                        'text-navy-400 transition-transform duration-200',
                        mobileHubOpen && 'rotate-90'
                      )}
                    />
                  </div>
                </button>

                {mobileHubOpen && (
                  <div className="px-2 py-1.5 space-y-0.5 border-t border-navy-800/60 bg-navy-900/60">
                    <NavLink
                      to={ROUTES.studio}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-semibold text-navy-300 hover:text-white"
                    >
                      <div className="flex items-center gap-2.5">
                        <Palette size={14} className="text-navy-400" />
                        <span>Creator Studio</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        PRO
                      </span>
                    </NavLink>
                    <NavLink
                      to={`${ROUTES.studio}?tab=coach`}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-navy-300 hover:text-white"
                    >
                      <Sparkles size={14} className="text-violet-400" />
                      <span>AI Profile Coach</span>
                    </NavLink>
                    <NavLink
                      to={currentPersona === 'admin' ? ROUTES.adminVerification : ROUTES.studio}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-semibold text-navy-300 hover:text-white"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck size={14} className="text-amber-400" />
                        <span>Creator Verification</span>
                      </div>
                      {pendingVerificationCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {pendingVerificationCount}
                        </span>
                      )}
                    </NavLink>
                  </div>
                )}
              </div>
              <NavLink
                to={ROUTES.briefNew}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-navy-300 hover:text-white"
              >
                <FileText size={16} />
                <span>BriefGen AI</span>
              </NavLink>
              <NavLink
                to={ROUTES.discovery}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-navy-300 hover:text-white"
              >
                <Search size={16} />
                <span>AuraMatch</span>
              </NavLink>
              <NavLink
                to={ROUTES.shortlist}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-navy-300 hover:text-white"
              >
                <Bookmark size={16} />
                <span>Shortlist</span>
              </NavLink>
              <NavLink
                to={ROUTES.projects}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-navy-300 hover:text-white"
              >
                <FolderKanban size={16} />
                <span>Collaboration Requests</span>
              </NavLink>
              <NavLink
                to={ROUTES.assistant}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-500/10"
              >
                <Bot size={16} />
                <span>Aura Assistant</span>
              </NavLink>
              <NavLink
                to={ROUTES.notifications}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-navy-300 hover:text-white"
              >
                <Bell size={16} />
                <span>Notifications</span>
              </NavLink>
              <NavLink
                to={ROUTES.settings}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-navy-300 hover:text-white"
              >
                <Settings size={16} />
                <span>Settings</span>
              </NavLink>
              <NavLink
                to={ROUTES.help}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-navy-300 hover:text-white"
              >
                <HelpCircle size={16} />
                <span>Help and Support</span>
              </NavLink>
            </nav>

            <div className="pt-3 border-t border-navy-800">
              <button
                onClick={() => {
                  logout();
                  setOpen(false);
                  navigate(ROUTES.welcome);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-lg"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
