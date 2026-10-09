// lib/rateLimit.js
/**
 * In-memory sliding window rate limiter for security-sensitive endpoints (Admin Login, etc).
 * Protects against brute-force attacks and credential stuffing.
 */

const loginAttempts = new Map();

// Default config: 5 failed attempts within 15 minutes leads to 15-minute lockout
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 menit

export function checkRateLimit(key, maxAttempts = MAX_ATTEMPTS, windowMs = WINDOW_MS) {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record) {
    return { allowed: true, remaining: maxAttempts, resetTime: now + windowMs };
  }

  // Bersihkan record jika window sudah lewat
  if (now > record.resetTime) {
    loginAttempts.delete(key);
    return { allowed: true, remaining: maxAttempts, resetTime: now + windowMs };
  }

  if (record.count >= maxAttempts) {
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec,
      resetTime: record.resetTime,
    };
  }

  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetTime: record.resetTime,
  };
}

export function recordFailedAttempt(key, windowMs = WINDOW_MS) {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || now > record.resetTime) {
    loginAttempts.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
  } else {
    record.count += 1;
    loginAttempts.set(key, record);
  }
}

export function resetRateLimit(key) {
  loginAttempts.delete(key);
}
