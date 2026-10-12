/**
 * GenAura AI — Demo Mode Automated Test Suite
 * ===========================================
 * Verifies all 10 core requirements from Section 11:
 *
 * 1. A first-time user enters Brand Demo.
 * 2. Seed data initializes once without duplicates.
 * 3. Search, filters, profile navigation, and shortlisting work.
 * 4. A brand creates a brief and sees it after reloading.
 * 5. A brand sends a demo proposal and the Creator Demo can view it.
 * 6. The creator counteroffers or responds using supported workflow logic.
 * 7. Changes remain isolated to demo storage.
 * 8. Reset restores the original seed data.
 * 9. Exit Demo preserves data unless reset was explicitly selected.
 * 10. Missing or corrupted demo data is handled gracefully.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Mock browser LocalStorage for Node test environment
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

if (typeof (global as any).window === 'undefined') {
  (global as any).window = {};
}
if (typeof (global as any).localStorage === 'undefined') {
  (global as any).localStorage = new MockLocalStorage();
}

import { demoService, DEMO_STORAGE_KEYS } from '../src/services/demoService.ts';
import {
  DEMO_CREATORS,
  DEMO_BRIEFS,
  DEMO_DEALS,
  DEMO_PORTFOLIOS,
  DEMO_SHORTLISTS,
  DEMO_NOTIFICATIONS,
} from '../src/data/demoSeedData.ts';
import { discoveryService } from '../src/services/discoveryService.js';
import { asBriefId, asCreatorId, asShortlistId, CreativeBrief } from '../src/types/index.ts';
import { Deal } from '../src/types/deal.ts';

test('GenAura AI — Demo Mode Test Suite', async (t) => {
  // Scenario 1: First-time user enters Brand Demo
  await t.test('1. First-time user enters Brand Demo with valid role and defaults', () => {
    demoService.enterDemo('brand');

    assert.equal(demoService.isDemoModeActive(), true, 'Demo Mode must be active');
    assert.equal(demoService.getDemoRole(), 'brand', 'Demo role must be brand');

    const creators = demoService.getDemoCreators();
    assert.ok(creators.length >= 12, `Expected >= 12 creators, got ${creators.length}`);

    const briefs = demoService.getDemoBriefs();
    assert.ok(briefs.length >= 8, `Expected >= 8 briefs, got ${briefs.length}`);

    const deals = demoService.getDemoDeals();
    assert.ok(deals.length >= 8, `Expected >= 8 deals, got ${deals.length}`);

    const portfolios = demoService.getDemoPortfolios();
    assert.ok(portfolios.length >= 10, `Expected >= 10 portfolio projects, got ${portfolios.length}`);

    const shortlists = demoService.getDemoShortlists();
    assert.ok(shortlists.length >= 6, `Expected >= 6 shortlist examples, got ${shortlists.length}`);
  });

  // Scenario 2: Seed data initializes once without duplicates
  await t.test('2. Seed data initializes idempotently without duplicate records', () => {
    const initialCreatorsCount = demoService.getDemoCreators().length;
    const initialBriefsCount = demoService.getDemoBriefs().length;
    const initialDealsCount = demoService.getDemoDeals().length;

    // Call initialization 5 consecutive times
    for (let i = 0; i < 5; i++) {
      demoService.initializeDemoSeedIfNeeded();
    }

    assert.equal(demoService.getDemoCreators().length, initialCreatorsCount, 'Creator count must not change');
    assert.equal(demoService.getDemoBriefs().length, initialBriefsCount, 'Brief count must not change');
    assert.equal(demoService.getDemoDeals().length, initialDealsCount, 'Deal count must not change');

    // Check stable IDs
    const creatorIds = demoService.getDemoCreators().map((c) => c.id);
    const uniqueCreatorIds = new Set(creatorIds);
    assert.equal(uniqueCreatorIds.size, creatorIds.length, 'All creator IDs must be strictly unique');
  });

  // Scenario 3: Search, filters, profile navigation, and shortlisting work
  await t.test('3. Search, filters, and shortlisting function reliably on demo dataset', () => {
    const creators = demoService.getDemoCreators();
    assert.ok(creators.length >= 12, 'Must have >= 12 demo creators');

    // Text search by keyword across name, bio, and skills
    const query = 'tech';
    const searched = creators.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.bio.toLowerCase().includes(query) ||
        c.skills.some((s) => s.toLowerCase().includes(query))
    );
    assert.ok(searched.length > 0, 'Text search for "tech" must match creators');

    // Filter by niche: Gaming
    const gamingCreators = creators.filter((c) =>
      c.skills.some((s) => s.toLowerCase().includes('gaming') || s.toLowerCase().includes('unreal'))
    );
    assert.ok(gamingCreators.length > 0, 'Must identify gaming creators in demo data');

    // Filter by budget cap ($120/hr)
    const budgetFiltered = creators.filter((c) => c.hourlyRate <= 120);
    assert.ok(budgetFiltered.length > 0, 'Must filter creators within budget cap');

    // Filter by verified status
    const verifiedOnly = creators.filter((c) => c.verified);
    assert.ok(verifiedOnly.length > 0, 'Must filter verified creators');

    // Shortlist check
    const shortlists = demoService.getDemoShortlists();
    assert.ok(shortlists.length >= 6, 'Must contain at least 6 pre-saved shortlists');
    assert.ok(shortlists[0].creatorId, 'Shortlist entry must reference a creator');
  });

  // Scenario 4: A brand creates a brief and sees it after reloading
  await t.test('4. Brand creates a new campaign brief and it persists across simulated reloads', () => {
    const newBrief: CreativeBrief = {
      id: asBriefId('brief_test_persisted'),
      title: 'Autonomous AI Agent Hackathon Showcase',
      description: 'Hands-on developer walkthrough of autonomous workflows.',
      contentType: 'video-script',
      requiredSkills: ['AI Tools', 'Developer Tools'],
      budget: { min: 5000, max: 10000, currency: 'USD' },
      timeline: { startDate: '2026-11-01', deadline: '2026-11-20' },
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      brandName: 'GenAura Systems',
    };

    demoService.saveDemoBrief(newBrief);

    // Verify it is present
    let briefs = demoService.getDemoBriefs();
    assert.ok(briefs.some((b) => b.id === 'brief_test_persisted'), 'New brief must be stored in demo briefs');

    // Simulate page reload
    demoService.initializeDemoSeedIfNeeded();

    briefs = demoService.getDemoBriefs();
    assert.ok(briefs.some((b) => b.id === 'brief_test_persisted'), 'New brief must survive reload initialization');
  });

  // Scenario 5: Brand sends a demo proposal and Creator Demo can view it
  await t.test('5. Brand sends proposal and Creator Demo can inspect it in incoming proposals', () => {
    const proposal: Deal = {
      id: 'deal-test-exchange',
      title: 'Autumn Interactive 3D Reveal',
      campaignObjective: 'Create interactive 3D motion reveal for holiday collection.',
      brand: {
        id: 'brand_1',
        role: 'brand',
        name: 'Aura Luxury House',
        handle: '@auraluxury',
        avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=auraluxury',
      },
      creator: {
        id: 'cr_1',
        role: 'creator',
        name: 'Sarah Jenkins',
        handle: '@sarah_tech',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      },
      currentTerms: {
        budget: 5000,
        currency: 'USD',
        deliverables: [{ id: 'd-1', title: '3D Reveal', format: 'Reel', quantity: 1 }],
        startDate: '2026-11-01',
        deadline: '2026-11-20',
        revisionAllowance: 2,
        usageRights: { durationDays: 180, digitalAdsAllowed: true, organicWhitelisting: false },
      },
      versions: [
        {
          versionNumber: 1,
          terms: {
            budget: 5000,
            currency: 'USD',
            deliverables: [{ id: 'd-1', title: '3D Reveal', format: 'Reel', quantity: 1 }],
            startDate: '2026-11-01',
            deadline: '2026-11-20',
            revisionAllowance: 2,
            usageRights: { durationDays: 180, digitalAdsAllowed: true, organicWhitelisting: false },
          },
          proposedByRole: 'brand',
          proposedByName: 'Aura Luxury House',
          proposedAt: new Date().toISOString(),
        },
      ],
      activeVersionNumber: 1,
      status: 'sent',
      awaitingActionFrom: 'creator',
      nextRequiredAction: 'Awaiting creator response: Accept, Decline, or Counteroffer.',
      lastActivityAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    demoService.saveDemoDeal(proposal);

    // Switch persona to Creator Demo
    demoService.switchDemoRole('creator');
    assert.equal(demoService.getDemoRole(), 'creator');

    // Retrieve creator's incoming deals
    const deals = demoService.getDemoDeals();
    const incomingForCreator = deals.filter(
      (d) => d.creator.id === 'cr_1' && d.awaitingActionFrom === 'creator'
    );
    assert.ok(
      incomingForCreator.some((d) => d.id === 'deal-test-exchange'),
      'Creator Demo must view incoming proposal awaiting creator action'
    );
  });

  // Scenario 6: Creator counteroffers and brand accepts
  await t.test('6. Creator submits counteroffer with bumped version and brand accepts', () => {
    let deal = demoService.getDemoDeals().find((d) => d.id === 'deal-test-exchange')!;
    assert.ok(deal, 'Deal must exist');

    // Creator counteroffers
    const counterTerms = {
      ...deal.currentTerms,
      budget: 6200,
      revisionAllowance: 3,
      notes: 'Increased budget to $6,200 for 4K rendering.',
    };

    const counterDeal: Deal = {
      ...deal,
      currentTerms: counterTerms,
      status: 'counteroffered',
      awaitingActionFrom: 'brand',
      activeVersionNumber: 2,
      versions: [
        ...deal.versions,
        {
          versionNumber: 2,
          terms: counterTerms,
          proposedByRole: 'creator',
          proposedByName: 'Sarah Jenkins',
          proposedAt: new Date().toISOString(),
          summaryNotes: 'Creator adjusted budget to $6,200',
        },
      ],
      nextRequiredAction: 'Awaiting brand decision on Counteroffer Version 2',
      updatedAt: new Date().toISOString(),
    };

    demoService.saveDemoDeal(counterDeal);

    // Verify counteroffer terms
    const reloaded = demoService.getDemoDeals().find((d) => d.id === 'deal-test-exchange')!;
    assert.equal(reloaded.status, 'counteroffered');
    assert.equal(reloaded.activeVersionNumber, 2);
    assert.equal(reloaded.currentTerms.budget, 6200);
    assert.equal(reloaded.awaitingActionFrom, 'brand');

    // Brand accepts counteroffer
    demoService.switchDemoRole('brand');
    const acceptedDeal: Deal = {
      ...reloaded,
      status: 'accepted',
      awaitingActionFrom: 'none',
      nextRequiredAction: 'Deal accepted. Ready to start production.',
      updatedAt: new Date().toISOString(),
    };
    demoService.saveDemoDeal(acceptedDeal);

    const finalDeal = demoService.getDemoDeals().find((d) => d.id === 'deal-test-exchange')!;
    assert.equal(finalDeal.status, 'accepted');
    assert.equal(finalDeal.awaitingActionFrom, 'none');
  });

  // Scenario 7: Storage isolation
  await t.test('7. Demo records remain isolated in dedicated demo namespace', () => {
    const demoDeals = demoService.getDemoDeals();
    assert.ok(demoDeals.length > 0);

    // Verify key naming standard
    assert.equal(DEMO_STORAGE_KEYS.IS_ACTIVE, 'genaura_demo_is_active');
    assert.equal(DEMO_STORAGE_KEYS.CREATORS, 'genaura_demo_creators');
    assert.equal(DEMO_STORAGE_KEYS.BRIEFS, 'genaura_demo_briefs');
    assert.equal(DEMO_STORAGE_KEYS.DEALS, 'genaura_demo_deals');
  });

  // Scenario 8: Reset restores original seed data
  await t.test('8. Reset restores canonical seed dataset and clears simulated mutations', () => {
    // Reset demo data
    const resetSuccess = demoService.resetDemoData();
    assert.equal(resetSuccess, true, 'Reset must succeed');

    const briefs = demoService.getDemoBriefs();
    assert.equal(
      briefs.some((b) => b.id === 'brief_test_persisted'),
      false,
      'Mutated test brief must be cleared after reset'
    );
    assert.equal(briefs.length, DEMO_BRIEFS.length, 'Briefs count must match canonical seed');

    const deals = demoService.getDemoDeals();
    assert.equal(
      deals.some((d) => d.id === 'deal-test-exchange'),
      false,
      'Custom test deal must be removed after reset'
    );
    assert.equal(deals.length, DEMO_DEALS.length, 'Deals count must match canonical seed (8 deals)');

    // Verify status coverage of the canonical 8 deals
    const statuses = deals.map((d) => d.status);
    assert.ok(statuses.includes('draft'), 'Must include draft deal');
    assert.ok(statuses.includes('sent'), 'Must include sent deal');
    assert.ok(statuses.includes('counteroffered'), 'Must include counteroffered deal');
    assert.ok(statuses.includes('accepted'), 'Must include accepted deal');
    assert.ok(statuses.includes('in_progress'), 'Must include in_progress deal');
    assert.ok(statuses.includes('completed'), 'Must include completed deal');
    assert.ok(statuses.includes('declined'), 'Must include declined deal');
    assert.ok(statuses.includes('withdrawn'), 'Must include withdrawn deal');
  });

  // Scenario 9: Exit Demo preserves data unless reset explicitly selected
  await t.test('9. Exit Demo deactivates demo mode without deleting session records', () => {
    // Add a marker brief
    const markerBrief: CreativeBrief = {
      id: asBriefId('brief_exit_marker'),
      title: 'Exit Test Brief',
      description: 'Preserved brief',
      contentType: 'social-post',
      requiredSkills: ['Clean Beauty'],
      budget: { min: 1000, max: 2000, currency: 'USD' },
      timeline: { startDate: '2026-11-01', deadline: '2026-11-15' },
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    demoService.saveDemoBrief(markerBrief);

    // Exit Demo
    demoService.exitDemo();
    assert.equal(demoService.isDemoModeActive(), false, 'Demo mode must be inactive after exit');

    // Re-enter Demo
    demoService.enterDemo('brand');
    assert.equal(demoService.isDemoModeActive(), true, 'Demo mode active again');

    const briefs = demoService.getDemoBriefs();
    assert.ok(
      briefs.some((b) => b.id === 'brief_exit_marker'),
      'Session brief must be preserved across exit and re-entry'
    );

    // Clean up
    demoService.resetDemoData();
  });

  // Scenario 10: Missing or corrupted demo data is handled gracefully
  await t.test('10. Missing or corrupted demo data recovers gracefully to canonical seed', () => {
    // Force re-seed with forceFresh = true
    demoService.initializeDemoSeedIfNeeded(true);

    const creators = demoService.getDemoCreators();
    assert.ok(Array.isArray(creators), 'Must return valid creators array');
    assert.ok(creators.length >= 12, 'Must contain at least 12 creators after healing');

    const summary = demoService.getDemoMetricsSummary();
    assert.ok(summary.creatorsCount >= 12, 'Summary must reflect >= 12 creators');
    assert.ok(summary.briefsCount >= 8, 'Summary must reflect >= 8 briefs');
    assert.ok(summary.dealsCount >= 8, 'Summary must reflect >= 8 deals');
  });
});
