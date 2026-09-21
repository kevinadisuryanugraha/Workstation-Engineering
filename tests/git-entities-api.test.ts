import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import dotenv from 'dotenv';

/**
 * Story 18.1 — Git entities read API (CC-5).
 *
 * 1. Service-level integration test di atas DB dev nyata (pola
 *    tests/workflow-e2e.test.ts): fixtures di-insert lalu dibersihkan.
 * 2. Mapper DTO→UI (pure) — placeholder jujur untuk field tanpa padanan.
 *
 * Catatan: vi.mock apiClient memutus rantai import auth.ts (localStorage)
 * sehingga modul hook bisa di-import di lingkungan node.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'workstation-test-secret-min-32-chars-long-security-token';

// CI tanpa Postgres → suite integrasi DB di-skip jujur; pure unit tetap jalan.
dotenv.config();
const HAS_DB = Boolean(process.env.DATABASE_URL);
const describeDb = HAS_DB ? describe : describe.skip;

vi.mock('../src/lib/apiClient.ts', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {},
}));

import { gitEntityService, parseLimit, DEFAULT_LIMIT, MAX_LIMIT } from '../server/modules/git/git-entity.service.ts';
import { mapCommitDto, mapPullRequestDto, extractItemCodes } from '../src/hooks/api/useGitEntities.ts';
import { db } from '../server/db/client.ts';
import { projects } from '../server/db/schema/projects.ts';
import { repositories } from '../server/db/schema/repositories.ts';
import { commits } from '../server/db/schema/commits.ts';
import { pullRequests } from '../server/db/schema/pull_requests.ts';
import { eq } from 'drizzle-orm';

const RUN = `t18-${Date.now()}`;

describe('Story 18.1 — parseLimit', () => {
  it('default & clamp sesuai kontrak', () => {
    expect(parseLimit(undefined)).toBe(DEFAULT_LIMIT);
    expect(parseLimit('')).toBe(DEFAULT_LIMIT);
    expect(parseLimit('bukan-angka')).toBe(DEFAULT_LIMIT);
    expect(parseLimit('10')).toBe(10);
    expect(parseLimit('99999')).toBe(MAX_LIMIT);
    expect(parseLimit('-5')).toBe(DEFAULT_LIMIT);
  });
});

describe('Story 18.1 — mapper DTO→UI (placeholder jujur)', () => {
  it('mapCommitDto memetakan field nyata & mengekstrak kode item dari pesan', () => {
    const ui = mapCommitDto({
      sha: 'a'.repeat(40),
      message: '[WRK-101] Fix login bug',
      authorName: 'Kevin',
      authorEmail: 'k@x.io',
      branch: 'feature/wrk-101-login',
      url: 'https://github.com/o/r/commit/aaa',
      committedAt: '2026-09-19T01:00:00Z',
      projectId: 'proj-1',
    });
    expect(ui.sha).toBe('a'.repeat(40));
    expect(ui.author).toBe('Kevin');
    expect(ui.projectId).toBe('proj-1');
    expect(ui.linkedItemCodes).toContain('WRK-101');
    // Statistik diff tidak di-ingest — HARUS 0 (bukan angka karangan).
    expect(ui.filesChanged).toBe(0);
    expect(ui.additions).toBe(0);
    expect(ui.deletions).toBe(0);
  });

  it('mapPullRequestDto memetakan status & placeholder netral', () => {
    const ui = mapPullRequestDto({
      id: 'uuid-1',
      prNumber: 42,
      title: '[WRK-102] Add audit page',
      authorName: 'Rina',
      sourceBranch: 'feat/wrk-102',
      targetBranch: 'main',
      status: 'MERGED',
      url: null,
      mergedAt: '2026-09-19T02:00:00Z',
      projectId: null,
    });
    expect(ui.id).toBe(42);
    expect(ui.status).toBe('MERGED');
    expect(ui.linkedItemCode).toBe('WRK-102');
    expect(ui.reviewers).toEqual([]); // belum di-ingest — jujur
    expect(ui.ciStatus).toBe('RUNNING'); // netral, bukan klaim PASSED palsu
  });

  it('extractItemCodes unik & menolak teks kosong', () => {
    expect(extractItemCodes('fix ABC-1 dan ABC-1 lagi WRK-9')).toEqual(['ABC-1', 'WRK-9']);
    expect(extractItemCodes(null)).toEqual([]);
  });
});

describeDb('Story 18.1 — gitEntityService (integrasi DB dev)', () => {
  let projectId: string;
  let repoId: string;

  beforeAll(async () => {
    // Fixtures minimal: project → repository → 2 commit + 1 PR.
    const [proj] = await db
      .insert(projects)
      .values({ key: `T18${RUN.slice(-6)}`, name: `Story 18.1 Test ${RUN}`, status: 'ACTIVE' })
      .returning();
    projectId = proj.id;

    const [repo] = await db
      .insert(repositories)
      .values({ projectId, fullName: `org/t18-${RUN}`, webhookSecret: 'secret-t18' })
      .returning();
    repoId = repo.id;

    await db.insert(commits).values([
      { repoId, sha: `sha-1-${RUN}`, message: `[T18-1] oldest`, authorName: 'Dev A', branch: 'main', committedAt: new Date('2026-09-19T01:00:00Z') },
      { repoId, sha: `sha-2-${RUN}`, message: `[T18-1] newest`, authorName: 'Dev B', branch: 'main', committedAt: new Date('2026-09-19T03:00:00Z') },
    ]);

    await db.insert(pullRequests).values({
      repoId,
      prNumber: 4242,
      title: `[T18-1] Test PR`,
      authorName: 'Dev A',
      sourceBranch: 'feat/t18',
      targetBranch: 'main',
      status: 'OPEN',
    });
  });

  afterAll(async () => {
    // Bersih-bersih fixture (urutan anak → induk).
    await db.delete(commits).where(eq(commits.repoId, repoId));
    await db.delete(pullRequests).where(eq(pullRequests.repoId, repoId));
    await db.delete(repositories).where(eq(repositories.id, repoId));
    await db.delete(projects).where(eq(projects.id, projectId));
  });

  it('listCommits urut terbaru dulu & join projectId nyata', async () => {
    const rows = await gitEntityService.listCommits({ projectId });
    expect(rows.length).toBe(2);
    expect(rows[0].message).toContain('newest');
    expect(rows[0].projectId).toBe(projectId);
  });

  it('listPullRequests mengembalikan PR fixture dengan projectId', async () => {
    const rows = await gitEntityService.listPullRequests({ projectId });
    expect(rows.length).toBe(1);
    expect(rows[0].prNumber).toBe(4242);
    expect(rows[0].projectId).toBe(projectId);
  });

  it('filter projectId memisahkan data fixture dari data lain', async () => {
    const rows = await gitEntityService.listCommits({ projectId, limit: 200 });
    expect(rows.every((r) => r.projectId === projectId)).toBe(true);
  });
});
