const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getUserPreferences, upsertUserPreferences } = require('../db');

const router = express.Router();

router.use(requireAuth);

const validColdTolerance = new Set(['low', 'medium', 'high']);
const validUnits = new Set(['metric', 'imperial']);

function normalizePreferenceBody(body = {}) {
  const next = { ...body };

  if (Object.prototype.hasOwnProperty.call(next, 'coldTolerance')) {
    if (typeof next.coldTolerance !== 'string') {
      const error = new Error('coldTolerance must be one of: low, medium, high');
      error.code = 'VALIDATION_ERROR';
      error.status = 400;
      throw error;
    }
    const normalized = next.coldTolerance.trim().toLowerCase();
    if (!validColdTolerance.has(normalized)) {
      const error = new Error('coldTolerance must be one of: low, medium, high');
      error.code = 'VALIDATION_ERROR';
      error.status = 400;
      throw error;
    }
    next.coldTolerance = normalized;
  }

  if (Object.prototype.hasOwnProperty.call(next, 'units')) {
    if (typeof next.units !== 'string') {
      const error = new Error('units must be either metric or imperial');
      error.code = 'VALIDATION_ERROR';
      error.status = 400;
      throw error;
    }
    const normalized = next.units.trim().toLowerCase();
    if (!validUnits.has(normalized)) {
      const error = new Error('units must be either metric or imperial');
      error.code = 'VALIDATION_ERROR';
      error.status = 400;
      throw error;
    }
    next.units = normalized;
  }

  if (Object.prototype.hasOwnProperty.call(next, 'preferredActivity')) {
    if (next.preferredActivity === null || next.preferredActivity === undefined) {
      next.preferredActivity = null;
    } else if (typeof next.preferredActivity !== 'string') {
      const error = new Error('preferredActivity must be a string');
      error.code = 'VALIDATION_ERROR';
      error.status = 400;
      throw error;
    } else {
      const normalized = next.preferredActivity.trim();
      next.preferredActivity = normalized || null;
    }
  }

  if (Object.prototype.hasOwnProperty.call(next, 'preferredActivityTime')) {
    if (next.preferredActivityTime === null || next.preferredActivityTime === undefined) {
      next.preferredActivityTime = null;
    } else if (typeof next.preferredActivityTime !== 'string') {
      const error = new Error('preferredActivityTime must be a time string');
      error.code = 'VALIDATION_ERROR';
      error.status = 400;
      throw error;
    } else {
      const normalized = next.preferredActivityTime.trim();
      next.preferredActivityTime = normalized || null;
    }
  }

  if (Object.prototype.hasOwnProperty.call(next, 'notificationsEnabled')) {
    if (typeof next.notificationsEnabled !== 'boolean') {
      const error = new Error('notificationsEnabled must be a boolean');
      error.code = 'VALIDATION_ERROR';
      error.status = 400;
      throw error;
    }
  }

  return next;
}

router.get('/me', async (req, res, next) => {
  try {
    const user = req.user;
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/preferences', async (req, res, next) => {
  try {
    const preferences = await getUserPreferences(req.user.id);
    return res.json({ preferences });
  } catch (error) {
    return next(error);
  }
});

router.patch('/preferences', async (req, res, next) => {
  try {
    const payload = normalizePreferenceBody(req.body || {});
    const hasUpdates = Object.keys(payload).length > 0;
    if (!hasUpdates) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'At least one preference update is required' },
      });
    }

    const allowedKeys = new Set(['coldTolerance', 'preferredActivity', 'preferredActivityTime', 'units', 'notificationsEnabled']);
    const invalidKeys = Object.keys(payload).filter((key) => !allowedKeys.has(key));
    if (invalidKeys.length > 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Unsupported preference fields were supplied' },
      });
    }

    const updated = await upsertUserPreferences(req.user.id, payload);
    return res.json({ preferences: updated });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
