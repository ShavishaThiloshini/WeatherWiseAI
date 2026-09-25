/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';
import { getColdWeatherSummary } from '../src/utils/coldWeather.ts';

const weather = {
  temperatureC: 8,
  feelsLikeC: 6,
  condition: 'cloudy',
  conditionLabel: 'Overcast',
  humidity: 70,
  windSpeedKmh: 10,
  windDirection: 'N',
  uvIndex: 2,
  rainProbability: 0,
  visibilityKm: 10,
  timestamp: '2026-09-25T08:00:00Z',
} as const;

test('cold warning uses the lowest temperature in the near forecast', () => {
  const result = getColdWeatherSummary(weather, {
    hourly: [],
    daily: [
      { date: '2026-09-25', maxTempC: 12, minTempC: 4, condition: 'cloudy', conditionLabel: 'Overcast', rainProbability: 0, uvIndex: 2 },
    ],
  });

  assert.deepEqual(result, { lowestTemperature: 4, isFreezing: false, source: 'forecast' });
});

test('cold warning marks freezing temperatures as a stronger warning', () => {
  const result = getColdWeatherSummary(weather, {
    hourly: [],
    daily: [
      { date: '2026-09-25', maxTempC: 6, minTempC: -2, condition: 'snowy', conditionLabel: 'Snowy', rainProbability: 0, uvIndex: 1 },
    ],
  });

  assert.equal(result?.isFreezing, true);
  assert.equal(result?.lowestTemperature, -2);
});

test('cold warning stays inactive above the warning threshold', () => {
  assert.equal(getColdWeatherSummary(weather, {
    hourly: [],
    daily: [{ date: '2026-09-25', maxTempC: 16, minTempC: 9, condition: 'sunny', conditionLabel: 'Clear Sky', rainProbability: 0, uvIndex: 5 }],
  }), null);
});