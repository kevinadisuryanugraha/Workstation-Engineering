import { desc, eq } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { commits } from '../../db/schema/commits.ts';
import { pullRequests } from '../../db/schema/pull_requests.ts';
import { repositories } from '../../db/schema/repositories.ts';

/**
 * Git entities read service (Story 18.1 — CC-5).
 *
 * Data commit/PR terkumpul via webhook ingest (Story 5.1/5.2) ke tabel
 * `commits` & `pull_requests`. Service ini menyediakan jalur BACA saja —
 * murni additive, tidak menyentuh jalur ingest (HMAC/idempotensi).
 */

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 200;

export function parseLimit(raw: unknown): number {
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

export const gitEntityService = {
  /** Commit terbaru (join repositories untuk projectId nyata). */
  async listCommits(opts: { projectId?: string; limit?: number } = {}) {
    const limit = opts.limit ?? DEFAULT_LIMIT;
    return db
      .select({
        sha: commits.sha,
        message: commits.message,
        authorName: commits.authorName,
        authorEmail: commits.authorEmail,
        branch: commits.branch,
        url: commits.url,
        committedAt: commits.committedAt,
        projectId: repositories.projectId,
        provider: repositories.provider,
      })
      .from(commits)
      .leftJoin(repositories, eq(commits.repoId, repositories.id))
      .where(opts.projectId ? eq(repositories.projectId, opts.projectId) : undefined)
      .orderBy(desc(commits.committedAt))
      .limit(limit);
  },

  /** Pull request terbaru (join repositories untuk projectId nyata). */
  async listPullRequests(opts: { projectId?: string; limit?: number } = {}) {
    const limit = opts.limit ?? DEFAULT_LIMIT;
    return db
      .select({
        id: pullRequests.id,
        prNumber: pullRequests.prNumber,
        title: pullRequests.title,
        authorName: pullRequests.authorName,
        sourceBranch: pullRequests.sourceBranch,
        targetBranch: pullRequests.targetBranch,
        status: pullRequests.status,
        url: pullRequests.url,
        mergedAt: pullRequests.mergedAt,
        projectId: repositories.projectId,
        provider: repositories.provider,
      })
      .from(pullRequests)
      .leftJoin(repositories, eq(pullRequests.repoId, repositories.id))
      .where(opts.projectId ? eq(repositories.projectId, opts.projectId) : undefined)
      .orderBy(desc(pullRequests.createdAt))
      .limit(limit);
  },
};
