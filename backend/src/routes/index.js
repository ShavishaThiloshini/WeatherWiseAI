const express = require('express');

const healthRouter = require('./health.routes');
const locationRouter = require('./location.routes');

const router = express.Router();

router.use('/health', healthRouter);
router.use('/locations', locationRouter);

module.exports = router;
