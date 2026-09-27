const express = require('express');

const healthRouter = require('./health.routes');
const locationRouter = require('./location.routes');
const weatherRouter = require('./weather.routes');
const alertsRouter = require('./alerts.routes');
const { requireAuth } = require('../middleware/auth');
const { getCurrentWeather } = require('../services/weather.service');
const { getDashboardRecommendations } = require('../services/recommendation.service');

const router = express.Router();

function validateTravelPoint(point, label) {
  if (!point || typeof point !== 'object') {
    const error = new Error(`${label} location is required`);
    error.code = 'VALIDATION_ERROR';
    error.status = 400;
    throw error;
  }

  const latitude = Number(point.latitude);
  const longitude = Number(point.longitude);

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    const error = new Error(`${label} latitude must be between -90 and 90 degrees`);
    error.code = 'VALIDATION_ERROR';
    error.status = 400;
    throw error;
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    const error = new Error(`${label} longitude must be between -180 and 180 degrees`);
    error.code = 'VALIDATION_ERROR';
    error.status = 400;
    throw error;
  }

  return {
    latitude,
    longitude,
    label: point.label || label,
  };
}

function travelRiskLevel(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'moderate';
  return 'low';
}

function summarizeTravelRisk(score, riskLevel, destinationLabel) {
  if (riskLevel === 'high') {
    return `High travel risk for ${destinationLabel}: rough weather, heavy rain, or strong winds are likely to affect the trip.`;
  }
  if (riskLevel === 'moderate') {
    return `Moderate travel risk for ${destinationLabel}: expect some weather disruption, but the trip remains manageable with basic precautions.`;
  }
  return `Low travel risk for ${destinationLabel}: conditions look stable enough for a routine trip with standard travel awareness.`;
}

function buildTravelFactors(destinationWeather, originWeather) {
  const factors = [];
  const destination = destinationWeather.current;
  const origin = originWeather.current;
  const temperatureDelta = Math.abs(Number(destination.temperature_c) - Number(origin.temperature_c));

  if (destination.temperature_c >= 32 || destination.feels_like_c >= 35) {
    factors.push({
      type: 'heat',
      title: 'High heat exposure',
      message: 'The destination is hot enough to increase fatigue and reduce driving comfort.',
      score: 22,
      value: `${destination.temperature_c}°C`,
    });
  }

  if (destination.rain_probability_percent >= 60) {
    factors.push({
      type: 'rain',
      title: 'Rain risk',
      message: 'Heavy rain is likely and can reduce visibility or slow travel.',
      score: 24,
      value: `${destination.rain_probability_percent}%`,
    });
  }

  if (destination.wind_speed_kmh >= 40) {
    factors.push({
      type: 'wind',
      title: 'Strong wind',
      message: 'Wind gusts may make the route less stable, especially for open-road travel.',
      score: 19,
      value: `${destination.wind_speed_kmh} km/h`,
    });
  }

  if (destination.uv_index >= 8) {
    factors.push({
      type: 'uv',
      title: 'High UV',
      message: 'Sun glare and heat can affect visibility and comfort during long travel.',
      score: 9,
      value: `${destination.uv_index}`,
    });
  }

  if (destination.visibility_km !== null && destination.visibility_km < 5) {
    factors.push({
      type: 'visibility',
      title: 'Low visibility',
      message: 'Reduced visibility increases the chance of delays or difficult driving conditions.',
      score: 15,
      value: `${destination.visibility_km} km`,
    });
  }

  if (temperatureDelta >= 12) {
    factors.push({
      type: 'temperature-change',
      title: 'Temperature swing',
      message: `The destination is ${temperatureDelta.toFixed(1)}°C different from your current weather, which may affect comfort and route planning.`,
      score: 10,
      value: `${temperatureDelta.toFixed(1)}°C`,
    });
  }

  if (factors.length === 0) {
    factors.push({
      type: 'safe',
      title: 'Stable conditions',
      message: 'Conditions are consistent and the route looks comfortable for normal travel.',
      score: 6,
      value: 'Low risk',
    });
  }

  return factors;
}

async function compareTravelWeather(origin, destination) {
  const [originWeather, destinationWeather] = await Promise.all([
    getCurrentWeather(origin.latitude, origin.longitude),
    getCurrentWeather(destination.latitude, destination.longitude),
  ]);

  const factors = buildTravelFactors(destinationWeather, originWeather);
  const weightedScore = factors.reduce((total, factor) => total + Number(factor.score || 0), 0);
  const clampedScore = Math.min(100, Math.max(0, weightedScore));
  const riskLevel = travelRiskLevel(clampedScore);
  const summary = summarizeTravelRisk(clampedScore, riskLevel, destination.label);

  return {
    score: clampedScore,
    riskLevel,
    summary,
    factors,
    origin: {
      label: origin.label,
      latitude: origin.latitude,
      longitude: origin.longitude,
      condition: originWeather.current.conditionLabel,
      temperature: originWeather.current.temperature_c,
    },
    destination: {
      label: destination.label,
      latitude: destination.latitude,
      longitude: destination.longitude,
      condition: destinationWeather.current.conditionLabel,
      temperature: destinationWeather.current.temperature_c,
    },
    comparison: {
      temperatureDelta: Number((destinationWeather.current.temperature_c - originWeather.current.temperature_c).toFixed(1)),
      rainDelta: Number((destinationWeather.current.rain_probability_percent - originWeather.current.rain_probability_percent).toFixed(1)),
      windDelta: Number((destinationWeather.current.wind_speed_kmh - originWeather.current.wind_speed_kmh).toFixed(1)),
    },
  };
}

router.use('/health', healthRouter);
router.use('/locations', locationRouter);
router.use('/weather', weatherRouter);
router.use('/alerts', alertsRouter);

router.post('/travel/compare', requireAuth, async (req, res, next) => {
  try {
    const { origin, destination } = req.body || {};
    const validatedOrigin = validateTravelPoint(origin, 'Origin');
    const validatedDestination = validateTravelPoint(destination, 'Destination');
    const result = await compareTravelWeather(validatedOrigin, validatedDestination);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

router.post('/dashboard', requireAuth, async (req, res, next) => {
  try {
    const { location, current, forecast } = req.body || {};
    if (!location || !current || typeof current !== 'object') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Location and current weather are required' } });
    }
    const response = await getDashboardRecommendations({ location, current, forecast });
    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

router.get('/', (req, res) => {
  return res.json({
    name: 'WeatherWise AI API',
    version: 'v1',
    status: 'ok',
  });
});

module.exports = router;
