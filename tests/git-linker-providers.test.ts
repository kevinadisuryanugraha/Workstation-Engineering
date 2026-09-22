import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';
import { eq, sql } from 'drizzle-orm';
import { parseEntityKeys } from '../server/modules/git/entity-parser.ts';
import { gitLinkerService } from '../server/modules/git/git-linker.service.ts';
import { webhookService } from '../server/modules/git/webhook.service.ts';
import { gitEntityService } from '../server/modules/git/git-entity.service.ts';
import { db } from '../server/db/client.ts';
import { projects } from '../server/db/schema/projects.ts';
import { repositories } from '../server/db/schema/repositories.ts';
import { workItems } from '../server/db/schema/work_items.ts';
import { tickets } from '../server/db/schema/tickets.ts';
import { commits } from '../server/db/schema/commits.ts';
import { pullRequests } from '../server/db/schema/pull_requests.ts';
import { evidenceLinks } from '../server/db/schema/evidence_links.ts';
import { webhookDeliveries } from '../server/db/schema/webhook_deliveries.ts';
import type { CanonicalGitEvent } from '../server/modules/git/webhook.providers.ts';

/**
 * Story 23.3 (CC-8) — Pemrosesan Kanonik Multi-Provider & Evidence Links.
 *
 * 1. Pure unit: regex parseEntityKeys pada message & MR multi-provider.
 * 2. Integration (DB dev): pipeline end-to-end webhook delivery → commits/PRs →
 *    evidence links dua arah (WorkItem & Ticket), REPO_NOT_REGISTERED → FAILED jujur,
 *    dan verifikasi field `provider` pada read API (join repositories).
 */

dotenv.config();
const HAS_DB = Boolean(process.env.DATABASE_URL);
const describeDb = HAS_DB ? describe : describe.skip;

describe('Story 23.3 — parseEntityKeys pada konteks multi-provider', () => {
  it('ekstrak kode dari judul MR GitLab & Bitbucket', () => {
    expect(parseEntityKeys('[WRK-105] Resolve GitLab webhook auth')).toEqual(['WRK-105']);
    expect(parseEntityKeys('Merge branch: feature/TCK-900 into main')).toEqual(['TCK-900']);
    expect(parseEntityKeys('CORE-50 & WRK-2 duplikasi [CORE-50]')).toEqual(['CORE-50', 'WRK-2']);
  });

  it('string kosong / tanpa kode → array kosong', () => {
    expect(parseEntityKeys('')).toEqual([]);
    expect(parseEntityKeys('chore: routine update')).toEqual([]);
  });
});

