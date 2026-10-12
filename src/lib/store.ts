/**
 * GenAura AI — Zustand App Store
 * ================================
 * Single source of truth for all application data.
 * Feature members should import useAppStore and select their slice.
 *
 * Dashboard reads derived stats via selectors (never hardcoded).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  AppStore,
  Creator, CreatorId,
  PortfolioItem, PortfolioId,
  CreativeBrief, BriefId,
  ShortlistEntry, ShortlistId,
  ProjectRequest, ProjectId,
  DashboardStats,
} from '@/types';
import {
  SEED_CREATORS,
  SEED_PORTFOLIOS,
  SEED_BRIEFS,
  SEED_SHORTLIST,
  SEED_PROJECTS,
} from '@/data/seed';

// ──────────────────────────────────────────────
// Store shape
// ──────────────────────────────────────────────
interface AppStoreActions {
  // Creators (Member 2)
  addCreator:    (c: Creator) => void;
  updateCreator: (id: CreatorId, patch: Partial<Creator>) => void;
  removeCreator: (id: CreatorId) => void;

  // Portfolios (Member 2)
  addPortfolio:    (p: PortfolioItem) => void;
  updatePortfolio: (id: PortfolioId, patch: Partial<PortfolioItem>) => void;
  removePortfolio: (id: PortfolioId) => void;

  // Briefs (Member 4)
  addBrief:    (b: CreativeBrief) => void;
  updateBrief: (id: BriefId, patch: Partial<CreativeBrief>) => void;
  removeBrief: (id: BriefId) => void;

  // Shortlist (Member 3)
  addToShortlist:      (entry: ShortlistEntry) => void;
  updateShortlistEntry:(id: ShortlistId, patch: Partial<ShortlistEntry>) => void;
  removeFromShortlist: (id: ShortlistId) => void;

  // Projects (Member 5)
  addProject:    (p: ProjectRequest) => void;
  updateProject: (id: ProjectId, patch: Partial<ProjectRequest>) => void;
  removeProject: (id: ProjectId) => void;

  // Selectors
  getDashboardStats: () => DashboardStats;
  getCreatorById:    (id: CreatorId) => Creator | undefined;
  getBriefById:      (id: BriefId) => CreativeBrief | undefined;
  getProjectById:    (id: ProjectId) => ProjectRequest | undefined;
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
      creators:   SEED_CREATORS,
      portfolios: SEED_PORTFOLIOS,
      briefs:     SEED_BRIEFS,
      shortlist:  SEED_SHORTLIST,
      projects:   SEED_PROJECTS,

      // ── Creators ──
      addCreator: (c) => set((s) => ({ creators: [...s.creators, c] })),
      updateCreator: (id, patch) =>
        set((s) => ({
          creators: s.creators.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      removeCreator: (id) =>
        set((s) => ({ creators: s.creators.filter((c) => c.id !== id) })),

      // ── Portfolios ──
      addPortfolio: (p) => set((s) => ({ portfolios: [...s.portfolios, p] })),
      updatePortfolio: (id, patch) =>
        set((s) => ({
          portfolios: s.portfolios.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removePortfolio: (id) =>
        set((s) => ({ portfolios: s.portfolios.filter((p) => p.id !== id) })),

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
