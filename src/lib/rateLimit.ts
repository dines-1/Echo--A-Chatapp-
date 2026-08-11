/**
 * In-Memory Rate Limiter and Cooldown Manager for Next.js API Routes.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface CooldownRecord {
  lastAttempt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const cooldownMap = new Map<string, CooldownRecord>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
  for (const [key, record] of cooldownMap.entries()) {
    if (now - record.lastAttempt > 600000) { // 10 mins
      cooldownMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Checks if a key has exceeded max requests within a given time window.
 * Returns { success: boolean, remaining: number, resetInSeconds: number }
 */
export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      remaining: limit - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetInSeconds: Math.ceil((record.resetTime - now) / 1000),
    };
  }

  record.count += 1;
  return {
    success: true,
    remaining: limit - record.count,
    resetInSeconds: Math.ceil((record.resetTime - now) / 1000),
  };
}

/**
 * Checks if a key is currently in a cooldown period.
 * If not in cooldown, sets the last attempt timestamp to now.
 * Returns { success: boolean, remainingSeconds: number }
 */
export function checkCooldown(key: string, cooldownMs: number) {
  const now = Date.now();
  const record = cooldownMap.get(key);

  if (record) {
    const elapsed = now - record.lastAttempt;
    if (elapsed < cooldownMs) {
      const remainingSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
      return { success: false, remainingSeconds };
    }
  }

  // Set new timestamp
  cooldownMap.set(key, { lastAttempt: now });
  return { success: true, remainingSeconds: 0 };
}
