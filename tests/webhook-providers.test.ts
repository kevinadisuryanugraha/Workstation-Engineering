import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import {
  verifyGitHubSignature,
  verifyGitlabToken,
  verifyBitbucketSignature,
  verifyProviderSignature,
} from '../server/modules/git/webhook.crypto.ts';
import {
  normalizeProviderEvent,
  syntheticDeliveryId,
} from '../server/modules/git/webhook.providers.ts';
import {
  providerWebhookHandler,
  githubWebhookHandler,
} from '../server/modules/git/webhook.controller.ts';
import { webhookService } from '../server/modules/git/webhook.service.ts';

/**
 * Story 23.2 (CC-8) — Webhook adapter GitLab & Bitbucket.
 * Fixture mengikuti struktur resmi dokumentasi provider.
 */

const SECRET = 'test-webhook-secret-23-2';

/* ------------------------------ Verifikasi auth ----------------------------- */

describe('Story 23.2 — verifyGitlabToken (timing-safe)', () => {
  it('token cocok → true', () => {
    expect(verifyGitlabToken(SECRET, SECRET)).toBe(true);
  });

  it('token salah → false', () => {
    expect(verifyGitlabToken(SECRET, 'wrong-token')).toBe(false);
  });

  it('token tidak dikirim → false', () => {
    expect(verifyGitlabToken(SECRET, undefined)).toBe(false);
  });

  it('panjang berbeda → false tanpa throw', () => {
    expect(verifyGitlabToken(SECRET, 'a')).toBe(false);
  });
});

describe('Story 23.2 — verifyBitbucketSignature (HMAC-SHA256, header beda nama)', () => {
  const body = JSON.stringify({ repository: { full_name: 'team/repo' } });

  it('signature valid → true', () => {
    const sig = `sha256=${crypto.createHmac('sha256', SECRET).update(body).digest('hex')}`;
    expect(verifyBitbucketSignature(body, SECRET, sig)).toBe(true);
  });

  it('signature invalid → false', () => {
    expect(verifyBitbucketSignature(body, SECRET, 'sha256=' + '0'.repeat(64))).toBe(false);
  });

  it('raw body berbeda → false (HMAC terikat byte asli)', () => {
    const sig = `sha256=${crypto.createHmac('sha256', SECRET).update(body).digest('hex')}`;
    expect(verifyBitbucketSignature(body + ' ', SECRET, sig)).toBe(false);
  });
});

describe('Story 23.2 — verifyProviderSignature dispatcher', () => {
  const body = JSON.stringify({ x: 1 });
  const hmac = `sha256=${crypto.createHmac('sha256', SECRET).update(body).digest('hex')}`;

  it('GITHUB → X-Hub-Signature-256', () => {
    expect(verifyProviderSignature('GITHUB', body, SECRET, { 'x-hub-signature-256': hmac })).toBe(true);
    expect(verifyProviderSignature('GITHUB', body, SECRET, { 'x-hub-signature': hmac })).toBe(false);
  });

  it('BITBUCKET → X-Hub-Signature', () => {
    expect(verifyProviderSignature('BITBUCKET', body, SECRET, { 'x-hub-signature': hmac })).toBe(true);
    expect(verifyProviderSignature('BITBUCKET', body, SECRET, { 'x-hub-signature-256': hmac })).toBe(false);
  });

  it('GITLAB → X-Gitlab-Token', () => {
    expect(verifyProviderSignature('GITLAB', body, SECRET, { 'x-gitlab-token': SECRET })).toBe(true);
    expect(verifyProviderSignature('GITLAB', body, SECRET, {})).toBe(false);
  });
});

/* ------------------------- Normalisasi GitLab (fixture) ------------------------- */

const GITLAB_PUSH_BODY = {
  object_kind: 'push',
  ref: 'refs/heads/main',
  project: { path_with_namespace: 'zamzami/workstation' },
  user_name: 'Budi',
  commits: [
    {
      id: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
      message: '[WRK-105] perbaiki sprint board',
      author: { name: 'Budi', email: 'budi@zamzami.or.id' },
      url: 'https://gitlab.com/zamzami/workstation/-/commit/a1b2',
      timestamp: '2026-09-22T02:00:00Z',
    },
    {
      id: '0000000000000000000000000000000000000000',
      message: 'should be filtered (zero commit)',
    },
  ],
};

const GITLAB_MR_BODY = {
  object_kind: 'merge_request',
  project: { path_with_namespace: 'zamzami/workstation' },
  user: { name: 'Budi' },
  object_attributes: {
    iid: 17,
    title: 'CORE-50 refactor ingest',
    source_branch: 'feature/core-50',
    target_branch: 'main',
    state: 'opened',
    action: 'open',
    url: 'https://gitlab.com/zamzami/workstation/-/merge_requests/17',
  },
};

