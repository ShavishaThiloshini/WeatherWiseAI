const express = require('express');

const healthRouter = require('./health.routes');
const locationRouter = require('./location.routes');
const mapsRouter = require('./maps.routes');
const weatherRouter = require('./weather.routes');
const alertsRouter = require('./alerts.routes');
const { requireAuth } = require('../middleware/auth');
const { getCurrentWeather } = require('../services/weather.service');
const { assessDestinationWeather } = require('../services/travel-risk.service');
const { getDashboardRecommendations } = require('../services/recommendation.service');
const { getAssistantAnswer } = require('../services/assistant.service');

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

async function compareTravelWeather(origin, destination) {
  const [originWeather, destinationWeather] = await Promise.all([
    getCurrentWeather(origin.latitude, origin.longitude),
    getCurrentWeather(destination.latitude, destination.longitude),
  ]);

  const risk = assessDestinationWeather(destinationWeather.current, {
    originWeather: originWeather.current,
    destinationLabel: destination.label,
  });

  return {
    ...risk,
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
router.use('/maps', mapsRouter);
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

router.post('/ai/assistant', requireAuth, async (req, res, next) => {
  try {
    const { question, weather } = req.body || {};
    if (typeof question !== 'string' || !question.trim() || question.trim().length > 300) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Question must be between 1 and 300 characters' },
      });
    }
    if (!weather || typeof weather !== 'object' || Array.isArray(weather)
      || !weather.location || typeof weather.location !== 'object' || Array.isArray(weather.location)
      || !weather.current || typeof weather.current !== 'object' || Array.isArray(weather.current)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Location and current weather are required' },
      });
    }
    return res.json(await getAssistantAnswer(question.trim(), weather));
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
