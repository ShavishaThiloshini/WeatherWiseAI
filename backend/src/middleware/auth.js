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
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: { code: 'TOKEN_EXPIRED', message: 'The access token has expired' },
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: { code: 'INVALID_TOKEN', message: 'The access token is invalid' },
      });
    }
    return res.status(401).json({
      error: { code: 'INVALID_TOKEN', message: 'The access token is invalid or expired' },
    });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
    }

    return next();
  };
}

module.exports = { requireAuth, requireRole };