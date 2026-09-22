import { describe, it, expect } from 'vitest';
import dotenv from 'dotenv';

/**
 * Story 23.1 (CC-8, Master PRD §30 Fase V2) — Multi-Provider Schema & Registry.
 *
 * 1. Pure unit: validasi zod (enum provider, pola fullName), idempotensi key,
 *    generator secret, DTO tanpa secret (hasSecret boolean).
 * 2. Integration (DB dev nyata): migrasi 0017 (kolom provider + default GITHUB),
 *    register → list, idempoten 200-vs-201, provider berbeda co-eksis, cleanup.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'workstation-test-secret-min-32-chars-long-security-token';

// CI tanpa Postgres → suite integrasi DB di-skip jujur; pure unit tetap jalan.
dotenv.config();
const HAS_DB = Boolean(process.env.DATABASE_URL);
const describeDb = HAS_DB ? describe : describe.skip;

import {
  registerRepositorySchema,
  listRepositoriesQuerySchema,
  RepositoryRegistryService,
  generateWebhookSecret,
  toRepositoryDto,
  type GitRepositoryDto,
} from '../server/modules/git/repository.registry.ts';
import { GIT_PROVIDERS } from '../server/db/schema/repositories.ts';

describe('Story 23.1 — registerRepositorySchema (zod ketat)', () => {
  const valid = {
    projectId: 'p-1',
    fullName: 'zamzami/workstation',
    provider: 'GITLAB',
  };

  it('menerima payload valid lengkap dengan defaultBranch', () => {
    const parsed = registerRepositorySchema.parse({ ...valid, defaultBranch: 'trunk' });
    expect(parsed.defaultBranch).toBe('trunk');
    expect(parsed.provider).toBe('GITLAB');
  });

  it.each(['GITHUB', 'GITLAB', 'BITBUCKET'] as const)('menerima provider %s', (provider) => {
    expect(() => registerRepositorySchema.parse({ ...valid, provider })).not.toThrow();
  });

  it('menolak provider di luar enum (400 jalur controller)', () => {
    expect(() => registerRepositorySchema.parse({ ...valid, provider: 'SOURCEFORGE' })).toThrow();
    expect(() => registerRepositorySchema.parse({ ...valid, provider: 'github' })).toThrow(); // case-sensitive
  });

  it('menolak fullName tanpa slash / kosong / terlalu panjang', () => {
    expect(() => registerRepositorySchema.parse({ ...valid, fullName: 'workstation-saja' })).toThrow();
    expect(() => registerRepositorySchema.parse({ ...valid, fullName: '' })).toThrow();
    expect(() => registerRepositorySchema.parse({ ...valid, fullName: 'a/'.repeat(200) })).toThrow();
  });

  it('menerima titik/strip/underscore pada segmen fullName', () => {
    expect(() =>
      registerRepositorySchema.parse({ ...valid, fullName: 'my-org.io/repo_name.v2' })
    ).not.toThrow();
  });

  it('menolak projectId kosong', () => {
    expect(() => registerRepositorySchema.parse({ ...valid, projectId: '' })).toThrow();
  });
});

describe('Story 23.1 — listRepositoriesQuerySchema', () => {
  it('projectId opsional', () => {
    expect(listRepositoriesQuerySchema.parse({})).toEqual({});
    expect(listRepositoriesQuerySchema.parse({ projectId: 'abc' })).toEqual({ projectId: 'abc' });
  });
});

describe('Story 23.1 — GIT_PROVIDERS & generateWebhookSecret', () => {
  it('enum provider tepat 3 nilai', () => {
    expect(GIT_PROVIDERS).toEqual(['GITHUB', 'GITLAB', 'BITBUCKET']);
  });

  it('secret hex 48 karakter dan tidak pernah identik antar panggilan', () => {
    const a = generateWebhookSecret();
    const b = generateWebhookSecret();
    expect(a).toMatch(/^[0-9a-f]{48}$/);
    expect(b).toMatch(/^[0-9a-f]{48}$/);
    expect(a).not.toBe(b);
  });
});

describe('Story 23.1 — toRepositoryDto (secret tidak pernah bocor)', () => {
  it('DTO berisi hasSecret boolean, tanpa field webhookSecret', () => {
    const row = {
      id: 'r-1',
      projectId: 'p-1',
      fullName: 'org/repo',
      provider: 'GITLAB',
      defaultBranch: 'main',
      webhookSecret: 'super-secret-value',
      createdAt: new Date('2026-09-22T00:00:00.000Z'),
      updatedAt: new Date('2026-09-22T00:00:00.000Z'),
    } as any;

    const dto: GitRepositoryDto = toRepositoryDto(row);
    expect(dto).toEqual({
      id: 'r-1',
      projectId: 'p-1',
      fullName: 'org/repo',
      provider: 'GITLAB',
      defaultBranch: 'main',
      hasSecret: true,
      createdAt: '2026-09-22T00:00:00.000Z',
    });
    expect(JSON.stringify(dto)).not.toContain('super-secret-value');
    expect((dto as any).webhookSecret).toBeUndefined();
  });

  it('provider null/legacy dinormalisasi ke GITHUB (jujur, bukan default palsu provider lain)', () => {
    const row = {
      id: 'r-2',
      projectId: 'p-1',
      fullName: 'org/repo',
      provider: null,
      defaultBranch: 'main',
      webhookSecret: 'x',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    expect(toRepositoryDto(row).provider).toBe('GITHUB');
    expect(toRepositoryDto(row).hasSecret).toBe(true);
  });
});

describe('Story 23.1 — RepositoryRegistryService.register (idempotensi key, unit via DB-palsu tak mungkin)', () => {
  it('service punya metode list/register/projectExists', () => {
    const svc = new RepositoryRegistryService();
    expect(typeof svc.list).toBe('function');
    expect(typeof svc.register).toBe('function');
    expect(typeof svc.projectExists).toBe('function');
  });
});

describeDb('Story 23.1 — Registry integration (DB dev)', () => {
  it('migrasi 0017: kolom provider ada dengan default GITHUB', async () => {
    const { sql } = await import('drizzle-orm');
    const { db } = await import('../server/db/client.ts');
    const res = await db.execute(
      sql`SELECT column_default, is_nullable FROM information_schema.columns
          WHERE table_name = 'repositories' AND column_name = 'provider'`
    );
    const rows = res.rows as Array<{ column_default: string | null; is_nullable: string }>;
    expect(rows.length).toBe(1);
    expect(rows[0].column_default).toContain('GITHUB');
    expect(rows[0].is_nullable).toBe('NO');

    const res2 = await db.execute(
      sql`SELECT column_default FROM information_schema.columns
          WHERE table_name = 'webhook_deliveries' AND column_name = 'provider'`
    );
    expect((res2.rows as Array<{ column_default: string | null }>).length).toBe(1);
  });

  it('register GITLAB → muncul di list; register ulang → idempoten (created=false)', async () => {
    const { projectService } = await import('../server/modules/projects/project.service.ts');
    const svc = new RepositoryRegistryService();
    const projects = await projectService.listProjects();
    expect(projects.length).toBeGreaterThan(0);
    const projectId = projects[0].id;
    const uniqueName = `cc8-test/repo-${Date.now()}`;

    const first = await svc.register({ projectId, fullName: uniqueName, provider: 'GITLAB' });
    expect(first.created).toBe(true);
    expect(first.repository.provider).toBe('GITLAB');
    expect(first.repository.hasSecret).toBe(true);

    const again = await svc.register({ projectId, fullName: uniqueName, provider: 'GITLAB' });
    expect(again.created).toBe(false);
    expect(again.repository.id).toBe(first.repository.id);

    // Provider berbeda pada fullName sama → co-eksis (mirror lintas provider).
    const mirror = await svc.register({ projectId, fullName: uniqueName, provider: 'GITHUB' });
    expect(mirror.created).toBe(true);
    expect(mirror.repository.id).not.toBe(first.repository.id);

    const list = await svc.list(projectId);
    const names = list.filter((r) => r.fullName === uniqueName);
    expect(names.length).toBe(2);
    expect(new Set(names.map((n) => n.provider))).toEqual(new Set(['GITLAB', 'GITHUB']));

    // Filter list tanpa projectId tetap mengandung keduanya; secret tidak pernah di DTO.
    const all = await svc.list();
    expect(all.find((r) => r.id === first.repository.id)?.hasSecret).toBe(true);
    expect(JSON.stringify(all)).not.toMatch(/"webhookSecret"/);

    await cleanupTestRepos(uniqueName);
  });

  it('project tak dikenal → projectExists false (controller → 404)', async () => {
    const svc = new RepositoryRegistryService();
    expect(await svc.projectExists('tidak-ada-project-ini')).toBe(false);
  });
});

async function cleanupTestRepos(uniqueName: string) {
  try {
    const { sql } = await import('drizzle-orm');
    const { db } = await import('../server/db/client.ts');
    await db.execute(sql`DELETE FROM repositories WHERE full_name = ${uniqueName}`);
  } catch {
    // best-effort cleanup
  }
}
