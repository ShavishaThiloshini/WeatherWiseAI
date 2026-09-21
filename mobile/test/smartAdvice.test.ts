/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';

import { findSmartAdviceCards } from '../src/utils/smartAdvice.ts';

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
