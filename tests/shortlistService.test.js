import test from 'node:test';
import assert from 'node:assert/strict';
import { ShortlistService } from '../src/services/shortlistService.js';
import { PersistenceService } from '../src/services/persistenceService.js';
import { seedCreators } from '../src/data/seedCreators.js';
import { ShortlistStatus } from '../src/types/index.js';

function createFreshService() {
  const customPersistence = new PersistenceService();
  customPersistence.resetToDefaults();
  return new ShortlistService(customPersistence);
}

test('Shortlist Service - Add creator and duplicate prevention', () => {
  const service = createFreshService();
  const creator = seedCreators[0];

  const added = service.addToShortlist('shortlist-default', creator, 'Priority outreach');
  assert.ok(added);
  assert.equal(added.creatorId, creator.id);
  assert.equal(added.notes, 'Priority outreach');
  assert.equal(added.status, ShortlistStatus.IDENTIFIED);

  // Try adding same creator again
  service.addToShortlist('shortlist-default', creator, 'Updated notes');
  const list = service.getShortlist('shortlist-default');
  assert.equal(list.items.length, 1, 'Duplicate addition should not create second entry');
  assert.equal(list.items[0].notes, 'Updated notes');
});

test('Shortlist Service - Remove and Toggle actions', () => {
  const service = createFreshService();
  const creator = seedCreators[0];

  service.addToShortlist('shortlist-default', creator);
  assert.equal(service.isShortlisted('shortlist-default', creator.id), true);

  const removed = service.removeFromShortlist('shortlist-default', creator.id);
  assert.equal(removed, true);
  assert.equal(service.isShortlisted('shortlist-default', creator.id), false);

  // Toggle on
  const toggledOn = service.toggleShortlist('shortlist-default', creator);
  assert.equal(toggledOn, true);
  assert.equal(service.isShortlisted('shortlist-default', creator.id), true);

  // Toggle off
  const toggledOff = service.toggleShortlist('shortlist-default', creator);
  assert.equal(toggledOff, false);
  assert.equal(service.isShortlisted('shortlist-default', creator.id), false);
});

test('Shortlist Service - Status and Notes updates', () => {
  const service = createFreshService();
  const creator = seedCreators[1];

  service.addToShortlist('shortlist-default', creator);
  service.updateItemStatus('shortlist-default', creator.id, ShortlistStatus.NEGOTIATING);
  service.updateItemNotes('shortlist-default', creator.id, 'Sent NDA and rate proposal');

  const list = service.getShortlist('shortlist-default');
  const item = list.items.find((i) => i.creatorId === creator.id);
  assert.equal(item.status, ShortlistStatus.NEGOTIATING);
  assert.equal(item.notes, 'Sent NDA and rate proposal');
});

test('Shortlist Service - Aggregate campaign metrics calculation', () => {
  const service = createFreshService();
  const c1 = seedCreators[0]; // followers: 185k, eng: 5.4, rate: 1400 (post) / 2200 (video)
  const c2 = seedCreators[1]; // followers: 64k, eng: 6.8, rate: 750 / 1200

  service.addToShortlist('shortlist-default', { ...c1, matchScore: 92 });
  service.addToShortlist('shortlist-default', { ...c2, matchScore: 84 });

  const metrics = service.getAggregateMetrics('shortlist-default');
  assert.equal(metrics.totalCreators, 2);
  assert.equal(metrics.totalReach, 185000 + 64000);
  assert.equal(metrics.averageEngagement, Number(((5.4 + 6.8) / 2).toFixed(2)));
  assert.equal(metrics.averageMatchScore, 88);
  assert.ok(metrics.estimatedTotalCost > 0);
});

test('Shortlist Service - CSV export generation', () => {
  const service = createFreshService();
  service.addToShortlist('shortlist-default', seedCreators[0], 'Lead candidate');

  const csv = service.exportCsv('shortlist-default');
  assert.ok(typeof csv === 'string');
  assert.ok(csv.includes('Creator ID,Name,Handle'));
  assert.ok(csv.includes('Elena Rostova'));
  assert.ok(csv.includes('@elena_tech'));
  assert.ok(csv.includes('Lead candidate'));
});

test('Shortlist Service - Clear shortlist', () => {
  const service = createFreshService();
  service.addToShortlist('shortlist-default', seedCreators[0]);
  service.addToShortlist('shortlist-default', seedCreators[1]);
  assert.equal(service.getShortlist('shortlist-default').items.length, 2);

  service.clearShortlist('shortlist-default');
  assert.equal(service.getShortlist('shortlist-default').items.length, 0);
  const metrics = service.getAggregateMetrics('shortlist-default');
  assert.equal(metrics.totalCreators, 0);
});
