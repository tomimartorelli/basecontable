const rateLimitStore = new Map();

/**
 * Rate limiter muy simple en memoria por IP + clave (ruta).
 * No es distribuido ni persistente, pero suficiente para proteger login.
 */
const createRateLimiter = ({ windowMs, max, key }) => {
  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const storeKey = `${key}:${ip}`;

    const entry = rateLimitStore.get(storeKey) || { count: 0, resetAt: now + windowMs };

    if (now > entry.resetAt) {
      // Ventana expirada → reiniciar contador
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }

    entry.count += 1;
    rateLimitStore.set(storeKey, entry);

    if (entry.count > max) {
      const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', retryAfterSeconds.toString());
      return res.status(429).json({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.'
      });
    }

    next();
  };
};

// Rate limit específico para login: 10 intentos por IP cada 15 minutos
const loginRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  key: 'login'
});

module.exports = {
  createRateLimiter,
  loginRateLimit
};

