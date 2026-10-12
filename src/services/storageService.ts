import {
  CollaborationProject,
  CollaborationStatus,
  DeclineCategory,
  StatusAuditLog,
  CollaborationDashboardMetrics,
  CollaborationFilterOptions,
  ProjectDeliverable,
} from '../contracts/collaborationContract';
import { CreatorProfile, Shortlist } from '../contracts/discoveryContract';
import { CampaignBrief } from '../contracts/briefContract';
import {
  INITIAL_CREATORS,
  INITIAL_SHORTLISTS,
  INITIAL_BRIEFS,
  INITIAL_COLLABORATIONS,
} from '../data/mockSeedData';
import { canTransition } from '../utils/statusTransitions';

const STORAGE_KEYS = {
  COLLABORATIONS: 'genaura_collaborations_v1',
  CREATORS: 'genaura_creators_v1',
  SHORTLISTS: 'genaura_shortlists_v1',
  BRIEFS: 'genaura_briefs_v1',
  ACTIVE_PERSONA: 'genaura_active_persona_v1',
  VIEWING_CREATOR_ID: 'genaura_viewing_creator_id_v1',
};

export type AppPersona = 'brand' | 'creator';

class StorageService {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.ensureInitialized();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', () => this.notify());
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb());
  }

  private getItem<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      return JSON.parse(data) as T;
    } catch (e) {
      console.warn(`Error reading from localStorage key "${key}":`, e);
      return fallback;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.notify();
    } catch (e) {
      console.error(`Error saving to localStorage key "${key}":`, e);
    }
  }

  public ensureInitialized(): void {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(STORAGE_KEYS.CREATORS)) {
      this.setItem(STORAGE_KEYS.CREATORS, INITIAL_CREATORS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SHORTLISTS)) {
      this.setItem(STORAGE_KEYS.SHORTLISTS, INITIAL_SHORTLISTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BRIEFS)) {
      this.setItem(STORAGE_KEYS.BRIEFS, INITIAL_BRIEFS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.COLLABORATIONS)) {
      this.setItem(STORAGE_KEYS.COLLABORATIONS, INITIAL_COLLABORATIONS);
    }
  }

  public resetAllToSeed(): void {
    if (typeof window === 'undefined') return;
    this.setItem(STORAGE_KEYS.CREATORS, INITIAL_CREATORS);
    this.setItem(STORAGE_KEYS.SHORTLISTS, INITIAL_SHORTLISTS);
    this.setItem(STORAGE_KEYS.BRIEFS, INITIAL_BRIEFS);
    this.setItem(STORAGE_KEYS.COLLABORATIONS, INITIAL_COLLABORATIONS);
  }

  public setDemoData(
    creators: CreatorProfile[],
    briefs?: CampaignBrief[],
    shortlists?: Shortlist[],
    collaborations?: CollaborationProject[]
  ): void {
    if (typeof window === 'undefined') return;
    if (creators) this.setItem(STORAGE_KEYS.CREATORS, creators);
    if (briefs) this.setItem(STORAGE_KEYS.BRIEFS, briefs);
    if (shortlists) this.setItem(STORAGE_KEYS.SHORTLISTS, shortlists);
    if (collaborations) this.setItem(STORAGE_KEYS.COLLABORATIONS, collaborations);
  }

  // --- Persona & Simulation ---
  public getPersona(): AppPersona {
    return this.getItem<AppPersona>(STORAGE_KEYS.ACTIVE_PERSONA, 'brand');
  }

  public setPersona(persona: AppPersona): void {
    this.setItem(STORAGE_KEYS.ACTIVE_PERSONA, persona);
  }

  public getViewingCreatorId(): string {
    const creators = this.getCreators();
    const defaultId = creators[0]?.id || 'cr_1';
    return this.getItem<string>(STORAGE_KEYS.VIEWING_CREATOR_ID, defaultId);
  }

  public setViewingCreatorId(creatorId: string): void {
    this.setItem(STORAGE_KEYS.VIEWING_CREATOR_ID, creatorId);
  }

  // --- Creators & Discovery ---
  public getCreators(): CreatorProfile[] {
    return this.getItem<CreatorProfile[]>(STORAGE_KEYS.CREATORS, INITIAL_CREATORS);
  }

  public getCreatorById(id: string): CreatorProfile | undefined {
    return this.getCreators().find((c) => c.id === id);
  }

  public getShortlists(): Shortlist[] {
    return this.getItem<Shortlist[]>(STORAGE_KEYS.SHORTLISTS, INITIAL_SHORTLISTS);
  }

  public getShortlistById(id: string): Shortlist | undefined {
    return this.getShortlists().find((s) => s.id === id);
  }

  // --- Campaign Briefs ---
  public getBriefs(): CampaignBrief[] {
    return this.getItem<CampaignBrief[]>(STORAGE_KEYS.BRIEFS, INITIAL_BRIEFS);
  }

  public getBriefById(id: string): CampaignBrief | undefined {
    return this.getBriefs().find((b) => b.id === id);
  }

  // --- Collaborations ---
  public getCollaborations(filters?: CollaborationFilterOptions): CollaborationProject[] {
    let projects = this.getItem<CollaborationProject[]>(
      STORAGE_KEYS.COLLABORATIONS,
      INITIAL_COLLABORATIONS
    );

    if (!filters) return projects;

    if (filters.status && filters.status !== 'all') {
      projects = projects.filter((p) => p.status === filters.status);
    }

    if (filters.briefId && filters.briefId !== 'all') {
      projects = projects.filter((p) => p.briefId === filters.briefId);
    }

    if (filters.creatorId && filters.creatorId !== 'all') {
      projects = projects.filter((p) => p.creatorId === filters.creatorId);
    }

    if (filters.platform && filters.platform !== 'all') {
      projects = projects.filter((p) =>
        p.deliverables.some((d) => d.platform === filters.platform)
      );
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      const creators = this.getCreators();
      const creatorMap = new Map(creators.map((c) => [c.id, c]));

      projects = projects.filter((p) => {
        const creator = creatorMap.get(p.creatorId);
        return (
          p.title.toLowerCase().includes(q) ||
          p.personalizedMessage.toLowerCase().includes(q) ||
          creator?.name.toLowerCase().includes(q) ||
          creator?.handle.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
        );
      });
    }

    return projects;
  }

  public getCollaborationById(id: string): CollaborationProject | undefined {
    return this.getCollaborations().find((p) => p.id === id);
  }

  public saveCollaboration(project: CollaborationProject): void {
    const list = this.getCollaborations();
    const idx = list.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      list[idx] = { ...project, updatedAt: new Date().toISOString() };
    } else {
      list.unshift(project);
    }
    this.setItem(STORAGE_KEYS.COLLABORATIONS, list);
  }

  public deleteCollaboration(id: string): void {
    const list = this.getCollaborations().filter((p) => p.id !== id);
    this.setItem(STORAGE_KEYS.COLLABORATIONS, list);
  }

  /**
   * Transition status with full audit logging & validation
   */
  public updateStatus(
    projectId: string,
    targetStatus: CollaborationStatus,
    actorRole: 'brand' | 'creator' | 'system',
    actorName: string,
    note: string,
    declineDetails?: { category: DeclineCategory; note: string }
  ): { success: boolean; error?: string; project?: CollaborationProject } {
    const project = this.getCollaborationById(projectId);
    if (!project) {
      return { success: false, error: `Project ${projectId} not found` };
    }

    if (!canTransition(project.status, targetStatus)) {
      return {
        success: false,
        error: `Illegal state transition from "${project.status}" to "${targetStatus}".`,
      };
    }

    const newAuditLog: StatusAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fromStatus: project.status,
      toStatus: targetStatus,
      timestamp: new Date().toISOString(),
      actorRole,
      actorName,
      note,
    };

    const updated: CollaborationProject = {
      ...project,
      status: targetStatus,
      statusHistory: [...project.statusHistory, newAuditLog],
      updatedAt: new Date().toISOString(),
    };

    if (targetStatus === 'accepted') {
      updated.contractSignoffDate = new Date().toISOString();
    }

    if (targetStatus === 'declined' && declineDetails) {
      updated.declineReason = {
        category: declineDetails.category,
        note: declineDetails.note,
        timestamp: new Date().toISOString(),
      };
    }

    this.saveCollaboration(updated);
    return { success: true, project: updated };
  }

  /**
   * Deliverable status updates
   */
  public updateDeliverable(
    projectId: string,
    deliverableId: string,
    updates: Partial<ProjectDeliverable>
  ): void {
    const project = this.getCollaborationById(projectId);
    if (!project) return;

    const delivs = project.deliverables.map((d) => {
      if (d.id === deliverableId) {
        return { ...d, ...updates };
      }
      return d;
    });

    this.saveCollaboration({
      ...project,
      deliverables: delivs,
    });
  }

  // --- Metrics Calculation ---
  public getMetrics(): CollaborationDashboardMetrics {
    const all = this.getCollaborations();
    const active = all.filter((p) =>
      ['in_progress', 'submitted', 'revision_requested'].includes(p.status)
    ).length;
    const pending = all.filter((p) => p.status === 'sent').length;

    const acceptedCount = all.filter((p) =>
      ['accepted', 'in_progress', 'submitted', 'revision_requested', 'completed'].includes(p.status)
    ).length;
    const declinedCount = all.filter((p) => p.status === 'declined').length;
    const deciderTotal = acceptedCount + declinedCount;
    const acceptanceRate = deciderTotal > 0 ? Math.round((acceptedCount / deciderTotal) * 100) : 100;

    const totalBudget = all.reduce((sum, p) => sum + p.compensation.amount, 0);

    let completedDelivs = 0;
    let pendingDelivs = 0;
    all.forEach((p) => {
      p.deliverables.forEach((d) => {
        if (d.status === 'approved') completedDelivs++;
        else pendingDelivs++;
      });
    });

    return {
      totalProjects: all.length,
      activeProjects: active,
      pendingResponses: pending,
      acceptanceRate,
      totalBudgetCommitted: totalBudget,
      totalDeliverablesCompleted: completedDelivs,
      totalDeliverablesPending: pendingDelivs,
    };
  }

  // --- Export / Import ---
  public exportDataJSON(): string {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      collaborations: this.getCollaborations(),
      creators: this.getCreators(),
      shortlists: this.getShortlists(),
      briefs: this.getBriefs(),
    };
    return JSON.stringify(data, null, 2);
  }

  public importDataJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.collaborations && Array.isArray(parsed.collaborations)) {
        this.setItem(STORAGE_KEYS.COLLABORATIONS, parsed.collaborations);
      }
      if (parsed.creators && Array.isArray(parsed.creators)) {
        this.setItem(STORAGE_KEYS.CREATORS, parsed.creators);
      }
      if (parsed.shortlists && Array.isArray(parsed.shortlists)) {
        this.setItem(STORAGE_KEYS.SHORTLISTS, parsed.shortlists);
      }
      if (parsed.briefs && Array.isArray(parsed.briefs)) {
        this.setItem(STORAGE_KEYS.BRIEFS, parsed.briefs);
      }
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }
}

export const storageService = new StorageService();
