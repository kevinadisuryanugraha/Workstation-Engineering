import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { webhookDeliveries, WebhookDelivery, NewWebhookDelivery } from '../../db/schema/webhook_deliveries.ts';
import { repositories } from '../../db/schema/repositories.ts';
import type { GitProvider } from '../../db/schema/repositories.ts';
import type { CanonicalGitEvent } from './webhook.providers.ts';
import { gitLinkerService } from './git-linker.service.ts';

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

  /**
   * Story 23.3 (CC-8) — Tahap 2: Pemrosesan event kanonik (asinkron).
   * Menemukan repo terdaftar by (provider, fullName). Bila belum terdaftar,
   * delivery berstatus FAILED + error REPO_NOT_REGISTERED. Bila terdaftar,
   * commits dan pull_requests disimpan + evidence links ditautkan, lalu
   * status delivery menjadi PROCESSED.
   */
  async processDelivery(deliveryId: string): Promise<{
    status: 'PROCESSED' | 'FAILED' | 'IGNORED';
    error?: string;
    commitCount?: number;
    prCount?: number;
    linkedKeys?: string[];
  }> {
    try {
      const records = await db
        .select()
        .from(webhookDeliveries)
        .where(eq(webhookDeliveries.deliveryId, deliveryId))
        .limit(1);

      if (records.length === 0) {
        return { status: 'FAILED', error: 'DELIVERY_NOT_FOUND' };
      }

      const delivery = records[0];
      const payload: any = delivery.payload;
      const canonical: CanonicalGitEvent | undefined = payload?.canonical;

      // Event yang memang diabaikan (unsupported)
      if (payload?.canonical?.ignored) {
        await db
          .update(webhookDeliveries)
          .set({ status: 'PROCESSED', processedAt: new Date() })
          .where(eq(webhookDeliveries.id, delivery.id));
        return { status: 'IGNORED' };
      }

      if (!canonical || !canonical.repoFullName) {
        await db
          .update(webhookDeliveries)
          .set({ status: 'FAILED', error: 'UNPARSEABLE_CANONICAL_PAYLOAD', processedAt: new Date() })
          .where(eq(webhookDeliveries.id, delivery.id));
        return { status: 'FAILED', error: 'UNPARSEABLE_CANONICAL_PAYLOAD' };
      }

      const provider = (delivery.provider as GitProvider) || canonical.provider || 'GITHUB';

      // AC 23.3.2: Lookup repo by (provider, fullName) di tabel repositories.
      // Repo belum teregistrasi → FAILED + REPO_NOT_REGISTERED.
      const repoRows = await db
        .select()
        .from(repositories)
        .where(and(eq(repositories.provider, provider), eq(repositories.fullName, canonical.repoFullName)))
        .limit(1);

      if (repoRows.length === 0) {
        await db
          .update(webhookDeliveries)
          .set({ status: 'FAILED', error: 'REPO_NOT_REGISTERED', processedAt: new Date() })
          .where(eq(webhookDeliveries.id, delivery.id));
        return { status: 'FAILED', error: 'REPO_NOT_REGISTERED' };
      }

      const repo = repoRows[0];
      const allLinkedKeys: string[] = [];
      let commitCount = 0;
      let prCount = 0;

      // AC 23.3.3 & 23.3.4: pemrosesan kanonik
      if (canonical.event === 'push' && Array.isArray(canonical.commits)) {
        for (const c of canonical.commits) {
          if (!c.sha) continue;
          const { linkedKeys } = await gitLinkerService.processCommitAndLink({
            repoId: repo.id,
            sha: c.sha,
            message: c.message || '',
            authorName: c.authorName || 'Unknown',
            authorEmail: c.authorEmail || null,
            branch: canonical.branch || repo.defaultBranch || 'main',
            url: c.url || null,
            committedAt: c.committedAt ? new Date(c.committedAt) : new Date(),
          });
          commitCount++;
          for (const k of linkedKeys) {
            if (!allLinkedKeys.includes(k)) allLinkedKeys.push(k);
          }
        }
      } else if (canonical.event === 'merge_request' && canonical.mergeRequest) {
        const mr = canonical.mergeRequest;
        const { linkedKeys } = await gitLinkerService.processPullRequestAndLink({
          repoId: repo.id,
          prNumber: mr.prNumber,
          title: mr.title || `PR #${mr.prNumber}`,
          authorName: mr.authorName || 'Unknown',
          sourceBranch: mr.sourceBranch || 'feature',
          targetBranch: mr.targetBranch || repo.defaultBranch || 'main',
          status: mr.status,
          url: mr.url || null,
          mergedAt: mr.status === 'MERGED' ? new Date() : null,
        });
        prCount++;
        for (const k of linkedKeys) {
          if (!allLinkedKeys.includes(k)) allLinkedKeys.push(k);
        }
      }

      // AC 23.3.5: Delivery status lifecycle PENDING → PROCESSED
      await db
        .update(webhookDeliveries)
        .set({ status: 'PROCESSED', processedAt: new Date(), error: null })
        .where(eq(webhookDeliveries.id, delivery.id));

      return {
        status: 'PROCESSED',
        commitCount,
        prCount,
        linkedKeys: allLinkedKeys,
      };
    } catch (err: any) {
      await db
        .update(webhookDeliveries)
        .set({ status: 'FAILED', error: err?.message || 'INTERNAL_ERROR', processedAt: new Date() })
        .where(eq(webhookDeliveries.deliveryId, deliveryId))
        .catch(() => undefined);
      return { status: 'FAILED', error: err?.message || 'INTERNAL_ERROR' };
    }
  }
}

export const webhookService = new WebhookService();
