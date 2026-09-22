import crypto from 'crypto';
import type { GitProvider } from '../../db/schema/repositories.ts';

/**
 * Story 23.2 (CC-8) — Normalizer payload webhook multi-provider → model kanonik.
 *
 * Satu model kanonik untuk GitHub / GitLab / Bitbucket agar pipeline evidence
 * (23.3: commits, pull_requests, evidence links) tidak perlu tahu perbedaan
 * format antar provider.
 *
 * Sumber struktur payload:
 * - GitLab: https://docs.gitlab.com/ee/user/project/integrations/webhook_events.html
 *   (Push Hook, Tag Push Hook, Merge Request Hook; auth = X-Gitlab-Token)
 * - Bitbucket: https://developer.atlassian.com/cloud/bitbucket/rest/intro/#webhooks
 *   (repo:push, pullrequest:*; auth = X-Hub-Signature HMAC-SHA256)
 */

export type CanonicalGitEventType = 'push' | 'merge_request';

export interface CanonicalCommit {
  sha: string;
  message: string;
  authorName?: string;
  authorEmail?: string;
  url?: string;
  committedAt?: string;
}

export interface CanonicalMergeRequest {
  prNumber: number;
  title?: string;
  authorName?: string;
  sourceBranch?: string;
  targetBranch?: string;
  /** Dinormalisasi: OPEN | MERGED | CLOSED (raw state provider disimpan juga). */
  status: 'OPEN' | 'MERGED' | 'CLOSED';
  rawState?: string;
  url?: string;
}

export interface CanonicalGitEvent {
  provider: GitProvider;
  repoFullName: string;
  event: CanonicalGitEventType;
  /** Branch/tag target untuk push (refs/heads/x & refs/tags/x sudah dipangkas). */
  branch?: string;
  commits: CanonicalCommit[];
  mergeRequest?: CanonicalMergeRequest;
  /** Nilai header event asli provider — untuk forensik di delivery.payload. */
  rawEvent: string;
}

export type NormalizeResult =
  | { ok: true; canonical: CanonicalGitEvent; deliveryId: string; deliveryIdSynthetic: boolean }
  | { ok: false; reason: 'BAD_HEADERS' | 'UNSUPPORTED_EVENT' | 'UNPARSEABLE_PAYLOAD' };

function header(headers: Record<string, unknown>, name: string): string | undefined {
  const v = headers[name.toLowerCase()] ?? headers[name];
  return Array.isArray(v) ? v[0] : (v as string | undefined);
}

/** Delivery ID deterministik bila provider tidak mengirim UUID (GitLab lama). */
export function syntheticDeliveryId(rawBody: string | Buffer, rawEvent: string): string {
  return crypto
    .createHash('sha256')
    .update(`${rawEvent}::`)
    .update(rawBody)
    .digest('hex');
}

