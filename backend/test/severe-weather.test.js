const test = require('node:test');
const assert = require('node:assert/strict');
const { processSevereWeather } = require('../src/services/severe-weather.service');

test('severe-weather processing returns explainable high-risk alerts first', () => {
  const alerts = processSevereWeather(
    { condition: 'stormy', temperature_c: 40, wind_speed_kmh: 65 },
    [{ precipitation: 10, windSpeed: 45 }],
    [],
  );

  assert.deepEqual(alerts.map((alert) => alert.type), [
    'thunderstorm',
    'strong_wind',
    'extreme_heat',
    'heavy_rain',
  ]);
  assert.equal(alerts[0].severity, 'high');
  assert.match(alerts[0].reason, /thunderstorm/i);
  assert.ok(alerts[0].recommended_action);
});

test('severe-weather processing returns no alerts for safe conditions', () => {
  const alerts = processSevereWeather(
    { condition: 'sunny', temperature_c: 24, wind_speed_kmh: 12 },
    [{ precipitation: 0, windSpeed: 10 }],
    [{ maxTempC: 28, minTempC: 18 }],
  );

  assert.deepEqual(alerts, []);
});

test('severe-weather processing detects forecast cold conditions', () => {
  const alerts = processSevereWeather(
    { condition: 'cloudy', temperature_c: 8, wind_speed_kmh: 10 },
    [],
    [{ maxTempC: 12, minTempC: 2 }],
  );

  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].type, 'cold');
  assert.equal(alerts[0].severity, 'medium');
});