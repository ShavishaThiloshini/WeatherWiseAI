const jwt = require('jsonwebtoken');
const { findUserById } = require('../db');

const attempts = new Map();
const windowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 60_000);
const maxAttempts = Number(process.env.AUTH_RATE_LIMIT_MAX || 60);

function authRateLimit(req, res, next) {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || now - record.startedAt >= windowMs) {
    attempts.set(key, { startedAt: now, count: 1 });
    return next();
  }
  record.count += 1;
  if (record.count > maxAttempts) {
    res.set('Retry-After', String(Math.ceil((windowMs - (now - record.startedAt)) / 1000)));
    return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many authentication requests. Try again later.' } });
  }
  return next();
}

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

module.exports = { authRateLimit, requireAuth };