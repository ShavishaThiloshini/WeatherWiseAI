function getHealth(req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'weatherwise-ai-api',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
}

module.exports = { getHealth };
