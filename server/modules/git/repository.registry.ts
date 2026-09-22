import { Router, type Request, type Response } from 'express';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from '../../db/client.ts';
import { projects } from '../../db/schema/projects.ts';
import { repositories, GIT_PROVIDERS, type GitProvider } from '../../db/schema/repositories.ts';
import { requirePermission } from '../../middlewares/rbac.ts';
import { safeAsync } from '../../middlewares/safeAsync.ts';

/**
 * Story 23.1 (CC-8, Master PRD §30 Fase V2) — Repository Registry API.
 *
 * Registrasi repositori multi-provider (GITHUB | GITLAB | BITBUCKET) ke project.
 * - GET  /api/v1/git/repositories — daftar repo (pola read 18.1: JWT + permission view).
 * - POST /api/v1/git/repositories — registrasi idempoten (PERM_EVIDENCE_ATTACH:
 *   repo = provisioning sumber evidence). Secret webhook digenerate server dan
 *   TIDAK PERNAH dikirim ke client (hanya indikator hasSecret).
 */

export const GIT_PROVIDER_VALUES = GIT_PROVIDERS;

/** Pola fullName `owner/repo` (izinkan titik, strip, underscore di kedua segmen). */
const FULL_NAME_PATTERN = /^[\w.-]+\/[\w.-]+$/;

export const registerRepositorySchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  fullName: z
    .string()
    .max(255)
    .regex(FULL_NAME_PATTERN, 'fullName must follow owner/repo format'),
  provider: z.enum(GIT_PROVIDERS),
  defaultBranch: z.string().max(100).optional(),
});

export const listRepositoriesQuerySchema = z.object({
  projectId: z.string().optional(),
});

/** Bentuk respons tanpa secret — kontrak AC 23.1.3/23.1.4. */
export interface GitRepositoryDto {
  id: string;
  projectId: string;
  fullName: string;
  provider: GitProvider;
  defaultBranch: string;
  hasSecret: boolean;
  createdAt: string;
}

export function toRepositoryDto(row: typeof repositories.$inferSelect): GitRepositoryDto {
  return {
    id: row.id,
    projectId: row.projectId,
    fullName: row.fullName,
    provider: (row.provider as GitProvider) ?? 'GITHUB',
    defaultBranch: row.defaultBranch,
    hasSecret: Boolean(row.webhookSecret),
    createdAt: row.createdAt.toISOString(),
  };
}

/** Generator secret webhook (hex 48 karakter) — dipakai saat registrasi. */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(24).toString('hex');
}

export class RepositoryRegistryService {
  async list(projectId?: string): Promise<GitRepositoryDto[]> {
    const rows = projectId
      ? await db.select().from(repositories).where(eq(repositories.projectId, projectId))
      : await db.select().from(repositories);
    // Urutan stabil: createdAt lama → baru, lalu fullName untuk determinisme test.
    rows.sort((a, b) => {
      const byTime = a.createdAt.getTime() - b.createdAt.getTime();
      return byTime !== 0 ? byTime : a.fullName.localeCompare(b.fullName);
    });
    return rows.map(toRepositoryDto);
  }

  /**
   * Registrasi idempoten (AC 23.1.5): kombinasi (projectId, provider, fullName)
   * yang sudah ada mengembalikan repo eksisting (200) — bukan duplikat.
   * Repo sama dengan provider BERBEDA boleh co-eksis (mirror lintas provider).
   */
  async register(input: {
    projectId: string;
    fullName: string;
    provider: GitProvider;
    defaultBranch?: string;
  }): Promise<{ repository: GitRepositoryDto; created: boolean }> {
    const existing = await db
      .select()
      .from(repositories)
      .where(
        and(
          eq(repositories.projectId, input.projectId),
          eq(repositories.provider, input.provider),
          eq(repositories.fullName, input.fullName)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return { repository: toRepositoryDto(existing[0]), created: false };
    }

    const inserted = await db
      .insert(repositories)
      .values({
        projectId: input.projectId,
        fullName: input.fullName,
        provider: input.provider,
        defaultBranch: input.defaultBranch ?? 'main',
        webhookSecret: generateWebhookSecret(),
      })
      .returning();

    return { repository: toRepositoryDto(inserted[0]), created: true };
  }

  async projectExists(projectId: string): Promise<boolean> {
    const rows = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, projectId)).limit(1);
    return rows.length > 0;
  }
}

export const repositoryRegistryService = new RepositoryRegistryService();

function zodErrorResponse(res: Response, err: z.ZodError) {
  return res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    },
    timestamp: new Date().toISOString(),
  });
}

export const repositoryRegistryRouter = Router();

// GET /api/v1/git/repositories?projectId=
repositoryRegistryRouter.get(
  '/repositories',
  requirePermission('PERM_VIEW_ENGINEERING'),
  safeAsync(async (req: Request, res: Response) => {
    const query = listRepositoriesQuerySchema.parse(req.query);
    const items = await repositoryRegistryService.list(query.projectId || undefined);
    res.json({
      success: true,
      data: items,
      meta: { total: items.length },
      timestamp: new Date().toISOString(),
    });
  })
);

// POST /api/v1/git/repositories — registrasi repo = provisioning sumber evidence.
repositoryRegistryRouter.post(
  '/repositories',
  requirePermission('PERM_EVIDENCE_ATTACH'),
  safeAsync(async (req: Request, res: Response) => {
    let input: z.infer<typeof registerRepositorySchema>;
    try {
      input = registerRepositorySchema.parse(req.body);
    } catch (err) {
      if (err instanceof z.ZodError) return zodErrorResponse(res, err);
      throw err;
    }

    if (!(await repositoryRegistryService.projectExists(input.projectId))) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: `Project ${input.projectId} not found` },
        timestamp: new Date().toISOString(),
      });
    }

    const { repository, created } = await repositoryRegistryService.register(input);
    return res.status(created ? 201 : 200).json({
      success: true,
      data: repository,
      meta: { created },
      timestamp: new Date().toISOString(),
    });
  })
);
