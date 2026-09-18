import crypto from 'crypto';

/**
 * Validates GitHub X-Hub-Signature-256 header against raw payload and webhook secret.
 * Uses constant-time buffer comparison to prevent timing attacks.
 */
export function verifyGitHubSignature(rawPayload: string | Buffer, secret: string, headerSignature?: string): boolean {
  if (!headerSignature || !headerSignature.startsWith('sha256=')) {
    return false;
  }

  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(rawPayload)
    .digest('hex')}`;

  const sigBuffer = Buffer.from(headerSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}
