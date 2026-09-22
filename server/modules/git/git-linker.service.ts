import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { commits, NewCommit } from '../../db/schema/commits.ts';
import { pullRequests, NewPullRequest, PullRequest } from '../../db/schema/pull_requests.ts';
import { workItems } from '../../db/schema/work_items.ts';
import { tickets } from '../../db/schema/tickets.ts';
import { evidenceLinks } from '../../db/schema/evidence_links.ts';
import { parseEntityKeys } from './entity-parser.ts';

export class GitLinkerService {
  async processCommitAndLink(commitData: NewCommit): Promise<{ linkedKeys: string[] }> {
    // 1. Insert commit record if not already existing
    try {
      await db.insert(commits).values(commitData).onConflictDoNothing();
    } catch (err) {
      // Ignore conflict
    }

    // 2. Parse entity keys from message
    const keys = parseEntityKeys(commitData.message);
    const linkedKeys: string[] = [];

    for (const key of keys) {
      // Try matching work item key
      const matchedWorkItem = await db
        .select()
        .from(workItems)
        .where(eq(workItems.key, key))
        .limit(1);

      if (matchedWorkItem.length > 0) {
        await db
          .insert(evidenceLinks)
          .values({
            workItemId: matchedWorkItem[0].id,
            commitSha: commitData.sha,
          })
          .onConflictDoNothing();
        linkedKeys.push(key);
      }

      // Try matching ticket key
      const matchedTicket = await db
        .select()
        .from(tickets)
        .where(eq(tickets.key, key))
        .limit(1);

      if (matchedTicket.length > 0) {
        await db
          .insert(evidenceLinks)
          .values({
            ticketId: matchedTicket[0].id,
            commitSha: commitData.sha,
          })
          .onConflictDoNothing();
        if (!linkedKeys.includes(key)) {
          linkedKeys.push(key);
        }
      }
    }

    return { linkedKeys };
  }

  /**
   * Story 23.3 (CC-8) — auto-linker untuk Pull Request / Merge Request.
   * Menyimpan baris PR (idempoten berdasarkan repoId + prNumber) dan menautkan
   * evidence ke work item dan tiket via parseEntityKeys terhadap judul PR.
   */
  async processPullRequestAndLink(prData: NewPullRequest): Promise<{ linkedKeys: string[]; prId?: string }> {
    let prRecord: PullRequest | undefined;
    try {
      const inserted = await db.insert(pullRequests).values(prData).returning();
      prRecord = inserted[0];
    } catch (err: any) {
      // Pada duplikat / konflik (repoId + prNumber), ambil baris eksisting dan perbarui status
      if (prData.repoId) {
        const existing = await db
          .select()
          .from(pullRequests)
          .where(and(eq(pullRequests.repoId, prData.repoId), eq(pullRequests.prNumber, prData.prNumber)))
          .limit(1);
        if (existing.length > 0) {
          prRecord = existing[0];
          await db
            .update(pullRequests)
            .set({
              status: prData.status,
              title: prData.title,
              mergedAt: prData.mergedAt,
              updatedAt: new Date(),
            })
            .where(eq(pullRequests.id, existing[0].id));
        }
      }
    }

    const prId = prRecord?.id;
    const keys = parseEntityKeys(prData.title);
    const linkedKeys: string[] = [];

    for (const key of keys) {
      const matchedWorkItem = await db
        .select()
        .from(workItems)
        .where(eq(workItems.key, key))
        .limit(1);

      if (matchedWorkItem.length > 0) {
        await db
          .insert(evidenceLinks)
          .values({
            workItemId: matchedWorkItem[0].id,
            prId: prId ?? String(prData.prNumber),
          })
          .onConflictDoNothing();
        linkedKeys.push(key);
      }

      const matchedTicket = await db
        .select()
        .from(tickets)
        .where(eq(tickets.key, key))
        .limit(1);

      if (matchedTicket.length > 0) {
        await db
          .insert(evidenceLinks)
          .values({
            ticketId: matchedTicket[0].id,
            prId: prId ?? String(prData.prNumber),
          })
          .onConflictDoNothing();
        if (!linkedKeys.includes(key)) {
          linkedKeys.push(key);
        }
      }
    }

    return { linkedKeys, prId };
  }
}

export const gitLinkerService = new GitLinkerService();
