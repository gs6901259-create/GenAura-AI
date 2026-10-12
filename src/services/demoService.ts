/**
 * GenAura AI — Reusable Demo Mode Service
 * ========================================
 * Presentation-ready, fast, reliable Demo Mode service for judges & teams.
 *
 * Guarantees:
 * 1. Storage isolation with dedicated namespaced keys (`genaura_demo_*`).
 * 2. Stable IDs and idempotent initialization (no duplicate records).
 * 3. Preserves user modifications across page reloads while in demo mode.
 * 4. Deterministic reset restoring canonical seed data without touching real accounts.
 * 5. Clean exit returning to normal app without destructive data loss.
 * 6. Graceful recovery if demo storage is missing or corrupted.
 */

import {
  Creator,
  CreativeBrief,
  PortfolioItem,
  ShortlistEntry,
  AppNotification,
  UserSettings,
  UserPersona,
  AuthUser,
} from '../types';
import { Deal, DealActivity, DealMessage } from '../types/deal';
import {
  DEMO_CREATORS,
  DEMO_CREATOR_PROFILES,
  DEMO_BRIEFS,
  DEMO_PORTFOLIOS,
  DEMO_SHORTLISTS,
  DEMO_DEALS,
  DEMO_DEAL_ACTIVITIES,
  DEMO_DEAL_MESSAGES,
  DEMO_NOTIFICATIONS,
  DEMO_USER_SETTINGS,
} from '../data/demoSeedData';
import { DEFAULT_DEMO_USERS } from '../data/authAndSettingsDefaults';
import { useAppStore } from '../lib/store';
import { dealService } from './dealService';
import { storageService } from './storageService';

export const DEMO_STORAGE_KEYS = {
  IS_ACTIVE: 'genaura_demo_is_active',
  ACTIVE_ROLE: 'genaura_demo_active_role',
  INITIALIZED: 'genaura_demo_initialized',
  SCHEMA_VERSION: 'genaura_demo_version',
  CREATORS: 'genaura_demo_creators',
  BRIEFS: 'genaura_demo_briefs',
  PORTFOLIOS: 'genaura_demo_portfolios',
  SHORTLISTS: 'genaura_demo_shortlists',
  DEALS: 'genaura_demo_deals',
  DEAL_ACTIVITIES: 'genaura_demo_deal_activities',
  DEAL_MESSAGES: 'genaura_demo_deal_messages',
  NOTIFICATIONS: 'genaura_demo_notifications',
  SETTINGS: 'genaura_demo_settings',
} as const;

const CURRENT_SCHEMA_VERSION = '2.0.0';

// In-memory fallback for non-browser/test environments
const memoryStore = new Map<string, string>();

