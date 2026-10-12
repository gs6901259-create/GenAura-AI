import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBriefMatch, SCORING_WEIGHTS } from '../src/services/scoringEngine.js';
import { seedCreators } from '../src/data/seedCreators.js';
import { seedBriefs } from '../src/data/seedBriefs.js';

test('Scoring Engine - Weights integrity', () => {
  const sum = Object.values(SCORING_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.equal(Math.round(sum * 1000) / 1000, 1.0, 'Scoring weights must sum to exactly 1.0');
});

test('Scoring Engine - Determinism test across multiple invocations', () => {
  const creator = seedCreators[0]; // Elena Rostova
  const brief = seedBriefs[0]; // AI Workflow SaaS Launch

  const firstRun = calculateBriefMatch(creator, brief);

  // Run 100 times to guarantee strict determinism
  for (let i = 0; i < 100; i++) {
    const nextRun = calculateBriefMatch(creator, brief);
    assert.equal(nextRun.overallScore, firstRun.overallScore, 'Overall score must be identical');
    assert.equal(nextRun.matchTier, firstRun.matchTier, 'Match tier must be identical');
    assert.deepEqual(nextRun.breakdown, firstRun.breakdown, 'Breakdown scores must be identical');
    assert.equal(nextRun.explanations.length, firstRun.explanations.length, 'Explanations count must match');
    for (let j = 0; j < firstRun.explanations.length; j++) {
      assert.equal(nextRun.explanations[j].factor, firstRun.explanations[j].factor);
      assert.equal(nextRun.explanations[j].type, firstRun.explanations[j].type);
      assert.equal(nextRun.explanations[j].score, firstRun.explanations[j].score);
    }
  }
});

test('Scoring Engine - Niche & Category alignment scoring', () => {
  const techCreator = seedCreators.find((c) => c.category === 'Tech & AI');
  const foodCreator = seedCreators.find((c) => c.category === 'Food & Culinary');
  const techBrief = seedBriefs[0]; // requires Tech & AI

  const techMatch = calculateBriefMatch(techCreator, techBrief);
  const foodMatch = calculateBriefMatch(foodCreator, techBrief);

  assert.ok(
    techMatch.breakdown.nicheRelevance > foodMatch.breakdown.nicheRelevance,
    'Tech creator should have significantly higher niche score than food creator on tech brief'
  );
  assert.ok(techMatch.overallScore > foodMatch.overallScore);
});

test('Scoring Engine - Budget fit penalties', () => {
  const lowRateCreator = {
    ...seedCreators[0],
    rateCard: { postRate: 500, videoRate: 800 },
  };
  const expensiveCreator = {
    ...seedCreators[0],
    rateCard: { postRate: 8000, videoRate: 12000 },
  };
  const budgetBrief = {
    ...seedBriefs[0],
    maxCreatorBudget: 1500,
  };

  const withinBudget = calculateBriefMatch(lowRateCreator, budgetBrief);
  const overBudget = calculateBriefMatch(expensiveCreator, budgetBrief);

  assert.equal(withinBudget.breakdown.budgetFit, 100, 'Creator within budget should receive 100 for budget fit');
  assert.ok(
    overBudget.breakdown.budgetFit < 40,
    'Creator significantly over budget should receive penalized budget fit'
  );
  assert.ok(withinBudget.overallScore > overBudget.overallScore);
});

test('Scoring Engine - Performance & engagement rate scoring', () => {
  const highEngCreator = {
    ...seedCreators[0],
    engagementRate: 7.5,
  };
  const lowEngCreator = {
    ...seedCreators[0],
    engagementRate: 1.5,
  };
  const brief = {
    ...seedBriefs[0],
    minEngagementRate: 4.0,
  };

  const highMatch = calculateBriefMatch(highEngCreator, brief);
  const lowMatch = calculateBriefMatch(lowEngCreator, brief);

  assert.ok(
    highMatch.breakdown.performanceFit > lowMatch.breakdown.performanceFit,
    'High engagement creator must receive higher performance fit'
  );
});

test('Scoring Engine - Explainability details present', () => {
  const creator = seedCreators[0];
  const brief = seedBriefs[0];
  const match = calculateBriefMatch(creator, brief);

  assert.ok(Array.isArray(match.explanations), 'Explanations must be an array');
  assert.ok(match.explanations.length >= 5, 'Should have explanations for all key factors');

  const factors = match.explanations.map((e) => e.factor);
  assert.ok(factors.includes('Niche & Content'), 'Must include Niche factor');
  assert.ok(factors.includes('Platform & Formats'), 'Must include Platform factor');
  assert.ok(factors.includes('Audience Demographics'), 'Must include Demographics factor');
  assert.ok(factors.includes('Performance & Engagement'), 'Must include Performance factor');
  assert.ok(factors.includes('Budget & Rates'), 'Must include Budget factor');
  assert.ok(factors.includes('Brand Safety & Quality'), 'Must include Brand Safety factor');

  match.explanations.forEach((exp) => {
    assert.ok(['positive', 'neutral', 'warning'].includes(exp.type), `Valid explanation type: ${exp.type}`);
    assert.ok(typeof exp.detail === 'string' && exp.detail.length > 10, 'Detail must be descriptive');
  });
});

test('Scoring Engine - Graceful null handling', () => {
  const nullMatch = calculateBriefMatch(null, null);
  assert.equal(nullMatch.overallScore, 0);
  assert.equal(nullMatch.matchTier, 'No Match');
  assert.equal(nullMatch.explanations.length, 0);
});
