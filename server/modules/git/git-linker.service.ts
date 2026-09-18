import { eq } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { commits, NewCommit } from '../../db/schema/commits.ts';
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
}

export const gitLinkerService = new GitLinkerService();
