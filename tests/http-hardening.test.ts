import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express, { Express } from 'express';
import helmet from 'helmet';
import { createLoginRateLimiter, resolveRateLimitConfig, RATE_LIMIT_DEFAULTS } from '../server/middlewares/rateLimit.ts';

/**
 * Story 8.1 — HTTP Hardening Integration Tests (SEC-02, SEC-03, SEC-04)
 * Spins a minimal Express app using the EXACT same middleware stack as server.ts,
 * then makes real HTTP requests to verify behavior at the protocol level.
 */

const TEST_BODY_LIMIT = '500kb';

function buildHardenedApp(): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: TEST_BODY_LIMIT }));
  app.post('/api/v1/auth/login', createLoginRateLimiter(), (_req, res) => {
    res.json({ success: true });
  });
  app.post('/api/v1/work-items', (_req, res) => {
    res.json({ success: true });
  });
  return app;
}

describe('HTTP Hardening (Story 8.1)', () => {
  let app: Express;
  let server: ReturnType<Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    app = buildHardenedApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('SEC-03: applies standard security headers and hides X-Powered-By', async () => {
    const res = await fetch(`${baseUrl}/api/v1/work-items`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    });

    expect(res.status).toBe(200);
    // Helmet security headers
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBeDefined();
    expect(res.headers.get('content-security-policy')).toBeDefined();
    // Framework fingerprint removed
    expect(res.headers.get('x-powered-by')).toBeNull();
  });

  it('SEC-04: rejects JSON bodies larger than 500kb with HTTP 413', async () => {
    const bigPayload = JSON.stringify({ blob: 'x'.repeat(600 * 1024) });
    const res = await fetch(`${baseUrl}/api/v1/work-items`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: bigPayload,
    });
    expect(res.status).toBe(413);
  });

  it('SEC-02: blocks the 6th login attempt from the same IP with HTTP 429', async () => {
    const url = `${baseUrl}/api/v1/auth/login`;
    const attempts: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'attacker@workstation.io', password: 'guess' + i }),
      });
      attempts.push(res.status);
      if (res.status === 429) {
        const body: any = await res.json();
        expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      }
    }
    expect(attempts.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(attempts[5]).toBe(429);
  });

  it('exposes env-tunable configuration with safe defaults', () => {
    const config = resolveRateLimitConfig({} as NodeJS.ProcessEnv);
    expect(config).toEqual({
      windowMs: RATE_LIMIT_DEFAULTS.windowMinutes * 60 * 1000,
      limit: RATE_LIMIT_DEFAULTS.max,
    });

    const tuned = resolveRateLimitConfig({ RATE_LIMIT_WINDOW_MINUTES: '30', RATE_LIMIT_MAX: '10' } as NodeJS.ProcessEnv);
    expect(tuned).toEqual({ windowMs: 30 * 60 * 1000, limit: 10 });

    expect(() => resolveRateLimitConfig({ RATE_LIMIT_MAX: '-3' } as NodeJS.ProcessEnv)).toThrow();
  });
});
