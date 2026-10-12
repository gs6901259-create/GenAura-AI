/**
 * @file Unified persistence layer supporting both Node.js (memory/file) and Browser (localStorage).
 */

import { seedCreators } from '../data/seedCreators.js';
import { seedBriefs } from '../data/seedBriefs.js';

export class PersistenceService {
  constructor(storageAdapter = null) {
    this.adapter = storageAdapter || this.detectStorageAdapter();
  }

  detectStorageAdapter() {
    // Check if running in browser with window.localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      return {
        getItem: (k) => window.localStorage.getItem(k),
        setItem: (k, v) => window.localStorage.setItem(k, v),
        removeItem: (k) => window.localStorage.removeItem(k),
      };
    }

    // Node.js memory store fallback
    const memory = new Map();
    memory.set('genaura_creators', JSON.stringify(seedCreators));
    memory.set('genaura_briefs', JSON.stringify(seedBriefs));
    memory.set(
      'genaura_shortlists',
      JSON.stringify([
        {
          id: 'shortlist-default',
          name: 'Primary Campaign Shortlist',
          createdAt: new Date().toISOString(),
          items: [],
        },
      ])
    );

    return {
      getItem: (k) => memory.get(k) || null,
      setItem: (k, v) => memory.set(k, v),
      removeItem: (k) => memory.delete(k),
    };
  }

  // --- CREATORS ---
  getCreators() {
    const raw = this.adapter.getItem('genaura_creators');
    if (!raw) {
      this.adapter.setItem('genaura_creators', JSON.stringify(seedCreators));
      return [...seedCreators];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [...seedCreators];
    }
  }

  getCreatorById(id) {
    const creators = this.getCreators();
    return creators.find((c) => c.id === id) || null;
  }

  saveCreators(creators) {
    this.adapter.setItem('genaura_creators', JSON.stringify(creators));
    return creators;
  }

  // --- BRIEFS ---
  getBriefs() {
    const raw = this.adapter.getItem('genaura_briefs');
    if (!raw) {
      this.adapter.setItem('genaura_briefs', JSON.stringify(seedBriefs));
      return [...seedBriefs];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [...seedBriefs];
    }
  }

  getBriefById(id) {
    const briefs = this.getBriefs();
    return briefs.find((b) => b.id === id) || null;
  }

  saveBrief(brief) {
    const briefs = this.getBriefs();
    const existingIdx = briefs.findIndex((b) => b.id === brief.id);
    if (existingIdx >= 0) {
      briefs[existingIdx] = brief;
    } else {
      briefs.push(brief);
    }
    this.adapter.setItem('genaura_briefs', JSON.stringify(briefs));
    return brief;
  }

  // --- SHORTLISTS ---
  getShortlists() {
    const raw = this.adapter.getItem('genaura_shortlists');
    if (!raw) {
      const initial = [
        {
          id: 'shortlist-default',
          name: 'Primary Campaign Shortlist',
          createdAt: new Date().toISOString(),
          items: [],
        },
      ];
      this.adapter.setItem('genaura_shortlists', JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  getShortlist(id = 'shortlist-default') {
    const shortlists = this.getShortlists();
    return shortlists.find((s) => s.id === id) || shortlists[0] || null;
  }

  saveShortlists(shortlists) {
    this.adapter.setItem('genaura_shortlists', JSON.stringify(shortlists));
    return shortlists;
  }

  createShortlist(name) {
    const shortlists = this.getShortlists();
    const newShortlist = {
      id: `shortlist-${Date.now()}`,
      name: name || `Shortlist ${shortlists.length + 1}`,
      createdAt: new Date().toISOString(),
      items: [],
    };
    shortlists.push(newShortlist);
    this.saveShortlists(shortlists);
    return newShortlist;
  }

  resetToDefaults() {
    this.adapter.setItem('genaura_creators', JSON.stringify(seedCreators));
    this.adapter.setItem('genaura_briefs', JSON.stringify(seedBriefs));
    this.adapter.setItem(
      'genaura_shortlists',
      JSON.stringify([
        {
          id: 'shortlist-default',
          name: 'Primary Campaign Shortlist',
          createdAt: new Date().toISOString(),
          items: [],
        },
      ])
    );
  }
}

export const persistence = new PersistenceService();
