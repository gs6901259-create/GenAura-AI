import test from 'node:test';
import assert from 'node:assert/strict';
import { discoveryService } from '../src/services/discoveryService.js';
import { seedCreators } from '../src/data/seedCreators.js';
import { seedBriefs } from '../src/data/seedBriefs.js';

test('Discovery Service - Text search by name (case-insensitive)', () => {
  const result = discoveryService.filterAndSort(seedCreators, { query: 'elena' });
  assert.equal(result.total, 1);
  assert.equal(result.results[0].name, 'Elena Rostova');
});

test('Discovery Service - Text search by handle', () => {
  const result = discoveryService.filterAndSort(seedCreators, { query: '@marcus_builds' });
  assert.equal(result.total, 1);
  assert.equal(result.results[0].handle, '@marcus_builds');
});

test('Discovery Service - Text search by topic tag', () => {
  const result = discoveryService.filterAndSort(seedCreators, { query: 'figma' });
  assert.ok(result.total >= 1);
  assert.ok(result.results.some((c) => c.tags.includes('figma')));
});

test('Discovery Service - Platform filtering', () => {
  const result = discoveryService.filterAndSort(seedCreators, { platforms: ['TikTok'] });
  assert.ok(result.total > 0);
  result.results.forEach((c) => {
    const platforms = c.platforms || [c.primaryPlatform];
    assert.ok(
      platforms.map((p) => p.toLowerCase()).includes('tiktok'),
      `Creator ${c.name} must be active on TikTok`
    );
  });
});

test('Discovery Service - Category filtering', () => {
  const result = discoveryService.filterAndSort(seedCreators, { categories: ['Gaming'] });
  assert.ok(result.total > 0);
  result.results.forEach((c) => {
    assert.equal(c.category, 'Gaming');
  });
});

test('Discovery Service - Follower tier filtering', () => {
  const result = discoveryService.filterAndSort(seedCreators, {
    tiers: ['Micro (10K-100K)'],
  });
  assert.ok(result.total > 0);
  result.results.forEach((c) => {
    assert.equal(c.followerTier, 'Micro (10K-100K)');
  });
});

test('Discovery Service - Minimum engagement rate filtering', () => {
  const minEng = 6.0;
  const result = discoveryService.filterAndSort(seedCreators, { minEngagement: minEng });
  assert.ok(result.total > 0);
  result.results.forEach((c) => {
    assert.ok(c.engagementRate >= minEng);
  });
});

test('Discovery Service - Max deliverable budget filtering', () => {
  const maxBudget = 1000;
  const result = discoveryService.filterAndSort(seedCreators, { maxBudget });
  assert.ok(result.total > 0);
  result.results.forEach((c) => {
    const rate = (c.rateCard && (c.rateCard.postRate || c.rateCard.videoRate)) || 0;
    assert.ok(rate <= maxBudget, `Rate ${rate} must be <= maxBudget ${maxBudget}`);
  });
});

test('Discovery Service - Verified only filtering', () => {
  const result = discoveryService.filterAndSort(seedCreators, { verifiedOnly: true });
  assert.ok(result.total > 0);
  result.results.forEach((c) => {
    assert.equal(c.verified, true);
  });
});

test('Discovery Service - Combined multi-filtering', () => {
  const result = discoveryService.filterAndSort(seedCreators, {
    categories: ['Tech & AI'],
    platforms: ['YouTube'],
    minEngagement: 5.0,
    maxBudget: 2500,
  });

  assert.ok(result.total > 0, 'Should find at least 1 creator matching combined criteria');
  result.results.forEach((c) => {
    assert.equal(c.category, 'Tech & AI');
    assert.ok(c.platforms.includes('YouTube'));
    assert.ok(c.engagementRate >= 5.0);
    const rate = (c.rateCard && (c.rateCard.postRate || c.rateCard.videoRate)) || 0;
    assert.ok(rate <= 2500);
  });
});

test('Discovery Service - Sorting options', () => {
  // Followers desc
  const folDesc = discoveryService.filterAndSort(seedCreators, { sortBy: 'followers_desc' });
  for (let i = 0; i < folDesc.results.length - 1; i++) {
    assert.ok(folDesc.results[i].followers >= folDesc.results[i + 1].followers);
  }

  // Followers asc
  const folAsc = discoveryService.filterAndSort(seedCreators, { sortBy: 'followers_asc' });
  for (let i = 0; i < folAsc.results.length - 1; i++) {
    assert.ok(folAsc.results[i].followers <= folAsc.results[i + 1].followers);
  }

  // Engagement desc
  const engDesc = discoveryService.filterAndSort(seedCreators, { sortBy: 'engagement_desc' });
  for (let i = 0; i < engDesc.results.length - 1; i++) {
    assert.ok(engDesc.results[i].engagementRate >= engDesc.results[i + 1].engagementRate);
  }

  // Name asc
  const nameAsc = discoveryService.filterAndSort(seedCreators, { sortBy: 'name_asc' });
  for (let i = 0; i < nameAsc.results.length - 1; i++) {
    assert.ok(nameAsc.results[i].name.localeCompare(nameAsc.results[i + 1].name) <= 0);
  }

  // Match score desc with active brief
  const brief = seedBriefs[0];
  const matchDesc = discoveryService.filterAndSort(seedCreators, { sortBy: 'matchScore_desc' }, brief);
  for (let i = 0; i < matchDesc.results.length - 1; i++) {
    assert.ok(matchDesc.results[i].matchScore >= matchDesc.results[i + 1].matchScore);
  }
});

test('Discovery Service - Empty state diagnostics and suggestions', () => {
  // Query only empty state
  const queryEmpty = discoveryService.filterAndSort(seedCreators, { query: 'nonexistentcreator12345xyz' });
  assert.equal(queryEmpty.total, 0);
  assert.ok(queryEmpty.emptyState);
  assert.equal(queryEmpty.emptyState.reason, 'query_only');
  assert.equal(queryEmpty.emptyState.canReset, true);

  // Filters only empty state (impossible combo: >15% engagement)
  const filterEmpty = discoveryService.filterAndSort(seedCreators, { minEngagement: 15.0 });
  assert.equal(filterEmpty.total, 0);
  assert.ok(filterEmpty.emptyState);
  assert.equal(filterEmpty.emptyState.reason, 'filters_only');
  assert.equal(filterEmpty.emptyState.canReset, true);

  // Empty input array
  const noCreators = discoveryService.filterAndSort([], {});
  assert.equal(noCreators.total, 0);
  assert.ok(noCreators.emptyState);
  assert.equal(noCreators.emptyState.reason, 'no_creators');
});
