/**
 * @file Shortlist management and campaign planning service.
 */

import { persistence } from './persistenceService.js';
import { ShortlistStatus } from '../types/index.js';

export class ShortlistService {
  constructor(persistenceLayer = persistence) {
    this.persistence = persistenceLayer;
  }

  getShortlists() {
    return this.persistence.getShortlists();
  }

  getShortlist(shortlistId = 'shortlist-default') {
    return this.persistence.getShortlist(shortlistId);
  }

  createShortlist(name) {
    return this.persistence.createShortlist(name);
  }

  isShortlisted(shortlistId, creatorId) {
    const list = this.getShortlist(shortlistId);
    if (!list || !Array.isArray(list.items)) return false;
    return list.items.some((item) => item.creatorId === creatorId);
  }

  addToShortlist(shortlistId = 'shortlist-default', creator, notes = '') {
    if (!creator || !creator.id) return null;
    const shortlists = this.getShortlists();
    let list = shortlists.find((s) => s.id === shortlistId);
    if (!list) {
      list = {
        id: shortlistId,
        name: 'Primary Campaign Shortlist',
        createdAt: new Date().toISOString(),
        items: [],
      };
      shortlists.push(list);
    }

    const existingIndex = list.items.findIndex((i) => i.creatorId === creator.id);
    if (existingIndex >= 0) {
      // Already in shortlist, update notes if provided
      if (notes) {
        list.items[existingIndex].notes = notes;
      }
      this.persistence.saveShortlists(shortlists);
      return list.items[existingIndex];
    }

    const newItem = {
      creatorId: creator.id,
      creator: {
        id: creator.id,
        name: creator.name,
        handle: creator.handle,
        avatar: creator.avatar,
        category: creator.category,
        primaryPlatform: creator.primaryPlatform,
        followers: creator.followers,
        followerTier: creator.followerTier,
        engagementRate: creator.engagementRate,
        rateCard: creator.rateCard,
        brandSafetyScore: creator.brandSafetyScore,
        matchScore: creator.matchScore ?? null,
      },
      addedAt: new Date().toISOString(),
      status: ShortlistStatus.IDENTIFIED,
      notes: notes || '',
    };

    list.items.push(newItem);
    this.persistence.saveShortlists(shortlists);
    return newItem;
  }

  removeFromShortlist(shortlistId = 'shortlist-default', creatorId) {
    const shortlists = this.getShortlists();
    const list = shortlists.find((s) => s.id === shortlistId);
    if (!list || !Array.isArray(list.items)) return false;

    const initialLen = list.items.length;
    list.items = list.items.filter((item) => item.creatorId !== creatorId);
    if (list.items.length !== initialLen) {
      this.persistence.saveShortlists(shortlists);
      return true;
    }
    return false;
  }

  toggleShortlist(shortlistId = 'shortlist-default', creator) {
    if (!creator || !creator.id) return false;
    if (this.isShortlisted(shortlistId, creator.id)) {
      this.removeFromShortlist(shortlistId, creator.id);
      return false; // Removed
    } else {
      this.addToShortlist(shortlistId, creator);
      return true; // Added
    }
  }

  updateItemStatus(shortlistId = 'shortlist-default', creatorId, newStatus) {
    const shortlists = this.getShortlists();
    const list = shortlists.find((s) => s.id === shortlistId);
    if (!list) return false;

    const item = list.items.find((i) => i.creatorId === creatorId);
    if (item) {
      item.status = newStatus;
      this.persistence.saveShortlists(shortlists);
      return true;
    }
    return false;
  }

  updateItemNotes(shortlistId = 'shortlist-default', creatorId, notes) {
    const shortlists = this.getShortlists();
    const list = shortlists.find((s) => s.id === shortlistId);
    if (!list) return false;

    const item = list.items.find((i) => i.creatorId === creatorId);
    if (item) {
      item.notes = notes;
      this.persistence.saveShortlists(shortlists);
      return true;
    }
    return false;
  }

  clearShortlist(shortlistId = 'shortlist-default') {
    const shortlists = this.getShortlists();
    const list = shortlists.find((s) => s.id === shortlistId);
    if (list) {
      list.items = [];
      this.persistence.saveShortlists(shortlists);
      return true;
    }
    return false;
  }

  getAggregateMetrics(shortlistId = 'shortlist-default') {
    const list = this.getShortlist(shortlistId);
    const items = (list && list.items) || [];

    if (items.length === 0) {
      return {
        totalCreators: 0,
        totalReach: 0,
        averageEngagement: 0,
        estimatedTotalCost: 0,
        averageMatchScore: 0,
      };
    }

    let totalReach = 0;
    let sumEngagement = 0;
    let totalCost = 0;
    let sumMatchScore = 0;
    let scoredCount = 0;

    items.forEach((item) => {
      const c = item.creator;
      totalReach += c.followers || 0;
      sumEngagement += c.engagementRate || 0;
      const rate = (c.rateCard && (c.rateCard.postRate || c.rateCard.videoRate)) || 0;
      totalCost += rate;
      if (typeof c.matchScore === 'number' && !isNaN(c.matchScore)) {
        sumMatchScore += c.matchScore;
        scoredCount++;
      }
    });

    return {
      totalCreators: items.length,
      totalReach,
      averageEngagement: Number((sumEngagement / items.length).toFixed(2)),
      estimatedTotalCost: totalCost,
      averageMatchScore: scoredCount > 0 ? Number((sumMatchScore / scoredCount).toFixed(1)) : 0,
    };
  }

  exportCsv(shortlistId = 'shortlist-default') {
    const list = this.getShortlist(shortlistId);
    const items = (list && list.items) || [];

    const headers = [
      'Creator ID',
      'Name',
      'Handle',
      'Platform',
      'Category',
      'Followers',
      'Engagement Rate (%)',
      'Post Rate ($)',
      'Video Rate ($)',
      'Match Score',
      'Status',
      'Notes',
      'Added At',
    ];

    const rows = items.map((item) => {
      const c = item.creator;
      return [
        `"${c.id}"`,
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.handle}"`,
        `"${c.primaryPlatform}"`,
        `"${c.category}"`,
        c.followers,
        c.engagementRate,
        (c.rateCard && c.rateCard.postRate) || '',
        (c.rateCard && c.rateCard.videoRate) || '',
        c.matchScore ?? 'N/A',
        `"${item.status}"`,
        `"${(item.notes || '').replace(/"/g, '""')}"`,
        `"${item.addedAt}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}

export const shortlistService = new ShortlistService();
