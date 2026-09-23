const express = require('express');

const { requireAuth } = require('../middleware/auth');
const { getCurrentWeather, getForecastWeather, getHourlyForecast } = require('../services/weather.service');

const router = express.Router();

function validateCoordinates(lat, lon) {
  const latitude = Number(lat);
  const longitude = Number(lon);

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    const error = new Error('Latitude must be between -90 and 90 degrees');
    error.code = 'VALIDATION_ERROR';
    error.status = 400;
    throw error;
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    const error = new Error('Longitude must be between -180 and 180 degrees');
    error.code = 'VALIDATION_ERROR';
    error.status = 400;
    throw error;
  }
}

router.use(requireAuth);

router.get('/current', async (req, res, next) => {
  try {
    validateCoordinates(req.query.lat, req.query.lon);
    const weather = await getCurrentWeather(req.query.lat, req.query.lon);
    return res.json(weather);
  } catch (error) {
    return next(error);
  }
});

router.get('/forecast', async (req, res, next) => {
  try {
    validateCoordinates(req.query.lat, req.query.lon);
    const forecast = await getForecastWeather(req.query.lat, req.query.lon);
    return res.json(forecast);
  } catch (error) {
    return next(error);
  }
});

router.get('/hourly', async (req, res, next) => {
  try {
    validateCoordinates(req.query.lat, req.query.lon);
    const forecast = await getHourlyForecast(req.query.lat, req.query.lon);
    return res.json(forecast);
  } catch (error) {
    return next(error);
  }
});

router.get('/heat', async (req, res, next) => {
  try {
    validateCoordinates(req.query.lat, req.query.lon);
    const { getHeatAndUVData } = require('../services/heat.service');
    const heatData = await getHeatAndUVData(req.query.lat, req.query.lon);
    return res.json(heatData);
  } catch (error) {
    return next(error);
  }
});

router.get('/activity', async (req, res, next) => {
  try {
    validateCoordinates(req.query.lat, req.query.lon);
    const { getActivityData } = require('../services/activity.service');
    const activityData = await getActivityData(req.query.lat, req.query.lon);
    return res.json(activityData);
  } catch (error) {
    return next(error);
  }
});

router.get('/rain-alert', async (req, res, next) => {
  try {
    validateCoordinates(req.query.lat, req.query.lon);
    const { getRainAlertData } = require('../services/rain.service');
    const rainData = await getRainAlertData(req.query.lat, req.query.lon);
    return res.json(rainData);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
