import { eq, and } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { repositories, GitProvider } from '../../db/schema/repositories.ts';
import { gitLinkerService } from './git-linker.service.ts';
import { auditService } from '../audit/audit.service.ts';

/**
 * Story 24.2 (CC-9) — Direct Repository Sync Engine.
 *
 * Mengunduh commit dan PR/MR secara on-demand langsung dari REST API
 * GitHub / GitLab, menyimpannya ke PostgreSQL, dan menautkan evidence kode.
 */

export interface ParsedGitUrl {
  provider: GitProvider;
  fullName: string;
}

export function parseGitUrl(input: string): ParsedGitUrl | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim().replace(/\.git\/?$/, '');

  // Format URL: https://github.com/owner/repo
  const ghMatch = trimmed.match(/github\.com\/([^\/]+)\/([^\/]+)/i);
  if (ghMatch) {
    return { provider: 'GITHUB', fullName: `${ghMatch[1]}/${ghMatch[2]}` };
  }

  const glMatch = trimmed.match(/gitlab\.com\/([^\/]+)\/([^\/]+)/i);
  if (glMatch) {
    return { provider: 'GITLAB', fullName: `${glMatch[1]}/${glMatch[2]}` };
  }

  const bbMatch = trimmed.match(/bitbucket\.org\/([^\/]+)\/([^\/]+)/i);
  if (bbMatch) {
    return { provider: 'BITBUCKET', fullName: `${bbMatch[1]}/${bbMatch[2]}` };
  }

  // Format shorthand: owner/repo
  const shortMatch = trimmed.match(/^([\w.-]+)\/([\w.-]+)$/);
  if (shortMatch) {
    return { provider: 'GITHUB', fullName: `${shortMatch[1]}/${shortMatch[2]}` };
  }

  return null;
}

export interface SyncOptions {
  token?: string;
  actorId?: string;
  actorName?: string;
  correlationId?: string;
}

export interface SyncResult {
  repositoryId: string;
  fullName: string;
  provider: GitProvider;
  syncedCommits: number;
  syncedPullRequests: number;
  linkedKeys: string[];
}

