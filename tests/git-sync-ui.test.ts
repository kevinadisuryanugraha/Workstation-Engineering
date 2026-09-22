import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/lib/apiClient.ts', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {},
}));

import { parseGitUrl } from '../server/modules/git/git-sync.service.ts';
import { useSyncRepositoryUrl, useSyncRepositoryById } from '../src/hooks/api/useGitRepositories.ts';

describe('Story 24.3 (CC-9) — Git Sync UI Hooks & Helpers', () => {
  it('useSyncRepositoryUrl hook mengekspor mutation function', () => {
    expect(typeof useSyncRepositoryUrl).toBe('function');
  });

  it('useSyncRepositoryById hook mengekspor mutation function', () => {
    expect(typeof useSyncRepositoryById).toBe('function');
  });

  it('parseGitUrl mendeteksi URL GitHub lengkap', () => {
    const parsed = parseGitUrl('https://github.com/kevinadisuryanugraha/Workstation-Engineering');
    expect(parsed?.provider).toBe('GITHUB');
    expect(parsed?.fullName).toBe('kevinadisuryanugraha/Workstation-Engineering');
  });

  it('parseGitUrl mendeteksi URL GitLab lengkap', () => {
    const parsed = parseGitUrl('https://gitlab.com/zamzami/workstation-core');
    expect(parsed?.provider).toBe('GITLAB');
    expect(parsed?.fullName).toBe('zamzami/workstation-core');
  });
});
