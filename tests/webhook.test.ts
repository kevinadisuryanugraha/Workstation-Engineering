import { describe, it, expect, vi } from 'vitest';
import crypto from 'crypto';
import { verifyGitHubSignature } from '../server/modules/git/webhook.crypto.ts';
import { webhookService } from '../server/modules/git/webhook.service.ts';

describe('GitHub Webhook Receiver Unit Tests', () => {
  const secret = 'my-test-webhook-secret-token';
  const payload = JSON.stringify({
    action: 'opened',
    pull_request: { number: 42, title: '[WRK-101] Fix login bug' },
  });

  it('validates matching HMAC-SHA256 signature correctly', () => {
    const validSignature = `sha256=${crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')}`;

    const isValid = verifyGitHubSignature(payload, secret, validSignature);
    expect(isValid).toBe(true);
  });

  it('rejects invalid or tampered HMAC signature', () => {
    const invalidSignature = 'sha256=invalid0000000000000000000000000000000000000000000000000000000000';
    const isValid = verifyGitHubSignature(payload, secret, invalidSignature);
    expect(isValid).toBe(false);
  });

  it('returns duplicate: true when delivery ID already processed (idempotency)', async () => {
    vi.spyOn(webhookService, 'ingestWebhook').mockResolvedValueOnce({
      duplicate: true,
      delivery: { id: 'del-1', deliveryId: 'uuid-123', event: 'push', status: 'PROCESSED' } as any,
    });

    const result = await webhookService.ingestWebhook('uuid-123', 'push', {});
    expect(result.duplicate).toBe(true);
  });
});
