const clients = new Map();

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

function rateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const current = clients.get(key);

  if (!current || now >= current.resetAt) {
    clients.set(key, { count: 1, resetAt: now + windowMs });
    res.set('X-RateLimit-Limit', String(maxRequests));
    res.set('X-RateLimit-Remaining', String(Math.max(maxRequests - 1, 0)));
    return next();
  }

  current.count += 1;
  const remaining = Math.max(maxRequests - current.count, 0);
  res.set('X-RateLimit-Limit', String(maxRequests));
  res.set('X-RateLimit-Remaining', String(remaining));

  if (current.count > maxRequests) {
    const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
    res.set('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
      },
    });
  }

  return next();
}

module.exports = { rateLimit };