describe('Story 23.2 — normalisasi GitLab', () => {
  it('Push Hook → kanonik push, zero-commit difilter, branch dipangkas', () => {
    const res = normalizeProviderEvent(
      'GITLAB',
      { 'x-gitlab-event': 'Push Hook', 'x-gitlab-token': SECRET, 'x-gitlab-event-uuid': 'gl-uuid-1' },
      GITLAB_PUSH_BODY,
      JSON.stringify(GITLAB_PUSH_BODY)
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.canonical).toMatchObject({
      provider: 'GITLAB',
      repoFullName: 'zamzami/workstation',
      event: 'push',
      branch: 'main',
    });
    expect(res.canonical.commits.length).toBe(1);
    expect(res.canonical.commits[0].message).toContain('WRK-105');
    expect(res.deliveryId).toBe('gl-uuid-1');
    expect(res.deliveryIdSynthetic).toBe(false);
  });

  it('Push Hook tanpa X-Gitlab-Event-UUID → delivery ID sintetis deterministik', () => {
    const raw = JSON.stringify(GITLAB_PUSH_BODY);
    const res1 = normalizeProviderEvent('GITLAB', { 'x-gitlab-event': 'Push Hook' }, GITLAB_PUSH_BODY, raw);
    const res2 = normalizeProviderEvent('GITLAB', { 'x-gitlab-event': 'Push Hook' }, GITLAB_PUSH_BODY, raw);
    expect(res1.ok && res2.ok).toBe(true);
    if (res1.ok && res2.ok) {
      expect(res1.deliveryIdSynthetic).toBe(true);
      expect(res1.deliveryId).toMatch(/^[0-9a-f]{64}$/);
      expect(res1.deliveryId).toBe(res2.deliveryId); // retry GitLab tetap ter-dedup
    }
  });

  it('Merge Request Hook → kanonik merge_request dengan iid → prNumber', () => {
    const res = normalizeProviderEvent(
      'GITLAB',
      { 'x-gitlab-event': 'Merge Request Hook' },
      GITLAB_MR_BODY,
      JSON.stringify(GITLAB_MR_BODY)
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.canonical.event).toBe('merge_request');
    expect(res.canonical.mergeRequest).toMatchObject({
      prNumber: 17,
      sourceBranch: 'feature/core-50',
      targetBranch: 'main',
      status: 'OPEN',
    });
  });

  it('MR state merged → status MERGED', () => {
    const body = { ...GITLAB_MR_BODY, object_attributes: { ...GITLAB_MR_BODY.object_attributes, state: 'merged', action: 'merge' } };
    const res = normalizeProviderEvent('GITLAB', { 'x-gitlab-event': 'Merge Request Hook' }, body, '{}');
    expect(res.ok && res.canonical.mergeRequest?.status).toBe('MERGED');
  });

  it('Note Hook (event tak didukung) → UNSUPPORTED_EVENT', () => {
    const res = normalizeProviderEvent('GITLAB', { 'x-gitlab-event': 'Note Hook' }, { project: { path_with_namespace: 'a/b' } }, '{}');
    expect(res).toMatchObject({ ok: false, reason: 'UNSUPPORTED_EVENT' });
  });

  it('payload tanpa project → UNPARSEABLE_PAYLOAD', () => {
    const res = normalizeProviderEvent('GITLAB', { 'x-gitlab-event': 'Push Hook' }, { foo: 1 }, '{}');
    expect(res).toMatchObject({ ok: false, reason: 'UNPARSEABLE_PAYLOAD' });
  });

  it('header X-Gitlab-Event hilang → BAD_HEADERS', () => {
    const res = normalizeProviderEvent('GITLAB', {}, GITLAB_PUSH_BODY, '{}');
    expect(res).toMatchObject({ ok: false, reason: 'BAD_HEADERS' });
  });
});

/* ------------------------ Normalisasi Bitbucket (fixture) ------------------------ */

const BITBUCKET_PUSH_BODY = {
  push: {
    changes: [
      {
        new: { type: 'branch', name: 'feature/tck-900' },
        commits: [
          {
            hash: 'bb1234567890abcdef1234567890abcdef123456',
            message: 'TCK-900 catat insiden jaringan',
            author: { raw: 'Sari <sari@zamzami.or.id>' },
            links: { html: { href: 'https://bitbucket.org/team/repo/commits/bb12' } },
          },
          {
            hash: 'bb2234567890abcdef1234567890abcdef123456',
            message: 'chore: tanpa kode item',
          },
        ],
      },
      {
        new: { type: 'branch', name: 'feature/tck-900' },
        commits: [
          {
            hash: 'bb3234567890abcdef1234567890abcdef123456',
            message: 'WRK-2 tambahan dari change kedua (flatten)',
          },
        ],
      },
    ],
  },
  repository: { full_name: 'team/repo' },
};

