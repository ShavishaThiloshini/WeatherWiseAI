const express = require('express');

const { askAssistant } = require('../controllers/assistant.controller');

const router = express.Router();

router.post('/ask', askAssistant);

module.exports = router;