import { Router } from 'express';
import { githubWebhookHandler } from './webhook.controller.ts';

const router = Router();

// Public webhook ingestion endpoint (protected by X-Hub-Signature-256 header)
router.post('/github', githubWebhookHandler);

export const gitWebhookRouter = router;