const BITBUCKET_PR_BODY = {
  pullrequest: {
    id: 42,
    title: 'WRK-77 deploy gate',
    author: { display_name: 'Sari' },
    source: { branch: { name: 'feature/wrk-77' } },
    destination: { branch: { name: 'main' } },
    state: 'OPEN',
    links: { html: { href: 'https://bitbucket.org/team/repo/pull-requests/42' } },
  },
  repository: { full_name: 'team/repo' },
};

describe('Story 23.2 — normalisasi Bitbucket', () => {
  it('repo:push → commits nested di changes[] ter-flatten', () => {
    const res = normalizeProviderEvent(
      'BITBUCKET',
      { 'x-event-key': 'repo:push', 'x-request-uuid': 'bb-uuid-1' },
      BITBUCKET_PUSH_BODY,
      JSON.stringify(BITBUCKET_PUSH_BODY)
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.canonical).toMatchObject({
      provider: 'BITBUCKET',
      repoFullName: 'team/repo',
      event: 'push',
      branch: 'feature/tck-900',
    });
    expect(res.canonical.commits.length).toBe(3); // 2 dari change pertama + 1 dari change kedua
    expect(res.canonical.commits[0].message).toContain('TCK-900');
    expect(res.deliveryId).toBe('bb-uuid-1');
  });

  it('pullrequest:created → kanonik merge_request, id → prNumber', () => {
    const res = normalizeProviderEvent(
      'BITBUCKET',
      { 'x-event-key': 'pullrequest:created', 'x-request-uuid': 'bb-uuid-2' },
      BITBUCKET_PR_BODY,
      JSON.stringify(BITBUCKET_PR_BODY)
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.canonical.event).toBe('merge_request');
    expect(res.canonical.mergeRequest).toMatchObject({
      prNumber: 42,
      sourceBranch: 'feature/wrk-77',
      targetBranch: 'main',
      status: 'OPEN',
    });
  });

  it.each([
    ['pullrequest:fulfilled', 'MERGED'],
    ['pullrequest:rejected', 'CLOSED'],
  ] as const)('%s → status %s', (eventKey, status) => {
    const res = normalizeProviderEvent(
      'BITBUCKET',
      { 'x-event-key': eventKey },
      BITBUCKET_PR_BODY,
      '{}'
    );
    expect(res.ok && res.canonical.mergeRequest?.status).toBe(status);
  });

  it('issue:created (tak didukung) → UNSUPPORTED_EVENT', () => {
    const res = normalizeProviderEvent(
      'BITBUCKET',
      { 'x-event-key': 'issue:created' },
      { repository: { full_name: 'team/repo' } },
      '{}'
    );
    expect(res).toMatchObject({ ok: false, reason: 'UNSUPPORTED_EVENT' });
  });
});

describe('Story 23.2 — syntheticDeliveryId', () => {
  it('deterministik terhadap body + event', () => {
    expect(syntheticDeliveryId('abc', 'Push Hook')).toBe(syntheticDeliveryId('abc', 'Push Hook'));
    expect(syntheticDeliveryId('abc', 'Push Hook')).not.toBe(syntheticDeliveryId('abd', 'Push Hook'));
    expect(syntheticDeliveryId('abc', 'Push Hook')).toMatch(/^[0-9a-f]{64}$/);
  });
});

