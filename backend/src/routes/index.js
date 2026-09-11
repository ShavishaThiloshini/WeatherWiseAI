const express = require('express');

const healthRouter = require('./health.routes');
const locationRouter = require('./location.routes');
const integrationRouter = require('./integration.routes');
const dashboardRouter = require('./dashboard.routes');
const userRouter = require('./user.routes');

const router = express.Router();

router.use('/health', healthRouter);
router.use('/locations', locationRouter);
router.use('/ai', integrationRouter);
router.use('/weather', integrationRouter);
router.use('/dashboard', dashboardRouter);
router.use('/users', userRouter);

module.exports = router;
