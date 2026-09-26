const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { findAlertById, listAlerts } = require('../db');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const activeOnly = req.query.active !== 'false';
    const alerts = await listAlerts(req.user.id, {
      locationId: req.query.locationId,
      activeOnly,
    });
    return res.json({ alerts });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const alert = await findAlertById(req.user.id, req.params.id);
    if (!alert) return res.status(404).json({ error: { code: 'ALERT_NOT_FOUND', message: 'Alert not found' } });
    return res.json({ alert });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;