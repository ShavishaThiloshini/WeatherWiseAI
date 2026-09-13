const express = require('express');
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/weather.controller');
const { recommendation } = require('../controllers/integration.controller');

const router = express.Router();

router.use(requireAuth);
router.get('/current', controller.current);
router.get('/forecast', controller.forecast);
router.post('/recommend', recommendation);

module.exports = router;
