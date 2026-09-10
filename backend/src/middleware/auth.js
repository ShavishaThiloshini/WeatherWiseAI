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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'weatherwise-dev-secret');
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
    };
    return next();
  } catch (error) {
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