/**
 * GenAura AI — Google OAuth Configuration & Diagnostic Modal
 * ============================================================
 * Displayed when Google OAuth Client credentials (VITE_GOOGLE_CLIENT_ID)
 * have not yet been provided in the environment. Explains step-by-step
 * Google Cloud setup instructions and offers simulated test flow.
 */
import { X, ExternalLink, ShieldAlert, Key, CheckCircle2, Play } from 'lucide-react';
import { GoogleIcon } from './GoogleIcon';
import { googleAuthService } from '@/services/googleAuthService';
import { UserPersona } from '@/types';

export interface GoogleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateDemo?: (role: UserPersona) => void;
}

export function GoogleConfigModal({ isOpen, onClose, onSimulateDemo }: GoogleConfigModalProps) {
  if (!isOpen) return null;

  const config = googleAuthService.getConfigStatus();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-config-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-left relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
          title="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <GoogleIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 id="google-config-title" className="font-bold text-base text-slate-900 dark:text-navy-50">
                Google OAuth Setup Required
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                Setup Mode
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-navy-400 mt-0.5">
              Live Google authentication requires a registered Google Cloud Client ID.
            </p>
          </div>
        </div>

        {/* Notice Card */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs leading-relaxed space-y-1">
          <div className="flex items-center gap-1.5 font-semibold">
            <ShieldAlert size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Missing Environment Variable: VITE_GOOGLE_CLIENT_ID</span>
          </div>
          <p className="text-[11px] opacity-90">
            To connect to live Google accounts, configure your OAuth credentials in <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono">.env</code>.
          </p>
        </div>

        {/* Configuration Steps */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-slate-800 dark:text-navy-200 block uppercase tracking-wider">
            Quick Setup Instructions:
          </span>
          <ol className="space-y-2 text-xs text-slate-600 dark:text-navy-300 list-decimal pl-4 leading-relaxed">
            <li>
              Visit the{' '}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="text-violet-600 dark:text-cyan-400 hover:underline font-semibold inline-flex items-center gap-0.5"
              >
                Google Cloud Credentials Console <ExternalLink size={11} />
              </a>
              .
            </li>
            <li>Configure your OAuth consent screen with App name <strong>"GenAura AI"</strong>.</li>
            <li>
              Create OAuth Client ID with <strong>Application type: Web application</strong>.
            </li>
            <li>
              Add Authorized JavaScript origin:
              <div className="mt-1 font-mono text-[11px] p-1.5 rounded bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-slate-800 dark:text-cyan-300 break-all select-all">
                {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}
              </div>
            </li>
            <li>
              Add Authorized redirect URI:
              <div className="mt-1 font-mono text-[11px] p-1.5 rounded bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-slate-800 dark:text-cyan-300 break-all select-all">
                {config.redirectUri}
              </div>
            </li>
            <li>
              Add to your local <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-navy-950 font-mono text-violet-600 dark:text-violet-300">.env</code> file:
              <div className="mt-1 font-mono text-[11px] p-1.5 rounded bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-slate-800 dark:text-emerald-400 break-all select-all">
                VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
              </div>
            </li>
            <li>Restart the local dev server (<code className="font-mono">npm run dev</code>).</li>
          </ol>
        </div>

        {/* Demo Simulation Option for Local Testing */}
        {onSimulateDemo && (
          <div className="pt-3 border-t border-slate-200 dark:border-navy-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 dark:text-navy-300 block">
              Or test Google OAuth Simulation locally:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onSimulateDemo('creator');
                  onClose();
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-violet-50 dark:hover:bg-violet-600/20 text-slate-800 dark:text-navy-200 border border-slate-200 dark:border-navy-700 hover:border-violet-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play size={13} className="text-violet-500" />
                <span>Simulate as Creator</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSimulateDemo('brand');
                  onClose();
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-cyan-50 dark:hover:bg-cyan-600/20 text-slate-800 dark:text-navy-200 border border-slate-200 dark:border-navy-700 hover:border-cyan-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play size={13} className="text-cyan-500" />
                <span>Simulate as Brand</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-200 dark:border-navy-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-navy-300 hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
