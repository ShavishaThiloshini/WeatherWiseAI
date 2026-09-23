const { getCurrentWeather, getHourlyForecast } = require('./weather.service');

function categorizeRainIntensity(precipitationMm) {
  if (precipitationMm === null || precipitationMm === undefined) return 'Unknown';
  const val = Number(precipitationMm);
  if (val === 0) return 'No Rain';
  if (val <= 2.5) return 'Light';
  if (val <= 7.6) return 'Moderate';
  if (val <= 50) return 'Heavy';
  return 'Extreme';
}

async function getRainAlertData(latitude, longitude) {
  const [weatherResponse, forecastResponse] = await Promise.all([
    getCurrentWeather(latitude, longitude),
    getHourlyForecast(latitude, longitude)
  ]);

  const current = weatherResponse.current || {};
  const hourly = forecastResponse.hourlyForecast || [];

  const precipitation = current.precipitation_mm ?? 0;
  const probability = current.rain_probability_percent ?? 0;
  
  const intensity = categorizeRainIntensity(precipitation);
  
  // Find next rain time
  const currentObserved = current.observed_at || new Date().toISOString();
  let nextRainTime = null;
  
  for (const hour of hourly) {
    if (hour.time >= currentObserved && hour.time !== currentObserved) {
      if (hour.precipitation > 0 || hour.rainProbability > 0) {
        nextRainTime = hour.time;
        break;
      }
    }
  }

  // Check thunderstorm
  const isStormy = current.condition === 'stormy';
  const thunderstorm = isStormy || hourly.slice(0, 24).some(h => h.condition === 'stormy');

  return {
    location: {
      latitude: Number(latitude),
      longitude: Number(longitude)
    },
    rain: {
      probability,
      precipitation,
      intensity,
      condition: current.conditionLabel || 'Unknown',
      nextRainTime
    },
    weather: {
      temperature: current.temperature_c ?? null,
      windSpeed: current.wind_speed_kmh ?? null,
      thunderstorm
    }
  };
}

module.exports = {
  getRainAlertData,
  categorizeRainIntensity
};
