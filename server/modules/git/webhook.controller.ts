import { Request, Response } from 'express';
import { verifyGitHubSignature, verifyProviderSignature } from './webhook.crypto.ts';
import { webhookService } from './webhook.service.ts';
import { normalizeProviderEvent } from './webhook.providers.ts';
import type { GitProvider } from '../../db/schema/repositories.ts';

/**
 * Story 23.2 (CC-8): handler generik provider-aware. Route GitHub eksisting
 * dipertahankan lewat `githubWebhookHandler` (bound GITHUB) dengan bentuk
 * respons yang identik; GitLab & Bitbucket memakai `providerWebhookHandler`.
 */

/** Header delivery/event per provider (AC 23.2.3). */
const PROVIDER_HEADERS: Record<GitProvider, { delivery: string; event: string }> = {
  GITHUB: { delivery: 'x-github-delivery', event: 'x-github-event' },
  GITLAB: { delivery: 'x-github-delivery', event: 'x-gitlab-event' }, // delivery tak dipakai — normalizer menentukan
  BITBUCKET: { delivery: 'x-request-uuid', event: 'x-event-key' },
};

const PROVIDER_ENV_SECRET: Partial<Record<GitProvider, string>> = {
  GITHUB: 'GITHUB_WEBHOOK_SECRET',
  GITLAB: 'GITLAB_WEBHOOK_SECRET',
  BITBUCKET: 'BITBUCKET_WEBHOOK_SECRET',
};

