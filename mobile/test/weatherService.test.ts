import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeCurrentWeather } from '../src/services/weatherNormalization.ts';

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