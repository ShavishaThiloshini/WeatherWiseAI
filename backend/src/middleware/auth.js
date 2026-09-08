const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      error: { code: 'AUTH_REQUIRED', message: 'A valid Bearer token is required' },
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'weatherwise-dev-secret');
    return next();
  } catch (error) {
    return res.status(401).json({
      error: { code: 'INVALID_TOKEN', message: 'The access token is invalid or expired' },
    });
  }
}

module.exports = { requireAuth };