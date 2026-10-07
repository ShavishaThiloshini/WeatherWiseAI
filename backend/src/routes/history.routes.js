const express = require('express');

const { requireAuth } = require('../middleware/auth');
const { listWeatherHistory, upsertWeatherHistory } = require('../db');

const router = express.Router();
const SUMMARY_FIELDS = [
  'avgTemperatureC',
  'maxTemperatureC',
  'minTemperatureC',
  'totalRainMm',
];

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function validationError(message) {
  const error = new Error(message);
  error.code = 'VALIDATION_ERROR';
  error.status = 400;
  return error;
}

function parsePagination(query) {
  const limit = query.limit === undefined ? 30 : Number(query.limit);
  const offset = query.offset === undefined ? 0 : Number(query.offset);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw validationError('Limit must be an integer between 1 and 100');
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw validationError('Offset must be a non-negative integer');
  }
  return { limit, offset };
}

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { locationId, from, to } = req.query;
    if (locationId !== undefined && (typeof locationId !== 'string' || !locationId.trim())) {
      throw validationError('locationId must be a non-empty string');
    }
    if (from !== undefined && !validDate(from)) throw validationError('from must be a valid date in YYYY-MM-DD format');
    if (to !== undefined && !validDate(to)) throw validationError('to must be a valid date in YYYY-MM-DD format');
    if (from && to && from > to) throw validationError('from must be on or before to');

    const pagination = parsePagination(req.query);
    const result = await listWeatherHistory(req.user.id, {
      locationId,
      from,
      to,
      ...pagination,
    });
    return res.json({
      history: result.history,
      pagination: { ...pagination, total: result.total },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const body = req.body || {};
    if (typeof body.locationId !== 'string' || !body.locationId.trim()) {
      throw validationError('locationId is required');
    }
    if (!validDate(body.summaryDate)) {
      throw validationError('summaryDate must be a valid date in YYYY-MM-DD format');
    }

    const summary = { summaryDate: body.summaryDate };
    let hasWeatherValue = false;
    for (const field of SUMMARY_FIELDS) {
      const value = body[field];
      if (value !== undefined && value !== null && (typeof value !== 'number' || !Number.isFinite(value))) {
        throw validationError(`${field} must be a finite number or null`);
      }
      if (field === 'totalRainMm' && value != null && value < 0) {
        throw validationError('totalRainMm cannot be negative');
      }
      summary[field] = value ?? null;
      if (value !== undefined && value !== null) hasWeatherValue = true;
    }
    if (!hasWeatherValue) throw validationError('At least one weather measurement is required');
    if (summary.minTemperatureC !== null && summary.maxTemperatureC !== null
      && summary.minTemperatureC > summary.maxTemperatureC) {
      throw validationError('minTemperatureC cannot exceed maxTemperatureC');
    }
    if (summary.avgTemperatureC !== null
      && ((summary.minTemperatureC !== null && summary.avgTemperatureC < summary.minTemperatureC)
        || (summary.maxTemperatureC !== null && summary.avgTemperatureC > summary.maxTemperatureC))) {
      throw validationError('avgTemperatureC must be between the minimum and maximum temperatures');
    }

    const condition = body.dominantCondition;
    if (condition !== undefined && condition !== null
      && (typeof condition !== 'string' || !condition.trim() || condition.trim().length > 30)) {
      throw validationError('dominantCondition must be a non-empty string of at most 30 characters or null');
    }
    summary.dominantCondition = condition == null ? null : condition.trim();

    const history = await upsertWeatherHistory(req.user.id, body.locationId, summary);
    if (!history) {
      return res.status(404).json({ error: { code: 'LOCATION_NOT_FOUND', message: 'Location not found' } });
    }
    return res.status(201).json({ history });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
