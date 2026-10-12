/**
 * GenAura AI — Animated Welcome, Landing & Authentication Portal
 * ==============================================================
 * Dark midnight-navy backdrop with violet/cyan floating orbs,
 * particle glow, glassmorphism, 3 animated highlights, and
 * complete authentication panel (Sign In, Register, Forgot Password, Demo Quick-Login).
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { DEFAULT_DEMO_USERS } from '@/data/authAndSettingsDefaults';
import { UserPersona, AuthUser, ROUTES, GoogleProfile } from '@/types';
import { GoogleAuthButton } from './GoogleAuthButton';
import { GoogleConfigModal } from './GoogleConfigModal';
import { RoleSelectionModal } from './RoleSelectionModal';
import { googleAuthService } from '@/services/googleAuthService';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  FileText,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Building2,
  Palette,
  ChevronRight,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function WelcomeLoginPage() {
  const navigate = useNavigate();
  const login = useAppStore((s) => s.login);
  const registerUser = useAppStore((s) => s.registerUser);
  const getRegisteredUserByGoogleSub = useAppStore((s) => s.getRegisteredUserByGoogleSub);
  const getRegisteredUserByEmail = useAppStore((s) => s.getRegisteredUserByEmail);
  const authUser = useAppStore((s) => s.authUser);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && authUser) {
      if (authUser.role === 'creator') navigate(ROUTES.studio, { replace: true });
      else if (authUser.role === 'admin') navigate(ROUTES.adminVerification, { replace: true });
      else navigate(ROUTES.dashboard, { replace: true });
    }
  }, [isAuthenticated, authUser, navigate]);

  // Auth Card State
  const [authTab, setAuthTab] = useState<'signin' | 'register'>('signin');
  const [role, setRole] = useState<UserPersona>('brand');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Google OAuth State
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showGoogleConfigModal, setShowGoogleConfigModal] = useState(false);
  const [pendingGoogleProfile, setPendingGoogleProfile] = useState<GoogleProfile | null>(null);

  // Status & Feedback
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Quick 1-Click Demo Login
  const handleQuickDemoLogin = (targetRole: UserPersona) => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      const demoUser = DEFAULT_DEMO_USERS[targetRole];
      login(demoUser);
      setIsLoading(false);
      if (targetRole === 'creator') navigate(ROUTES.studio);
      else if (targetRole === 'admin') navigate(ROUTES.adminVerification);
      else navigate(ROUTES.dashboard);
    }, 400);
  };

  // Sign In Submission
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      // Create user session from input or match demo account
      const matchedDemo = Object.values(DEFAULT_DEMO_USERS).find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      const userToLogin: AuthUser = matchedDemo || {
        id: `usr_${Date.now()}`,
        name: email.split('@')[0],
        email,
        username: email.split('@')[0],
        role: email.includes('creator') ? 'creator' : 'brand',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
        createdAt: new Date().toISOString(),
      };

      login(userToLogin);
      setIsLoading(false);
      setSuccessMessage('Welcome back to GenAura AI!');

      setTimeout(() => {
        if (userToLogin.role === 'creator') navigate(ROUTES.studio);
        else if (userToLogin.role === 'admin') navigate(ROUTES.adminVerification);
        else navigate(ROUTES.dashboard);
      }, 500);
    }, 500);
  };

  // Registration Submission
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name or creator name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const newUser: AuthUser = {
        id: `usr_${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        username: name.toLowerCase().replace(/\s+/g, '_'),
        role,
        avatarUrl:
          role === 'creator'
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop'
            : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
        bio: role === 'creator' ? 'New Creator on GenAura AI' : 'Brand Marketer exploring AI creators',
        createdAt: new Date().toISOString(),
      };

      registerUser(newUser);
      login(newUser);
      setIsLoading(false);
      setSuccessMessage(`Account created successfully as ${role.toUpperCase()}!`);

      setTimeout(() => {
        if (role === 'creator') navigate(ROUTES.studio);
        else navigate(ROUTES.dashboard);
      }, 600);
    }, 600);
  };

  // Google OAuth Initiator
  const handleGoogleAuth = async (mode: 'signin' | 'signup') => {
    setError(null);
    setIsGoogleLoading(true);

    try {
      const config = googleAuthService.getConfigStatus();
      if (!config.configured) {
        setIsGoogleLoading(false);
        setShowGoogleConfigModal(true);
        return;
      }

      const { authUrl } = await googleAuthService.startOAuthFlow({
        mode,
        preselectedRole: mode === 'signup' ? role : undefined,
      });

      window.location.href = authUrl;
    } catch (err) {
      setIsGoogleLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to connect to Google authentication.');
    }
  };

  const handleSimulateGoogleDemo = (targetRole: UserPersona) => {
    setShowGoogleConfigModal(false);
    setIsGoogleLoading(true);

    setTimeout(() => {
      const { user } = googleAuthService.simulateGoogleAuth(targetRole);
      login(user);
      setIsGoogleLoading(false);
      setSuccessMessage(`Signed in via Google Demo as ${user.name}!`);
      setTimeout(() => {
        if (targetRole === 'creator') navigate(ROUTES.studio);
        else navigate(ROUTES.dashboard);
      }, 400);
    }, 400);
  };

  // New Google Sign-Up Role Confirmation
  const handleRoleSelected = (chosenRole: UserPersona) => {
    if (!pendingGoogleProfile) return;
    const newUser = googleAuthService.createAccountFromGoogle(pendingGoogleProfile, chosenRole);
    registerUser(newUser);
    login(newUser);
    setPendingGoogleProfile(null);
    setSuccessMessage(`Welcome to GenAura AI, ${newUser.name}!`);
    setTimeout(() => {
      if (chosenRole === 'creator') navigate(ROUTES.studio);
      else navigate(ROUTES.dashboard);
    }, 400);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) return;
    setForgotSent(true);
  };

  return (
    <div className="min-h-screen bg-navy-950 text-navy-50 relative overflow-hidden flex flex-col selection:bg-violet-500 selection:text-white">
      {/* ── Background Glowing Orbs & Trails ── */}
      <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] rounded-full bg-violet-600/20 blur-[130px] pointer-events-none animate-float-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/15 blur-[140px] pointer-events-none animate-float-delayed" />
      <div className="absolute top-[40%] right-[20%] w-[350px] h-[350px] rounded-full bg-violet-500/10 blur-[100px] pointer-events-none" />

      {/* Subtle Grid Backdrop */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* ── Top Navigation Bar ── */}
      <nav className="relative z-20 px-6 lg:px-12 py-5 flex items-center justify-between border-b border-navy-800/60 bg-navy-950/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center shadow-glow-violet text-white">
            <Sparkles size={18} />
          </div>
          <span className="font-bold text-xl tracking-tight">
            <span className="gradient-brand-text">GenAura</span>
            <span className="text-navy-300"> AI</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && authUser ? (
            <button
              onClick={() =>
                navigate(authUser.role === 'creator' ? ROUTES.studio : ROUTES.dashboard)
              }
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600/20 text-violet-300 border border-violet-500/40 hover:bg-violet-600 hover:text-white transition-all shadow-sm"
            >
              <span>Go to {authUser.role === 'creator' ? 'Creator Studio' : 'Dashboard'}</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={() => navigate(ROUTES.discovery)}
              className="text-xs font-medium text-navy-300 hover:text-white transition-colors"
            >
              Explore Creators
            </button>
          )}
        </div>
      </nav>

      {/* ── Main Content Hero & Auth Split ── */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-6 lg:px-12 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Hero Showcase */}
        <div className="lg:col-span-7 space-y-8 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-medium backdrop-blur-sm">
            <Sparkles size={13} className="text-violet-400" />
            <span>Intelligent AI Creator Marketplace</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
              Discover Creators. <br />
              <span className="gradient-brand-text">Empower Creativity.</span>
            </h1>
            <p className="text-base sm:text-lg text-navy-300 max-w-xl font-normal leading-relaxed">
              Your intelligent creator marketplace. Discover talented creators, build powerful
              campaigns, and turn creative ideas into meaningful collaborations with AI.
            </p>
          </div>

          {/* 3 Animated Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-navy-900/70 border border-navy-800 hover:border-violet-500/40 transition-all group backdrop-blur-sm shadow-card">
              <div className="h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Search size={18} />
              </div>
              <h3 className="font-semibold text-sm text-navy-50 mb-1">AI Creator Discovery</h3>
              <p className="text-xs text-navy-400 leading-normal">
                Find creators that fit your campaign with 6-factor AuraMatch scoring.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-navy-900/70 border border-navy-800 hover:border-violet-500/40 transition-all group backdrop-blur-sm shadow-card">
              <div className="h-9 w-9 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <ShieldCheck size={18} />
              </div>
              <h3 className="font-semibold text-sm text-navy-50 mb-1">AI Profile Verification</h3>
              <p className="text-xs text-navy-400 leading-normal">
                Review creator readiness with a transparent 100-point rubric.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-navy-900/70 border border-navy-800 hover:border-violet-500/40 transition-all group backdrop-blur-sm shadow-card">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileText size={18} />
              </div>
              <h3 className="font-semibold text-sm text-navy-50 mb-1">AI Campaign Assistant</h3>
              <p className="text-xs text-navy-400 leading-normal">
                Create briefs and get intelligent recommendations with BriefGen AI.
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => {
                setAuthTab('register');
                document.getElementById('auth-panel')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3 rounded-xl gradient-brand text-white font-semibold text-sm shadow-glow-violet hover:opacity-95 transition-all flex items-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => navigate(ROUTES.discovery)}
              className="px-6 py-3 rounded-xl bg-navy-800/80 hover:bg-navy-800 text-navy-200 border border-navy-700 font-semibold text-sm transition-all"
            >
              Explore Creators
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthTab('signin');
                document.getElementById('auth-panel')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-3 text-xs font-semibold text-violet-300 hover:text-white transition-colors"
            >
              Sign In to Account →
            </button>
          </div>
        </div>

        {/* Right Column: Authentication Panel */}
        <div id="auth-panel" className="lg:col-span-5">
          <div className="bg-navy-900/90 border border-navy-700/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
            {/* Tab Header */}
            <div className="flex rounded-xl bg-navy-950 p-1 border border-navy-800">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('signin');
                  setError(null);
                }}
                className={cn(
                  'flex-1 py-2 text-xs font-semibold rounded-lg transition-all',
                  authTab === 'signin'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-navy-400 hover:text-white'
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('register');
                  setError(null);
                }}
                className={cn(
                  'flex-1 py-2 text-xs font-semibold rounded-lg transition-all',
                  authTab === 'register'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-navy-400 hover:text-white'
                )}
              >
                Create Account
              </button>
            </div>

            {/* Quick 1-Click Demo Login Bar */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold tracking-wider text-navy-400">
                Quick Demo Access (1-Click)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('brand')}
                  disabled={isLoading}
                  className="px-2 py-2 rounded-lg bg-navy-800 hover:bg-violet-600/20 border border-navy-700 hover:border-violet-500/40 text-left text-xs transition-all flex items-center gap-1.5"
                >
                  <Building2 size={13} className="text-violet-400 shrink-0" />
                  <span className="truncate font-medium text-navy-200">Brand</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('creator')}
                  disabled={isLoading}
                  className="px-2 py-2 rounded-lg bg-navy-800 hover:bg-cyan-600/20 border border-navy-700 hover:border-cyan-500/40 text-left text-xs transition-all flex items-center gap-1.5"
                >
                  <Palette size={13} className="text-cyan-400 shrink-0" />
                  <span className="truncate font-medium text-navy-200">Creator</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('admin')}
                  disabled={isLoading}
                  className="px-2 py-2 rounded-lg bg-navy-800 hover:bg-amber-600/20 border border-navy-700 hover:border-amber-500/40 text-left text-xs transition-all flex items-center gap-1.5"
                >
                  <ShieldCheck size={13} className="text-amber-400 shrink-0" />
                  <span className="truncate font-medium text-navy-200">Admin</span>
                </button>
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-navy-800"></div>
              <span className="flex-shrink mx-2 text-[10px] text-navy-500 uppercase tracking-wider font-semibold">
                Or with credentials
              </span>
              <div className="flex-grow border-t border-navy-800"></div>
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form Mode: Sign In */}
            {authTab === 'signin' ? (
              <div className="space-y-4">
                <GoogleAuthButton
                  mode="signin"
                  isLoading={isGoogleLoading}
                  onClick={() => handleGoogleAuth('signin')}
                />

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-navy-800"></div>
                  <span className="flex-shrink mx-3 text-[10px] text-navy-400 uppercase tracking-wider font-semibold">
                    Or sign in with email
                  </span>
                  <div className="flex-grow border-t border-navy-800"></div>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-navy-300">Email Address</label>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-500"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com or demo"
                      className="w-full pl-9 pr-4 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 placeholder-navy-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-navy-300">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] text-violet-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-500"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 placeholder-navy-500 focus:outline-none focus:border-violet-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-500 hover:text-navy-300"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-left">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-navy-700 text-violet-600 focus:ring-0 bg-navy-950"
                    />
                    <span className="text-xs text-navy-400">Remember me</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl gradient-brand text-white font-semibold text-xs shadow-glow-violet hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Sign In to Marketplace</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Form Mode: Registration */
            <div className="space-y-4">
              <GoogleAuthButton
                mode="signup"
                isLoading={isGoogleLoading}
                onClick={() => handleGoogleAuth('signup')}
              />

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-navy-800"></div>
                <span className="flex-shrink mx-3 text-[10px] text-navy-400 uppercase tracking-wider font-semibold">
                  Or sign up with email
                </span>
                <div className="flex-grow border-t border-navy-800"></div>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-navy-300">Choose Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('brand')}
                      className={cn(
                        'p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all',
                        role === 'brand'
                          ? 'bg-violet-600/20 text-violet-300 border-violet-500/50'
                          : 'bg-navy-950 text-navy-400 border-navy-800'
                      )}
                    >
                      <Building2 size={15} />
                      <span>Brand / Marketer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('creator')}
                      className={cn(
                        'p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all',
                        role === 'creator'
                          ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/50'
                          : 'bg-navy-950 text-navy-400 border-navy-800'
                      )}
                    >
                      <Palette size={15} />
                      <span>Content Creator</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-navy-300">Full Name</label>
                  <div className="relative">
                    <User
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-500"
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Jordan Blake"
                      className="w-full pl-9 pr-4 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 placeholder-navy-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-navy-300">Email Address</label>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-500"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jordan@creative.co"
                      className="w-full pl-9 pr-4 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 placeholder-navy-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-navy-300">Create Password</label>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-500"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-9 pr-10 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 placeholder-navy-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-500 hover:text-navy-300"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 text-white font-semibold text-xs shadow-glow-cyan hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? <span>Creating Account...</span> : <span>Join GenAura AI</span>}
                </button>
              </form>
            </div>
          )}

            {/* Security Notice */}
            <div className="pt-2 text-[11px] text-navy-500 text-center leading-normal">
              Demo Authentication Mode — Passwords and sessions run with encrypted client-state
              persistence.
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-left">
            <h3 className="font-bold text-base text-navy-50">Reset Password</h3>
            <p className="text-xs text-navy-300 leading-relaxed">
              Enter your account email to receive a password reset link.
            </p>

            {forgotSent ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Check size={16} />
                <span>Reset link dispatched to {forgotEmail}!</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl gradient-brand text-white font-semibold text-xs"
                >
                  Send Reset Link
                </button>
              </form>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSent(false);
                }}
                className="px-4 py-2 text-xs font-medium text-navy-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google OAuth Setup / Diagnostic Modal */}
      <GoogleConfigModal
        isOpen={showGoogleConfigModal}
        onClose={() => setShowGoogleConfigModal(false)}
        onSimulateDemo={handleSimulateGoogleDemo}
      />

      {/* Google New Account Role Designation Modal */}
      {pendingGoogleProfile && (
        <RoleSelectionModal
          isOpen={!!pendingGoogleProfile}
          googleProfile={pendingGoogleProfile}
          isLoading={isGoogleLoading}
          onSelectRole={handleRoleSelected}
        />
      )}
    </div>
  );
}
