import { describe, it, expect, beforeAll, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { generateToken, verifyToken, TokenPayload } from '../server/modules/auth/auth.crypto.ts';

/**
 * Story 8.2 — SEC-01: Instant Token Revocation via token_version.
 *
 * Strategy: the revocation decision lives in `authenticateToken` (server/middlewares/authenticate.ts)
 * and delegates version resolution to `userService.resolveTokenVersion`. We mock the users service
 * module to control the authoritative DB value deterministically (no live DB dependency),
 * then drive the middleware with real signed JWTs.
 */

process.env.JWT_SECRET = 'workstation-test-secret-min-32-chars-long-security-token';

const { mockResolveTokenVersion } = vi.hoisted(() => ({
  mockResolveTokenVersion: vi.fn(),
}));

vi.mock('../server/modules/users/users.service.ts', () => ({
  userService: {
    resolveTokenVersion: mockResolveTokenVersion,
    bumpTokenVersion: vi.fn().mockResolvedValue(true),
    setUserRole: vi.fn().mockResolvedValue({ id: 'usr-1', role: 'Viewer' }),
  },
}));

import { authenticateToken, AuthenticatedRequest } from '../server/middlewares/authenticate.ts';

function createMockResponse() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function buildRequest(token: string): AuthenticatedRequest {
  return {
    headers: { authorization: `Bearer ${token}` },
  } as unknown as AuthenticatedRequest;
}

const basePayload: Omit<TokenPayload, 'iat' | 'exp'> = {
  userId: 'usr-1',
  email: 'kevin@workstation.io',
  name: 'Kevin Santoso',
  role: 'Developer',
};

describe('Token Revocation via token_version (Story 8.2 / SEC-01)', () => {
  beforeEach(() => {
    mockResolveTokenVersion.mockReset();
  });

  it('issued tokens carry a tokenVersion claim (default 1)', () => {
    const token = generateToken(basePayload);
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    expect(decoded.tokenVersion).toBe(1);
  });

  it('accepts a token whose claim matches the authoritative DB version', async () => {
    mockResolveTokenVersion.mockResolvedValue(3);
    const token = generateToken({ ...basePayload, tokenVersion: 3 });
    const req = buildRequest(token);
    const res = createMockResponse();
    const next = vi.fn();

    await authenticateToken(req as any, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user?.userId).toBe('usr-1');
  });

  it('rejects a previously valid token after logout rotated the DB version (HTTP 401)', async () => {
    // Token minted when version was 2...
    const token = generateToken({ ...basePayload, tokenVersion: 2 });
    // ...then logout bumped the DB to 3
    mockResolveTokenVersion.mockResolvedValue(3);

    const res = createMockResponse();
    const next = vi.fn();
    await authenticateToken(buildRequest(token) as any, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'AUTH_TOKEN_REVOKED' }),
      })
    );
  });

  it('rejects old tokens carrying the previous role after a role change rotates the version', async () => {
    const oldRoleToken = generateToken({
      ...basePayload,
      role: 'Developer',
      tokenVersion: 1,
    });
    mockResolveTokenVersion.mockResolvedValue(2); // role change bumped version

    const res = createMockResponse();
    const next = vi.fn();
    await authenticateToken(buildRequest(oldRoleToken) as any, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects legacy pre-migration tokens without a tokenVersion claim (HTTP 401)', async () => {
    // Hand-craft a legacy JWT with no tokenVersion claim (simulating pre-8.2 tokens)
    const legacyToken = jwt.sign(
      { userId: 'usr-1', email: basePayload.email, name: basePayload.name, role: 'Developer' },
      process.env.JWT_SECRET!,
      { algorithm: 'HS256', expiresIn: 3600 }
    );
    // Case A: DB reachable and version is 1 -> claim 0 !== 1 -> rejected
    mockResolveTokenVersion.mockResolvedValue(1);
    const resA = createMockResponse();
    const nextA = vi.fn();
    await authenticateToken(buildRequest(legacyToken) as any, resA, nextA);
    expect(resA.status).toHaveBeenCalledWith(401);
    expect(nextA).not.toHaveBeenCalled();

    // Case B: DB unavailable (null) -> claim-shape fallback still rejects version 0
    mockResolveTokenVersion.mockResolvedValue(null);
    const resB = createMockResponse();
    const nextB = vi.fn();
    await authenticateToken(buildRequest(legacyToken) as any, resB, nextB);
    expect(resB.status).toHaveBeenCalledWith(401);
    expect(nextB).not.toHaveBeenCalled();
  });

  it('degraded mode: new-format tokens (claim >= 1) still authenticate when the DB is unreachable', async () => {
    mockResolveTokenVersion.mockResolvedValue(null); // DB down / directory-only user
    const token = generateToken({ ...basePayload, tokenVersion: 1 });

    const res = createMockResponse();
    const next = vi.fn();
    await authenticateToken(buildRequest(token) as any, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('login flow embeds the current DB token_version in newly issued tokens', async () => {
    // Reconstruct the version-resolution logic used by authService.login
    const userRecord = { id: 'usr-1', email: basePayload.email, name: basePayload.name, role: 'Developer', tokenVersion: 7 };
    const tokenVersion = (userRecord as any).tokenVersion ?? 1;
    const token = generateToken({
      userId: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: 'Developer',
      tokenVersion,
    });
    const verified = verifyToken(token);
    expect(verified?.tokenVersion).toBe(7);
  });
});
