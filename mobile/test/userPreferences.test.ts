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

test('each preference can be changed independently while preserving the other selections', () => {
  const original = {
    theme: 'Dark',
    units: 'Imperial',
    coldTolerance: 'High',
    preferredActivity: 'Running',
    notifications: false,
  } as const;

  assert.deepEqual(updateUserPreference(original, 'theme', 'Light'), {
    ...original,
    theme: 'Light',
  });
  assert.deepEqual(updateUserPreference(original, 'units', 'Metric'), {
    ...original,
    units: 'Metric',
  });
  assert.deepEqual(updateUserPreference(original, 'coldTolerance', 'Low'), {
    ...original,
    coldTolerance: 'Low',
  });
  assert.deepEqual(updateUserPreference(original, 'preferredActivity', 'Cycling'), {
    ...original,
    preferredActivity: 'Cycling',
  });
  assert.deepEqual(updateUserPreference(original, 'notifications', true), {
    ...original,
    notifications: true,
  });
  assert.deepEqual(original, {
    theme: 'Dark',
    units: 'Imperial',
    coldTolerance: 'High',
    preferredActivity: 'Running',
    notifications: false,
  });
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

test('every supported preference combination survives save and reload', () => {
  for (const theme of PREFERENCE_OPTIONS.theme) {
    for (const units of PREFERENCE_OPTIONS.units) {
      for (const coldTolerance of PREFERENCE_OPTIONS.coldTolerance) {
        for (const preferredActivity of PREFERENCE_OPTIONS.preferredActivity) {
          for (const notifications of [true, false]) {
            const preferences = { theme, units, coldTolerance, preferredActivity, notifications };
            assert.deepEqual(parseUserPreferences(serializeUserPreferences(preferences)), preferences);
          }
        }
      }
    }
  }
});

test('missing or malformed stored preferences fall back to defaults', () => {
  assert.deepEqual(parseUserPreferences(null), DEFAULT_USER_PREFERENCES);
  assert.deepEqual(parseUserPreferences('{not-json'), DEFAULT_USER_PREFERENCES);
  assert.deepEqual(parseUserPreferences('null'), DEFAULT_USER_PREFERENCES);
  assert.deepEqual(parseUserPreferences(JSON.stringify([])), DEFAULT_USER_PREFERENCES);
  assert.deepEqual(parseUserPreferences(JSON.stringify('Metric')), DEFAULT_USER_PREFERENCES);
  assert.deepEqual(parseUserPreferences(JSON.stringify(42)), DEFAULT_USER_PREFERENCES);
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

test('missing fields and unknown fields in stored data preserve defaults for missing preferences', () => {
  assert.deepEqual(parseUserPreferences(JSON.stringify({
    units: 'Imperial',
    preferredActivity: 'Cycling',
    legacyPreference: true,
  })), {
    ...DEFAULT_USER_PREFERENCES,
    units: 'Imperial',
    preferredActivity: 'Cycling',
  });
});