export async function providerWebhookHandler(provider: GitProvider, req: Request, res: Response) {
  const headers = req.headers as Record<string, unknown>;
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  // --- Normalisasi payload → model kanonik (perlu repoFullName untuk secret) ---
  const normalized = normalizeProviderEvent(provider, headers, req.body, rawBody);
  const eventLabel = normalized.ok ? normalized.canonical.rawEvent : ((headers[PROVIDER_HEADERS[provider].event] as string) ?? 'unknown');

  if (!normalized.ok && normalized.reason === 'BAD_HEADERS') {
    return res.status(400).json({
      success: false,
      error: { code: 'BAD_WEBHOOK_HEADERS', message: `Missing required ${provider} webhook headers` },
      timestamp: new Date().toISOString(),
    });
  }

  // --- Secret lookup: registry (provider, fullName) → fallback env per-provider ---
  const repoFullName = normalized.ok ? normalized.canonical.repoFullName : (req.body?.repository?.full_name ?? req.body?.project?.path_with_namespace);
  let secret = (process.env[PROVIDER_ENV_SECRET[provider] ?? ''] as string | undefined)
    || 'workstation-github-webhook-default-secret';
  if (repoFullName) {
    const repoSecret = await webhookService.getRepositorySecretByProvider(provider, repoFullName);
    if (repoSecret) {
      secret = repoSecret;
    }
  }

  // --- Verifikasi kriptografis per provider (AC 23.2.2) ---
  const isSignatureValid = verifyProviderSignature(provider, rawBody, secret, headers);
  if (!isSignatureValid) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_SIGNATURE', message: `${provider} webhook signature/token verification failed` },
      timestamp: new Date().toISOString(),
    });
  }

  if (!normalized.ok) {
    if (normalized.reason === 'UNPARSEABLE_PAYLOAD') {
      return res.status(400).json({
        success: false,
        error: { code: 'UNPARSEABLE_PAYLOAD', message: 'Webhook payload missing repository identity' },
        timestamp: new Date().toISOString(),
      });
    }
    // UNSUPPORTED_EVENT (AC 23.2.4): diterima + tercatat IGNORED — jujur, bukan gagal.
    const unsupportedDelivery = (req.headers[PROVIDER_HEADERS[provider].delivery] as string)
      || (req.headers['x-github-delivery'] as string)
      || `unsupported-${Date.now()}`;
    await webhookService.ingestWebhook(
      `ignored:${unsupportedDelivery}:${eventLabel}`,
      eventLabel,
      req.body,
      provider,
      { ignored: true, reason: 'UNSUPPORTED_EVENT' }
    );
    return res.status(202).json({
      success: true,
      message: 'Event type not supported — recorded as IGNORED',
      event: eventLabel,
      status: 'IGNORED',
      timestamp: new Date().toISOString(),
    });
  }

  const { canonical, deliveryId, deliveryIdSynthetic } = normalized;

  // --- Ingest idempoten (ADR-005): dedup via deliveryId unik ---
  const { duplicate } = await webhookService.ingestWebhook(
    deliveryId,
    canonical.event,
    req.body,
    provider,
    { ...canonical, deliveryIdSynthetic }
  );

  if (duplicate) {
    return res.status(200).json({
      success: true,
      message: 'Duplicate delivery ignored',
      deliveryId,
      timestamp: new Date().toISOString(),
    });
  }

  // Tahap 2 asinkron (ADR-005) — tidak memblok respons 202 ke webhook runner
  setImmediate(() => {
    webhookService.processDelivery(deliveryId).catch((err) => {
      console.error('[WebhookService] Async delivery processing error:', err);
    });
  });

  // Fast response (< 50ms) sesuai kontrak webhook runner (ADR-005 tahap 1).
  res.status(202).json({
    success: true,
    message: 'Webhook delivery accepted for processing',
    deliveryId,
    event: canonical.event,
    status: 'PENDING',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handler GitHub — perilaku legacy dipertahankan (header X-GitHub-*, secret
 * fallback global GITHUB_WEBHOOK_SECRET, bentuk respons identik).
 */
export async function githubWebhookHandler(req: Request, res: Response) {
  const deliveryId = req.headers['x-github-delivery'] as string;
  const signature = req.headers['x-hub-signature-256'] as string;
  const event = req.headers['x-github-event'] as string;

  if (!deliveryId || !event) {
    return res.status(400).json({
      success: false,
      error: { code: 'BAD_WEBHOOK_HEADERS', message: 'Missing X-GitHub-Delivery or X-GitHub-Event header' },
      timestamp: new Date().toISOString(),
    });
  }

  // Determine repository secret: check repo in payload or fallback to global org secret
  const repoFullName = req.body?.repository?.full_name;
  let secret = process.env.GITHUB_WEBHOOK_SECRET || 'workstation-github-webhook-default-secret';
  if (repoFullName) {
    const repoSecret = await webhookService.getRepositorySecret(repoFullName);
    if (repoSecret) {
      secret = repoSecret;
    }
  }

  // Validate HMAC-SHA256 signature
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);
  const isSignatureValid = verifyGitHubSignature(rawBody, secret, signature);

  if (!isSignatureValid) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_SIGNATURE', message: 'HMAC-SHA256 signature verification failed' },
      timestamp: new Date().toISOString(),
    });
  }

  // Idempotency check & ingestion
  const normalized = normalizeProviderEvent('GITHUB', req.headers as any, req.body, rawBody);
  const canonical = normalized.ok ? normalized.canonical : undefined;

  const { duplicate, delivery } = await webhookService.ingestWebhook(deliveryId, event, req.body, 'GITHUB', canonical);

  if (duplicate) {
    return res.status(200).json({
      success: true,
      message: 'Duplicate delivery ignored',
      deliveryId,
      timestamp: new Date().toISOString(),
    });
  }

  // Tahap 2 asinkron (ADR-005)
  setImmediate(() => {
    webhookService.processDelivery(deliveryId).catch((err) => {
      console.error('[WebhookService] Async delivery processing error:', err);
    });
  });

  // Fast response (< 50ms) to satisfy GitHub Webhook runner timeout requirement
  res.status(202).json({
    success: true,
    message: 'Webhook delivery accepted for processing',
    deliveryId,
    event,
    status: 'PENDING',
    timestamp: new Date().toISOString(),
  });
}

/** Binding route GitLab. */
export function gitlabWebhookHandler(req: Request, res: Response) {
  return providerWebhookHandler('GITLAB', req, res);
}

/** Binding route Bitbucket. */
export function bitbucketWebhookHandler(req: Request, res: Response) {
  return providerWebhookHandler('BITBUCKET', req, res);
}
