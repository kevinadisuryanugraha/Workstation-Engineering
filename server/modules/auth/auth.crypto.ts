import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../../config/auth.ts';
import { UserRole, Permission, SERVER_ROLE_PERMISSIONS } from '../../constants/permissions.ts';

const BCRYPT_SALT_ROUNDS = 12;

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  /** SEC-01: rotation counter — validated against users.token_version on every request */
  tokenVersion?: number;
  iat?: number;
  exp?: number;
}

export interface VerifiedSession {
  user: TokenPayload;
  permissions: Permission[];
}

/**
 * Hashes a plaintext password using bcrypt with 12 salt rounds (NFR-002, closing DS-08)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compares a candidate password against a bcrypt hash in constant time
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Signs a stateless cryptographic JWT token using HMAC-SHA256
 */
export function generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>, expiresInSeconds = JWT_CONFIG.expiresInSeconds): string {
  const secret = JWT_CONFIG.secret;
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      tokenVersion: payload.tokenVersion ?? 1,
    },
    secret,
    {
      algorithm: JWT_CONFIG.algorithm,
      expiresIn: expiresInSeconds,
    }
  );
}

/**
 * Verifies and decodes a JWT token strictly.
 * Rejects any unverified token or client-forged signature.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const secret = JWT_CONFIG.secret;
    const decoded = jwt.verify(token, secret, {
      algorithms: [JWT_CONFIG.algorithm],
    }) as TokenPayload;

    if (!decoded || !decoded.userId || !decoded.role) {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}
