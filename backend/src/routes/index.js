const express = require('express');

const healthRouter = require('./health.routes');
const locationRouter = require('./location.routes');
const weatherRouter = require('./weather.routes');

const router = express.Router();

router.use('/health', healthRouter);
router.use('/locations', locationRouter);
router.use('/weather', weatherRouter);

router.get('/', (req, res) => {
  return res.json({
    name: 'WeatherWise AI API',
    version: 'v1',
    status: 'ok',
  });
});

module.exports = router;
