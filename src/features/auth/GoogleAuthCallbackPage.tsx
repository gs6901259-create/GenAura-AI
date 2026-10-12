/**
 * GenAura AI — Google OAuth 2.0 Callback Handler
 * ===============================================
 * Receives the authorized callback from Google OAuth, validates
 * anti-CSRF state and tokens, handles new user role selection,
 * or re-authenticates existing Google users to their dashboard.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { googleAuthService } from '@/services/googleAuthService';
import { GoogleProfile, UserPersona, ROUTES } from '@/types';
import { RoleSelectionModal } from './RoleSelectionModal';
import { Sparkles, AlertCircle, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export function GoogleAuthCallbackPage() {
  const navigate = useNavigate();

  const [status, setStatus] = useState<
    'processing' | 'role_selection' | 'success' | 'error'
  >('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [googleProfile, setGoogleProfile] = useState<GoogleProfile | null>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function processCallback() {
      try {
        const result = await googleAuthService.handleCallback();

        if (!isMounted) return;

        if (!result.success || result.error) {
          setStatus('error');
          setErrorMessage(
            result.errorDescription ||
              (result.error === 'access_denied'
                ? 'Google sign-in was cancelled or access was denied.'
                : 'Authentication failed. Please try again.')
          );
          return;
        }

        if (result.profile) {
          setGoogleProfile(result.profile);

          if (result.isNewUser) {
            // New user must select role
            setStatus('role_selection');
          } else if (result.existingUser) {
            // Existing user: restore session and route to dashboard
            googleAuthService.loginExistingGoogleUser(result.existingUser);
            setStatus('success');

            setTimeout(() => {
              if (result.existingUser?.role === 'creator') {
                navigate(ROUTES.studio);
              } else if (result.existingUser?.role === 'admin') {
                navigate(ROUTES.adminVerification);
              } else {
                navigate(ROUTES.dashboard);
              }
            }, 600);
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(err?.message || 'An unexpected error occurred during Google verification.');
      }
    }

    processCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleRoleSelected = (role: UserPersona) => {
    if (!googleProfile) return;
    setIsCreatingAccount(true);

    try {
      const newUser = googleAuthService.createAccountFromGoogle(googleProfile, role);
      setStatus('success');

      setTimeout(() => {
        if (newUser.role === 'creator') {
          navigate(ROUTES.studio);
        } else {
          navigate(ROUTES.dashboard);
        }
      }, 500);
    } catch (err: any) {
      setIsCreatingAccount(false);
      setStatus('error');
      setErrorMessage(err?.message || 'Failed to initialize account.');
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-navy-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-violet-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-cyan-500/15 blur-[120px] pointer-events-none" />

      {/* Main Card */}
      <div className="max-w-md w-full bg-navy-900/90 border border-navy-700/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl text-center space-y-6 relative z-10">
        <div className="h-14 w-14 rounded-2xl gradient-brand flex items-center justify-center shadow-glow-violet text-white mx-auto">
          <Sparkles size={28} />
        </div>

        {status === 'processing' && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-navy-50">Verifying Google Sign-In</h2>
            <p className="text-xs text-navy-400">
              Validating authorized Google session credentials with PKCE security...
            </p>
            <div className="flex items-center justify-center pt-4">
              <Loader2 size={24} className="animate-spin text-cyan-400" />
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <h2 className="text-xl font-bold text-navy-50">Welcome to GenAura AI!</h2>
            <p className="text-xs text-navy-300">
              Google authentication verified. Directing to your workspace...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 text-center">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-lg font-bold text-navy-50">Authentication Notice</h2>
            <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl leading-relaxed">
              {errorMessage}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate(ROUTES.welcome)}
                className="w-full py-2.5 px-4 rounded-xl bg-navy-800 hover:bg-navy-750 text-navy-200 border border-navy-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Return to Sign In</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Role Selection Modal for New Users */}
      {status === 'role_selection' && googleProfile && (
        <RoleSelectionModal
          isOpen={true}
          googleProfile={googleProfile}
          isLoading={isCreatingAccount}
          onSelectRole={handleRoleSelected}
        />
      )}
    </div>
  );
}
