const express = require('express');
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/user.controller');

const router = express.Router();
router.use(requireAuth);
router.get('/me', controller.me);
router.patch('/me', controller.updateMe);
router.get('/preferences', controller.preferences);
router.patch('/preferences', controller.updatePreferences);

module.exports = router;
