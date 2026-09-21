const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { createLocation, deleteLocation, listLocations } = require('../db');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    return res.json({ locations: await listLocations(req.user.id) });
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { label, latitude, longitude, timezone, isDefault } = req.body || {};
    if (typeof label !== 'string' || !label.trim() || !Number.isFinite(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90 || !Number.isFinite(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'A label and valid latitude/longitude are required' } });
    }
    const location = await createLocation(req.user.id, { label, latitude, longitude, timezone, isDefault });
    return res.status(201).json({ location });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await deleteLocation(req.user.id, req.params.id);
    if (!deleted) return res.status(404).json({ error: { code: 'LOCATION_NOT_FOUND', message: 'Location not found' } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
