import dotenv from 'dotenv';

dotenv.config();

const MIN_SECRET_LENGTH = 32;

/**
 * Validates and retrieves the JWT_SECRET from environment variables.
 * Fails fast with a fatal error if the secret is missing or insecure.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error(
      '[FATAL SECURITY CONFIGURATION] JWT_SECRET environment variable is missing! ' +
      'A secure random string with minimum 32 characters must be configured in environment variables.'
    );
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `[FATAL SECURITY CONFIGURATION] JWT_SECRET is too short (${secret.length} chars). ` +
      `It must be at least ${MIN_SECRET_LENGTH} characters long.`
    );
  }

  // Reject known dangerous mock strings
  if (secret === 'workstation-enterprise-rbac-secure-salt-2026' && process.env.NODE_ENV === 'production') {
    throw new Error(
      '[FATAL SECURITY CONFIGURATION] Default development secret cannot be used in production!'
    );
  }

  return secret;
}

export const JWT_CONFIG = {
  get secret() {
    return getJwtSecret();
  },
  expiresInSeconds: 86400, // 24 hours
  algorithm: 'HS256' as const,
};
