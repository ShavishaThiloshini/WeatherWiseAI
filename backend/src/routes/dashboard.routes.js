const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { recommendation } = require('../controllers/integration.controller');

const router = express.Router();

router.use(requireAuth);
router.post('/', recommendation);

module.exports = router;
