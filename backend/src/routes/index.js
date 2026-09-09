const express = require('express');

const healthRouter = require('./health.routes');
const locationRouter = require('./location.routes');
const weatherRouter = require('./weather.routes');
const weatherController = require('../controllers/weather.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use('/health', healthRouter);
router.use('/locations', locationRouter);
router.use('/weather', weatherRouter);
router.post('/recommendations', requireAuth, weatherController.recommendations);
router.post('/assistant', requireAuth, weatherController.assistant);

module.exports = router;