class DemoService {
  private listeners = new Set<() => void>();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', () => this.notify());
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error('DemoService subscriber error:', e);
      }
    });
  }

  // ── Storage Helpers with In-Memory Fallback ──

  private getStorageItem<T>(key: string, fallback: T): T {
    try {
      let raw: string | null = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        raw = window.localStorage.getItem(key);
      } else {
        raw = memoryStore.get(key) || null;
      }
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch (e) {
      console.warn(`[DemoService] Error reading key "${key}", using fallback:`, e);
      return fallback;
    }
  }

  private setStorageItem<T>(key: string, value: T): void {
    try {
      const json = JSON.stringify(value);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, json);
      } else {
        memoryStore.set(key, json);
      }
    } catch (e) {
      console.error(`[DemoService] Error setting key "${key}":`, e);
    }
  }

  private removeStorageItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      } else {
        memoryStore.delete(key);
      }
    } catch (e) {
      console.error(`[DemoService] Error removing key "${key}":`, e);
    }
  }

  // ── Status & Persona ──

  public isDemoModeActive(): boolean {
    return this.getStorageItem<boolean>(DEMO_STORAGE_KEYS.IS_ACTIVE, false);
  }

  public getDemoRole(): UserPersona {
    return this.getStorageItem<UserPersona>(DEMO_STORAGE_KEYS.ACTIVE_ROLE, 'brand');
  }

  // ── Deterministic Initialization ──

  /**
   * Initializes demo seed data into isolated storage keys (`genaura_demo_*`).
   * Guarantees:
   * - Deterministic stable IDs
   * - No duplicate entities generated on multiple calls
   * - Does NOT overwrite user modifications if already initialized!
   * - Recovers gracefully from corrupted data.
   */
  public initializeDemoSeedIfNeeded(forceFresh = false): void {
    const isInitialized = this.getStorageItem<boolean>(DEMO_STORAGE_KEYS.INITIALIZED, false);
    const schemaVersion = this.getStorageItem<string>(DEMO_STORAGE_KEYS.SCHEMA_VERSION, '');

    const needsInit = forceFresh || !isInitialized || schemaVersion !== CURRENT_SCHEMA_VERSION;

    if (!needsInit) {
      // Validate data integrity in case a previous session corrupted a key
      try {
        const creators = this.getDemoCreators();
        const briefs = this.getDemoBriefs();
        const deals = this.getDemoDeals();
        if (creators.length < 12 || briefs.length < 8 || deals.length < 8) {
          // Incomplete records detected; heal by filling in canonical baseline
          this.seedCanonicalDataset();
        }
      } catch {
        this.seedCanonicalDataset();
      }
      return;
    }

    this.seedCanonicalDataset();
  }

  private seedCanonicalDataset(): void {
    this.setStorageItem(DEMO_STORAGE_KEYS.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
    this.setStorageItem(DEMO_STORAGE_KEYS.CREATORS, DEMO_CREATORS);
    this.setStorageItem(DEMO_STORAGE_KEYS.BRIEFS, DEMO_BRIEFS);
    this.setStorageItem(DEMO_STORAGE_KEYS.PORTFOLIOS, DEMO_PORTFOLIOS);
    this.setStorageItem(DEMO_STORAGE_KEYS.SHORTLISTS, DEMO_SHORTLISTS);
    this.setStorageItem(DEMO_STORAGE_KEYS.DEALS, DEMO_DEALS);
    this.setStorageItem(DEMO_STORAGE_KEYS.DEAL_ACTIVITIES, DEMO_DEAL_ACTIVITIES);
    this.setStorageItem(DEMO_STORAGE_KEYS.DEAL_MESSAGES, DEMO_DEAL_MESSAGES);
    this.setStorageItem(DEMO_STORAGE_KEYS.NOTIFICATIONS, DEMO_NOTIFICATIONS);
    this.setStorageItem(DEMO_STORAGE_KEYS.SETTINGS, DEMO_USER_SETTINGS);
    this.setStorageItem(DEMO_STORAGE_KEYS.INITIALIZED, true);
  }

  // ── Demo Entry, Role Switching, Exit & Reset ──

  /**
   * Enters Demo Mode with the chosen persona.
   * Hydrates isolated demo data, updates store sessions, and notifies listeners.
   */
  public enterDemo(role: UserPersona = 'brand'): void {
    this.setStorageItem(DEMO_STORAGE_KEYS.IS_ACTIVE, true);
    this.setStorageItem(DEMO_STORAGE_KEYS.ACTIVE_ROLE, role);

    // Ensure seed data is initialized
    this.initializeDemoSeedIfNeeded();

    // Synchronize to runtime stores
    this.syncStoresWithDemoData(role);
    this.notify();
  }

  /**
   * Fast 1-click role switcher in the demo banner.
   */
  public switchDemoRole(role: UserPersona): void {
    this.setStorageItem(DEMO_STORAGE_KEYS.ACTIVE_ROLE, role);
    this.syncStoresWithDemoData(role);
    this.notify();
  }

  /**
   * Exits demo mode cleanly.
   * Preserves demo data in `genaura_demo_*` so subsequent entries do not lose state,
   * but deactivates the demo banner and logs out.
   */
  public exitDemo(): void {
    this.setStorageItem(DEMO_STORAGE_KEYS.IS_ACTIVE, false);
    try {
      useAppStore.getState().logout();
    } catch (e) {
      console.warn('[DemoService] Error during store logout on exit:', e);
    }
    this.notify();
  }

  /**
   * Explicitly resets only the demo storage namespace.
   * Restores the canonical dataset without affecting real user accounts.
   */
  public resetDemoData(): boolean {
    try {
      const activeRole = this.getDemoRole();
      this.seedCanonicalDataset();
      this.syncStoresWithDemoData(activeRole);
      this.notify();
      return true;
    } catch (e) {
      console.error('[DemoService] Failed to reset demo data:', e);
      return false;
    }
  }

  // ── Store Synchronization ──

  /**
   * Hydrates the application stores with current demo data.
   */
  public syncStoresWithDemoData(role?: UserPersona): void {
    const activeRole = role || this.getDemoRole();
    const creators = this.getDemoCreators();
    const briefs = this.getDemoBriefs();
    const portfolios = this.getDemoPortfolios();
    const shortlists = this.getDemoShortlists();
    const deals = this.getDemoDeals();
    const activities = this.getStorageItem<DealActivity[]>(DEMO_STORAGE_KEYS.DEAL_ACTIVITIES, DEMO_DEAL_ACTIVITIES);
    const messages = this.getStorageItem<DealMessage[]>(DEMO_STORAGE_KEYS.DEAL_MESSAGES, DEMO_DEAL_MESSAGES);
    const notifications = this.getStorageItem<AppNotification[]>(DEMO_STORAGE_KEYS.NOTIFICATIONS, DEMO_NOTIFICATIONS);
    const userSettings = this.getStorageItem<UserSettings>(DEMO_STORAGE_KEYS.SETTINGS, DEMO_USER_SETTINGS);

    // 1. Sync useAppStore
    try {
      const demoUser: AuthUser = DEFAULT_DEMO_USERS[activeRole];
      useAppStore.setState({
        creators,
        briefs,
        portfolios,
        shortlist: shortlists,
        notifications,
        userSettings,
        authUser: demoUser,
        currentPersona: activeRole,
        isAuthenticated: true,
      });
    } catch (e) {
      console.warn('[DemoService] Could not sync useAppStore:', e);
    }

    // 2. Sync dealService
    try {
      dealService.setDealsData(deals, activities, messages);
    } catch (e) {
      console.warn('[DemoService] Could not sync dealService:', e);
    }

    // 3. Sync storageService (discovery profiles)
    try {
      storageService.setDemoData(DEMO_CREATOR_PROFILES);
    } catch (e) {
      console.warn('[DemoService] Could not sync storageService:', e);
    }
  }

  // ── Queries & Mutators for Demo State ──

  public getDemoCreators(): Creator[] {
    return this.getStorageItem<Creator[]>(DEMO_STORAGE_KEYS.CREATORS, DEMO_CREATORS);
  }

  public getDemoBriefs(): CreativeBrief[] {
    return this.getStorageItem<CreativeBrief[]>(DEMO_STORAGE_KEYS.BRIEFS, DEMO_BRIEFS);
  }

  public getDemoPortfolios(): PortfolioItem[] {
    return this.getStorageItem<PortfolioItem[]>(DEMO_STORAGE_KEYS.PORTFOLIOS, DEMO_PORTFOLIOS);
  }

  public getDemoShortlists(): ShortlistEntry[] {
    return this.getStorageItem<ShortlistEntry[]>(DEMO_STORAGE_KEYS.SHORTLISTS, DEMO_SHORTLISTS);
  }

  public getDemoDeals(): Deal[] {
    return this.getStorageItem<Deal[]>(DEMO_STORAGE_KEYS.DEALS, DEMO_DEALS);
  }

  public saveDemoBrief(brief: CreativeBrief): void {
    const briefs = this.getDemoBriefs();
    const idx = briefs.findIndex((b) => b.id === brief.id);
    let updated: CreativeBrief[];
    if (idx >= 0) {
      updated = [...briefs];
      updated[idx] = brief;
    } else {
      updated = [brief, ...briefs];
    }
    this.setStorageItem(DEMO_STORAGE_KEYS.BRIEFS, updated);
    try {
      useAppStore.getState().addBrief(brief);
    } catch {}
    this.notify();
  }

  public saveDemoDeal(deal: Deal): void {
    const deals = this.getDemoDeals();
    const idx = deals.findIndex((d) => d.id === deal.id);
    let updated: Deal[];
    if (idx >= 0) {
      updated = [...deals];
      updated[idx] = deal;
    } else {
      updated = [deal, ...deals];
    }
    this.setStorageItem(DEMO_STORAGE_KEYS.DEALS, updated);
    try {
      dealService.setDealsData(updated);
    } catch {}
    this.notify();
  }

  public saveDemoCreator(creator: Creator): void {
    const creators = this.getDemoCreators();
    const idx = creators.findIndex((c) => c.id === creator.id);
    let updated: Creator[];
    if (idx >= 0) {
      updated = [...creators];
      updated[idx] = creator;
    } else {
      updated = [creator, ...creators];
    }
    this.setStorageItem(DEMO_STORAGE_KEYS.CREATORS, updated);
    try {
      useAppStore.getState().updateCreator(creator.id, creator);
    } catch {}
    this.notify();
  }

  public getDemoMetricsSummary() {
    const creators = this.getDemoCreators();
    const briefs = this.getDemoBriefs();
    const deals = this.getDemoDeals();
    const portfolios = this.getDemoPortfolios();
    const shortlists = this.getDemoShortlists();

    return {
      creatorsCount: creators.length,
      briefsCount: briefs.length,
      dealsCount: deals.length,
      portfoliosCount: portfolios.length,
      shortlistsCount: shortlists.length,
      activeNegotiations: deals.filter((d) => ['sent', 'counteroffered'].includes(d.status)).length,
      acceptedDeals: deals.filter((d) => ['accepted', 'in_progress'].includes(d.status)).length,
      completedDeals: deals.filter((d) => d.status === 'completed').length,
    };
  }
}

export const demoService = new DemoService();
