/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';

import { buildFallbackSmartAdviceCards, findSmartAdviceCards } from '../src/utils/smartAdvice.ts';

test('smart advice picks category-based cards and keeps the general summary for non-primary items', () => {
  const cards = findSmartAdviceCards([
    { id: 'clothing-01', category: 'clothing', title: 'Light layers', message: 'Wear breathable fabric.', reason: 'Warm', priority: 'medium', risk_level: 'moderate', severity: 'warning', factors: [] },
    { id: 'umbrella-01', category: 'umbrella', title: 'Carry an umbrella', message: 'Expect rain later today.', reason: 'Rain chance 70%', priority: 'high', risk_level: 'warning', severity: 'warning', factors: [] },
    { id: 'hydration-01', category: 'hydration', title: 'Hydrate more', message: 'Drink water regularly.', reason: 'Warm weather', priority: 'high', risk_level: 'high', severity: 'danger', factors: [] },
    { id: 'general-01', category: 'general', title: 'Plan around the heat', message: 'Best time to go outside is early evening.', reason: 'High UV', priority: 'medium', risk_level: 'moderate', severity: 'info', factors: [] },
  ] as any);

  assert.equal(cards.clothing?.id, 'clothing-01');
  assert.equal(cards.umbrella?.id, 'umbrella-01');
  assert.equal(cards.hydration?.id, 'hydration-01');
  assert.equal(cards.general?.id, 'general-01');
  assert.equal(cards.primarySummary?.title, 'Plan around the heat');
});

test('fallback advice still renders category cards when the dashboard service is unavailable', () => {
  const fallback = buildFallbackSmartAdviceCards({
    temperatureC: 33,
    feelsLikeC: 36,
    condition: 'sunny',
    conditionLabel: 'Sunny',
    humidity: 82,
    windSpeedKmh: 14,
    windDirection: 'SE',
    uvIndex: 9,
    rainProbability: 68,
    visibilityKm: 10,
    timestamp: new Date().toISOString(),
  });

  assert.equal(fallback[0]?.category, 'clothing');
  assert.equal(fallback[1]?.category, 'umbrella');
  assert.equal(fallback[2]?.category, 'hydration');
  assert.ok(fallback.some((entry) => entry.category === 'general') === false);
});
