import { rateLimit } from 'express-rate-limit';
import type { RateLimitRequestHandler } from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

/**
 * HTTP Hardening rate limiter (SEC-02).
 * Brute-force protection for the login endpoint only.
 * Tunable via environment variables with safe defaults (5 attempts / 15 minutes / IP).
 */

export const RATE_LIMIT_DEFAULTS = {
  windowMinutes: 15,
  max: 5,
};

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    // Fail-fast on invalid configuration instead of silently degrading security
    throw new Error(`[rateLimit] Environment variable ${name} must be a positive integer, received: "${raw}"`);
  }
  return parsed;
}

export interface RateLimitConfig {
  windowMs: number;
  limit: number;
}

/**
 * Resolves the login rate-limit configuration from environment variables.
 * Exported for testability and centralized tuning (Story 8.1 AC #5).
 */
export function resolveRateLimitConfig(
  env: NodeJS.ProcessEnv = process.env,
  defaults = RATE_LIMIT_DEFAULTS
): RateLimitConfig {
  const windowMinutes = readPositiveIntFrom(env.RATE_LIMIT_WINDOW_MINUTES, defaults.windowMinutes);
  const max = readPositiveIntFrom(env.RATE_LIMIT_MAX, defaults.max);
  return {
    windowMs: windowMinutes * 60 * 1000,
    limit: max,
  };
}

function readPositiveIntFrom(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`[rateLimit] Invalid rate limit value: "${raw}" must be a positive integer`);
  }
  return parsed;
}

/**
 * Shared rate-limit handler response shape (consistent with API error envelope).
 */
function limitHandler(_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }): void {
  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts from this IP address. Please try again later.',
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Creates a login rate limiter instance (SEC-02).
 * Returns the express-rate-limit middleware configured from env/defaults.
 */
export function createLoginRateLimiter(config: RateLimitConfig = resolveRateLimitConfig()): RateLimitRequestHandler {
  return rateLimit({
    windowMs: config.windowMs,
    limit: config.limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    handler: limitHandler,
  });
}

/** Default configured instance for mounting in server.ts */
export const loginRateLimiter = createLoginRateLimiter();
