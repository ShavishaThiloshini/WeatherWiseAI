const HEAT_THRESHOLDS = Object.freeze({
  comfortableMax: 26,
  warmMax: 32,
  highHeat: 35,
  criticalHeat: 37,
  highHumidity: 80,
});

function numericValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function effectiveHeatC(temperature, feelsLike) {
  const values = [numericValue(temperature), numericValue(feelsLike)].filter((value) => value !== null);
  return values.length ? Math.max(...values) : null;
}

function heatRiskLevel({ temperature, feelsLike, humidity } = {}) {
  const effective = effectiveHeatC(temperature, feelsLike);
  if (effective === null) return 'SAFE';

  const humidityValue = numericValue(humidity);
  const highHumidity = humidityValue !== null && humidityValue >= HEAT_THRESHOLDS.highHumidity;

  if (effective >= HEAT_THRESHOLDS.criticalHeat) return 'CRITICAL';
  if (effective >= HEAT_THRESHOLDS.highHeat) return 'HIGH';
  if (effective >= HEAT_THRESHOLDS.warmMax) return highHumidity ? 'HIGH' : 'MODERATE';
  if (effective >= HEAT_THRESHOLDS.comfortableMax && highHumidity) return 'MODERATE';
  return 'SAFE';
}

function heatAlertForRisk(risk, temperature, feelsLike, humidity) {
  if (risk === 'SAFE' || risk === 'MODERATE') return null;

  const effective = effectiveHeatC(temperature, feelsLike);
  const factors = [];
  const temperatureValue = numericValue(temperature);
  const feelsLikeValue = numericValue(feelsLike);
  const humidityValue = numericValue(humidity);
  if (temperatureValue !== null) factors.push({ name: 'temperature_c', value: temperatureValue, unit: 'celsius' });
  if (feelsLikeValue !== null) factors.push({ name: 'feels_like_c', value: feelsLikeValue, unit: 'celsius' });
  if (humidityValue !== null) factors.push({ name: 'humidity_percent', value: humidityValue, unit: 'percent' });

  const critical = risk === 'CRITICAL';
  return {
    id: 'heat-alert-01',
    category: 'outdoor',
    severity: critical ? 'danger' : 'warning',
    title: critical ? 'Extreme heat alert' : 'Heat warning',
    message: critical
      ? 'Extreme heat is expected. Limit strenuous outdoor activity, seek shade, and drink water regularly.'
      : 'High heat is expected. Take shade breaks, stay hydrated, and avoid prolonged strenuous outdoor activity.',
    action: 'limit_heat_exposure',
    risk_level: risk,
    factors: factors.length ? factors : [{ name: 'effective_heat_c', value: effective, unit: 'celsius' }],
  };
}

module.exports = {
  HEAT_THRESHOLDS,
  effectiveHeatC,
  heatRiskLevel,
  heatAlertForRisk,
};