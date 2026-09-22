import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { webhookDeliveries, WebhookDelivery, NewWebhookDelivery } from '../../db/schema/webhook_deliveries.ts';
import { repositories } from '../../db/schema/repositories.ts';
import type { GitProvider } from '../../db/schema/repositories.ts';

export class WebhookService {
  /**
   * Retrieves the webhook secret configured for a given repository.
   * (Jalur legacy GitHub — dipakai handler GitHub eksisting.)
   */
  async getRepositorySecret(repoFullName: string): Promise<string | null> {
    try {
      const results = await db
        .select()
        .from(repositories)
        .where(eq(repositories.fullName, repoFullName))
        .limit(1);
      return results[0]?.webhookSecret || null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Story 23.2 (CC-8) — lookup secret by (provider, fullName) via kolom provider
   * (Registry 23.1). Fallback env per-provider ditangani di controller.
   */
  async getRepositorySecretByProvider(provider: GitProvider, repoFullName: string): Promise<string | null> {
    try {
      const results = await db
        .select()
        .from(repositories)
        .where(and(eq(repositories.provider, provider), eq(repositories.fullName, repoFullName)))
        .limit(1);
      return results[0]?.webhookSecret || null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Checks if delivery is duplicate, registers pending event, and returns.
   * Story 23.2 (CC-8): menerima `provider` (default GITHUB — backward compatible
   * dengan pemanggil GitHub eksisting) dan payload kanonik yang di-embed di
   * dalam payload JSON yang sama (raw payload tetap utuh untuk forensik).
   */
  async ingestWebhook(
    deliveryId: string,
    event: string,
    payload: any,
    provider: GitProvider = 'GITHUB',
    canonical?: unknown
  ): Promise<{ duplicate: boolean; delivery: WebhookDelivery | null }> {
    try {
      // Idempotency check: see if deliveryId already exists
      const existing = await db
        .select()
        .from(webhookDeliveries)
        .where(eq(webhookDeliveries.deliveryId, deliveryId))
        .limit(1);

      if (existing.length > 0) {
        return { duplicate: true, delivery: existing[0] };
      }

      const storedPayload =
        canonical !== undefined && payload && typeof payload === 'object'
          ? { ...payload, canonical }
          : canonical !== undefined
            ? { raw: payload ?? null, canonical }
            : payload;

      const newRecord: NewWebhookDelivery = {
        deliveryId,
        event,
        provider,
        status: 'PENDING',
        payload: storedPayload as any,
      };

      const inserted = await db.insert(webhookDeliveries).values(newRecord).returning();
      return { duplicate: false, delivery: inserted[0] };
    } catch (err: any) {
      // In case of unique constraint race condition
      if (err?.code === '23505') {
        return { duplicate: true, delivery: null };
      }
      return { duplicate: false, delivery: null };
    }
  }
}

export const webhookService = new WebhookService();
