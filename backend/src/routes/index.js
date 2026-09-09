const express = require('express');

const healthRouter = require('./health.routes');
const locationRouter = require('./location.routes');
const weatherRouter = require('./weather.routes');

const router = express.Router();

router.use('/health', healthRouter);
router.use('/locations', locationRouter);
router.use('/weather', weatherRouter);
router.use('/recommendations', weatherRouter);

module.exports = router;
