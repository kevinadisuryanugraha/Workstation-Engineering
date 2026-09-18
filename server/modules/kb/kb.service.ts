import { and, desc, eq, ilike, or, asc } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { kbArticles, kbArticleVersions, KbArticle } from '../../db/schema/kb_articles.ts';
import { tickets } from '../../db/schema/tickets.ts';
import { auditService } from '../audit/audit.service.ts';

/**
 * Knowledge Base service (Story 15.1 — FR-018, Master PRD §19).
 * Versioning: create v1; every update appends a version row (append-only history).
 */

export class DuplicateSlugError extends Error {
  constructor(slug: string) {
    super(`KB article slug '${slug}' already exists`);
    this.name = 'DuplicateSlugError';
  }
}

export class KbValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KbValidationError';
  }
}

export function toKebabSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
}

export class KbService {
  async create(input: { title: string; body: string; tags?: string[]; ownerName: string; projectId?: string; sourceTicketKey?: string }, correlationId = 'system'): Promise<KbArticle> {
    if (!input.title || input.title.trim().length < 3) throw new KbValidationError('title is required (min 3 chars)');
    if (!input.body || input.body.trim().length < 10) throw new KbValidationError('body is required (min 10 chars)');

    let slug = toKebabSlug(input.title) || `kb-${Date.now()}`;
    if (input.sourceTicketKey) slug = `${slug}-${input.sourceTicketKey.toLowerCase()}`;

    const exists = await db.select({ id: kbArticles.id }).from(kbArticles).where(eq(kbArticles.slug, slug)).limit(1);
    if (exists.length > 0) throw new DuplicateSlugError(slug);

    const rows = await db
      .insert(kbArticles)
      .values({
        slug,
        title: input.title.trim(),
        body: input.body,
        tags: input.tags ?? [],
        version: 1,
        ownerName: input.ownerName,
        sourceTicketKey: input.sourceTicketKey ?? null,
      })
      .returning();
    const article = rows[0];

    // v1 snapshot
    await db.insert(kbArticleVersions).values({
      articleId: article.id,
      version: 1,
      title: article.title,
      body: article.body,
      updatedBy: input.ownerName,
    });

    await auditService.logEvent({
      actorId: input.ownerName,
      actorName: input.ownerName,
      action: 'KB_ARTICLE_CREATED',
      targetEntity: 'kb_articles',
      targetId: article.id,
      details: { slug, version: 1 },
      correlationId,
    }).catch(() => undefined);

    return article;
  }

  async update(slug: string, patch: { title?: string; body?: string; tags?: string[] }, updatedBy: string, correlationId = 'system'): Promise<KbArticle> {
    const rows = await db.select().from(kbArticles).where(eq(kbArticles.slug, slug)).limit(1);
    if (rows.length === 0) throw new KbValidationError(`Article '${slug}' not found`);
    const article = rows[0];

    const nextVersion = article.version + 1;
    const updatedRows = await db
      .update(kbArticles)
      .set({
        title: patch.title ?? article.title,
        body: patch.body ?? article.body,
        tags: patch.tags ?? (article.tags as unknown as string[]),
        version: nextVersion,
        updatedAt: new Date(),
      })
      .where(eq(kbArticles.slug, slug))
      .returning();

    // Append-only history (never mutate old versions)
    await db.insert(kbArticleVersions).values({
      articleId: article.id,
      version: nextVersion,
      title: updatedRows[0].title,
      body: updatedRows[0].body,
      updatedBy,
    });

    await auditService.logEvent({
      actorId: updatedBy,
      actorName: updatedBy,
      action: 'KB_ARTICLE_UPDATED',
      targetEntity: 'kb_articles',
      targetId: article.id,
      details: { slug, version: nextVersion },
      correlationId,
    }).catch(() => undefined);

    return updatedRows[0];
  }

  async list(filters: { tag?: string; q?: string }): Promise<KbArticle[]> {
    const conditions = [];
    if (filters.q) conditions.push(ilike(kbArticles.title, `%${filters.q}%`));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await db.select().from(kbArticles).where(where).orderBy(desc(kbArticles.updatedAt)).limit(50);
    if (!filters.tag) return rows;
    return rows.filter((r) => ((r.tags as unknown as string[]) ?? []).includes(filters.tag!));
  }

  async bySlug(slug: string): Promise<KbArticle | null> {
    const rows = await db.select().from(kbArticles).where(eq(kbArticles.slug, slug)).limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async versions(slug: string): Promise<Array<{ version: number; title: string; updatedBy: string; createdAt: Date }>> {
    const article = await this.bySlug(slug);
    if (!article) return [];
    return db
      .select({ version: kbArticleVersions.version, title: kbArticleVersions.title, updatedBy: kbArticleVersions.updatedBy, createdAt: kbArticleVersions.createdAt })
      .from(kbArticleVersions)
      .where(eq(kbArticleVersions.articleId, article.id))
      .orderBy(asc(kbArticleVersions.version));
  }

  async versionContent(slug: string, version: number): Promise<{ title: string; body: string } | null> {
    const article = await this.bySlug(slug);
    if (!article) return null;
    const rows = await db
      .select({ title: kbArticleVersions.title, body: kbArticleVersions.body })
      .from(kbArticleVersions)
      .where(and(eq(kbArticleVersions.articleId, article.id), eq(kbArticleVersions.version, version)))
      .limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Draft article from a RESOLVED/CLOSED ticket (AC 15.1.4).
   */
  async draftFromTicket(ticketKey: string, ownerName: string, correlationId = 'system'): Promise<KbArticle> {
    const rows = await db.select().from(tickets).where(eq(tickets.key, ticketKey)).limit(1);
    if (rows.length === 0) throw new KbValidationError(`Ticket '${ticketKey}' not found`);
    const ticket = rows[0];
    if (!['RESOLVED', 'CLOSED'].includes(ticket.status)) {
      throw new KbValidationError('Hanya tiket berstatus RESOLVED/CLOSED yang dapat dijadikan artikel (AC #4)');
    }

    const body = [
      `## Masalah`,
      ticket.title,
      '',
      `## Detail`,
      ticket.description ?? '(tanpa deskripsi tambahan)',
      '',
      `## Referensi`,
      `- Tiket: ${ticket.key} (${ticket.status})`,
      `- Severity: ${ticket.severity}`,
    ].join('\n');

    return this.create(
      {
        title: ticket.title,
        body,
        tags: ['dari-tiket', ticket.severity.toLowerCase()],
        ownerName,
        projectId: ticket.projectId,
        sourceTicketKey: ticket.key,
      },
      correlationId
    );
  }

  /** Untuk global search (15.2). */
  async searchByTitle(q: string, limit = 10): Promise<KbArticle[]> {
    return db.select().from(kbArticles).where(or(ilike(kbArticles.title, `%${q}%`), ilike(kbArticles.body, `%${q}%`))).limit(limit);
  }
}

export const kbService = new KbService();
void desc;
