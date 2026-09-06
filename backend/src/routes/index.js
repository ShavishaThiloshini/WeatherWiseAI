const express = require('express');

const healthRouter = require('./health.routes');
const assistantRouter = require('./assistant.routes');

const router = express.Router();

router.use('/health', healthRouter);
router.use('/assistant', assistantRouter);

module.exports = router;
