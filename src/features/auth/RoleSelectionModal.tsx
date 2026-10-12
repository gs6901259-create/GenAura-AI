/**
 * GenAura AI — New User Role Selection Screen
 * ============================================
 * Presented to new Google OAuth sign-ups to designate their marketplace role
 * (Content Creator vs Brand). Once selected, establishes stable account record
 * and initiates designated onboarding experience.
 */
import { useState } from 'react';
import { Palette, Building2, ArrowRight, Sparkles, CheckCircle2, Shield } from 'lucide-react';
import { GoogleProfile, UserPersona } from '@/types';
import { cn } from '@/lib/utils';

export interface RoleSelectionModalProps {
  isOpen: boolean;
  googleProfile: GoogleProfile;
  isLoading?: boolean;
  onSelectRole: (role: UserPersona) => void;
}

export function RoleSelectionModal({
  isOpen,
  googleProfile,
  isLoading = false,
  onSelectRole,
}: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserPersona>('creator');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onSelectRole(selectedRole);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-selection-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
    >
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl text-left relative animate-in fade-in zoom-in-95 duration-200">
        {/* Top Profile Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-200 dark:border-navy-800">
          <img
            src={
              googleProfile.picture ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop'
            }
            alt={googleProfile.name}
            className="h-12 w-12 rounded-full object-cover border-2 border-violet-500/40 shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-cyan-400">
                Google Verified Account
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-navy-50 truncate">
              {googleProfile.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-navy-400 truncate">{googleProfile.email}</p>
          </div>
        </div>

        {/* Title & Instructions */}
        <div className="space-y-1">
          <h2 id="role-selection-title" className="text-xl font-bold text-slate-900 dark:text-navy-50 tracking-tight">
            Select Your Marketplace Role
          </h2>
          <p className="text-xs text-slate-500 dark:text-navy-300 leading-relaxed">
            Welcome to GenAura AI! Google proves your identity, but your role determines your workspace.
            Select how you plan to use GenAura AI:
          </p>
        </div>

        {/* Role Options */}
        <div className="space-y-3">
          {/* Creator Role Card */}
          <div
            onClick={() => setSelectedRole('creator')}
            className={cn(
              'p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5',
              selectedRole === 'creator'
                ? 'bg-violet-50/80 dark:bg-violet-600/15 border-violet-600 dark:border-violet-500 shadow-md ring-1 ring-violet-500/30'
                : 'bg-white dark:bg-navy-950 border-slate-200 dark:border-navy-800 hover:border-slate-300 dark:hover:border-navy-700'
            )}
          >
            <div
              className={cn(
                'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                selectedRole === 'creator'
                  ? 'bg-violet-600 text-white shadow-glow-violet'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-navy-400'
              )}
            >
              <Palette size={20} />
            </div>

            <div className="flex-1 space-y-1 text-left">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-navy-100">
                  Content Creator / Artist
                </span>
                {selectedRole === 'creator' && (
                  <CheckCircle2 size={16} className="text-violet-600 dark:text-violet-400" />
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-navy-300 leading-relaxed">
                Build your studio profile, showcase portfolio case studies, pass our 100-point rubric, and get matched with leading brand campaigns.
              </p>
              <span className="inline-block text-[11px] font-semibold text-violet-700 dark:text-violet-300 mt-1">
                → Opens Creator Studio & Profile Setup
              </span>
            </div>
          </div>

          {/* Brand Role Card */}
          <div
            onClick={() => setSelectedRole('brand')}
            className={cn(
              'p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5',
              selectedRole === 'brand'
                ? 'bg-cyan-50/80 dark:bg-cyan-600/15 border-cyan-600 dark:border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                : 'bg-white dark:bg-navy-950 border-slate-200 dark:border-navy-800 hover:border-slate-300 dark:hover:border-navy-700'
            )}
          >
            <div
              className={cn(
                'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                selectedRole === 'brand'
                  ? 'bg-cyan-600 text-white shadow-glow-cyan'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-navy-400'
              )}
            >
              <Building2 size={20} />
            </div>

            <div className="flex-1 space-y-1 text-left">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-navy-100">
                  Brand / Marketer / Agency
                </span>
                {selectedRole === 'brand' && (
                  <CheckCircle2 size={16} className="text-cyan-600 dark:text-cyan-400" />
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-navy-300 leading-relaxed">
                Generate structured briefs with BriefGen AI, discover verified talent via 6-factor AuraMatch scoring, and negotiate in the Smart Deal Room.
              </p>
              <span className="inline-block text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 mt-1">
                → Opens Brand Dashboard & Brief Creator
              </span>
            </div>
          </div>
        </div>

        {/* Security & Verification Note */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-[11px] text-slate-500 dark:text-navy-400">
          <Shield size={14} className="text-violet-500 shrink-0" />
          <span>
            Marketplace creator verification remains separate from Google authentication and requires portfolio submission.
          </span>
        </div>

        {/* Confirm Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl gradient-brand text-white font-semibold text-sm shadow-glow-violet hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span>Initializing Workspace...</span>
            ) : (
              <>
                <span>Continue as {selectedRole === 'creator' ? 'Creator' : 'Brand'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
