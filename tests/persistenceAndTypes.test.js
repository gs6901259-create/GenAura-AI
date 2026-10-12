import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidCreator,
  isValidBrief,
  getFollowerTier,
  FollowerTier,
  Platform,
  Categories,
} from '../src/types/index.js';
import { PersistenceService } from '../src/services/persistenceService.js';
import { seedCreators } from '../src/data/seedCreators.js';
import { seedBriefs } from '../src/data/seedBriefs.js';

test('Types & Models - Follower Tier resolution', () => {
  assert.equal(getFollowerTier(5000), FollowerTier.NANO);
  assert.equal(getFollowerTier(45000), FollowerTier.MICRO);
  assert.equal(getFollowerTier(250000), FollowerTier.MID);
  assert.equal(getFollowerTier(750000), FollowerTier.MACRO);
  assert.equal(getFollowerTier(2500000), FollowerTier.MEGA);
});

test('Types & Models - Creator and Brief schema validators', () => {
  seedCreators.forEach((creator) => {
    assert.equal(isValidCreator(creator), true, `Creator ${creator.name} must be valid`);
  });

  seedBriefs.forEach((brief) => {
    assert.equal(isValidBrief(brief), true, `Brief ${brief.title} must be valid`);
  });

  // Invalid creator check
  assert.equal(isValidCreator({ name: 'incomplete' }), false);
  assert.equal(isValidBrief({ title: 'incomplete' }), false);
});

test('Persistence Service - Seed loading, update, and reset cycle', () => {
  const store = new PersistenceService();
  const creators = store.getCreators();
  assert.equal(creators.length, seedCreators.length);

  const briefs = store.getBriefs();
  assert.equal(briefs.length, seedBriefs.length);

  // Modify creator
  const updatedCreators = [...creators];
  updatedCreators[0].name = 'Elena Rostova Modified';
  store.saveCreators(updatedCreators);
  assert.equal(store.getCreatorById(creators[0].id).name, 'Elena Rostova Modified');

  // Reset to defaults
  store.resetToDefaults();
  assert.equal(store.getCreatorById(creators[0].id).name, 'Elena Rostova');
});
