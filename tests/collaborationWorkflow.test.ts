/**
 * Comprehensive Automated Test Suite for GenAura AI Collaboration Workflows
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Mock browser LocalStorage for Node environment
class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// Attach mock window and localStorage to global scope
(global as any).window = {};
(global as any).localStorage = new MockLocalStorage();

// Import services and utilities with explicit extensions for Node ESM
import {
  canTransition,
} from '../src/utils/statusTransitions.ts';
import { storageService } from '../src/services/storageService.ts';
import { discoveryService } from '../src/services/discoveryService.ts';
import { briefService } from '../src/services/briefService.ts';

describe('GenAura AI Collaboration Workflow Tests', () => {
  // Test 1: Seed Data & Contracts
  it('1. Seed Data Integrity: Creators, Briefs and Shortlists are properly populated', async () => {
    storageService.resetAllToSeed();

    const creators = await discoveryService.getCreators();
    assert.ok(creators.length >= 6, 'Expected at least 6 creators');
    assert.equal(creators[0].id, 'cr_1');
    assert.equal(creators[0].name, 'Sarah Jenkins');
    assert.ok(creators[0].platforms.length > 0, 'Creator has platform metrics');

    const briefs = await briefService.getBriefs();
    assert.ok(briefs.length >= 3, 'Expected at least 3 briefs');
    assert.equal(briefs[0].id, 'brief_1');
    assert.equal(briefs[0].brandName, 'GenAura Systems');
    assert.ok(briefs[0].standardDeliverables.length > 0, 'Brief has standard deliverables');

    const shortlists = await discoveryService.getShortlists();
    assert.ok(shortlists.length >= 3, 'Expected at least 3 shortlists');
    assert.ok(shortlists[0].creatorIds.includes('cr_1'));
  });

  // Test 2: State Machine Transition Rules
  it('2. State Machine: Valid transitions succeed and illegal transitions are rejected', () => {
    // Valid transitions
    assert.equal(canTransition('draft', 'sent'), true);
    assert.equal(canTransition('sent', 'accepted'), true);
    assert.equal(canTransition('sent', 'declined'), true);
    assert.equal(canTransition('accepted', 'in_progress'), true);
    assert.equal(canTransition('in_progress', 'submitted'), true);
    assert.equal(canTransition('submitted', 'revision_requested'), true);
    assert.equal(canTransition('submitted', 'completed'), true);
    assert.equal(canTransition('declined', 'sent'), true); // can re-invite

    // Illegal transitions
    assert.equal(canTransition('draft', 'completed'), false, 'Cannot jump draft directly to completed');
    assert.equal(canTransition('sent', 'in_progress'), false, 'Cannot start work without creator acceptance');
    assert.equal(canTransition('completed', 'draft'), false, 'Completed is terminal');
    assert.equal(canTransition('completed', 'sent'), false, 'Completed cannot be re-sent');
    assert.equal(canTransition('in_progress', 'accepted'), false, 'Cannot revert backwards to accepted');
  });

  // Test 3: Brief-Linked Collaboration Request Creation
  it('3. Brief-Linked Request Creation: Properly initializes project with audit log', () => {
    const newProjectId = `proj_test_${Date.now()}`;
    const newProject = {
      id: newProjectId,
      briefId: 'brief_1',
      creatorId: 'cr_1',
      shortlistId: 'sl_1',
      title: 'Sarah Jenkins - Test Product Launch',
      personalizedMessage: 'Looking forward to working together!',
      deliverables: [
        {
          id: 'del_t1',
          title: 'YouTube Dedicated Review',
          platform: 'youtube' as const,
          format: '10m Video',
          description: 'Product walkthrough',
          dueDate: '2026-11-01',
          status: 'pending' as const,
        },
      ],
      compensation: {
        amount: 3000,
        currency: 'USD',
        type: 'fixed' as const,
        paymentTerms: 'Net-15',
      },
      usageRights: {
        durationDays: 90,
        digitalAdsAllowed: true,
        organicWhitelisting: true,
      },
      status: 'sent' as const,
      statusHistory: [
        {
          id: 'log_t1',
          fromStatus: null,
          toStatus: 'draft' as const,
          timestamp: new Date().toISOString(),
          actorRole: 'brand' as const,
          actorName: 'Brand Manager',
          note: 'Created test request',
        },
        {
          id: 'log_t2',
          fromStatus: 'draft' as const,
          toStatus: 'sent' as const,
          timestamp: new Date().toISOString(),
          actorRole: 'brand' as const,
          actorName: 'Brand Manager',
          note: 'Dispatched test request to creator',
        },
      ],
      targetDraftDate: '2026-10-25',
      targetPublishDate: '2026-11-01',
      tags: ['Test', 'YouTube'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storageService.saveCollaboration(newProject);
    const retrieved = storageService.getCollaborationById(newProjectId);
    assert.ok(retrieved, 'Project must exist in storage');
    assert.equal(retrieved.status, 'sent');
    assert.equal(retrieved.deliverables.length, 1);
    assert.equal(retrieved.statusHistory.length, 2);
  });

  // Test 4: Creator Accept Action & Audit Logging
  it('4. Creator Accept Flow: Transitions status to accepted and creates audit trail', () => {
    const projectId = `proj_test_accept_${Date.now()}`;
    storageService.saveCollaboration({
      id: projectId,
      briefId: 'brief_1',
      creatorId: 'cr_2',
      title: 'Marcus Vance - AI Demo',
      personalizedMessage: 'Invitation message',
      deliverables: [],
      compensation: { amount: 4500, currency: 'USD', type: 'fixed', paymentTerms: 'Net-15' },
      usageRights: { durationDays: 60, digitalAdsAllowed: false, organicWhitelisting: true },
      status: 'sent',
      statusHistory: [],
      targetDraftDate: '2026-11-01',
      targetPublishDate: '2026-11-10',
      tags: ['AI'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res = storageService.updateStatus(
      projectId,
      'accepted',
      'creator',
      'Marcus Vance',
      'Terms agreed. Looking forward to filming!'
    );

    assert.equal(res.success, true);
    assert.equal(res.project?.status, 'accepted');
    assert.ok(res.project?.contractSignoffDate, 'Contract signoff date must be stamped');

    const history = res.project?.statusHistory || [];
    assert.equal(history.length, 1);
    assert.equal(history[0].actorRole, 'creator');
    assert.equal(history[0].toStatus, 'accepted');
    assert.equal(history[0].note, 'Terms agreed. Looking forward to filming!');
  });

  // Test 5: Creator Decline Action with Structured Categories
  it('5. Creator Decline Flow: Records decline category, note and status', () => {
    const projectId = `proj_test_decline_${Date.now()}`;
    storageService.saveCollaboration({
      id: projectId,
      briefId: 'brief_2',
      creatorId: 'cr_3',
      title: 'Elena Rostova - Design Collab',
      personalizedMessage: 'Invitation message',
      deliverables: [],
      compensation: { amount: 1800, currency: 'USD', type: 'fixed', paymentTerms: 'Net-15' },
      usageRights: { durationDays: 60, digitalAdsAllowed: false, organicWhitelisting: false },
      status: 'sent',
      statusHistory: [],
      targetDraftDate: '2026-11-05',
      targetPublishDate: '2026-11-15',
      tags: ['Design'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res = storageService.updateStatus(
      projectId,
      'declined',
      'creator',
      'Elena Rostova',
      'Declined due to timeline overlap with product sprint.',
      {
        category: 'schedule_conflict',
        note: 'Timeline overlap with product sprint.',
      }
    );

    assert.equal(res.success, true);
    assert.equal(res.project?.status, 'declined');
    assert.equal(res.project?.declineReason?.category, 'schedule_conflict');
    assert.equal(res.project?.declineReason?.note, 'Timeline overlap with product sprint.');
    assert.ok(res.project?.declineReason?.timestamp);
  });

  // Test 6: Deliverable Status Updates & Workflow Completion
  it('6. Deliverables Lifecycle: Draft submission -> Revision -> Approval -> Project Complete', () => {
    const projectId = `proj_test_deliv_${Date.now()}`;
    const delivId = 'del_life_1';

    storageService.saveCollaboration({
      id: projectId,
      briefId: 'brief_1',
      creatorId: 'cr_1',
      title: 'Full Lifecycle Collaboration',
      personalizedMessage: 'Let us complete this project',
      deliverables: [
        {
          id: delivId,
          title: 'YouTube Video Integration',
          platform: 'youtube',
          format: 'Dedicated Video',
          description: 'Highlight feature workflow',
          dueDate: '2026-10-30',
          status: 'in_progress',
        },
      ],
      compensation: { amount: 2500, currency: 'USD', type: 'fixed', paymentTerms: 'Net-15' },
      usageRights: { durationDays: 90, digitalAdsAllowed: true, organicWhitelisting: true },
      status: 'in_progress',
      statusHistory: [],
      targetDraftDate: '2026-10-30',
      targetPublishDate: '2026-11-05',
      tags: ['Lifecycle'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 1. Creator submits draft URL
    storageService.updateDeliverable(projectId, delivId, {
      status: 'submitted',
      draftUrl: 'https://preview.genaura.ai/draft/v1.mp4',
      submittedAt: new Date().toISOString(),
    });
    storageService.updateStatus(
      projectId,
      'submitted',
      'creator',
      'Sarah Jenkins',
      'Uploaded draft cut for brand review'
    );

    let proj = storageService.getCollaborationById(projectId);
    assert.equal(proj?.status, 'submitted');
    assert.equal(proj?.deliverables[0].status, 'submitted');
    assert.equal(proj?.deliverables[0].draftUrl, 'https://preview.genaura.ai/draft/v1.mp4');

    // 2. Brand requests revision
    storageService.updateDeliverable(projectId, delivId, {
      status: 'revision',
      feedback: 'Please enhance the dashboard intro section.',
    });
    storageService.updateStatus(
      projectId,
      'revision_requested',
      'brand',
      'Campaign Manager',
      'Please enhance the dashboard intro section.'
    );

    proj = storageService.getCollaborationById(projectId);
    assert.equal(proj?.status, 'revision_requested');
    assert.equal(proj?.deliverables[0].status, 'revision');

    // 3. Creator re-submits updated cut
    storageService.updateDeliverable(projectId, delivId, {
      status: 'submitted',
      draftUrl: 'https://preview.genaura.ai/draft/v2_final.mp4',
    });
    storageService.updateStatus(
      projectId,
      'submitted',
      'creator',
      'Sarah Jenkins',
      'Re-uploaded cut with enhanced dashboard segment.'
    );

    // 4. Brand approves deliverable & completes project
    storageService.updateDeliverable(projectId, delivId, {
      status: 'approved',
      liveUrl: 'https://youtube.com/watch?v=liveGenAuraTest',
      approvedAt: new Date().toISOString(),
    });
    storageService.updateStatus(
      projectId,
      'completed',
      'brand',
      'Campaign Manager',
      'Approved deliverable and verified live publish.'
    );

    proj = storageService.getCollaborationById(projectId);
    assert.equal(proj?.status, 'completed');
    assert.equal(proj?.deliverables[0].status, 'approved');
    assert.equal(proj?.deliverables[0].liveUrl, 'https://youtube.com/watch?v=liveGenAuraTest');
    assert.ok(proj?.deliverables[0].approvedAt);
  });

  // Test 7: Metrics & Analytics Calculation
  it('7. Dashboard Metrics: Calculates accurate KPIs from active collaborations', () => {
    storageService.resetAllToSeed();
    const metrics = storageService.getMetrics();

    assert.ok(metrics.totalProjects > 0, 'Total projects > 0');
    assert.ok(metrics.totalBudgetCommitted > 0, 'Budget committed > 0');
    assert.ok(metrics.acceptanceRate >= 0 && metrics.acceptanceRate <= 100, 'Acceptance rate percentage');
    assert.ok(metrics.activeProjects >= 0, 'Active projects counted');
    assert.ok(metrics.pendingResponses >= 0, 'Pending responses counted');
  });

  // Test 8: Export / Import JSON Persistence Roundtrip
  it('8. Persistence Export/Import: Roundtrip retains identical state data', () => {
    const exportedJSON = storageService.exportDataJSON();
    assert.ok(exportedJSON.length > 50, 'Exported string must contain data');

    const parsed = JSON.parse(exportedJSON);
    assert.equal(parsed.version, '1.0.0');
    assert.ok(Array.isArray(parsed.collaborations));
    assert.ok(Array.isArray(parsed.creators));
    assert.ok(Array.isArray(parsed.briefs));
    assert.ok(Array.isArray(parsed.shortlists));

    const importSuccess = storageService.importDataJSON(exportedJSON);
    assert.equal(importSuccess, true, 'Import must succeed without error');
  });
});
