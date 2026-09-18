import { describe, it, expect, beforeAll } from 'vitest';
import { hashPassword, comparePassword, generateToken, verifyToken } from '../server/modules/auth/auth.crypto.ts';

describe('Auth & Cryptography Unit Tests', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'workstation-test-secret-min-32-chars-long-security-token';
  });

  it('hashes password with bcrypt and verifies correctly', async () => {
    const rawPassword = 'superSecurePassword123!';
    const hash = await hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash.startsWith('$2')).toBe(true); // bcrypt hash prefix
    expect(hash).not.toBe(rawPassword);

    const isMatch = await comparePassword(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await comparePassword('wrongPassword', hash);
    expect(isWrongMatch).toBe(false);
  });

  it('signs and strictly verifies stateless JWT token', () => {
    const payload = {
      userId: 'usr-1',
      email: 'dev@workstation.io',
      name: 'Test Developer',
      role: 'Developer' as const,
    };

    const token = generateToken(payload, 3600);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const verified = verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.role).toBe(payload.role);
  });

  it('rejects tampered or forged token payloads strictly', () => {
    const forgedToken = 'ey.fakeHeader.fakePayloadWithAdminRole.fakeSignature';
    const result = verifyToken(forgedToken);
    expect(result).toBeNull();
  });

  it('rejects expired tokens strictly', () => {
    const payload = {
      userId: 'usr-2',
      email: 'expired@workstation.io',
      name: 'Expired User',
      role: 'Viewer' as const,
    };

    // Expired immediately (-1 second)
    const token = generateToken(payload, -1);
    const result = verifyToken(token);
    expect(result).toBeNull();
  });
});
