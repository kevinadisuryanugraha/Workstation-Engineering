import { eq } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { webhookDeliveries, WebhookDelivery, NewWebhookDelivery } from '../../db/schema/webhook_deliveries.ts';
import { repositories } from '../../db/schema/repositories.ts';

export class WebhookService {
  /**
   * Retrieves the webhook secret configured for a given repository.
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
   * Checks if delivery is duplicate, registers pending event, and returns.
   */
  async ingestWebhook(
    deliveryId: string,
    event: string,
    payload: any
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

      const newRecord: NewWebhookDelivery = {
        deliveryId,
        event,
        status: 'PENDING',
        payload,
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
