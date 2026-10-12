/**
 * GenAura AI — Upgraded Application Shell & Top Navigation Bar
 * =============================================================
 * Collapsible sidebar layout with persistent top navigation:
 * Breadcrumbs, Global Search, Notifications Dropdown,
 * Theme Toggle (Light/Dark/System), Persona Switcher, and User Menu.
 */
import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar, MobileNav } from './Sidebar';
import { useAppStore } from '@/lib/store';
import { ROUTES, UserPersona, ThemeMode } from '@/types';
import {
  Building2,
  Sparkles,
  ShieldCheck,
  Search,
  Bell,
  Sun,
  Moon,
  Laptop,
  User,
  Settings,
  LogOut,
  Bot,
  ExternalLink,
  ChevronDown,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DemoBanner } from '@/components/demo/DemoBanner';
import { demoService } from '@/services/demoService';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const theme = useAppStore((s) => s.theme) || 'dark';
  const setTheme = useAppStore((s) => s.setTheme);
  const authUser = useAppStore((s) => s.authUser);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const currentPersona = useAppStore((s) => s.currentPersona) || 'brand';
  const setPersona = useAppStore((s) => s.setPersona);
  const logout = useAppStore((s) => s.logout);
  const creators = useAppStore((s) => s.creators);
  const notifications = useAppStore((s) => s.notifications) || [];
  const markNotificationRead = useAppStore((s) => s.markNotificationRead);

  // Check if path requires authentication
  const isProtectedPath = (path: string) => {
    return (
      path.startsWith('/studio') ||
      path.startsWith('/verification') ||
      path.startsWith('/admin') ||
      path.startsWith('/briefs') ||
      path.startsWith('/projects') ||
      path.startsWith('/deals') ||
      path.startsWith('/settings') ||
      path.startsWith('/notifications') ||
      path.startsWith('/assistant')
    );
  };

  // Route protection: redirect unauthenticated users accessing protected routes to login
  useEffect(() => {
    if (!isAuthenticated && isProtectedPath(location.pathname)) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  const pendingCount = creators.filter((c) => c.verificationStatus === 'submitted').length;
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ensure demo data is loaded if Demo Mode is active
  useEffect(() => {
    if (demoService.isDemoModeActive()) {
      demoService.initializeDemoSeedIfNeeded();
      demoService.syncStoresWithDemoData();
    }
  }, []);

  // Compute breadcrumb / page title from location
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Overview';
    if (path.startsWith('/creators')) return 'Creator Directory';
    if (path.startsWith('/discovery')) return 'AuraMatch Discovery';
    if (path.startsWith('/studio')) return 'Creator Studio';
    if (path.startsWith('/admin')) return 'Admin Verification Queue';
    if (path.startsWith('/shortlist')) return 'Campaign Shortlist';
    if (path.startsWith('/briefs')) return 'BriefGen AI & Briefs';
    if (path.startsWith('/projects')) return 'Collaboration Projects';
    if (path.startsWith('/assistant')) return 'Aura Assistant';
    if (path.startsWith('/notifications')) return 'Platform Notifications';
    if (path.startsWith('/settings')) return 'Account Settings';
    if (path.startsWith('/help')) return 'Help & Support';
    return 'GenAura AI';
  };

  const handleSelectPersona = (persona: UserPersona) => {
    setPersona(persona);
    if (persona === 'creator' && !location.pathname.startsWith('/studio')) {
      navigate(ROUTES.studio);
    } else if (persona === 'admin' && !location.pathname.startsWith('/admin')) {
      navigate(ROUTES.adminVerification);
    } else if (
      persona === 'brand' &&
      (location.pathname.startsWith('/studio') || location.pathname.startsWith('/admin'))
    ) {
      navigate(ROUTES.discovery);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`${ROUTES.discovery}?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="flex min-h-screen bg-navy-950 text-slate-100 font-sans">
      {/* Desktop Persistent Sidebar */}
      <Sidebar />

      {/* Main Content Column */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Persistent Demo Mode Banner */}
        <DemoBanner />

        {/* Mobile Top Navigation */}
        <MobileNav />

        {/* Global Top Navigation Bar */}
        <header className="border-b border-navy-800 bg-navy-900/90 backdrop-blur-md px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 shadow-sm">
          {/* Left: Breadcrumbs & Title */}
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-navy-400">
                Workspace
              </span>
              <h2 className="text-sm font-bold text-navy-100 leading-none">{getPageTitle()}</h2>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center relative w-64 lg:w-80"
          >
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search creators, niches, briefs..."
              className="w-full pl-8 pr-12 py-1.5 bg-navy-950 border border-navy-800 rounded-lg text-xs text-navy-100 placeholder-navy-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-navy-500 bg-navy-900 px-1.5 py-0.5 rounded border border-navy-700">
              Ctrl K
            </kbd>
          </form>

          {/* Right: Controls, Notifications, Themes, and User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Persona Switcher Pill */}
            <div className="hidden sm:inline-flex rounded-lg bg-navy-950 p-0.5 border border-navy-800">
              <button
                type="button"
                onClick={() => handleSelectPersona('brand')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all',
                  currentPersona === 'brand'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-navy-400 hover:text-navy-200'
                )}
                title="Switch to Brand Marketer Persona"
              >
                <Building2 size={12} />
                <span>Brand</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPersona('creator')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all',
                  currentPersona === 'creator'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-navy-400 hover:text-navy-200'
                )}
                title="Switch to Creator Studio Persona"
              >
                <Sparkles size={12} />
                <span>Creator</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPersona('admin')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all relative',
                  currentPersona === 'admin'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-navy-400 hover:text-navy-200'
                )}
                title="Switch to Admin Reviewer Persona"
              >
                <ShieldCheck size={12} />
                <span>Admin</span>
                {pendingCount > 0 && (
                  <span className="ml-1 px-1 py-0.2 rounded-full text-[9px] bg-amber-400/30 text-amber-200 font-bold border border-amber-400/40">
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Theme Toggle Buttons */}
            <div className="flex items-center rounded-lg bg-navy-950 p-0.5 border border-navy-800">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={cn(
                  'p-1.5 rounded transition-all',
                  theme === 'light'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-navy-400 hover:text-navy-200'
                )}
                title="Light Mode"
              >
                <Sun size={13} />
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={cn(
                  'p-1.5 rounded transition-all',
                  theme === 'dark'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-navy-400 hover:text-navy-200'
                )}
                title="Dark Mode"
              >
                <Moon size={13} />
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={cn(
                  'p-1.5 rounded transition-all',
                  theme === 'system'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-navy-400 hover:text-navy-200'
                )}
                title="System Mode"
              >
                <Laptop size={13} />
              </button>
            </div>

            {/* Notifications Menu Trigger */}
            <div className="relative" ref={notifMenuRef}>
              <button
                type="button"
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="p-1.5 rounded-lg text-navy-400 hover:text-white hover:bg-navy-800 transition-colors relative"
                title="Notifications"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-navy-900 border border-navy-700 shadow-2xl p-3 z-50 animate-fadeIn text-left">
                  <div className="flex items-center justify-between pb-2 border-b border-navy-800 px-1">
                    <span className="text-xs font-bold text-navy-100">Notifications</span>
                    <button
                      onClick={() => {
                        setShowNotifMenu(false);
                        navigate(ROUTES.notifications);
                      }}
                      className="text-[11px] text-violet-400 hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="py-2 space-y-1.5 max-h-60 overflow-y-auto">
                    {notifications.slice(0, 3).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          setShowNotifMenu(false);
                          if (n.linkTo) navigate(n.linkTo);
                        }}
                        className="p-2 rounded-lg bg-navy-950/70 hover:bg-navy-800 border border-navy-800/80 cursor-pointer transition-colors"
                      >
                        <p className="text-xs font-semibold text-navy-200">{n.title}</p>
                        <p className="text-[11px] text-navy-400 line-clamp-1">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar & Dropdown Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-navy-800 transition-colors"
              >
                <img
                  src={
                    authUser?.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
                  }
                  alt={authUser?.name || 'User'}
                  className="h-7 w-7 rounded-lg object-cover border border-navy-700"
                />
                <ChevronDown size={13} className="text-navy-400 hidden sm:inline" />
              </button>

              {/* User Dropdown Panel */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-navy-900 border border-navy-700 shadow-2xl p-2 z-50 animate-fadeIn text-left">
                  <div className="px-3 py-2 border-b border-navy-800">
                    <p className="text-xs font-bold text-navy-100 truncate">
                      {authUser?.name || 'User Account'}
                    </p>
                    <p className="text-[11px] text-navy-400 truncate">
                      {authUser?.email || 'user@genaura.ai'}
                    </p>
                    <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      {authUser?.role || currentPersona}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate(ROUTES.settings);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-navy-300 hover:text-white hover:bg-navy-800 rounded-lg"
                    >
                      <Settings size={14} />
                      <span>Account Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate(ROUTES.assistant);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-cyan-300 hover:bg-cyan-500/10 rounded-lg"
                    >
                      <Bot size={14} />
                      <span>Ask Aura Assistant</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-navy-800">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                        navigate(ROUTES.welcome);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg font-medium"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
