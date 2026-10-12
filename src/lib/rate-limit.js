/**
 * In-memory sliding window rate limiter.
 * Protects login and sensitive auth endpoints from brute force attacks.
 */

const tracker = new Map();

// Run periodic cleanup every 10 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of tracker.entries()) {
      if (now > record.resetTime) {
        tracker.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

/**
 * Check and increment rate limit for a specific identifier (IP address, email, etc.)
 *
 * @param {string} identifier - Unique key (e.g., client IP or email)
 * @param {object} options
 * @param {number} options.limit - Max requests allowed within window (default: 5)
 * @param {number} options.windowMs - Window time in milliseconds (default: 15 minutes)
 * @returns {{ success: boolean, remaining: number, resetTime: number }}
 */
export function checkRateLimit(identifier, options = {}) {
  const limit = options.limit || 5;
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 mins default
  const now = Date.now();

  const record = tracker.get(identifier);

  if (!record || now > record.resetTime) {
    tracker.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { success: true, remaining: limit - 1, resetTime: now + windowMs };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count += 1;
  return { success: true, remaining: limit - record.count, resetTime: record.resetTime };
}

/**
 * Reset rate limit count upon successful login
 * @param {string} identifier
 */
export function resetRateLimit(identifier) {
  tracker.delete(identifier);
}
