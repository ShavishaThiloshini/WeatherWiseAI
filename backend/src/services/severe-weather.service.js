const { getCurrentWeather, getForecastWeather } = require('./weather.service');

const ALERT_PRIORITY = {
  high: 3,
  medium: 2,
  low: 1,
};

function numeric(value) {
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

function createAlert(type, severity, title, reason, action) {
  return {
    type,
    severity,
    title,
    reason,
    recommended_action: action,
  };
}

function processSevereWeather(current = {}, hourly = [], daily = []) {
  const alerts = [];
  const next24Hours = hourly.slice(0, 24);
  const stormHours = [current, ...next24Hours].filter((hour) => hour.condition === 'stormy');
  const rainHours = [current, ...next24Hours];
  const maxRain = Math.max(0, ...rainHours.map((hour) => numeric(hour.precipitation ?? hour.precipitation_mm) || 0));
  const maxWind = Math.max(0, ...[current, ...next24Hours].map((hour) => numeric(hour.windSpeed ?? hour.wind_speed_kmh) || 0));
  const maxTemperature = Math.max(0, ...[current, ...daily].map((item) => numeric(item.temperature_c ?? item.maxTempC) ?? -Infinity));
  const minTemperature = Math.min(Infinity, ...[current, ...daily].map((item) => numeric(item.temperature_c ?? item.minTempC) ?? Infinity));

  if (stormHours.length) {
    alerts.push(createAlert(
      'thunderstorm',
      'high',
      'Thunderstorm alert',
      stormHours.length === 1 ? 'A thunderstorm is present or expected soon.' : 'Thunderstorms are present or expected within the next 24 hours.',
      'Avoid open areas and unnecessary outdoor activity. Seek shelter indoors.',
    ));
  }

  if (maxRain > 50) {
    alerts.push(createAlert('heavy_rain', 'high', 'Extreme rain alert', `Rainfall may reach ${maxRain} mm within the next 24 hours.`, 'Avoid flooded roads and delay non-essential travel.'));
  } else if (maxRain > 7.6) {
    alerts.push(createAlert('heavy_rain', 'medium', 'Heavy rain alert', `Rainfall may reach ${maxRain} mm within the next 24 hours.`, 'Carry rain protection and use caution on roads.'));
  }

  if (maxWind >= 60) {
    alerts.push(createAlert('strong_wind', 'high', 'Strong wind alert', `Wind speeds may reach ${maxWind} km/h.`, 'Avoid exposed areas and secure loose outdoor objects.'));
  } else if (maxWind >= 40) {
    alerts.push(createAlert('strong_wind', 'medium', 'Strong wind warning', `Wind speeds may reach ${maxWind} km/h.`, 'Use caution outdoors, especially near trees and structures.'));
  }

  if (maxTemperature >= 40) {
    alerts.push(createAlert('extreme_heat', 'high', 'Extreme heat alert', `Temperatures may reach ${maxTemperature}°C.`, 'Avoid strenuous activity, stay hydrated, and remain in a cool place.'));
  } else if (maxTemperature >= 37) {
    alerts.push(createAlert('extreme_heat', 'medium', 'Heat warning', `Temperatures may reach ${maxTemperature}°C.`, 'Limit strenuous activity and drink water regularly.'));
  }

  if (minTemperature <= 0) {
    alerts.push(createAlert('cold', 'high', 'Freezing conditions alert', `Temperatures may fall to ${minTemperature}°C.`, 'Limit exposure and protect people, pets, and vulnerable plants from freezing conditions.'));
  } else if (minTemperature <= 5) {
    alerts.push(createAlert('cold', 'medium', 'Cold weather warning', `Temperatures may fall to ${minTemperature}°C.`, 'Wear warm layers and limit prolonged exposure.'));
  }

  return alerts.sort((left, right) => ALERT_PRIORITY[right.severity] - ALERT_PRIORITY[left.severity]);
}

async function getSevereWeatherData(latitude, longitude) {
  const [currentResponse, forecastResponse] = await Promise.all([
    getCurrentWeather(latitude, longitude),
    getForecastWeather(latitude, longitude),
  ]);
  const current = currentResponse.current || {};
  const alerts = processSevereWeather(current, forecastResponse.hourly || [], forecastResponse.daily || []);

  return {
    location: { latitude: Number(latitude), longitude: Number(longitude) },
    alerts,
    has_severe_weather: alerts.length > 0,
    timezone: currentResponse.timezone || forecastResponse.timezone,
    cached: currentResponse.cached || forecastResponse.cached,
  };
}

module.exports = { getSevereWeatherData, processSevereWeather };