import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseGitUrl, GitSyncService } from '../server/modules/git/git-sync.service.ts';

describe('Story 24.2 (CC-9) — parseGitUrl', () => {
  it('parses GitHub HTTPS URL correctly', () => {
    const res = parseGitUrl('https://github.com/kevinadisuryanugraha/Workstation-Engineering');
    expect(res).toEqual({
      provider: 'GITHUB',
      fullName: 'kevinadisuryanugraha/Workstation-Engineering',
    });
  });

  it('parses GitHub URL with .git extension', () => {
    const res = parseGitUrl('https://github.com/owner/repo.git');
    expect(res).toEqual({
      provider: 'GITHUB',
      fullName: 'owner/repo',
    });
  });

  it('parses GitLab HTTPS URL correctly', () => {
    const res = parseGitUrl('https://gitlab.com/zamzami/workstation');
    expect(res).toEqual({
      provider: 'GITLAB',
      fullName: 'zamzami/workstation',
    });
  });

  it('parses Bitbucket HTTPS URL correctly', () => {
    const res = parseGitUrl('https://bitbucket.org/team/project-repo');
    expect(res).toEqual({
      provider: 'BITBUCKET',
      fullName: 'team/project-repo',
    });
  });

  it('parses shorthand owner/repo format as GitHub default', () => {
    const res = parseGitUrl('acme/core-api');
    expect(res).toEqual({
      provider: 'GITHUB',
      fullName: 'acme/core-api',
    });
  });

  it('returns null for invalid strings', () => {
    expect(parseGitUrl('')).toBeNull();
    expect(parseGitUrl('just-a-name')).toBeNull();
    expect(parseGitUrl('https://google.com')).toBeNull();
  });
});

describe('Story 24.2 (CC-9) — GitSyncService unit tests', () => {
  let svc: GitSyncService;

  beforeEach(() => {
    svc = new GitSyncService();
    vi.restoreAllMocks();
  });

  it('fetchGitHub transforms raw GitHub API commits to normalized format', async () => {
    const mockCommits = [
      {
        sha: 'abc1234567890abcdef1234567890abcdef1234',
        commit: {
          message: '[WRK-101] implement sync feature',
          author: { name: 'Kevin Dev', email: 'k@dev.io', date: '2026-09-22T08:00:00Z' },
        },
        html_url: 'https://github.com/owner/repo/commit/abc1234',
      },
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/commits')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockCommits),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        });
      })
    );

    const { commits, pullRequests } = await svc.fetchGitHub('owner/repo');
    expect(commits.length).toBe(1);
    expect(commits[0].sha).toBe('abc1234567890abcdef1234567890abcdef1234');
    expect(commits[0].message).toBe('[WRK-101] implement sync feature');
    expect(commits[0].authorName).toBe('Kevin Dev');
    expect(pullRequests).toEqual([]);
  });

  it('fetchGitLab transforms raw GitLab API commits to normalized format', async () => {
    const mockGlCommits = [
      {
        id: 'gl1234567890abcdef1234567890abcdef123456',
        message: '[TCK-55] resolve issue from gitlab',
        author_name: 'GitLab Author',
        author_email: 'gl@zamzami.or.id',
        committed_date: '2026-09-22T08:30:00Z',
        web_url: 'https://gitlab.com/zamzami/repo/-/commit/gl1234',
      },
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/repository/commits')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockGlCommits),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        });
      })
    );

    const { commits } = await svc.fetchGitLab('zamzami/repo');
    expect(commits.length).toBe(1);
    expect(commits[0].sha).toBe('gl1234567890abcdef1234567890abcdef123456');
    expect(commits[0].message).toBe('[TCK-55] resolve issue from gitlab');
    expect(commits[0].authorName).toBe('GitLab Author');
  });
});