function stripRefs(ref: string | undefined): string | undefined {
  if (!ref) return undefined;
  return ref.replace(/^refs\/(heads|tags)\//, '');
}

function mapMrStatus(state: string | undefined, action?: string): 'OPEN' | 'MERGED' | 'CLOSED' {
  const s = (state ?? '').toLowerCase();
  const a = (action ?? '').toLowerCase();
  if (s === 'merged' || s === 'fulfilled' || a === 'merge' || a === 'merged' || a === 'fulfilled') return 'MERGED';
  if (s === 'closed' || s === 'declined' || s === 'rejected' || a === 'close' || a === 'closed' || a === 'declined' || a === 'rejected') return 'CLOSED';
  return 'OPEN';
}

/* ---------------------------------- GitLab --------------------------------- */

function normalizeGitlab(headers: Record<string, unknown>, body: any, rawBody: string | Buffer): NormalizeResult {
  const rawEvent = header(headers, 'X-Gitlab-Event');
  if (!rawEvent) return { ok: false, reason: 'BAD_HEADERS' };

  // X-Gitlab-Event-UUID ada di GitLab modern; versi lama tidak mengirim →
  // fallback deterministik (sha256 raw body) agar retry tetap ter-dedup.
  let deliveryId = header(headers, 'X-Gitlab-Event-UUID') ?? '';
  let deliveryIdSynthetic = false;
  if (!deliveryId) {
    deliveryId = syntheticDeliveryId(rawBody, rawEvent);
    deliveryIdSynthetic = true;
  }

  const repoFullName: string | undefined = body?.project?.path_with_namespace;
  if (!repoFullName || typeof repoFullName !== 'string') {
    return { ok: false, reason: 'UNPARSEABLE_PAYLOAD' };
  }

  if (rawEvent === 'Push Hook' || rawEvent === 'Tag Push Hook') {
    const commits: CanonicalCommit[] = Array.isArray(body.commits)
      ? body.commits
          .filter((c: any) => c && typeof c.id === 'string' && c.id !== '0000000000000000000000000000000000000000')
          .map((c: any) => ({
            sha: c.id,
            message: typeof c.message === 'string' ? c.message : '',
            authorName: c.author?.name,
            authorEmail: c.author?.email,
            url: c.url,
            committedAt: c.timestamp,
          }))
      : [];
    return {
      ok: true,
      deliveryId,
      deliveryIdSynthetic,
      canonical: {
        provider: 'GITLAB',
        repoFullName,
        event: 'push',
        branch: stripRefs(body.ref),
        commits,
        rawEvent,
      },
    };
  }

  if (rawEvent === 'Merge Request Hook') {
    const attrs = body.object_attributes;
    if (!attrs || (attrs.iid === undefined && attrs.iid === null)) {
      return { ok: false, reason: 'UNPARSEABLE_PAYLOAD' };
    }
    return {
      ok: true,
      deliveryId,
      deliveryIdSynthetic,
      canonical: {
        provider: 'GITLAB',
        repoFullName,
        event: 'merge_request',
        commits: [],
        mergeRequest: {
          prNumber: Number(attrs.iid),
          title: attrs.title,
          authorName: body.user?.name,
          sourceBranch: attrs.source_branch,
          targetBranch: attrs.target_branch,
          status: mapMrStatus(attrs.state, attrs.action),
          rawState: attrs.state,
          url: attrs.url,
        },
        rawEvent,
      },
    };
  }

  return { ok: false, reason: 'UNSUPPORTED_EVENT' };
}

/* --------------------------------- Bitbucket -------------------------------- */

function normalizeBitbucket(headers: Record<string, unknown>, body: any, rawBody: string | Buffer): NormalizeResult {
  const rawEvent = header(headers, 'X-Event-Key');
  if (!rawEvent) return { ok: false, reason: 'BAD_HEADERS' };

  const deliveryId = header(headers, 'X-Request-UUID') ?? syntheticDeliveryId(rawBody, rawEvent);
  const deliveryIdSynthetic = !header(headers, 'X-Request-UUID');

  const repoFullName: string | undefined = body?.repository?.full_name;
  if (!repoFullName || typeof repoFullName !== 'string') {
    return { ok: false, reason: 'UNPARSEABLE_PAYLOAD' };
  }

  if (rawEvent === 'repo:push') {
    // AC 23.2.4: commits Bitbucket NESTED di push.changes[].commits — wajib flatten.
    const changes = Array.isArray(body.push?.changes) ? body.push.changes : [];
    const commits: CanonicalCommit[] = [];
    let branch: string | undefined;
    for (const change of changes) {
      branch = branch ?? change?.new?.name;
      const changeCommits = Array.isArray(change?.commits) ? change.commits : [];
      for (const c of changeCommits) {
        if (!c || typeof c.hash !== 'string') continue;
        commits.push({
          sha: c.hash,
          message: typeof c.message === 'string' ? c.message : '',
          authorName: c.author?.raw,
          url: c.links?.html?.href,
        });
      }
    }
    return {
      ok: true,
      deliveryId,
      deliveryIdSynthetic,
      canonical: {
        provider: 'BITBUCKET',
        repoFullName,
        event: 'push',
        branch,
        commits,
        rawEvent,
      },
    };
  }

  if (rawEvent.startsWith('pullrequest:')) {
    const pr = body.pullrequest;
    if (!pr || pr.id === undefined) {
      return { ok: false, reason: 'UNPARSEABLE_PAYLOAD' };
    }
    return {
      ok: true,
      deliveryId,
      deliveryIdSynthetic,
      canonical: {
        provider: 'BITBUCKET',
        repoFullName,
        event: 'merge_request',
        commits: [],
        mergeRequest: {
          prNumber: Number(pr.id),
          title: pr.title,
          authorName: pr.author?.display_name,
          sourceBranch: pr.source?.branch?.name,
          targetBranch: pr.destination?.branch?.name,
          status: mapMrStatus(pr.state, rawEvent.replace(/^pullrequest:/, '')),
          rawState: pr.state,
          url: pr.links?.html?.href,
        },
        rawEvent,
      },
    };
  }

  return { ok: false, reason: 'UNSUPPORTED_EVENT' };
}

/* --------------------------------- Dispatcher -------------------------------- */

/**
 * Normalisasi payload mentah provider → model kanonik.
 * Event di luar yang didukung → UNSUPPORTED_EVENT (handler mengubahnya jadi
 * delivery IGNORED — jujur, bukan gagal).
 */
export function normalizeProviderEvent(
  provider: GitProvider,
  headers: Record<string, unknown>,
  body: any,
  rawBody: string | Buffer
): NormalizeResult {
  switch (provider) {
    case 'GITLAB':
      return normalizeGitlab(headers, body, rawBody);
    case 'BITBUCKET':
      return normalizeBitbucket(headers, body, rawBody);
    default:
      return { ok: false, reason: 'BAD_HEADERS' };
  }
}
