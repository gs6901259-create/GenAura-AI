/**
 * GenAura AI — Presentation-Ready Demo Banner & Role Switcher
 * =============================================================
 * Persistent top bar displayed when Demo Mode is active.
 *
 * Features:
 * - Subtle, prominent badge: "DEMO MODE — Sample data; actions are simulated"
 * - Active Role Indicator
 * - 1-Click Role Switcher (Brand Demo, Creator Demo, Admin Demo)
 * - Reset Demo Data with confirmation modal (restores canonical seed)
 * - Exit Demo action (returns cleanly to Welcome portal)
 * - Transparency notice for simulated metrics and fictional profiles
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { demoService } from '@/services/demoService';
import { useAppStore } from '@/lib/store';
import { UserPersona, ROUTES } from '@/types';
import {
  Sparkles,
  Building2,
  Palette,
  ShieldCheck,
  RotateCcw,
  LogOut,
  Info,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const DemoBanner: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isActive, setIsActive] = useState(() => demoService.isDemoModeActive());
  const [activeRole, setActiveRole] = useState<UserPersona>(() => demoService.getDemoRole());
  const [showResetModal, setShowResetModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Subscribe to demoService changes
  useEffect(() => {
    const unsubscribe = demoService.subscribe(() => {
      setIsActive(demoService.isDemoModeActive());
      setActiveRole(demoService.getDemoRole());
    });
    return unsubscribe;
  }, []);

  if (!isActive) return null;

  const handleRoleSwitch = (targetRole: UserPersona) => {
    demoService.switchDemoRole(targetRole);
    if (targetRole === 'creator') {
      navigate(ROUTES.studio);
    } else if (targetRole === 'admin') {
      navigate(ROUTES.adminVerification);
    } else {
      navigate(ROUTES.dashboard);
    }
  };

  const handleConfirmReset = () => {
    const success = demoService.resetDemoData();
    setShowResetModal(false);
    if (success) {
      setResetSuccessMessage('Demo data restored to canonical seed state (14 creators, 8 briefs, 8 deals).');
      setTimeout(() => setResetSuccessMessage(null), 4000);
    }
  };

  const handleExitDemo = () => {
    demoService.exitDemo();
    navigate('/welcome');
  };

  return (
    <>
      <div className="bg-gradient-to-r from-violet-950 via-navy-950 to-indigo-950 border-b border-violet-500/30 px-3 sm:px-6 py-2 text-xs text-navy-200 sticky top-0 z-50 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Mode Badge & Disclaimer */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold text-[11px] tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              DEMO MODE
            </span>
            <span className="hidden md:inline text-navy-400 font-medium">
              Sample data; actions are simulated.
            </span>
            <button
              type="button"
              onClick={() => setShowInfoModal(true)}
              aria-label="View demo transparency notice"
              className="text-navy-400 hover:text-violet-300 transition-colors p-0.5 rounded"
              title="Click for demo details & simulated data disclosures"
            >
              <Info size={13} />
            </button>
          </div>

          {/* Center: 1-Click Role Switcher */}
          <div className="flex items-center gap-1 bg-navy-900/80 p-0.5 rounded-lg border border-navy-800">
            <button
              type="button"
              onClick={() => handleRoleSwitch('brand')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all',
                activeRole === 'brand'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-navy-400 hover:text-navy-200'
              )}
            >
              <Building2 size={12} className={activeRole === 'brand' ? 'text-white' : 'text-violet-400'} />
              <span>Brand Demo</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSwitch('creator')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all',
                activeRole === 'creator'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-navy-400 hover:text-navy-200'
              )}
            >
              <Palette size={12} className={activeRole === 'creator' ? 'text-white' : 'text-cyan-400'} />
              <span>Creator Demo</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSwitch('admin')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all',
                activeRole === 'admin'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-navy-400 hover:text-navy-200'
              )}
            >
              <ShieldCheck size={12} className={activeRole === 'admin' ? 'text-white' : 'text-amber-400'} />
              <span>Admin Demo</span>
            </button>
          </div>

          {/* Right: Reset Data & Exit Demo */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-navy-900/80 hover:bg-rose-500/20 border border-navy-700/80 hover:border-rose-500/40 text-navy-300 hover:text-rose-300 text-[11px] font-medium transition-all"
              title="Reset demo data to canonical seed state"
            >
              <RotateCcw size={12} />
              <span>Reset Demo Data</span>
            </button>

            <button
              type="button"
              onClick={handleExitDemo}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-navy-900/80 hover:bg-navy-800 border border-navy-700/80 text-navy-400 hover:text-navy-200 text-[11px] font-medium transition-all"
              title="Exit demo mode and return to welcome portal"
            >
              <LogOut size={12} />
              <span>Exit Demo</span>
            </button>
          </div>
        </div>

        {/* Transient Reset Success Alert */}
        {resetSuccessMessage && (
          <div className="max-w-7xl mx-auto mt-1 px-2 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded text-emerald-300 text-[11px] flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>{resetSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setResetSuccessMessage(null)}
              className="text-emerald-400 hover:text-white"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* ── Reset Confirmation Modal ── */}
      {showResetModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Demo Data Reset"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowResetModal(false);
          }}
        >
          <div className="bg-navy-900 border border-navy-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-navy-50">Reset Demo Data?</h3>
                <p className="text-xs text-navy-300 leading-relaxed">
                  This will discard simulated briefs, proposals, counteroffers, or edits made during this demo session and restore the clean canonical dataset:
                </p>
                <ul className="text-xs text-navy-400 list-disc list-inside space-y-0.5 pt-1">
                  <li>14 Fictional Creator Profiles across 9 niches</li>
                  <li>8 Campaign Briefs across varied industries</li>
                  <li>8 Smart Collaboration Deals in all lifecycle states</li>
                  <li>5 Notifications & representative settings</li>
                </ul>
                <p className="text-[11px] text-navy-500 pt-1">
                  * Isolated to Demo storage only. Real accounts and non-demo records are never modified.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-navy-800">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-navy-300 hover:text-white bg-navy-800/80 hover:bg-navy-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-md transition-all flex items-center gap-1.5"
              >
                <RotateCcw size={13} />
                <span>Reset to Fresh Seed</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Demo Transparency & Disclosures Modal ── */}
      {showInfoModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Demo Transparency and Simulated Disclosures"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowInfoModal(false);
          }}
        >
          <div className="bg-navy-900 border border-navy-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-navy-800">
              <div className="flex items-center gap-2 text-violet-400">
                <Sparkles size={18} />
                <h3 className="text-base font-bold text-navy-50">Demo Mode Disclosures</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="text-navy-400 hover:text-white p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-navy-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-navy-950/60 border border-navy-800 space-y-1">
                <div className="font-semibold text-navy-100">Fictional Sample Data</div>
                <p className="text-navy-400">
                  All creators, brand identities, follower counts, engagement benchmarks, portfolio examples, customer reviews, and campaign budgets are fictional simulations constructed for evaluation.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-navy-950/60 border border-navy-800 space-y-1">
                <div className="font-semibold text-navy-100">Deterministic Match Scoring</div>
                <p className="text-navy-400">
                  Where live AI services are unconfigured, AuraMatch uses an explainable 6-factor deterministic scoring engine (Niche 30%, Audience 20%, Budget 20%, Platform 15%, Portfolio 10%, Location 5%).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-navy-950/60 border border-navy-800 space-y-1">
                <div className="font-semibold text-navy-100">Simulated Transactions & Storage</div>
                <p className="text-navy-400">
                  No real payments, emails, or third-party API mutations occur. Actions are stored locally in isolated namespaced keys (<code className="text-violet-300">genaura_demo_*</code>).
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-navy-800">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
