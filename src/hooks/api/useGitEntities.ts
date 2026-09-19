import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/apiClient.ts';
import { Commit, PullRequest } from '../../types.ts';

/**
 * Story 18.1 (CC-5) — Git entities client hooks + DTO→UI mappers.
 *
 * Sumber data nyata: GET /api/v1/git/commits & /api/v1/git/pull-requests
 * (read-only di atas hasil ingest webhook). Mapper = pure function agar
 * testable di node tanpa DOM; field tanpa padanan API diisi placeholder
 * JUJUR — bukan nilai fabricated.
 */

export interface GitCommitDto {
  sha: string;
  message: string;
  authorName: string;
  authorEmail: string | null;
  branch: string | null;
  url: string | null;
  committedAt: string;
  projectId: string | null;
}

export interface GitPullRequestDto {
  id: string;
  prNumber: number;
  title: string;
  authorName: string;
  sourceBranch: string;
  targetBranch: string;
  status: string;
  url: string | null;
  mergedAt: string | null;
  projectId: string | null;
}

/** Ekstrak kode item (mis. WRK-101) dari teks nyata — cermin auto-linker 5.2. */
export function extractItemCodes(text: string | null | undefined): string[] {
  if (!text) return [];
  const matches = text.match(/\b[A-Z]{2,10}-\d{1,6}\b/g) ?? [];
  return [...new Set(matches)];
}

export function mapCommitDto(dto: GitCommitDto): Commit {
  return {
    sha: dto.sha,
    projectId: dto.projectId ?? undefined,
    message: dto.message,
    author: dto.authorName,
    branch: dto.branch ?? '—',
    timestamp: dto.committedAt,
    // Statistik diff tidak dilakukan ingest webhook — 0 = "tidak tercatat"
    // (placeholder jujur; JANGAN diklaim sebagai angka nyata di UI).
    filesChanged: 0,
    additions: 0,
    deletions: 0,
    linkedItemCodes: extractItemCodes(`${dto.message} ${dto.branch ?? ''}`),
  };
}

export function mapPullRequestDto(dto: GitPullRequestDto): PullRequest {
  const codes = extractItemCodes(`${dto.title} ${dto.sourceBranch}`);
  return {
    id: dto.prNumber,
    projectId: dto.projectId ?? undefined,
    title: dto.title,
    sourceBranch: dto.sourceBranch,
    targetBranch: dto.targetBranch,
    author: dto.authorName,
    status: (dto.status === 'MERGED' || dto.status === 'CLOSED' ? dto.status : 'OPEN'),
    // Reviewers & CI belum di-ingest — placeholder jujur (netral, bukan hasil karangan).
    reviewers: [],
    ciStatus: 'RUNNING',
    commitsCount: 0,
    linkedItemCode: codes[0] ?? '',
    mergedAt: dto.mergedAt ?? undefined,
  };
}

export function useGitCommits(
  projectId: string | undefined,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ['gitCommits', projectId],
    queryFn: () =>
      apiRequest<GitCommitDto[]>(
        projectId ? `/api/v1/git/commits?projectId=${projectId}` : '/api/v1/git/commits'
      ),
    enabled: options.enabled ?? true,
    staleTime: 30_000,
  });
}

export function useGitPullRequests(
  projectId: string | undefined,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ['gitPullRequests', projectId],
    queryFn: () =>
      apiRequest<GitPullRequestDto[]>(
        projectId ? `/api/v1/git/pull-requests?projectId=${projectId}` : '/api/v1/git/pull-requests'
      ),
    enabled: options.enabled ?? true,
    staleTime: 30_000,
  });
}
