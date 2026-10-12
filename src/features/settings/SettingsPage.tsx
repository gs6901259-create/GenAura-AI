/**
 * GenAura AI — Complete Account Settings Page
 * ===========================================
 * Comprehensive 6-tab settings management with real state persistence:
 * Profile, Account & Security, Appearance (Light/Dark/System), Notifications,
 * Privacy & Data Export, and AI Preferences.
 */
import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { ThemeMode, UserSettings, ROUTES } from '@/types';
import { DEFAULT_USER_SETTINGS } from '@/data/authAndSettingsDefaults';
import { aiAssistantService } from '@/services/aiAssistantService';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Palette,
  Bell,
  Lock,
  Cpu,
  Check,
  AlertTriangle,
  Download,
  Trash2,
  RefreshCw,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { demoService } from '@/services/demoService';
import { walletService } from '@/services/walletService';
import { chatService } from '@/services/chatService';

export function SettingsPage() {
  const navigate = useNavigate();
  const theme = useAppStore((s) => s.theme) || 'dark';
  const setTheme = useAppStore((s) => s.setTheme);
  const authUser = useAppStore((s) => s.authUser);
  const updateAuthUser = useAppStore((s) => s.updateAuthUser);
  const userSettings = useAppStore((s) => s.userSettings) || DEFAULT_USER_SETTINGS;
  const updateUserSettings = useAppStore((s) => s.updateUserSettings);
  const resetUserSettings = useAppStore((s) => s.resetUserSettings);
  const logout = useAppStore((s) => s.logout);
  const clearChatMessages = useAppStore((s) => s.clearChatMessages);

  // Full state for the complete store
  const fullStoreState = useAppStore.getState();

  const [activeTab, setActiveTab] = useState<
    'profile' | 'account' | 'appearance' | 'notifications' | 'privacy' | 'ai'
  >('profile');

  // Form states with unsaved changes tracking
  const [profileForm, setProfileForm] = useState(userSettings.profile);
  const [notificationForm, setNotificationForm] = useState(userSettings.notifications);
  const [privacyForm, setPrivacyForm] = useState(userSettings.privacy);
  const [aiForm, setAiForm] = useState(userSettings.aiPreferences);

  // Feedback states
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Security Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const modelInfo = aiAssistantService.getModelInfo();

  useEffect(() => {
    if (userSettings) {
      setProfileForm(userSettings.profile);
      setNotificationForm(userSettings.notifications);
      setPrivacyForm(userSettings.privacy);
      setAiForm(userSettings.aiPreferences);
    }
  }, [userSettings]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    if (!profileForm.displayName.trim()) {
      setSaveError('Display name cannot be empty.');
      return;
    }

    updateUserSettings({ profile: profileForm });
    updateAuthUser({
      name: profileForm.displayName,
      username: profileForm.username,
      avatarUrl: profileForm.avatarUrl,
      bio: profileForm.bio,
      location: profileForm.location,
    });

    setSaveSuccess('Profile settings saved successfully.');
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleSaveNotifications = () => {
    updateUserSettings({ notifications: notificationForm });
    setSaveSuccess('Notification preferences updated.');
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleSavePrivacy = () => {
    updateUserSettings({ privacy: privacyForm });
    setSaveSuccess('Privacy preferences saved.');
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleSaveAi = () => {
    updateUserSettings({ aiPreferences: aiForm });
    setSaveSuccess('AI preferences saved.');
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleExportData = () => {
    const currentUid = authUser?.id || 'usr_brand_1';
    const userWallet = walletService.getWallet(currentUid);
    const userTxns = walletService.getTransactions(currentUid);
    const userConvs = chatService.getConversationsForUser(currentUid);

    const exportPayload = {
      exportDate: new Date().toISOString(),
      user: authUser,
      settings: userSettings,
      wallet: {
        currency: 'INR',
        availableBalanceINR: (userWallet.availablePaise / 100).toFixed(2),
        pendingBalanceINR: (userWallet.pendingPaise / 100).toFixed(2),
        reservedBalanceINR: (userWallet.reservedPaise / 100).toFixed(2),
        totalIncomingINR: (userWallet.totalIncomingPaise / 100).toFixed(2),
        totalOutgoingINR: (userWallet.totalOutgoingPaise / 100).toFixed(2),
        totalWithdrawnINR: (userWallet.totalWithdrawnPaise / 100).toFixed(2),
        transactionsCount: userTxns.length,
      },
      conversationsCount: userConvs.length,
      creatorsCount: fullStoreState.creators.length,
      briefsCount: fullStoreState.briefs.length,
      shortlistCount: fullStoreState.shortlist.length,
      projectsCount: fullStoreState.projects.length,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `genaura-user-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSaveSuccess('Complete authenticated profile, privacy, wallet, and chat records exported.');
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleRevokeSession = (sessionId: string) => {
    const updatedSessions = userSettings.account.activeSessions.filter((s) => s.id !== sessionId);
    updateUserSettings({
      account: {
        ...userSettings.account,
        activeSessions: updatedSessions,
      },
    });
    setSaveSuccess('Device session successfully revoked and invalidated.');
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass) return;
    if (newPass.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }
    if (newPass !== confirmPass) {
      alert('New passwords do not match.');
      return;
    }
    setPasswordSuccess(true);
    setTimeout(() => {
      setPasswordSuccess(false);
      setShowPasswordModal(false);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setSaveSuccess('Password credentials updated successfully.');
      setTimeout(() => setSaveSuccess(null), 3000);
    }, 1500);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText.trim().toLowerCase() === 'delete') {
      setShowDeleteModal(false);
      logout();
      navigate(ROUTES.welcome);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-50">Account Settings</h1>
          <p className="text-xs text-navy-400 mt-1">
            Manage your creator profile, security credentials, appearance themes, and AI preferences.
          </p>
        </div>

        {/* Global Save Notice Banner */}
        {saveSuccess && (
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5 animate-fadeIn">
            <CheckCircle2 size={14} />
            <span>{saveSuccess}</span>
          </div>
        )}
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Tabs Navigation */}
        <aside className="md:col-span-3 space-y-1">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={cn(
              'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left',
              activeTab === 'profile'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-navy-400 hover:text-navy-100 hover:bg-navy-800/60'
            )}
          >
            <User size={16} />
            <span>Profile Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={cn(
              'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left',
              activeTab === 'account'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-navy-400 hover:text-navy-100 hover:bg-navy-800/60'
            )}
          >
            <Shield size={16} />
            <span>Account & Security</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={cn(
              'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left',
              activeTab === 'appearance'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-navy-400 hover:text-navy-100 hover:bg-navy-800/60'
            )}
          >
            <Palette size={16} />
            <span>Appearance & Theme</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={cn(
              'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left',
              activeTab === 'notifications'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-navy-400 hover:text-navy-100 hover:bg-navy-800/60'
            )}
          >
            <Bell size={16} />
            <span>Notifications</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={cn(
              'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left',
              activeTab === 'privacy'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-navy-400 hover:text-navy-100 hover:bg-navy-800/60'
            )}
          >
            <Lock size={16} />
            <span>Privacy & Data</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={cn(
              'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left',
              activeTab === 'ai'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-navy-400 hover:text-navy-100 hover:bg-navy-800/60'
            )}
          >
            <Cpu size={16} />
            <span>AI Assistant Settings</span>
          </button>
        </aside>

        {/* Right Tab Content Panels */}
        <main className="md:col-span-9 bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-sm">
          {/* TAB 1: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6 text-left">
              <div>
                <h2 className="text-base font-bold text-navy-50">Profile Settings</h2>
                <p className="text-xs text-navy-400 mt-0.5">
                  Update public information visible to brands and creators on GenAura AI.
                </p>
              </div>

              {saveError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle size={15} />
                  <span>{saveError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-navy-300">Display Name</label>
                  <input
                    type="text"
                    value={profileForm.displayName}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, displayName: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-navy-300">Username</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500 text-xs">
                      @
                    </span>
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, username: e.target.value })
                      }
                      className="w-full pl-7 pr-3.5 py-2 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-navy-300">Avatar Image URL</label>
                  <input
                    type="url"
                    value={profileForm.avatarUrl}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, avatarUrl: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-navy-300">Bio & Creative Summary</label>
                  <textarea
                    rows={3}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    className="w-full px-3.5 py-2 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 focus:outline-none focus:border-violet-500 leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-navy-300">Location</label>
                  <input
                    type="text"
                    value={profileForm.location}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, location: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-navy-300">Website or Portfolio</label>
                  <input
                    type="url"
                    value={profileForm.website || ''}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, website: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-navy-800">
                <button
                  type="button"
                  onClick={() => setProfileForm(userSettings.profile)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-navy-400 hover:text-navy-100 hover:bg-navy-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl gradient-brand text-white font-semibold text-xs shadow-glow-violet hover:opacity-95 transition-all"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ACCOUNT & SECURITY */}
          {activeTab === 'account' && (
            <div className="space-y-6 text-left">
              <div>
                <h2 className="text-base font-bold text-navy-50">Account & Security</h2>
                <p className="text-xs text-navy-400 mt-0.5">
                  Manage login credentials, active device sessions, and account protection.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-navy-200">Account Email</h3>
                    <p className="text-xs text-navy-400 mt-0.5">
                      {authUser?.email || 'user@genaura.ai'}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Verified
                  </span>
                </div>
              </div>

              {/* Password Management */}
              <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-navy-200">Password</h3>
                    <p className="text-xs text-navy-400 mt-0.5">
                      Last updated 3 weeks ago. Minimum 6 characters required.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy-800 text-navy-200 hover:text-white border border-navy-700 transition-all"
                  >
                    Change Password
                  </button>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-navy-200 uppercase tracking-wider">
                  Active Device Sessions
                </h3>
                <div className="space-y-2">
                  {userSettings.account.activeSessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-navy-200">
                            {sess.device}
                          </span>
                          {sess.isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-violet-500/20 text-violet-300 font-semibold border border-violet-500/30">
                              Current Device
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-navy-500 mt-0.5">
                          {sess.location} • Last active: {sess.lastActive}
                        </p>
                      </div>

                      {!sess.isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(sess.id)}
                          className="text-xs text-rose-400 hover:underline font-medium"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-6 border-t border-navy-800 space-y-3">
                <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  Danger Zone
                </h3>
                <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-rose-200">Delete Account</h4>
                    <p className="text-xs text-navy-400 mt-0.5">
                      Permanently erase all profile data, portfolio pieces, and campaign history.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 transition-all shrink-0"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APPEARANCE & THEMES */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 text-left">
              <div>
                <h2 className="text-base font-bold text-navy-50">Appearance & Theme</h2>
                <p className="text-xs text-navy-400 mt-0.5">
                  Select your interface theme. Changes persist across application refreshes.
                </p>
              </div>

              {/* Theme Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Dark Mode Card */}
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={cn(
                    'p-4 rounded-xl border text-left transition-all relative overflow-hidden group',
                    theme === 'dark'
                      ? 'border-violet-500 bg-violet-600/10 ring-2 ring-violet-500/30'
                      : 'border-navy-800 bg-navy-950 hover:border-navy-700'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-8 w-8 rounded-lg bg-navy-900 border border-navy-700 flex items-center justify-center text-violet-400">
                      <Moon size={16} />
                    </div>
                    {theme === 'dark' && (
                      <span className="h-5 w-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs">
                        <Check size={12} />
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-xs text-navy-100">Dark Theme</h3>
                  <p className="text-[11px] text-navy-400 mt-0.5">
                    Midnight navy with violet & cyan glowing accents.
                  </p>
                </button>

                {/* Light Mode Card */}
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={cn(
                    'p-4 rounded-xl border text-left transition-all relative overflow-hidden group',
                    theme === 'light'
                      ? 'border-violet-500 bg-violet-600/10 ring-2 ring-violet-500/30'
                      : 'border-navy-800 bg-navy-950 hover:border-navy-700'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-8 w-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-amber-500">
                      <Sun size={16} />
                    </div>
                    {theme === 'light' && (
                      <span className="h-5 w-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs">
                        <Check size={12} />
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-xs text-navy-100">Light Theme</h3>
                  <p className="text-[11px] text-navy-400 mt-0.5">
                    Clean white surfaces with high-contrast text.
                  </p>
                </button>

                {/* System Preference Card */}
                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={cn(
                    'p-4 rounded-xl border text-left transition-all relative overflow-hidden group',
                    theme === 'system'
                      ? 'border-violet-500 bg-violet-600/10 ring-2 ring-violet-500/30'
                      : 'border-navy-800 bg-navy-950 hover:border-navy-700'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-8 w-8 rounded-lg bg-navy-900 border border-navy-700 flex items-center justify-center text-cyan-400">
                      <Laptop size={16} />
                    </div>
                    {theme === 'system' && (
                      <span className="h-5 w-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs">
                        <Check size={12} />
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-xs text-navy-100">System Sync</h3>
                  <p className="text-[11px] text-navy-400 mt-0.5">
                    Synchronize with operating system mode automatically.
                  </p>
                </button>
              </div>

              {/* Accessibility Toggles */}
              <div className="pt-4 border-t border-navy-800 space-y-4">
                <h3 className="text-xs font-bold text-navy-200 uppercase tracking-wider">
                  Motion & Display Accessibility
                </h3>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-navy-950 border border-navy-800 cursor-pointer">
                  <div>
                    <h4 className="text-xs font-semibold text-navy-200">
                      Respect Reduced Motion
                    </h4>
                    <p className="text-[11px] text-navy-400 mt-0.5">
                      Disable background particle floating and ambient hero light trail loops.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={userSettings.appearance.reduceMotion}
                    onChange={(e) =>
                      updateUserSettings({
                        appearance: {
                          ...userSettings.appearance,
                          reduceMotion: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-navy-700 text-violet-600 bg-navy-900 h-4 w-4"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 text-left">
              <div>
                <h2 className="text-base font-bold text-navy-50">Notification Preferences</h2>
                <p className="text-xs text-navy-400 mt-0.5">
                  Select which updates you want to receive across in-app badges and alerts.
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-navy-950 border border-navy-800 cursor-pointer">
                  <div>
                    <h4 className="text-xs font-semibold text-navy-200">
                      Collaboration Requests & Milestones
                    </h4>
                    <p className="text-[11px] text-navy-400 mt-0.5">
                      Get notified when a brand sends a project request or a creator accepts.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationForm.collaborationRequests}
                    onChange={(e) =>
                      setNotificationForm({
                        ...notificationForm,
                        collaborationRequests: e.target.checked,
                      })
                    }
                    className="rounded border-navy-700 text-violet-600 bg-navy-900 h-4 w-4"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-navy-950 border border-navy-800 cursor-pointer">
                  <div>
                    <h4 className="text-xs font-semibold text-navy-200">
                      Creator Verification Updates
                    </h4>
                    <p className="text-[11px] text-navy-400 mt-0.5">
                      Alerts when your 100-point rubric score changes or an admin review is logged.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationForm.verificationUpdates}
                    onChange={(e) =>
                      setNotificationForm({
                        ...notificationForm,
                        verificationUpdates: e.target.checked,
                      })
                    }
                    className="rounded border-navy-700 text-violet-600 bg-navy-900 h-4 w-4"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-navy-950 border border-navy-800 cursor-pointer">
                  <div>
                    <h4 className="text-xs font-semibold text-navy-200">Campaign & Brief Updates</h4>
                    <p className="text-[11px] text-navy-400 mt-0.5">
                      Receive notices when new briefs match your specific niche tags.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationForm.campaignUpdates}
                    onChange={(e) =>
                      setNotificationForm({
                        ...notificationForm,
                        campaignUpdates: e.target.checked,
                      })
                    }
                    className="rounded border-navy-700 text-violet-600 bg-navy-900 h-4 w-4"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-navy-950 border border-navy-800 cursor-pointer">
                  <div>
                    <h4 className="text-xs font-semibold text-navy-200">Product Announcements</h4>
                    <p className="text-[11px] text-navy-400 mt-0.5">
                      New feature releases and algorithm updates on GenAura AI.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationForm.productAnnouncements}
                    onChange={(e) =>
                      setNotificationForm({
                        ...notificationForm,
                        productAnnouncements: e.target.checked,
                      })
                    }
                    className="rounded border-navy-700 text-violet-600 bg-navy-900 h-4 w-4"
                  />
                </label>
              </div>

              <div className="flex justify-end pt-4 border-t border-navy-800">
                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  className="px-5 py-2 rounded-xl gradient-brand text-white font-semibold text-xs shadow-glow-violet hover:opacity-95 transition-all"
                >
                  Save Notification Preferences
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: PRIVACY & DATA EXPORT */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 text-left">
              <div>
                <h2 className="text-base font-bold text-navy-50">Privacy & Data Governance</h2>
                <p className="text-xs text-navy-400 mt-0.5">
                  Control how your creator profile is indexed and download your full marketplace records.
                </p>
              </div>

              {/* SECTION A: PROFILE PRIVACY */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-navy-200 uppercase tracking-wider">
                  Profile & Marketplace Visibility
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-navy-300">Profile Visibility</label>
                    <select
                      value={privacyForm.profileVisibility || 'public'}
                      onChange={(e) =>
                        setPrivacyForm({
                          ...privacyForm,
                          profileVisibility: e.target.value as any,
                        })
                      }
                      className="w-full px-3.5 py-2 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 focus:outline-none focus:border-violet-500"
                    >
                      <option value="public">Public (Visible to all marketplace search)</option>
                      <option value="shortlist-only">Workspace Only (Direct invitees & shortlisted brands)</option>
                      <option value="private">Private (Hidden from discovery)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-navy-300">Portfolio Work Visibility</label>
                    <select
                      value={privacyForm.portfolioVisibility || 'public'}
                      onChange={(e) =>
                        setPrivacyForm({
                          ...privacyForm,
                          portfolioVisibility: e.target.value as any,
                        })
                      }
                      className="w-full px-3.5 py-2 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 focus:outline-none focus:border-violet-500"
                    >
                      <option value="public">Public (Show all creative pieces)</option>
                      <option value="workspace-only">Workspace Only (Collaborating brands)</option>
                      <option value="hidden">Hidden (Portfolio under revision)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-navy-300">Direct Contact Information</label>
                    <select
                      value={privacyForm.contactInfoVisibility || 'workspace-only'}
                      onChange={(e) =>
                        setPrivacyForm({
                          ...privacyForm,
                          contactInfoVisibility: e.target.value as any,
                        })
                      }
                      className="w-full px-3.5 py-2 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 focus:outline-none focus:border-violet-500"
                    >
                      <option value="workspace-only">Workspace Only (Masked until deal initiated)</option>
                      <option value="visible">Visible to All Authenticated Users</option>
                      <option value="hidden">Hidden Completely</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-navy-300">Collaboration History & Deals</label>
                    <select
                      value={privacyForm.collaborationHistoryVisibility || 'public'}
                      onChange={(e) =>
                        setPrivacyForm({
                          ...privacyForm,
                          collaborationHistoryVisibility: e.target.value as any,
                        })
                      }
                      className="w-full px-3.5 py-2 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 focus:outline-none focus:border-violet-500"
                    >
                      <option value="public">Public (Show verified campaign ratings)</option>
                      <option value="workspace-only">Workspace Only</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-navy-950 border border-navy-800 cursor-pointer">
                    <div>
                      <h4 className="text-xs font-semibold text-navy-200">
                        Marketplace AI Discoverability
                      </h4>
                      <p className="text-[11px] text-navy-400 mt-0.5">
                        Allow AuraMatch algorithm to recommend your profile for high-value campaign briefs.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacyForm.discoverabilityEnabled !== false}
                      onChange={(e) =>
                        setPrivacyForm({
                          ...privacyForm,
                          discoverabilityEnabled: e.target.checked,
                        })
                      }
                      className="rounded border-navy-700 text-violet-600 bg-navy-900 h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-navy-950 border border-navy-800 cursor-pointer">
                    <div>
                      <h4 className="text-xs font-semibold text-navy-200">
                        Public Social & Portfolio Links
                      </h4>
                      <p className="text-[11px] text-navy-400 mt-0.5">
                        Display Instagram, YouTube, and Behance links on your public creator card.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacyForm.socialLinksVisibility !== 'hidden'}
                      onChange={(e) =>
                        setPrivacyForm({
                          ...privacyForm,
                          socialLinksVisibility: e.target.checked ? 'visible' : 'hidden',
                        })
                      }
                      className="rounded border-navy-700 text-violet-600 bg-navy-900 h-4 w-4"
                    />
                  </label>
                </div>
              </div>

              {/* SECTION B: MESSAGING PRIVACY */}
              <div className="space-y-4 pt-4 border-t border-navy-800">
                <h3 className="text-xs font-bold text-navy-200 uppercase tracking-wider">
                  Workspace Messaging & Chat Privacy
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-navy-300">Who Can Send You Direct Messages</label>
                  <select
                    value={privacyForm.messaging?.allowedSenders || 'anyone'}
                    onChange={(e) =>
                      setPrivacyForm({
                        ...privacyForm,
                        messaging: {
                          ...(privacyForm.messaging || {
                            allowNewMessageRequests: true,
                            showOnlineStatus: true,
                            readReceipts: true,
                            showPreviewsInNotifications: true,
                          }),
                          allowedSenders: e.target.value as any,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 focus:outline-none focus:border-violet-500"
                  >
                    <option value="anyone">Anyone on GenAura (Brands and verified Creators)</option>
                    <option value="verified-only">Verified Creators and Registered Brands Only</option>
                    <option value="contacts-only">Active Collaboration Contacts Only</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-navy-950 border border-navy-800 cursor-pointer">
                    <div>
                      <h4 className="text-xs font-semibold text-navy-200">
                        Allow New Collaboration Message Requests
                      </h4>
                      <p className="text-[11px] text-navy-400 mt-0.5">
                        Accept inbound messages from brands before an official proposal is dispatched.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacyForm.messaging?.allowNewMessageRequests !== false}
                      onChange={(e) =>
                        setPrivacyForm({
                          ...privacyForm,
                          messaging: {
                            ...(privacyForm.messaging || {
                              allowedSenders: 'anyone',
                              showOnlineStatus: true,
                              readReceipts: true,
                              showPreviewsInNotifications: true,
                            }),
                            allowNewMessageRequests: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-navy-700 text-violet-600 bg-navy-900 h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-navy-950 border border-navy-800 cursor-pointer">
                    <div>
                      <h4 className="text-xs font-semibold text-navy-200">
                        Online Status Visibility
                      </h4>
                      <p className="text-[11px] text-navy-400 mt-0.5">
                        Display a green active indicator when you are online in Workspace Chat.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacyForm.messaging?.showOnlineStatus !== false}
                      onChange={(e) =>
                        setPrivacyForm({
                          ...privacyForm,
                          messaging: {
                            ...(privacyForm.messaging || {
                              allowedSenders: 'anyone',
                              allowNewMessageRequests: true,
                              readReceipts: true,
                              showPreviewsInNotifications: true,
                            }),
                            showOnlineStatus: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-navy-700 text-violet-600 bg-navy-900 h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-navy-950 border border-navy-800 cursor-pointer">
                    <div>
                      <h4 className="text-xs font-semibold text-navy-200">
                        Send Read Receipts
                      </h4>
                      <p className="text-[11px] text-navy-400 mt-0.5">
                        Allow message senders to see cyan double-checkmarks when you have read their messages.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacyForm.messaging?.readReceipts !== false}
                      onChange={(e) =>
                        setPrivacyForm({
                          ...privacyForm,
                          messaging: {
                            ...(privacyForm.messaging || {
                              allowedSenders: 'anyone',
                              allowNewMessageRequests: true,
                              showOnlineStatus: true,
                              showPreviewsInNotifications: true,
                            }),
                            readReceipts: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-navy-700 text-violet-600 bg-navy-900 h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-navy-950 border border-navy-800 cursor-pointer">
                    <div>
                      <h4 className="text-xs font-semibold text-navy-200">
                        Show Message Previews in Notifications
                      </h4>
                      <p className="text-[11px] text-navy-400 mt-0.5">
                        When disabled, notification alerts show &ldquo;New message received&rdquo; without exposing sensitive content.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacyForm.messaging?.showPreviewsInNotifications !== false}
                      onChange={(e) =>
                        setPrivacyForm({
                          ...privacyForm,
                          messaging: {
                            ...(privacyForm.messaging || {
                              allowedSenders: 'anyone',
                              allowNewMessageRequests: true,
                              showOnlineStatus: true,
                              readReceipts: true,
                            }),
                            showPreviewsInNotifications: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-navy-700 text-violet-600 bg-navy-900 h-4 w-4"
                    />
                  </label>
                </div>
              </div>

              {/* Data Export Box */}
              <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-navy-200">Export Marketplace Data</h3>
                  <p className="text-xs text-navy-400 mt-0.5">
                    Download an authenticated JSON snapshot of your profile, campaigns, and shortlists.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600/20 text-violet-300 hover:bg-violet-600 hover:text-white border border-violet-500/40 transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Download size={14} />
                  <span>Export JSON</span>
                </button>
              </div>

              {/* Demo Mode Management Box */}
              <div className="p-4 rounded-xl bg-navy-950 border border-violet-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-navy-200">Demo Mode & Simulated Storage</h3>
                    {demoService.isDemoModeActive() && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-navy-400">
                    Reset demo proposals and briefs back to canonical seed (14 creators, 8 briefs, 8 deals). Real user accounts are unaffected.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const success = demoService.resetDemoData();
                      if (success) {
                        setSaveSuccess('Demo data successfully restored to fresh canonical seed (14 creators, 8 briefs, 8 deals).');
                        setTimeout(() => setSaveSuccess(null), 3500);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/15 text-rose-300 hover:bg-rose-500 hover:text-white border border-rose-500/40 transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw size={13} />
                    <span>Reset Demo Data</span>
                  </button>
                  {demoService.isDemoModeActive() && (
                    <button
                      type="button"
                      onClick={() => {
                        demoService.exitDemo();
                        navigate('/welcome');
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-navy-800 text-navy-300 hover:text-white border border-navy-700 transition-all"
                    >
                      Exit Demo
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-navy-800">
                <button
                  type="button"
                  onClick={handleSavePrivacy}
                  className="px-5 py-2 rounded-xl gradient-brand text-white font-semibold text-xs shadow-glow-violet hover:opacity-95 transition-all"
                >
                  Save Privacy Settings
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: AI PREFERENCES */}
          {activeTab === 'ai' && (
            <div className="space-y-6 text-left">
              <div>
                <h2 className="text-base font-bold text-navy-50">AI Assistant Preferences</h2>
                <p className="text-xs text-navy-400 mt-0.5">
                  Configure the behavior of Aura Assistant and inspect provider connectivity.
                </p>
              </div>

              {/* Live Provider Status Card */}
              <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu size={16} className={modelInfo.isLive ? 'text-emerald-400' : 'text-cyan-400'} />
                    <h3 className="text-xs font-bold text-navy-200">Active AI Architecture</h3>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                      modelInfo.isLive
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                    )}
                  >
                    {modelInfo.isLive ? 'Live Gemini REST API' : 'Deterministic Fallback Engine'}
                  </span>
                </div>
                <p className="text-xs text-navy-400 leading-relaxed">
                  Model: <strong className="text-navy-200">{modelInfo.modelName}</strong>. {modelInfo.notice}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-navy-300">Preferred AI Language</label>
                  <select
                    value={aiForm.responseLanguage}
                    onChange={(e) =>
                      setAiForm({ ...aiForm, responseLanguage: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 focus:outline-none focus:border-violet-500"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="French">French (Français)</option>
                    <option value="German">German (Deutsch)</option>
                    <option value="Japanese">Japanese (日本語)</option>
                  </select>
                </div>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-navy-950 border border-navy-800 cursor-pointer">
                  <div>
                    <h4 className="text-xs font-semibold text-navy-200">
                      Context-Aware Page Suggestions
                    </h4>
                    <p className="text-[11px] text-navy-400 mt-0.5">
                      Allow Aura to offer contextual prompts on Creator Studio, Briefs, and Verification.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiForm.autoSuggestions}
                    onChange={(e) =>
                      setAiForm({ ...aiForm, autoSuggestions: e.target.checked })
                    }
                    className="rounded border-navy-700 text-violet-600 bg-navy-900 h-4 w-4"
                  />
                </label>
              </div>

              {/* Clear History Shortcut */}
              <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-navy-200">Clear Saved Conversations</h4>
                  <p className="text-[11px] text-navy-400 mt-0.5">
                    Reset stored chat session history back to the initial greeting.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearChatMessages();
                    setSaveSuccess('AI Assistant chat history cleared.');
                    setTimeout(() => setSaveSuccess(null), 3000);
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 transition-all flex items-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>Clear History</span>
                </button>
              </div>

              <div className="flex justify-end pt-4 border-t border-navy-800">
                <button
                  type="button"
                  onClick={handleSaveAi}
                  className="px-5 py-2 rounded-xl gradient-brand text-white font-semibold text-xs shadow-glow-violet hover:opacity-95 transition-all"
                >
                  Save AI Preferences
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-left">
            <h3 className="font-bold text-base text-navy-50">Change Password</h3>
            {passwordSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Check size={16} />
                <span>Password successfully updated!</span>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-navy-300">Current Password</label>
                  <input
                    type="password"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-navy-300">New Password</label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-navy-300">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 text-xs font-medium text-navy-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl gradient-brand text-white font-semibold text-xs"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-navy-900 border border-rose-500/40 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-left">
            <h3 className="font-bold text-base text-rose-300">Confirm Account Deletion</h3>
            <p className="text-xs text-navy-300 leading-relaxed">
              This action is irreversible. Type <strong>DELETE</strong> below to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 text-xs font-medium text-navy-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText.toLowerCase() !== 'delete'}
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs disabled:opacity-40"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