describeDb('Story 23.3 — Pipeline Kanonik & Evidence Integration (DB dev)', () => {
  const RUN = `t23-${Date.now()}`;
  let projectId: string;
  let gitlabRepoId: string;
  let bitbucketRepoId: string;
  let workItemId: string;
  let ticketId: string;

  const gitlabFullName = `zamzami/gl-${RUN}`;
  const bitbucketFullName = `zamzami/bb-${RUN}`;
  const workItemKey = `WRK-${RUN.slice(-4)}`;
  const ticketKey = `TCK-${RUN.slice(-4)}`;

  beforeAll(async () => {
    // 1. Project
    const [proj] = await db
      .insert(projects)
      .values({ key: `P23${RUN.slice(-4)}`, name: `Project 23.3 Test ${RUN}`, status: 'ACTIVE' })
      .returning();
    projectId = proj.id;

    // 2. Repositories (GITLAB & BITBUCKET)
    const [glRepo] = await db
      .insert(repositories)
      .values({
        projectId,
        fullName: gitlabFullName,
        provider: 'GITLAB',
        defaultBranch: 'main',
        webhookSecret: 'secret-gl',
      })
      .returning();
    gitlabRepoId = glRepo.id;

    const [bbRepo] = await db
      .insert(repositories)
      .values({
        projectId,
        fullName: bitbucketFullName,
        provider: 'BITBUCKET',
        defaultBranch: 'main',
        webhookSecret: 'secret-bb',
      })
      .returning();
    bitbucketRepoId = bbRepo.id;

    // 3. Work Item & Ticket target evidence
    const [wi] = await db
      .insert(workItems)
      .values({
        projectId,
        key: workItemKey,
        title: `Work Item Target Evidence ${RUN}`,
        type: 'FEATURE',
        status: 'IN_PROGRESS',
      })
      .returning();
    workItemId = wi.id;

    const [tck] = await db
      .insert(tickets)
      .values({
        projectId,
        key: ticketKey,
        title: `Ticket Target Evidence ${RUN}`,
        severity: 'SEV2',
        status: 'OPEN',
      })
      .returning();
    ticketId = tck.id;
  });

  afterAll(async () => {
    // Bersih-bersih dari anak ke induk
    await db.delete(evidenceLinks).where(eq(evidenceLinks.workItemId, workItemId)).catch(() => undefined);
    await db.delete(evidenceLinks).where(eq(evidenceLinks.ticketId, ticketId)).catch(() => undefined);
    await db.delete(commits).where(eq(commits.repoId, gitlabRepoId)).catch(() => undefined);
    await db.delete(pullRequests).where(eq(pullRequests.repoId, bitbucketRepoId)).catch(() => undefined);
    await db.delete(webhookDeliveries).where(sql`delivery_id LIKE ${`%${RUN}%`}`).catch(() => undefined);
    await db.delete(workItems).where(eq(workItems.id, workItemId)).catch(() => undefined);
    await db.delete(tickets).where(eq(tickets.id, ticketId)).catch(() => undefined);
    await db.delete(repositories).where(eq(repositories.projectId, projectId)).catch(() => undefined);
    await db.delete(projects).where(eq(projects.id, projectId)).catch(() => undefined);
  });

  it('AC 23.3.1–23.3.5: GitLab Push kanonik diproses → commit tersimpan & evidence link terbuat', async () => {
    const deliveryId = `del-gl-${RUN}`;
    const commitSha = `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8${RUN.slice(-4)}`;

    const canonical: CanonicalGitEvent = {
      provider: 'GITLAB',
      repoFullName: gitlabFullName,
      event: 'push',
      branch: 'main',
      rawEvent: 'Push Hook',
      commits: [
        {
          sha: commitSha,
          message: `feat: [${workItemKey}] menghubungkan evidence GitLab`,
          authorName: 'Developer GitLab',
          authorEmail: 'dev@gitlab.zamzami.or.id',
          url: `https://gitlab.com/${gitlabFullName}/-/commit/${commitSha}`,
          committedAt: new Date().toISOString(),
        },
      ],
    };

    // Ingest webhook delivery (tahap 1)
    await webhookService.ingestWebhook(deliveryId, 'push', {}, 'GITLAB', canonical);

    // Proses delivery (tahap 2)
    const result = await webhookService.processDelivery(deliveryId);
    expect(result.status).toBe('PROCESSED');
    expect(result.commitCount).toBe(1);
    expect(result.linkedKeys).toContain(workItemKey);

    // Verifikasi commit tersimpan
    const commitRows = await db.select().from(commits).where(eq(commits.sha, commitSha));
    expect(commitRows.length).toBe(1);
    expect(commitRows[0].repoId).toBe(gitlabRepoId);

    // Verifikasi evidence link terbentuk
    const links = await db
      .select()
      .from(evidenceLinks)
      .where(eq(evidenceLinks.commitSha, commitSha));
    expect(links.length).toBe(1);
    expect(links[0].workItemId).toBe(workItemId);

    // Verifikasi status delivery diperbarui menjadi PROCESSED
    const delRows = await db.select().from(webhookDeliveries).where(eq(webhookDeliveries.deliveryId, deliveryId));
    expect(delRows[0].status).toBe('PROCESSED');
    expect(delRows[0].error).toBeNull();
  });

  it('AC 23.3.1–23.3.5: Bitbucket PR kanonik diproses → pull_requests tersimpan & evidence link terbuat', async () => {
    const deliveryId = `del-bb-${RUN}`;
    const prNumber = 90210;

    const canonical: CanonicalGitEvent = {
      provider: 'BITBUCKET',
      repoFullName: bitbucketFullName,
      event: 'merge_request',
      rawEvent: 'pullrequest:created',
      commits: [],
      mergeRequest: {
        prNumber,
        title: `[${ticketKey}] Penanganan isu via Bitbucket PR`,
        authorName: 'Bitbucket Dev',
        sourceBranch: 'bugfix/bb-1',
        targetBranch: 'main',
        status: 'OPEN',
        url: `https://bitbucket.org/${bitbucketFullName}/pull-requests/${prNumber}`,
      },
    };

    await webhookService.ingestWebhook(deliveryId, 'merge_request', {}, 'BITBUCKET', canonical);

    const result = await webhookService.processDelivery(deliveryId);
    expect(result.status).toBe('PROCESSED');
    expect(result.prCount).toBe(1);
    expect(result.linkedKeys).toContain(ticketKey);

    // Verifikasi pull request tersimpan
    const prRows = await db
      .select()
      .from(pullRequests)
      .where(eq(pullRequests.repoId, bitbucketRepoId));
    expect(prRows.length).toBeGreaterThanOrEqual(1);
    const foundPr = prRows.find((p) => p.prNumber === prNumber);
    expect(foundPr).toBeDefined();

    // Verifikasi evidence link untuk ticket
    const links = await db
      .select()
      .from(evidenceLinks)
      .where(eq(evidenceLinks.ticketId, ticketId));
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it('AC 23.3.2: Repo belum terdaftar → delivery FAILED dengan REPO_NOT_REGISTERED', async () => {
    const deliveryId = `del-unregistered-${RUN}`;
    const canonical: CanonicalGitEvent = {
      provider: 'GITLAB',
      repoFullName: 'tidak-ada/repo-ini-palsu',
      event: 'push',
      rawEvent: 'Push Hook',
      commits: [{ sha: `fake-sha-${RUN}`, message: 'halo' }],
    };

    await webhookService.ingestWebhook(deliveryId, 'push', {}, 'GITLAB', canonical);
    const result = await webhookService.processDelivery(deliveryId);

    expect(result.status).toBe('FAILED');
    expect(result.error).toBe('REPO_NOT_REGISTERED');

    const del = await db.select().from(webhookDeliveries).where(eq(webhookDeliveries.deliveryId, deliveryId));
    expect(del[0].status).toBe('FAILED');
    expect(del[0].error).toBe('REPO_NOT_REGISTERED');
  });

  it('AC 23.3.6: Read API menyertakan kolom provider hasil join repositories', async () => {
    const commitRows = await gitEntityService.listCommits({ projectId });
    expect(commitRows.length).toBeGreaterThan(0);
    const glCommit = commitRows.find((c) => c.message.includes(workItemKey));
    expect(glCommit).toBeDefined();
    expect(glCommit?.provider).toBe('GITLAB');

    const prRows = await gitEntityService.listPullRequests({ projectId });
    expect(prRows.length).toBeGreaterThan(0);
    const bbPr = prRows.find((p) => p.title.includes(ticketKey));
    expect(bbPr).toBeDefined();
    expect(bbPr?.provider).toBe('BITBUCKET');
  });
});
