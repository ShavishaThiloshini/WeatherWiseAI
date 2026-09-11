const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { recommendation, assistant } = require('../controllers/integration.controller');

const router = express.Router();

router.use(requireAuth);
router.post('/recommend', recommendation);
router.post('/assistant', assistant);

module.exports = router;
