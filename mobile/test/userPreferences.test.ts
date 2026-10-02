/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_USER_PREFERENCES,
  PREFERENCE_OPTIONS,
  USER_PREFERENCES_STORAGE_KEY,
  cyclePreferenceOption,
  parseUserPreferences,
  serializeUserPreferences,
  updateUserPreference,
} from '../src/utils/userPreferences.ts';

test('user preferences start with expected defaults', () => {
  assert.deepEqual(DEFAULT_USER_PREFERENCES, {
    theme: 'System',
    units: 'Metric',
    coldTolerance: 'Medium',
    preferredActivity: 'Walking',
    notifications: true,
  });
  assert.equal(USER_PREFERENCES_STORAGE_KEY, 'weatherwise.user-preferences.v1');
});

test('preference selectors cycle through every supported value and wrap to the first', () => {
  for (const options of Object.values(PREFERENCE_OPTIONS)) {
    for (let index = 0; index < options.length; index += 1) {
      const nextIndex = (index + 1) % options.length;
      assert.equal(cyclePreferenceOption(options[index], options), options[nextIndex]);
    }
  }
});

test('selector recovers an invalid current choice with the first available option', () => {
  assert.equal(cyclePreferenceOption('Unknown', PREFERENCE_OPTIONS.theme), 'System');
});

test('selector reports an invalid empty option list', () => {
  assert.throws(() => cyclePreferenceOption('Metric', []), /must not be empty/);
});

test('updating a preference preserves other values without mutating the previous state', () => {
  const original = { ...DEFAULT_USER_PREFERENCES };
  const updated = updateUserPreference(original, 'preferredActivity', 'Cycling');

  assert.equal(updated.preferredActivity, 'Cycling');
  assert.equal(updated.units, 'Metric');
  assert.equal(original.preferredActivity, 'Walking');
});

test('all user preference choices and notification state survive serialization', () => {
  const selected = {
    theme: 'Dark',
    units: 'Imperial',
    coldTolerance: 'High',
    preferredActivity: 'Running',
    notifications: false,
  } as const;

  assert.deepEqual(parseUserPreferences(serializeUserPreferences(selected)), selected);
});

test('missing or malformed stored preferences fall back to defaults', () => {
  assert.deepEqual(parseUserPreferences(null), DEFAULT_USER_PREFERENCES);
  assert.deepEqual(parseUserPreferences('{not-json'), DEFAULT_USER_PREFERENCES);
  assert.deepEqual(parseUserPreferences('null'), DEFAULT_USER_PREFERENCES);
});

test('invalid stored values fall back independently while valid preferences remain intact', () => {
  assert.deepEqual(parseUserPreferences(JSON.stringify({
    theme: 'Neon',
    units: 'Imperial',
    coldTolerance: 42,
    preferredActivity: 'Cycling',
    notifications: 'off',
  })), {
    theme: DEFAULT_USER_PREFERENCES.theme,
    units: 'Imperial',
    coldTolerance: DEFAULT_USER_PREFERENCES.coldTolerance,
    preferredActivity: 'Cycling',
    notifications: DEFAULT_USER_PREFERENCES.notifications,
  });
});
