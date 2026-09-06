const { askGeminiAssistant } = require('../services/gemini.service');

function askAssistant(req, res, next) {
  const { message, context } = req.body || {};

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'message is required',
      },
    });
  }

  askGeminiAssistant({
    message: message.trim(),
    context: context && typeof context === 'object' ? context : {},
  })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(next);
}

module.exports = { askAssistant };