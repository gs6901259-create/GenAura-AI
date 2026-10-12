/**
 * GenAura AI — Zustand App Store
 * ================================
 * Single source of truth for all application data.
 * Supports Brand, Creator, and Admin Review personas with
 * full verification lifecycle, portfolio CRUD, brief generation,
 * shortlisting, and project collaboration.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  AppStore,
  Creator, CreatorId, asCreatorId,
  PortfolioItem, PortfolioId,
  CreativeBrief, BriefId, asBriefId,
  ShortlistEntry, ShortlistId,
  ProjectRequest, ProjectId,
  DashboardStats,
  UserPersona,
  ThemeMode,
  AuthUser,
  UserSettings,
  ChatMessage,
  AppNotification,
} from '@/types';
import {
  SEED_CREATORS,
  SEED_PORTFOLIOS,
  SEED_BRIEFS,
  SEED_SHORTLIST,
  SEED_PROJECTS,
} from '@/data/seed';
import {
  DEFAULT_DEMO_USERS,
  DEFAULT_USER_SETTINGS,
  SEED_NOTIFICATIONS,
  INITIAL_ASSISTANT_MESSAGES,
} from '@/data/authAndSettingsDefaults';
import { applyTheme } from '@/lib/theme';
import { verificationEngine } from '@/services/verificationEngine';

// Enhance initial seed creators with verification statuses
const ENHANCED_SEED_CREATORS: Creator[] = SEED_CREATORS.map((c, i) => {
  if (i === 0) {
    return {
      ...c,
      verified: true,
      verificationStatus: 'verified',
      email: 'aria@creativestory.io',
      country: 'United States',
      city: 'San Francisco',
      yearsExperience: 8,
      collaborationTypes: ['Brand Copy', 'Campaign Retainers', 'Website Messaging'],
    };
  }
  if (i === 1) {
    return {
      ...c,
      verified: true,
      verificationStatus: 'verified',
      email: 'marcus@webbdesign.com',
      country: 'United States',
      city: 'Austin',
      yearsExperience: 6,
      collaborationTypes: ['Brand Identity', 'Packaging', 'Visual Systems'],
    };
  }
  if (i === 2) {
    return {
      ...c,
      verified: false,
      verificationStatus: 'submitted',
      email: 'yuki@motionlab.jp',
      country: 'United States',
      city: 'New York',
      yearsExperience: 5,
      collaborationTypes: ['3D Motion', 'App Launch Videos', 'Lottie Animations'],
    };
  }
  if (i === 3) {
    return {
      ...c,
      verified: false,
      verificationStatus: 'under_review',
      email: 'priya@growthsocial.in',
      country: 'India',
      city: 'Bangalore',
      yearsExperience: 4,
      collaborationTypes: ['Social Media Retainers', 'Content Calendar', 'Instagram Strategy'],
    };
  }
  if (i === 4) {
    return {
      ...c,
      verified: false,
      verificationStatus: 'needs_changes',
      email: 'leo@leolens.fr',
      country: 'France',
      city: 'Paris',
      yearsExperience: 3,
      collaborationTypes: ['Product Photography', 'Commercial Shoots'],
    };
  }
  return {
    ...c,
    verified: false,
    verificationStatus: 'draft',
    email: 'zara@productux.co.uk',
    country: 'United Kingdom',
    city: 'London',
    yearsExperience: 4,
    collaborationTypes: ['UX Research', 'Design Systems'],
  };
});

// ──────────────────────────────────────────────
// Store Actions
// ──────────────────────────────────────────────
interface AppStoreActions {
  // Persona & Active Context
  setPersona:           (p: UserPersona) => void;
  setCurrentCreatorId:  (id: CreatorId) => void;
  setActiveBriefId:     (id: BriefId | null) => void;

  // Creators (Member 2 & Creator Studio)
  addCreator:    (c: Creator) => void;
  updateCreator: (id: CreatorId, patch: Partial<Creator>) => void;
  removeCreator: (id: CreatorId) => void;

  // Verification Engine (Core Flow)
  submitCreatorVerification: (creatorId: CreatorId) => void;
  reviewCreatorVerification: (
    creatorId: CreatorId,
    decision: 'approved' | 'changes_requested' | 'rejected',
    reason: string,
    reviewer?: string
  ) => void;

  // Portfolios (Member 2 & Portfolio Builder)
  addPortfolio:      (p: PortfolioItem) => void;
  updatePortfolio:   (id: PortfolioId, patch: Partial<PortfolioItem>) => void;
  removePortfolio:   (id: PortfolioId) => void;
  reorderPortfolios: (creatorId: CreatorId, orderedIds: PortfolioId[]) => void;

  // Briefs (Member 4)
  addBrief:    (b: CreativeBrief) => void;
  updateBrief: (id: BriefId, patch: Partial<CreativeBrief>) => void;
  removeBrief: (id: BriefId) => void;

  // Shortlist (Member 3)
  addToShortlist:       (entry: ShortlistEntry) => void;
  updateShortlistEntry: (id: ShortlistId, patch: Partial<ShortlistEntry>) => void;
  removeFromShortlist:  (id: ShortlistId) => void;

  // Projects (Member 5)
  addProject:    (p: ProjectRequest) => void;
  updateProject: (id: ProjectId, patch: Partial<ProjectRequest>) => void;
  removeProject: (id: ProjectId) => void;

  // Theme
  setTheme: (theme: ThemeMode) => void;

  // Authentication
  login:                        (user: AuthUser) => void;
  logout:                       () => void;
  updateAuthUser:               (patch: Partial<AuthUser>) => void;
  registerUser:                 (user: AuthUser) => void;
  getRegisteredUserByGoogleSub: (sub: string) => AuthUser | undefined;
  getRegisteredUserByEmail:     (email: string) => AuthUser | undefined;
  linkGoogleAccount:            (userId: string, googleSub: string) => void;

  // User Settings
  updateUserSettings: (patch: Partial<UserSettings>) => void;
  resetUserSettings:  () => void;

  // Notifications
  addNotification:          (n: AppNotification) => void;
  markNotificationRead:     (id: string) => void;
  markAllNotificationsRead: () => void;

  // AI Assistant Chat
  addChatMessage:    (m: ChatMessage) => void;
  clearChatMessages: () => void;

  // Selectors
  getDashboardStats:      () => DashboardStats;
  getCreatorById:         (id: CreatorId) => Creator | undefined;
  getBriefById:           (id: BriefId) => CreativeBrief | undefined;
  getProjectById:         (id: ProjectId) => ProjectRequest | undefined;
  getPortfoliosByCreator: (creatorId: CreatorId) => PortfolioItem[];
}

type FullStore = AppStore & AppStoreActions;

// ──────────────────────────────────────────────
// Store implementation
// ──────────────────────────────────────────────
export const useAppStore = create<FullStore>()(
  persist(
    (set, get) => ({
      // ── Initial state ──
      creators:          ENHANCED_SEED_CREATORS,
      portfolios:        SEED_PORTFOLIOS,
      briefs:            SEED_BRIEFS,
      shortlist:         SEED_SHORTLIST,
      projects:          SEED_PROJECTS,
      currentPersona:    'brand',
      currentCreatorId:  asCreatorId('c1'),
      activeBriefId:     asBriefId('b1'),
      theme:             'dark',
      authUser:          DEFAULT_DEMO_USERS.brand,
      isAuthenticated:   true,
      registeredUsers:   Object.values(DEFAULT_DEMO_USERS),
      userSettings:      DEFAULT_USER_SETTINGS,
      notifications:     SEED_NOTIFICATIONS,
      chatMessages:      INITIAL_ASSISTANT_MESSAGES,

      // ── Theme ──
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },

      // ── Authentication ──
      login: (user) => set({ authUser: user, isAuthenticated: true, currentPersona: user.role }),
      logout: () => set({ authUser: null, isAuthenticated: false }),
      updateAuthUser: (patch) =>
        set((s) => ({
          authUser: s.authUser ? { ...s.authUser, ...patch } : null,
          registeredUsers: (s.registeredUsers || []).map((u) =>
            u.id === s.authUser?.id ? { ...u, ...patch } : u
          ),
        })),
      registerUser: (user) =>
        set((s) => ({
          registeredUsers: [
            ...(s.registeredUsers || []).filter((u) => u.id !== user.id),
            user,
          ],
          authUser: user,
          isAuthenticated: true,
          currentPersona: user.role,
        })),
      getRegisteredUserByGoogleSub: (sub) =>
        (get().registeredUsers || []).find((u) => u.googleSub === sub),
      getRegisteredUserByEmail: (email) =>
        (get().registeredUsers || []).find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        ),
      linkGoogleAccount: (userId, googleSub) =>
        set((s) => ({
          registeredUsers: (s.registeredUsers || []).map((u) =>
            u.id === userId ? { ...u, googleSub, authProvider: 'google' } : u
          ),
          authUser:
            s.authUser?.id === userId
              ? { ...s.authUser, googleSub, authProvider: 'google' }
              : s.authUser,
        })),

      // ── User Settings ──
      updateUserSettings: (patch) =>
        set((s) => ({
          userSettings: s.userSettings
            ? { ...s.userSettings, ...patch }
            : { ...DEFAULT_USER_SETTINGS, ...patch },
        })),
      resetUserSettings: () => set({ userSettings: DEFAULT_USER_SETTINGS }),

      // ── Notifications ──
      addNotification: (n) =>
        set((s) => ({ notifications: [n, ...(s.notifications || [])] })),
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: (s.notifications || []).map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllNotificationsRead: () =>
        set((s) => ({
          notifications: (s.notifications || []).map((n) => ({ ...n, read: true })),
        })),

      // ── AI Assistant ──
      addChatMessage: (m) =>
        set((s) => ({ chatMessages: [...(s.chatMessages || []), m] })),
      clearChatMessages: () =>
        set({ chatMessages: INITIAL_ASSISTANT_MESSAGES }),

      // ── Persona & Context ──
      setPersona: (p) => {
        const demoUser = DEFAULT_DEMO_USERS[p];
        set((s) => ({
          currentPersona: p,
          authUser: s.authUser?.isDemoAccount ? demoUser : s.authUser,
        }));
      },
      setCurrentCreatorId: (id) => set({ currentCreatorId: id }),
      setActiveBriefId: (id) => set({ activeBriefId: id }),

      // ── Creators ──
      addCreator: (c) => set((s) => ({ creators: [...s.creators, c] })),
      updateCreator: (id, patch) =>
        set((s) => ({
          creators: s.creators.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      removeCreator: (id) =>
        set((s) => ({ creators: s.creators.filter((c) => c.id !== id) })),

      // ── Verification Engine ──
      submitCreatorVerification: (creatorId) => {
        const creator = get().creators.find((c) => c.id === creatorId);
        if (!creator) return;
        const creatorPortfolios = get().portfolios.filter((p) => p.creatorId === creatorId);
        const updated = verificationEngine.submitForVerification(creator, creatorPortfolios);

        set((s) => ({
          creators: s.creators.map((c) => (c.id === creatorId ? updated : c)),
        }));
      },

      reviewCreatorVerification: (creatorId, decision, reason, reviewer = 'Editorial Lead') => {
        const creator = get().creators.find((c) => c.id === creatorId);
        if (!creator) return;
        const updated = verificationEngine.reviewVerification(creator, decision, reason, reviewer);

        set((s) => ({
          creators: s.creators.map((c) => (c.id === creatorId ? updated : c)),
        }));
      },

      // ── Portfolios ──
      addPortfolio: (p) =>
        set((s) => {
          const creator = s.creators.find((c) => c.id === p.creatorId);
          const updatedCreators = creator
            ? s.creators.map((c) =>
                c.id === p.creatorId
                  ? { ...c, portfolioIds: [...c.portfolioIds, p.id] }
                  : c
              )
            : s.creators;

          return {
            portfolios: [...s.portfolios, p],
            creators: updatedCreators,
          };
        }),

      updatePortfolio: (id, patch) =>
        set((s) => ({
          portfolios: s.portfolios.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      removePortfolio: (id) =>
        set((s) => {
          const portfolio = s.portfolios.find((p) => p.id === id);
          const updatedCreators = portfolio
            ? s.creators.map((c) =>
                c.id === portfolio.creatorId
                  ? { ...c, portfolioIds: c.portfolioIds.filter((pId) => pId !== id) }
                  : c
              )
            : s.creators;

          return {
            portfolios: s.portfolios.filter((p) => p.id !== id),
            creators: updatedCreators,
          };
        }),

      reorderPortfolios: (creatorId, orderedIds) =>
        set((s) => ({
          creators: s.creators.map((c) =>
            c.id === creatorId ? { ...c, portfolioIds: orderedIds } : c
          ),
        })),

      // ── Briefs ──
      addBrief: (b) => set((s) => ({ briefs: [...s.briefs, b] })),
      updateBrief: (id, patch) =>
        set((s) => ({
          briefs: s.briefs.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),
      removeBrief: (id) =>
        set((s) => ({ briefs: s.briefs.filter((b) => b.id !== id) })),

      // ── Shortlist ──
      addToShortlist: (entry) =>
        set((s) => ({ shortlist: [...s.shortlist, entry] })),
      updateShortlistEntry: (id, patch) =>
        set((s) => ({
          shortlist: s.shortlist.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),
      removeFromShortlist: (id) =>
        set((s) => ({ shortlist: s.shortlist.filter((e) => e.id !== id) })),

      // ── Projects ──
      addProject: (p) => set((s) => ({ projects: [...s.projects, p] })),
      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removeProject: (id) =>
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

      // ── Selectors ──
      getDashboardStats: (): DashboardStats => {
        const { creators, briefs, shortlist, projects } = get();
        return {
          totalCreators:       creators.length,
          availableCreators:   creators.filter((c) => c.status === 'available').length,
          publishedBriefs:     briefs.filter((b) => b.status === 'published').length,
          shortlistedCreators: shortlist.length,
          pendingRequests:     projects.filter((p) => p.status === 'pending').length,
          activeEngagements:   projects.filter(
            (p) => p.status === 'in-progress' || p.status === 'review'
          ).length,
        };
      },

      getCreatorById: (id) => get().creators.find((c) => c.id === id),
      getBriefById:   (id) => get().briefs.find((b) => b.id === id),
      getProjectById: (id) => get().projects.find((p) => p.id === id),
      getPortfoliosByCreator: (creatorId) =>
        get().portfolios.filter((p) => p.creatorId === creatorId),
    }),
    {
      name: 'genaura-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
