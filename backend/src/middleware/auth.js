const jwt = require('jsonwebtoken');
const { findUserById } = require('../db');

async function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      error: { code: 'AUTH_REQUIRED', message: 'A valid Bearer token is required' },
    });
  }

  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET || 'weatherwise-dev-secret');
    const user = await findUserById(claims.sub);
    if (!user) {
      return res.status(401).json({
        error: { code: 'USER_NOT_FOUND', message: 'The authenticated user no longer exists' },
      });
    }
    req.user = { ...claims, id: user.id, name: user.name, email: user.email };
    return next();
  } catch (error) {
    if (error.code === 'DATABASE_UNAVAILABLE') return next(error);
    return res.status(401).json({
      error: { code: 'INVALID_TOKEN', message: 'The access token is invalid or expired' },
    });
  }
}

module.exports = { requireAuth };