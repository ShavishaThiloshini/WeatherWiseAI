/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeCurrentWeather } from '../src/services/weatherNormalization.ts';
import { toRecommendationForecast } from '../src/services/forecastMapping.ts';

test('recommendation forecast preserves the next 24 hourly rain values', () => {
  const forecast = toRecommendationForecast({
    hourly: Array.from({ length: 25 }, (_, index) => ({
      time: `2026-09-14T${String(index).padStart(2, '0')}:00`,
      temperatureC: 20 + index,
      condition: 'rainy',
      rainProbability: index,
    })),
    daily: [{
      date: '2026-09-14',
      maxTempC: 32,
      minTempC: 24,
      condition: 'partly-cloudy',
      conditionLabel: 'Partly Cloudy',
      rainProbability: 60,
      uvIndex: 8,
    }],
  });

  assert.equal((forecast.hours as unknown[]).length, 24);
  assert.deepEqual((forecast.hours as Array<Record<string, unknown>>)[23], {
    time: '2026-09-14T23:00',
    temperature_c: 43,
    rain_probability_percent: 23,
    condition: 'rainy',
  });
  assert.deepEqual((forecast.days as Array<Record<string, unknown>>)[0], {
    date: '2026-09-14',
    max_temp_c: 32,
    min_temp_c: 24,
    rain_probability_percent: 60,
  });
});

test('current weather normalization handles missing optional arrays without NaN', () => {
  const weather = normalizeCurrentWeather({
    current: {
      time: '2026-09-14T08:00',
      temperature_2m: -40,
      apparent_temperature: -45,
      relative_humidity_2m: 100,
      wind_speed_10m: 0,
      wind_direction_10m: 360,
      weather_code: 999,
      uv_index: 0,
    },
    hourly: { time: ['2026-09-14T08:00'], precipitation_probability: [], visibility: [] },
  });

  assert.equal(weather.temperatureC, -40);
  assert.equal(weather.humidity, 100);
  assert.equal(weather.rainProbability, 0);
  assert.equal(weather.visibilityKm, 0);
  assert.equal(weather.windDirection, 'N');
  assert.ok(Object.values(weather).every((value) => typeof value !== 'number' || Number.isFinite(value)));
});

test('current weather normalization clamps invalid percentage values', () => {
  const weather = normalizeCurrentWeather({
    current: {
      time: '2026-09-14T08:00',
      temperature_2m: Number.NaN,
      apparent_temperature: Number.POSITIVE_INFINITY,
      relative_humidity_2m: 140,
      wind_speed_10m: -5,
      wind_direction_10m: 45,
      weather_code: 0,
      uv_index: -1,
    },
    hourly: { time: ['2026-09-14T08:00'], precipitation_probability: [-20], visibility: [1000] },
  });

  assert.equal(weather.temperatureC, 0);
  assert.equal(weather.feelsLikeC, 0);
  assert.equal(weather.humidity, 100);
  assert.equal(weather.rainProbability, 0);
  assert.equal(weather.uvIndex, 0);
});