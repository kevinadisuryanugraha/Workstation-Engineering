import { Request, Response } from 'express';
import { verifyGitHubSignature } from './webhook.crypto.ts';
import { webhookService } from './webhook.service.ts';

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
  const { duplicate, delivery } = await webhookService.ingestWebhook(deliveryId, event, req.body);

  if (duplicate) {
    return res.status(200).json({
      success: true,
      message: 'Duplicate delivery ignored',
      deliveryId,
      timestamp: new Date().toISOString(),
    });
  }

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