export class GitSyncService {
  /**
   * Fetch commit & PR dari REST API GitHub.
   */
  async fetchGitHub(fullName: string, token?: string) {
    const headers: Record<string, string> = {
      'User-Agent': 'WORKSTATION-Engine/1.0',
      Accept: 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const commitsRes = await fetch(
      `https://api.github.com/repos/${fullName}/commits?per_page=30`,
      { headers }
    );

    if (!commitsRes.ok) {
      const errBody = await commitsRes.text().catch(() => '');
      throw new Error(`GitHub API error ${commitsRes.status}: ${errBody || commitsRes.statusText}`);
    }

    const commitsData = (await commitsRes.json()) as any[];

    // Fetch PRs
    let prsData: any[] = [];
    try {
      const prRes = await fetch(
        `https://api.github.com/repos/${fullName}/pulls?state=all&per_page=20`,
        { headers }
      );
      if (prRes.ok) {
        prsData = (await prRes.json()) as any[];
      }
    } catch {
      // PRs fetch failure non-fatal
    }

    const commits = Array.isArray(commitsData)
      ? commitsData.map((c) => ({
          sha: c.sha,
          message: c.commit?.message || '',
          authorName: c.commit?.author?.name || c.author?.login || 'Unknown',
          authorEmail: c.commit?.author?.email || null,
          branch: 'main',
          url: c.html_url || null,
          committedAt: c.commit?.author?.date ? new Date(c.commit.author.date) : new Date(),
        }))
      : [];

    const pullRequests = Array.isArray(prsData)
      ? prsData.map((p) => ({
          prNumber: Number(p.number),
          title: p.title || '',
          authorName: p.user?.login || 'Unknown',
          sourceBranch: p.head?.ref || 'feature',
          targetBranch: p.base?.ref || 'main',
          status: p.merged_at ? 'MERGED' : p.state === 'closed' ? 'CLOSED' : 'OPEN',
          url: p.html_url || null,
          mergedAt: p.merged_at ? new Date(p.merged_at) : null,
        }))
      : [];

    return { commits, pullRequests };
  }

  /**
   * Fetch commit & MR dari REST API GitLab.
   */
  async fetchGitLab(fullName: string, token?: string) {
    const headers: Record<string, string> = {
      'User-Agent': 'WORKSTATION-Engine/1.0',
    };
    if (token) {
      headers['PRIVATE-TOKEN'] = token;
    }

    const encodedPath = encodeURIComponent(fullName);
    const commitsRes = await fetch(
      `https://gitlab.com/api/v4/projects/${encodedPath}/repository/commits?per_page=30`,
      { headers }
    );

    if (!commitsRes.ok) {
      const errBody = await commitsRes.text().catch(() => '');
      throw new Error(`GitLab API error ${commitsRes.status}: ${errBody || commitsRes.statusText}`);
    }

    const commitsData = (await commitsRes.json()) as any[];

    // Fetch MRs
    let mrsData: any[] = [];
    try {
      const mrRes = await fetch(
        `https://gitlab.com/api/v4/projects/${encodedPath}/merge_requests?per_page=20`,
        { headers }
      );
      if (mrRes.ok) {
        mrsData = (await mrRes.json()) as any[];
      }
    } catch {
      // MRs fetch failure non-fatal
    }

    const commits = Array.isArray(commitsData)
      ? commitsData.map((c) => ({
          sha: c.id,
          message: c.message || '',
          authorName: c.author_name || 'Unknown',
          authorEmail: c.author_email || null,
          branch: 'main',
          url: c.web_url || null,
          committedAt: c.committed_date ? new Date(c.committed_date) : new Date(),
        }))
      : [];

    const pullRequests = Array.isArray(mrsData)
      ? mrsData.map((m) => ({
          prNumber: Number(m.iid),
          title: m.title || '',
          authorName: m.author?.name || 'Unknown',
          sourceBranch: m.source_branch || 'feature',
          targetBranch: m.target_branch || 'main',
          status: m.state === 'merged' ? 'MERGED' : m.state === 'closed' ? 'CLOSED' : 'OPEN',
          url: m.web_url || null,
          mergedAt: m.merged_at ? new Date(m.merged_at) : null,
        }))
      : [];

    return { commits, pullRequests };
  }

  /**
   * Eksekusi sinkronisasi repositori ke PostgreSQL & linking evidence.
   */
  async syncRepository(repoId: string, options: SyncOptions = {}): Promise<SyncResult> {
    const repoRows = await db
      .select()
      .from(repositories)
      .where(eq(repositories.id, repoId))
      .limit(1);

    if (repoRows.length === 0) {
      throw new Error(`Repository ${repoId} not found`);
    }

    const repo = repoRows[0];
    const provider = (repo.provider as GitProvider) || 'GITHUB';

    let remoteData: { commits: any[]; pullRequests: any[] };
    if (provider === 'GITLAB') {
      remoteData = await this.fetchGitLab(repo.fullName, options.token);
    } else {
      remoteData = await this.fetchGitHub(repo.fullName, options.token);
    }

    const allLinkedKeys: string[] = [];
    let syncedCommits = 0;
    let syncedPullRequests = 0;

    // Process commits
    for (const c of remoteData.commits) {
      const { linkedKeys } = await gitLinkerService.processCommitAndLink({
        repoId: repo.id,
        sha: c.sha,
        message: c.message,
        authorName: c.authorName,
        authorEmail: c.authorEmail,
        branch: repo.defaultBranch || 'main',
        url: c.url,
        committedAt: c.committedAt,
      });
      syncedCommits++;
      for (const k of linkedKeys) {
        if (!allLinkedKeys.includes(k)) allLinkedKeys.push(k);
      }
    }

    // Process PRs
    for (const pr of remoteData.pullRequests) {
      const { linkedKeys } = await gitLinkerService.processPullRequestAndLink({
        repoId: repo.id,
        prNumber: pr.prNumber,
        title: pr.title,
        authorName: pr.authorName,
        sourceBranch: pr.sourceBranch,
        targetBranch: pr.targetBranch,
        status: pr.status as any,
        url: pr.url,
        mergedAt: pr.mergedAt,
      });
      syncedPullRequests++;
      for (const k of linkedKeys) {
        if (!allLinkedKeys.includes(k)) allLinkedKeys.push(k);
      }
    }

    // Log audit trail
    await auditService.logEvent({
      actorId: options.actorId || 'unknown',
      actorName: options.actorName || 'System',
      action: 'REPOSITORY_SYNCED',
      targetEntity: 'repositories',
      targetId: repo.id,
      details: {
        fullName: repo.fullName,
        provider,
        syncedCommits,
        syncedPullRequests,
        linkedKeys: allLinkedKeys,
      },
      correlationId: options.correlationId || 'system',
    });

    return {
      repositoryId: repo.id,
      fullName: repo.fullName,
      provider,
      syncedCommits,
      syncedPullRequests,
      linkedKeys: allLinkedKeys,
    };
  }
}

export const gitSyncService = new GitSyncService();
