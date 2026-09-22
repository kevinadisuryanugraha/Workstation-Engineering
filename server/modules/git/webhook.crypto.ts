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

/**
 * Story 23.2 (CC-8) — GitLab webhook auth: header `X-Gitlab-Token` dibandingkan
 * langsung dengan secret (GitLab TIDAK memakai HMAC). Wajib konstanta-time
 * (timingSafeEqual) untuk mencegah timing attack.
 */
export function verifyGitlabToken(secret: string, headerToken?: string): boolean {
  if (!headerToken) return false;
  const a = Buffer.from(String(headerToken));
  const b = Buffer.from(String(secret));
  if (a.length !== b.length) {
    // Bandingkan tetap secara timing-safe terhadap dummy agar panjang token
    // tidak bisa diukur lewat waktu respons.
    crypto.timingSafeEqual(a, crypto.randomBytes(Math.max(a.length, 1)));
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

/**
 * Story 23.2 (CC-8) — Bitbucket webhook auth: header `X-Hub-Signature`
 * (format `sha256=<hex>` HMAC-SHA256 terhadap raw body) — skema sama dengan
 * GitHub, hanya nama headernya berbeda.
 */
export function verifyBitbucketSignature(
  rawPayload: string | Buffer,
  secret: string,
  headerSignature?: string
): boolean {
  return verifyGitHubSignature(rawPayload, secret, headerSignature);
}

export type WebhookProvider = 'GITHUB' | 'GITLAB' | 'BITBUCKET';

/**
 * Dispatcher verifikasi per provider (AC 23.2.2). GitHub/Bibbucket HMAC-SHA256;
 * GitLab token timing-safe.
 */
export function verifyProviderSignature(
  provider: WebhookProvider,
  rawPayload: string | Buffer,
  secret: string,
  headers: Record<string, unknown>
): boolean {
  const header = (name: string): string | undefined => {
    const v = headers[name.toLowerCase()] ?? headers[name];
    return Array.isArray(v) ? v[0] : (v as string | undefined);
  };

  switch (provider) {
    case 'GITHUB':
      return verifyGitHubSignature(rawPayload, secret, header('X-Hub-Signature-256'));
    case 'BITBUCKET':
      return verifyBitbucketSignature(rawPayload, secret, header('X-Hub-Signature'));
    case 'GITLAB':
      return verifyGitlabToken(secret, header('X-Gitlab-Token'));
    default:
      return false;
  }
}