/* ------------------------------- Handler level ------------------------------- */

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('Story 23.2 — providerWebhookHandler (unit, service di-mock)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GitLab valid: 202 + ingest dengan provider & kanonik', async () => {
    vi.spyOn(webhookService, 'getRepositorySecretByProvider').mockResolvedValueOnce(SECRET);
    const ingest = vi.spyOn(webhookService, 'ingestWebhook').mockResolvedValueOnce({
      duplicate: false,
      delivery: { id: 'd1' } as any,
    });

    const raw = JSON.stringify(GITLAB_PUSH_BODY);
    const req: any = {
      headers: {
        'x-gitlab-event': 'Push Hook',
        'x-gitlab-token': SECRET, // GitLab token = secret itu sendiri (timing-safe match)
        'x-gitlab-event-uuid': 'gl-uuid-9',
      },
      body: GITLAB_PUSH_BODY,
      rawBody: Buffer.from(raw),
    };
    const res = mockRes();

    await providerWebhookHandler('GITLAB', req, res);

    expect(res.status).toHaveBeenCalledWith(202);
    expect(ingest).toHaveBeenCalledTimes(1);
    const [deliveryId, event, payload, provider, canonical] = ingest.mock.calls[0];
    expect(provider).toBe('GITLAB');
    expect(deliveryId).toBe('gl-uuid-9');
    expect(event).toBe('push');
    expect((canonical as any).repoFullName).toBe('zamzami/workstation');
    expect((payload as any).project.path_with_namespace).toBe('zamzami/workstation'); // raw utuh
  });

  it('GitLab token salah → 401 INVALID_SIGNATURE', async () => {
    vi.spyOn(webhookService, 'getRepositorySecretByProvider').mockResolvedValueOnce(SECRET);
    const req: any = {
      headers: { 'x-gitlab-event': 'Push Hook', 'x-gitlab-token': 'wrong' },
      body: GITLAB_PUSH_BODY,
      rawBody: Buffer.from(JSON.stringify(GITLAB_PUSH_BODY)),
    };
    const res = mockRes();
    await providerWebhookHandler('GITLAB', req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: expect.objectContaining({ code: 'INVALID_SIGNATURE' }) }));
  });

  it('Bitbucket valid: 202, HMAC verifikasi terhadap raw bytes', async () => {
    vi.spyOn(webhookService, 'getRepositorySecretByProvider').mockResolvedValueOnce(SECRET);
    const ingest = vi.spyOn(webhookService, 'ingestWebhook').mockResolvedValueOnce({
      duplicate: false,
      delivery: { id: 'd2' } as any,
    });

    const raw = JSON.stringify(BITBUCKET_PUSH_BODY);
    const sig = `sha256=${crypto.createHmac('sha256', SECRET).update(raw).digest('hex')}`;
    const req: any = {
      headers: { 'x-event-key': 'repo:push', 'x-hub-signature': sig, 'x-request-uuid': 'bb-uuid-9' },
      body: BITBUCKET_PUSH_BODY,
      rawBody: Buffer.from(raw),
    };
    const res = mockRes();

    await providerWebhookHandler('BITBUCKET', req, res);
    expect(res.status).toHaveBeenCalledWith(202);
    const [deliveryId, , , provider] = ingest.mock.calls[0];
    expect(provider).toBe('BITBUCKET');
    expect(deliveryId).toBe('bb-uuid-9');
  });

  it('Event tak didukung → 202 IGNORED (jujur, bukan gagal)', async () => {
    vi.spyOn(webhookService, 'getRepositorySecretByProvider').mockResolvedValueOnce(SECRET);
    const ingest = vi.spyOn(webhookService, 'ingestWebhook').mockResolvedValueOnce({
      duplicate: false,
      delivery: { id: 'd3' } as any,
    });
    const req: any = {
      headers: { 'x-gitlab-event': 'Note Hook', 'x-gitlab-token': SECRET, 'x-gitlab-event-uuid': 'gl-u-10' },
      body: { project: { path_with_namespace: 'a/b' }, object_kind: 'note' },
      rawBody: Buffer.from('{}'),
    };
    const res = mockRes();
    await providerWebhookHandler('GITLAB', req, res);
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'IGNORED' }));
    const [, event, , , canonical] = ingest.mock.calls[0];
    expect(event).toBe('Note Hook');
    expect((canonical as any).ignored).toBe(true);
  });

  it('Duplicate delivery → 200', async () => {
    vi.spyOn(webhookService, 'getRepositorySecretByProvider').mockResolvedValueOnce(SECRET);
    vi.spyOn(webhookService, 'ingestWebhook').mockResolvedValueOnce({
      duplicate: true,
      delivery: { id: 'd4' } as any,
    });
    const raw = JSON.stringify(GITLAB_PUSH_BODY);
    const token = SECRET;
    const req: any = {
      headers: { 'x-gitlab-event': 'Push Hook', 'x-gitlab-token': token, 'x-gitlab-event-uuid': 'gl-uuid-dup' },
      body: GITLAB_PUSH_BODY,
      rawBody: Buffer.from(raw),
    };
    const res = mockRes();
    await providerWebhookHandler('GITLAB', req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('Regression: githubWebhookHandler lama tetap 400 tanpa header GitHub', async () => {
    const req: any = { headers: {}, body: {}, rawBody: Buffer.from('{}') };
    const res = mockRes();
    await githubWebhookHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.objectContaining({ code: 'BAD_WEBHOOK_HEADERS' }) }));
  });
});
