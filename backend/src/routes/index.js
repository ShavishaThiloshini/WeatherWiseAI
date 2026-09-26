const express = require('express');

const healthRouter = require('./health.routes');
const locationRouter = require('./location.routes');
const weatherRouter = require('./weather.routes');
const alertsRouter = require('./alerts.routes');
const { requireAuth } = require('../middleware/auth');
const { getDashboardRecommendations } = require('../services/recommendation.service');

const router = express.Router();

router.use('/health', healthRouter);
router.use('/locations', locationRouter);
router.use('/weather', weatherRouter);
router.use('/alerts', alertsRouter);

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
