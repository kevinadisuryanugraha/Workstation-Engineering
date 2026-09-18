import { and, eq, ilike, or } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { tickets } from '../../db/schema/tickets.ts';
import { workItems } from '../../db/schema/work_items.ts';
import { kbArticles } from '../../db/schema/kb_articles.ts';
import { incidents } from '../../db/schema/incidents.ts';

/**
 * Global search (Story 15.2 — FR-018, Master PRD §19).
 * Case-insensitive search across tickets, work items, KB articles, incidents.
 */

export interface SearchResultItem {
  entityType: 'ticket' | 'work_item' | 'kb_article' | 'incident';
  ref: string; // key / code / slug
  title: string;
  projectId: string | null;
  status: string | null;
  timestamp: Date | null;
  snippet: string | null;
}

const MAX_PER_ENTITY = 10;

function makeSnippet(text: string | null | undefined, q: string): string | null {
  if (!text) return null;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text.slice(0, 160);
  const start = Math.max(0, idx - 40);
  const raw = text.slice(start, start + 160);
  return (start > 0 ? '…' : '') + raw + (start + 160 < text.length ? '…' : '');
}

export class SearchService {
  async search(q: string): Promise<{ results: SearchResultItem[]; total: number }> {
    const pattern = `%${q}%`;

    const [ticketRows, workItemRows, kbRows, incidentRows] = await Promise.all([
      db
        .select({ key: tickets.key, title: tickets.title, projectId: tickets.projectId, status: tickets.status, createdAt: tickets.createdAt })
        .from(tickets)
        .where(or(ilike(tickets.key, pattern), ilike(tickets.title, pattern)))
        .limit(MAX_PER_ENTITY),
      db
        .select({ key: workItems.key, title: workItems.title, projectId: workItems.projectId, status: workItems.status, createdAt: workItems.createdAt, description: workItems.description })
        .from(workItems)
        .where(or(ilike(workItems.key, pattern), ilike(workItems.title, pattern)))
        .limit(MAX_PER_ENTITY),
      db
        .select({ slug: kbArticles.slug, title: kbArticles.title, projectId: kbArticles.projectId, updatedAt: kbArticles.updatedAt, body: kbArticles.body })
        .from(kbArticles)
        .where(or(ilike(kbArticles.title, pattern), ilike(kbArticles.body, pattern)))
        .limit(MAX_PER_ENTITY),
      db
        .select({ code: incidents.code, title: incidents.title, status: incidents.status, detectedAt: incidents.detectedAt, id: incidents.id })
        .from(incidents)
        .where(or(ilike(incidents.code, pattern), ilike(incidents.title, pattern)))
        .limit(MAX_PER_ENTITY),
    ]);

    const results: SearchResultItem[] = [];

    for (const t of ticketRows) {
      results.push({ entityType: 'ticket', ref: t.key, title: t.title, projectId: t.projectId, status: t.status, timestamp: t.createdAt, snippet: null });
    }
    for (const w of workItemRows) {
      results.push({ entityType: 'work_item', ref: w.key, title: w.title, projectId: w.projectId, status: w.status, timestamp: w.createdAt, snippet: makeSnippet(w.description ?? null, q) });
    }
    for (const k of kbRows) {
      results.push({ entityType: 'kb_article', ref: k.slug, title: k.title, projectId: k.projectId, status: null, timestamp: k.updatedAt, snippet: makeSnippet(k.body, q) });
    }
    for (const i of incidentRows) {
      results.push({ entityType: 'incident', ref: i.code, title: i.title, projectId: null, status: i.status, timestamp: i.detectedAt, snippet: null });
    }

    // Simple relevance: exact key/code matches float to the top
    results.sort((a, b) => {
      const aExact = a.ref.toLowerCase() === q.toLowerCase() ? 0 : 1;
      const bExact = b.ref.toLowerCase() === q.toLowerCase() ? 0 : 1;
      return aExact - bExact;
    });

    return { results, total: results.length };
  }
}

export const searchService = new SearchService();
void and; void eq;
