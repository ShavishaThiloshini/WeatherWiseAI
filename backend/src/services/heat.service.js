const { getCurrentWeather } = require('./weather.service');
const { heatAlertForRisk, heatRiskLevel } = require('./heat-threshold.service');

function categorizeUV(uvIndex) {
  if (uvIndex === null || uvIndex === undefined) return null;
  const uv = Number(uvIndex);
  if (uv < 3) return 'Low';
  if (uv < 6) return 'Moderate';
  if (uv < 8) return 'High';
  if (uv < 11) return 'Very High';
  return 'Extreme';
}

function categorizeHeat(temperature, feelsLike) {
  if (temperature === null || temperature === undefined) return null;
  const values = [temperature, feelsLike]
    .filter((value) => value !== null && value !== undefined)
    .map(Number)
    .filter(Number.isFinite);
  if (!values.length) return null;
  const temp = Math.max(...values);
  
  if (temp < 26) return 'Normal';
  if (temp < 32) return 'Warm';
  if (temp < 37) return 'Hot';
  if (temp < 40) return 'Very Hot';
  return 'Extreme Heat';
}

async function getHeatAndUVData(latitude, longitude) {
  const weather = await getCurrentWeather(latitude, longitude);
  const current = weather.current || {};

  const temperature = current.temperature_c;
  const feelsLike = current.feels_like_c;
  const uvIndex = current.uv_index;

  const heatCategory = categorizeHeat(temperature, feelsLike);
  const heatRisk = heatRiskLevel({ temperature, feelsLike, humidity: current.humidity_percent });
  const heatAlert = heatAlertForRisk(heatRisk, temperature, feelsLike, current.humidity_percent);
  const uvCategory = categorizeUV(uvIndex);

  return {
    location: {
      latitude: Number(latitude),
      longitude: Number(longitude),
    },
    current: {
      temperature_c: temperature ?? null,
      feels_like_c: feelsLike ?? null,
      uv_index: uvIndex ?? null,
      humidity_percent: current.humidity_percent ?? null,
      condition: current.condition ?? null,
      conditionLabel: current.conditionLabel ?? null,
      observed_at: current.observed_at ?? null,
    },
    analysis: {
      heat_category: heatCategory,
      heat_risk: heatRisk,
      heat_warning: heatRisk === 'HIGH' || heatRisk === 'CRITICAL',
      heat_alert: heatRisk === 'CRITICAL',
      uv_category: uvCategory,
      hydration_indicator: heatCategory && heatCategory !== 'Normal' ? 'Hydration Recommended' : 'Standard Hydration',
    },
    alerts: heatAlert ? [heatAlert] : [],
    timezone: weather.timezone,
    cached: weather.cached,
  };
}

module.exports = {
  getHeatAndUVData,
  categorizeUV,
  categorizeHeat,
  heatRiskLevel,
};
