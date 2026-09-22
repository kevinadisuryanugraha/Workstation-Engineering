import { Router } from 'express';
import { githubWebhookHandler, gitlabWebhookHandler, bitbucketWebhookHandler } from './webhook.controller.ts';

const router = Router();

// Public webhook ingestion endpoints (diproteksi signature/token per provider).
// Story 23.2 (CC-8): route GitHub lama TIDAK berubah; GitLab & Bitbucket baru.
router.post('/github', githubWebhookHandler);
router.post('/gitlab', gitlabWebhookHandler);
router.post('/bitbucket', bitbucketWebhookHandler);

export const gitWebhookRouter = router;
