import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/lib/apiClient.ts', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {},
}));

import { mapGitRepositoryDto } from '../src/lib/contractMappers.ts';
import { mapCommitDto, mapPullRequestDto } from '../src/hooks/api/useGitEntities.ts';
import { hasPermission } from '../src/lib/rbac.ts';
import type { GitRepositoryDto, GitProvider } from '../src/types.ts';

/**
 * Story 23.4 (CC-8, Master PRD §30 Fase V2) — Git Provider UI Wiring Unit Tests.
 *
 * 1. Mapper DTO→UI repository (jujur, secret tidak pernah ada di tipe).
 * 2. Mapper commit/PR dengan field provider (GitHub/GitLab/Bitbucket).
 * 3. Gate permission registrasi repo (PERM_EVIDENCE_ATTACH).
 */

describe('Story 23.4 — mapGitRepositoryDto (contract mapper)', () => {
  it('memetakan baris DB/API valid menjadi GitRepositoryDto', () => {
    const raw = {
      id: 'repo-1',
      projectId: 'proj-1',
      fullName: 'zamzami/workstation',
      provider: 'GITLAB',
      defaultBranch: 'main',
      hasSecret: true,
      createdAt: '2026-09-22T00:00:00.000Z',
    };

    const mapped = mapGitRepositoryDto(raw);
    expect(mapped).toEqual({
      id: 'repo-1',
      projectId: 'proj-1',
      fullName: 'zamzami/workstation',
      provider: 'GITLAB',
      defaultBranch: 'main',
      hasSecret: true,
      createdAt: '2026-09-22T00:00:00.000Z',
    });
  });

  it.each(['GITHUB', 'GITLAB', 'BITBUCKET'] as const)('menerima provider %s', (provider) => {
    const raw = { id: 'r1', fullName: 'a/b', provider };
    expect(mapGitRepositoryDto(raw)?.provider).toBe(provider);
  });

  it('provider tak dikenal dinormalisasi ke GITHUB (fallback jujur)', () => {
    const raw = { id: 'r1', fullName: 'a/b', provider: 'UNKNOWN' };
    expect(mapGitRepositoryDto(raw)?.provider).toBe('GITHUB');
  });

  it('input tidak valid / tanpa id / tanpa fullName mengembalikan null', () => {
    expect(mapGitRepositoryDto(null)).toBeNull();
    expect(mapGitRepositoryDto({})).toBeNull();
    expect(mapGitRepositoryDto({ id: 'r1' })).toBeNull();
    expect(mapGitRepositoryDto({ fullName: 'a/b' })).toBeNull();
  });
});

describe('Story 23.4 — mapCommitDto & mapPullRequestDto dengan provider', () => {
  it('mapCommitDto memetakan provider bila ada', () => {
    const commitWithProvider = mapCommitDto({
      sha: 'a1b2c3d4e5f6',
      message: '[WRK-105] fix gitlab webhook',
      authorName: 'Budi',
      authorEmail: null,
      branch: 'main',
      url: null,
      committedAt: '2026-09-22T01:00:00Z',
      projectId: 'p1',
      provider: 'GITLAB',
    });
    expect(commitWithProvider.provider).toBe('GITLAB');
    expect(commitWithProvider.linkedItemCodes).toContain('WRK-105');

    const commitWithoutProvider = mapCommitDto({
      sha: 'f1e2d3c4b5a6',
      message: 'legacy commit',
      authorName: 'Anon',
      authorEmail: null,
      branch: 'main',
      url: null,
      committedAt: '2026-09-22T01:00:00Z',
      projectId: 'p1',
    });
    expect(commitWithoutProvider.provider).toBeUndefined();
  });

  it('mapPullRequestDto memetakan provider bila ada', () => {
    const prWithProvider = mapPullRequestDto({
      id: 'pr-1',
      prNumber: 42,
      title: '[TCK-900] Bitbucket incident fix',
      authorName: 'Sari',
      sourceBranch: 'bugfix/tck-900',
      targetBranch: 'main',
      status: 'OPEN',
      url: null,
      mergedAt: null,
      projectId: 'p1',
      provider: 'BITBUCKET',
    });
    expect(prWithProvider.provider).toBe('BITBUCKET');
    expect(prWithProvider.linkedItemCode).toBe('TCK-900');

    const prLegacy = mapPullRequestDto({
      id: 'pr-2',
      prNumber: 10,
      title: 'legacy pr',
      authorName: 'Dev',
      sourceBranch: 'feat/x',
      targetBranch: 'main',
      status: 'OPEN',
      url: null,
      mergedAt: null,
      projectId: null,
    });
    expect(prLegacy.provider).toBeUndefined();
  });
});

describe('Story 23.4 — RBAC gate PERM_EVIDENCE_ATTACH untuk registrasi repo', () => {
  it('Super Admin, Org Admin, Tech Lead, Project Manager, Developer, QA diizinkan registrasi repo / evidence', () => {
    expect(hasPermission('Super Admin', 'PERM_EVIDENCE_ATTACH')).toBe(true);
    expect(hasPermission('Organization Admin', 'PERM_EVIDENCE_ATTACH')).toBe(true);
    expect(hasPermission('Tech Lead', 'PERM_EVIDENCE_ATTACH')).toBe(true);
    expect(hasPermission('Project Manager', 'PERM_EVIDENCE_ATTACH')).toBe(true);
    expect(hasPermission('Developer', 'PERM_EVIDENCE_ATTACH')).toBe(true);
    expect(hasPermission('QA', 'PERM_EVIDENCE_ATTACH')).toBe(true);
  });

  it('Manager, Support, Viewer TIDAK diizinkan registrasi repo / evidence', () => {
    expect(hasPermission('Manager', 'PERM_EVIDENCE_ATTACH')).toBe(false);
    expect(hasPermission('Support', 'PERM_EVIDENCE_ATTACH')).toBe(false);
    expect(hasPermission('Viewer', 'PERM_EVIDENCE_ATTACH')).toBe(false);
  });
});
