import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/apiClient.ts';
import { GitRepositoryDto, GitProvider } from '../../types.ts';
import { mapGitRepositoryDto } from '../../lib/contractMappers.ts';

/**
 * Story 23.4 (CC-8, Master PRD §30 Fase V2) — Git Repositories Hook.
 *
 * Query list repositori terdaftar per-project + mutation registrasi baru.
 * Registrasi sukses menginvalidasi cache query git.
 */

export interface RegisterRepositoryInput {
  projectId: string;
  fullName: string;
  provider: GitProvider;
  defaultBranch?: string;
}

export function useGitRepositories(
  projectId: string | undefined,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ['gitRepositories', projectId],
    queryFn: async () => {
      const url = projectId
        ? `/api/v1/git/repositories?projectId=${projectId}`
        : '/api/v1/git/repositories';
      const raw = await apiRequest<unknown[]>(url);
      if (!Array.isArray(raw)) return [];
      return raw.map(mapGitRepositoryDto).filter((r): r is GitRepositoryDto => r !== null);
    },
    enabled: options.enabled ?? true,
    staleTime: 30_000,
  });
}

export function useRegisterRepository() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterRepositoryInput) =>
      apiRequest<GitRepositoryDto>('/api/v1/git/repositories', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gitRepositories'] });
      queryClient.invalidateQueries({ queryKey: ['gitCommits', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['gitPullRequests', variables.projectId] });
    },
  });
}
