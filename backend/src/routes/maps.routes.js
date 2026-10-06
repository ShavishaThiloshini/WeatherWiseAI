const express = require('express');

const { getMapWeather } = require('../services/weather.service');
const { reverseGeocode, searchPlaces } = require('../services/maps-provider.service');

const router = express.Router();

function validateCoordinates(latitudeValue, longitudeValue) {
  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    const error = new Error('Valid latitude and longitude are required');
    error.code = 'VALIDATION_ERROR';
    error.status = 400;
    throw error;
  }
  return { latitude, longitude };
}

// Search, reverse geocoding, and map weather are read-only guest features.

router.get('/search', async (req, res, next) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (query.length < 2 || query.length > 120) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Search query must be 2 to 120 characters' } });
    }
    return res.json({ places: await searchPlaces(query) });
  } catch (error) {
    return next(error);
  }
});

router.get('/reverse', async (req, res, next) => {
  try {
    const coordinates = validateCoordinates(req.query.lat, req.query.lon);
    const place = await reverseGeocode(coordinates.latitude, coordinates.longitude);
    return res.json({ place });
  } catch (error) {
    return next(error);
  }
});

router.get('/weather', async (req, res, next) => {
  try {
    const coordinates = validateCoordinates(req.query.lat, req.query.lon);
    return res.json(await getMapWeather(coordinates.latitude, coordinates.longitude));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
