/**
 * GenAura AI — Smart Deal Room Automated Test Suite
 * ==================================================
 * Tests proposal creation, validation, state machine transitions,
 * side-by-side diffing, version immutability, role permissions,
 * private notes isolation, and persistence.
 */

import { describe, it, beforeEach } from 'node:test';
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

(global as any).window = {};
(global as any).localStorage = new MockLocalStorage();

// Import dealService and utilities with explicit .ts extension for tsx
import {
  dealService,
  canDealTransition,
  diffDealTerms,
  validateProposalTerms,
} from '../src/services/dealService.ts';
import { DealTerms } from '../src/types/deal.ts';

describe('GenAura AI — Smart Deal Room Test Suite', () => {
  const sampleTerms: DealTerms = {
    budget: 3500,
    currency: 'USD',
    deliverables: [
      {
        id: 'del-1',
        title: 'Cinematic Reel',
        format: 'Reel',
        quantity: 2,
        requirements: '4K video with color grading',
      },
    ],
    startDate: '2026-11-01',
    deadline: '2026-11-20',
    revisionAllowance: 2,
    usageRights: {
      durationDays: 90,
      digitalAdsAllowed: true,
      organicWhitelisting: true,
    },
    notes: 'Initial test terms',
  };

  const sampleBrand = {
    id: 'brand-test',
    role: 'brand' as const,
    name: 'Aura Fashion',
    handle: '@aurafashion',
    avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=brand',
  };

  const sampleCreator = {
    id: 'creator-test',
    role: 'creator' as const,
    name: 'Elena Rostova',
    handle: '@elena_motion',
    avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=creator',
  };

  beforeEach(() => {
    localStorage.clear();
    dealService.resetToSeed();
  });

  // Test 1: Validation Rules
  it('1. Proposal Validation: Enforces required fields, positive budget, and valid dates', () => {
    // Missing title
    const res1 = validateProposalTerms('', 'Valid objective', sampleTerms);
    assert.equal(res1.isValid, false);
    assert.ok(res1.errors.title);

    // Negative/Zero budget
    const invalidBudgetTerms = { ...sampleTerms, budget: -100 };
    const res2 = validateProposalTerms('Title', 'Valid objective', invalidBudgetTerms);
    assert.equal(res2.isValid, false);
    assert.ok(res2.errors.budget);

    // Deadline before start date
    const invalidDatesTerms = {
      ...sampleTerms,
      startDate: '2026-11-20',
      deadline: '2026-11-10',
    };
    const res3 = validateProposalTerms('Title', 'Valid objective', invalidDatesTerms);
    assert.equal(res3.isValid, false);
    assert.ok(res3.errors.deadline);

    // Empty deliverables
    const emptyDelivsTerms = { ...sampleTerms, deliverables: [] };
    const res4 = validateProposalTerms('Title', 'Valid objective', emptyDelivsTerms);
    assert.equal(res4.isValid, false);
    assert.ok(res4.errors.deliverables);

    // Valid proposal
    const validRes = validateProposalTerms('Autumn Campaign', 'High quality reel production', sampleTerms);
    assert.equal(validRes.isValid, true);
    assert.equal(Object.keys(validRes.errors).length, 0);
  });

  // Test 2: Proposal Creation & Version 1 Initialization
  it('2. Proposal Creation: Creates Deal with Version 1 and initial audit log', () => {
    const result = dealService.createProposal({
      title: 'Neon Dusk Launch',
      campaignObjective: 'Create luxury cinematic commercial',
      brand: sampleBrand,
      creator: sampleCreator,
      terms: sampleTerms,
      asDraft: false,
    });

    assert.equal(result.success, true);
    assert.ok(result.deal);
    assert.equal(result.deal?.status, 'sent');
    assert.equal(result.deal?.awaitingActionFrom, 'creator');
    assert.equal(result.deal?.versions.length, 1);
    assert.equal(result.deal?.versions[0].versionNumber, 1);
    assert.equal(result.deal?.versions[0].terms.budget, 3500);

    // Check activity trail
    const activities = dealService.getActivities(result.deal!.id);
    assert.ok(activities.length >= 1);
    assert.equal(activities[0].type, 'sent');
  });

  // Test 3: Draft Proposal
  it('3. Draft Lifecycle: Draft proposal does not dispatch awaitingActionFrom to creator', () => {
    const result = dealService.createProposal({
      title: 'Draft Work in Progress',
      campaignObjective: 'Pending budget approval',
      brand: sampleBrand,
      creator: sampleCreator,
      terms: sampleTerms,
      asDraft: true,
    });

    assert.equal(result.success, true);
    assert.equal(result.deal?.status, 'draft');
    assert.equal(result.deal?.awaitingActionFrom, 'none');
  });

  // Test 4: State Machine Invariant Rules
  it('4. State Machine: Valid transitions succeed and illegal transitions are rejected', () => {
    // Valid transitions
    assert.equal(canDealTransition('draft', 'sent'), true);
    assert.equal(canDealTransition('sent', 'counteroffered'), true);
    assert.equal(canDealTransition('sent', 'accepted'), true);
    assert.equal(canDealTransition('sent', 'declined'), true);
    assert.equal(canDealTransition('sent', 'withdrawn'), true);
    assert.equal(canDealTransition('counteroffered', 'accepted'), true);
    assert.equal(canDealTransition('counteroffered', 'declined'), true);
    assert.equal(canDealTransition('accepted', 'in_progress'), true);
    assert.equal(canDealTransition('in_progress', 'completed'), true);

    // Illegal transitions
    assert.equal(canDealTransition('draft', 'completed'), false, 'Cannot skip directly to completed');
    assert.equal(canDealTransition('sent', 'in_progress'), false, 'Cannot start work without acceptance');
    assert.equal(canDealTransition('accepted', 'counteroffered'), false, 'Cannot counteroffer accepted deal');
    assert.equal(canDealTransition('accepted', 'withdrawn'), false, 'Cannot withdraw accepted deal');
    assert.equal(canDealTransition('completed', 'sent'), false, 'Completed is terminal');
    assert.equal(canDealTransition('completed', 'draft'), false, 'Completed is terminal');
  });

  // Test 5: Counteroffer Workflow & Side-by-Side Diffing
  it('5. Counteroffer Workflow: Bumps version, highlights diffs, and preserves baseline', () => {
    const createRes = dealService.createProposal({
      title: 'Counteroffer Test Campaign',
      campaignObjective: 'Test versioning',
      brand: sampleBrand,
      creator: sampleCreator,
      terms: sampleTerms,
    });
    const dealId = createRes.deal!.id;

    // Creator prepares counteroffer: Increase budget to $4,200 and extend deadline
    const counterTerms: DealTerms = {
      ...sampleTerms,
      budget: 4200,
      deadline: '2026-11-28',
      revisionAllowance: 3,
      notes: 'Requested +$700 for extra revision round',
    };

    // Diff utility check
    const diff = diffDealTerms(sampleTerms, counterTerms);
    assert.equal(diff.hasChanges, true);
    assert.equal(diff.budgetChanged, true);
    assert.equal(diff.oldBudget, 3500);
    assert.equal(diff.newBudget, 4200);
    assert.equal(diff.deadlineChanged, true);
    assert.equal(diff.revisionAllowanceChanged, true);

    // Submit counteroffer as creator
    const counterRes = dealService.submitCounteroffer({
      dealId,
      proposedTerms: counterTerms,
      counterByRole: 'creator',
      counterByName: sampleCreator.name,
      summaryNotes: 'Increased budget to $4,200',
    });

    assert.equal(counterRes.success, true);
    assert.equal(counterRes.deal?.status, 'counteroffered');
    assert.equal(counterRes.deal?.activeVersionNumber, 2);
    assert.equal(counterRes.deal?.versions.length, 2);
    assert.equal(counterRes.deal?.awaitingActionFrom, 'brand');

    // Immutability: Version 1 must still preserve original budget of 3500
    assert.equal(counterRes.deal?.versions[0].terms.budget, 3500);
    assert.equal(counterRes.deal?.versions[1].terms.budget, 4200);
  });

  // Test 6: Brand Accepts Counteroffer
  it('6. Acceptance: Brand accepts Counteroffer Version 2 and locks agreed terms', () => {
    const createRes = dealService.createProposal({
      title: 'Acceptance Flow Test',
      campaignObjective: 'End-to-end verification',
      brand: sampleBrand,
      creator: sampleCreator,
      terms: sampleTerms,
    });
    const dealId = createRes.deal!.id;

    // Creator counteroffers
    const counterTerms = { ...sampleTerms, budget: 4500 };
    dealService.submitCounteroffer({
      dealId,
      proposedTerms: counterTerms,
      counterByRole: 'creator',
      counterByName: sampleCreator.name,
    });

    // Brand cannot counteroffer themselves without waiting for their turn, but now it is brand's turn
    // Creator cannot accept their own counteroffer:
    const creatorAcceptRes = dealService.acceptDeal({
      dealId,
      acceptedByRole: 'creator',
      acceptedByName: sampleCreator.name,
    });
    assert.equal(creatorAcceptRes.success, false, 'Proposer cannot accept their own proposal');

    // Brand accepts the counteroffer:
    const brandAcceptRes = dealService.acceptDeal({
      dealId,
      acceptedByRole: 'brand',
      acceptedByName: sampleBrand.name,
    });
    assert.equal(brandAcceptRes.success, true);
    assert.equal(brandAcceptRes.deal?.status, 'accepted');
    assert.equal(brandAcceptRes.deal?.currentTerms.budget, 4500);

    // Accepted deal cannot be silently amended or counteroffered:
    const illegalCounter = dealService.submitCounteroffer({
      dealId,
      proposedTerms: { ...counterTerms, budget: 5000 },
      counterByRole: 'creator',
      counterByName: sampleCreator.name,
    });
    assert.equal(illegalCounter.success, false, 'Accepted deal cannot be counteroffered');
  });

  // Test 7: Decline and Withdrawal Permissions
  it('7. Decline & Withdrawal: Proposing party can withdraw before acceptance, not after', () => {
    const createRes = dealService.createProposal({
      title: 'Withdrawal Test',
      campaignObjective: 'Test withdrawal rules',
      brand: sampleBrand,
      creator: sampleCreator,
      terms: sampleTerms,
    });
    const dealId = createRes.deal!.id;

    // Non-proposing party (creator) cannot withdraw brand's proposal
    const creatorWithdrawRes = dealService.withdrawDeal({
      dealId,
      withdrawnByRole: 'creator',
      withdrawnByName: sampleCreator.name,
    });
    assert.equal(creatorWithdrawRes.success, false);

    // Brand can withdraw their proposal:
    const brandWithdrawRes = dealService.withdrawDeal({
      dealId,
      withdrawnByRole: 'brand',
      withdrawnByName: sampleBrand.name,
      reason: 'Campaign priorities shifted',
    });
    assert.equal(brandWithdrawRes.success, true);
    assert.equal(brandWithdrawRes.deal?.status, 'withdrawn');
  });

  // Test 8: Production Execution & Completion
  it('8. Execution: Start production and Complete deal lifecycle', () => {
    const createRes = dealService.createProposal({
      title: 'Full Lifecycle Run',
      campaignObjective: 'From sent to completion',
      brand: sampleBrand,
      creator: sampleCreator,
      terms: sampleTerms,
    });
    const dealId = createRes.deal!.id;

    // Creator accepts
    dealService.acceptDeal({
      dealId,
      acceptedByRole: 'creator',
      acceptedByName: sampleCreator.name,
    });

    // Start production
    const startRes = dealService.startDeal({
      dealId,
      startedByName: sampleBrand.name,
      startedByRole: 'brand',
    });
    assert.equal(startRes.success, true);
    assert.equal(startRes.deal?.status, 'in_progress');

    // Complete deal
    const completeRes = dealService.completeDeal({
      dealId,
      completedByName: sampleBrand.name,
      completedByRole: 'brand',
      verificationNotes: 'All 4K reels approved and verified',
    });
    assert.equal(completeRes.success, true);
    assert.equal(completeRes.deal?.status, 'completed');
  });

  // Test 9: Public Chat vs Role-Private Notes Isolation
  it('9. Privacy Isolation: Brand notes hidden from creator, creator notes hidden from brand', () => {
    const createRes = dealService.createProposal({
      title: 'Security & Notes Test',
      campaignObjective: 'Test chat and privacy separation',
      brand: sampleBrand,
      creator: sampleCreator,
      terms: sampleTerms,
    });
    const dealId = createRes.deal!.id;

    // Public message
    dealService.addMessage(dealId, 'brand', sampleBrand.name, 'Hello Elena! Welcome to the deal room.', false);

    // Brand private note
    dealService.addMessage(dealId, 'brand', sampleBrand.name, 'Internal: We can go up to $4,500 if requested.', true);

    // Creator private note
    dealService.addMessage(dealId, 'creator', sampleCreator.name, 'Internal: My minimum bottom line is $4,000.', true);

    // Creator views messages
    const creatorView = dealService.getMessages(dealId, 'creator');
    assert.equal(creatorView.some((m) => m.content.includes('$4,500')), false, 'Brand private note leaked to creator!');
    assert.equal(creatorView.some((m) => m.content.includes('$4,000')), true, 'Creator should see own private note');
    assert.equal(creatorView.some((m) => m.content.includes('Hello Elena!')), true, 'Public message should be visible');

    // Brand views messages
    const brandView = dealService.getMessages(dealId, 'brand');
    assert.equal(brandView.some((m) => m.content.includes('$4,000')), false, 'Creator private note leaked to brand!');
    assert.equal(brandView.some((m) => m.content.includes('$4,500')), true, 'Brand should see own private note');
  });

  // Test 10: Persistence and Metrics
  it('10. Persistence: Reloads deal records and correctly computes dashboard metrics', () => {
    const metrics = dealService.getMetrics();
    assert.ok(metrics.totalDeals >= 5, 'Seed deals loaded');
    assert.ok(metrics.activeNegotiations >= 1, 'Active negotiations present');
    assert.ok(metrics.totalCommittedBudget > 0, 'Committed budget calculated');

    // Create a new deal and verify it persists
    const createRes = dealService.createProposal({
      title: 'Persistence Verification Deal',
      campaignObjective: 'Storage test',
      brand: sampleBrand,
      creator: sampleCreator,
      terms: sampleTerms,
    });

    const retrieved = dealService.getDealById(createRes.deal!.id);
    assert.ok(retrieved);
    assert.equal(retrieved?.title, 'Persistence Verification Deal');
  });
});
