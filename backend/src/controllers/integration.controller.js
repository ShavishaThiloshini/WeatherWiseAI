const { findLocationByIdForUser } = require('../db');
const { recommend, askAssistant } = require('../services/ai.service');

async function resolveLocation(body, userId) {
  if (body.location_id !== undefined) {
    const location = await findLocationByIdForUser(body.location_id, userId);
    if (!location) {
      const error = new Error('Location not found');
      error.status = 404;
      error.code = 'LOCATION_NOT_FOUND';
      throw error;
    }
    return {
      id: location.id,
      label: location.label,
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      timezone: location.timezone,
    };
  }

  const location = body.location;
  if (!location || typeof location !== 'object') {
    const error = new Error('A selected location or location_id is required');
    error.status = 400;
    error.code = 'LOCATION_REQUIRED';
    throw error;
  }

  return location;
}

function requireCurrentWeather(body) {
  if (!body.current || typeof body.current !== 'object') {
    const error = new Error('Current weather data is required');
    error.status = 400;
    error.code = 'WEATHER_REQUIRED';
    throw error;
  }
}

async function recommendation(req, res, next) {
  try {
    requireCurrentWeather(req.body);
    const location = await resolveLocation(req.body, req.user.sub);
    const payload = {
      request_id: req.body.request_id,
      location,
      current: req.body.current,
      forecast: req.body.forecast,
    };
    return res.json(await recommend(payload));
  } catch (error) {
    return next(error);
  }
}

async function assistant(req, res, next) {
  try {
    if (typeof req.body.question !== 'string' || !req.body.question.trim()) {
      return res.status(400).json({ error: { code: 'QUESTION_REQUIRED', message: 'A question is required' } });
    }
    requireCurrentWeather(req.body);
    const location = await resolveLocation(req.body, req.user.sub);
    return res.json(await askAssistant({
      question: req.body.question.trim(),
      weather: { ...req.body.current, location },
    }));
  } catch (error) {
    return next(error);
  }
}

module.exports = { recommendation, assistant };
