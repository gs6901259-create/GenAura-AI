import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar, MobileNav } from './Sidebar';
import { useAppStore } from '@/lib/store';
import { ROUTES, UserPersona } from '@/types';
import { Building2, Sparkles, ShieldCheck, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPersona = useAppStore((s) => s.currentPersona);
  const setPersona = useAppStore((s) => s.setPersona);
  const creators = useAppStore((s) => s.creators);
  const pendingCount = creators.filter((c) => c.verificationStatus === 'submitted').length;

  const handleSelectPersona = (persona: UserPersona) => {
    setPersona(persona);
    if (persona === 'creator' && !location.pathname.startsWith('/studio')) {
      navigate(ROUTES.studio);
    } else if (persona === 'admin' && !location.pathname.startsWith('/admin')) {
      navigate(ROUTES.adminVerification);
    } else if (persona === 'brand' && (location.pathname.startsWith('/studio') || location.pathname.startsWith('/admin'))) {
      navigate(ROUTES.discovery);
    }
  };

  return (
    <div className="flex min-h-screen bg-navy-950 text-slate-100 font-sans">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        <MobileNav />

        {/* Persona Switcher & App Status Header */}
        <header className="border-b border-navy-800 bg-navy-900/80 backdrop-blur-md px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
              Role:
            </span>
            <div className="inline-flex rounded-lg bg-navy-950 p-1 border border-navy-800">
              <button
                type="button"
                onClick={() => handleSelectPersona('brand')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all',
                  currentPersona === 'brand'
                    ? 'bg-violet-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                )}
                title="Brand / Marketer persona (Find creators, create briefs, track projects)"
              >
                <Building2 size={13} />
                <span>Brand Marketer</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPersona('creator')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all',
                  currentPersona === 'creator'
                    ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                )}
                title="Creator Studio persona (Build profile, manage portfolio, submit for verification)"
              >
                <Sparkles size={13} />
                <span>Creator Studio</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPersona('admin')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all relative',
                  currentPersona === 'admin'
                    ? 'bg-amber-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                )}
                title="Admin Reviewer persona (Audit verification queue, review 100-pt rubric)"
              >
                <ShieldCheck size={13} />
                <span>Admin Reviewer</span>
                {pendingCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400/30 text-amber-200 font-bold border border-amber-400/40">
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* AI Status Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-navy-950 px-2.5 py-1 rounded-full border border-navy-800">
              <Cpu size={12} className="text-cyan-400" />
              <span>AI Mode: <strong className="text-cyan-300 font-medium">Deterministic Rule-Based Fallback</strong> (Zero-Setup)</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          className="flex-1 p-4 lg:p-6 overflow-y-auto"
          id="main-content"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
