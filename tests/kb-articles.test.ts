import { describe, it, expect, beforeAll, vi } from 'vitest';
import express, { Express } from 'express';

/**
 * Story 15.1/15.2 — KB articles & global search (routes with mocked service
 * + pure slug tests).
 */

process.env.JWT_SECRET = 'workstation-test-secret-min-32-chars-long-security-token';

const { kbStub, searchStub } = vi.hoisted(() => ({
  kbStub: {
    create: vi.fn(),
    update: vi.fn(),
    list: vi.fn().mockResolvedValue([]),
    bySlug: vi.fn().mockResolvedValue(null),
    versions: vi.fn().mockResolvedValue([]),
    versionContent: vi.fn().mockResolvedValue(null),
    draftFromTicket: vi.fn(),
    searchByTitle: vi.fn().mockResolvedValue([]),
  },
  searchStub: {
    search: vi.fn(),
  },
}));

vi.mock('../server/modules/kb/kb.service.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../server/modules/kb/kb.service.ts')>();
  return { ...original, kbService: kbStub };
});

vi.mock('../server/modules/search/search.service.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../server/modules/search/search.service.ts')>();
  return { ...original, searchService: searchStub };
});

import { kbRouter } from '../server/modules/kb/kb.routes.ts';
import { searchRouter } from '../server/modules/search/search.routes.ts';
import { toKebabSlug } from '../server/modules/kb/kb.service.ts';
import { SERVER_ROLE_PERMISSIONS } from '../server/constants/permissions.ts';

describe('toKebabSlug (pure)', () => {
  it('converts titles to kebab-case slugs', () => {
    expect(toKebabSlug('Fix Printer Thermal Epson TM-T82')).toBe('fix-printer-thermal-epson-tm-t82');
    expect(toKebabSlug('  --Spasi & Simbol!!--  ')).toBe('spasi-simbol');
  });
});

describe('KB & Search routes (Story 15.1/15.2)', () => {
  let app: Express;
  let server: ReturnType<Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use((req: any, _res, next) => {
      req.user = { userId: 'usr-2', name: 'Rina Wijaya', role: 'Tech Lead', permissions: SERVER_ROLE_PERMISSIONS['Tech Lead'] };
      next();
    });
    app.use('/api/v1/kb', kbRouter);
    app.use('/api/v1/search', searchRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
        resolve();
      });
    });
  });

  it('POST /kb rejects short body with 400', async () => {
    const { KbValidationError } = await import('../server/modules/kb/kb.service.ts');
    kbStub.create.mockRejectedValueOnce(new KbValidationError('body is required (min 10 chars)'));
    const res = await fetch(`${baseUrl}/api/v1/kb`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Judul Valid', body: 'pendek' }),
    });
    expect(res.status).toBe(400);
  });

  it('POST /kb from-ticket requires key (400) and creates draft when valid', async () => {
    const bad = await fetch(`${baseUrl}/api/v1/kb/from-ticket`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(bad.status).toBe(400);

    kbStub.draftFromTicket.mockResolvedValueOnce({ id: 'kb-1', slug: 'struk-terpotong-tck-1003', sourceTicketKey: 'TCK-1003' });
    const ok = await fetch(`${baseUrl}/api/v1/kb/from-ticket`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: 'TCK-1003' }),
    });
    expect(ok.status).toBe(201);
    const body: any = await ok.json();
    expect(body.data.sourceTicketKey).toBe('TCK-1003');
  });

  it('duplicate slug → 409', async () => {
    const { DuplicateSlugError } = await import('../server/modules/kb/kb.service.ts');
    kbStub.create.mockRejectedValueOnce(new DuplicateSlugError('fix-printer'));
    const res = await fetch(`${baseUrl}/api/v1/kb`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Fix Printer', body: 'Isi artikel yang cukup panjang.' }),
    });
    expect(res.status).toBe(409);
  });

  it('unknown article versions → 404', async () => {
    const res = await fetch(`${baseUrl}/api/v1/kb/tidak-ada/versions`);
    expect(res.status).toBe(404);
  });

  it('search rejects q shorter than 2 chars with 400', async () => {
    const res = await fetch(`${baseUrl}/api/v1/search?q=a`);
    expect(res.status).toBe(400);
  });

  it('search returns grouped results with entity types and total', async () => {
    searchStub.search.mockResolvedValueOnce({
      results: [
        { entityType: 'incident', ref: 'INC-00001', title: 'Redis di kontabo-vps tidak merespons', projectId: null, status: 'IDENTIFIED', timestamp: new Date(), snippet: null },
        { entityType: 'kb_article', ref: 'redis-cache-guide', title: 'Redis Cache Guide', projectId: null, status: null, timestamp: new Date(), snippet: '…redis…' },
      ],
      total: 2,
    });
    const res = await fetch(`${baseUrl}/api/v1/search?q=redis`);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data.total).toBe(2);
    expect(body.data.results[0].entityType).toBe('incident');
    expect(body.data.results[1].entityType).toBe('kb_article');
  });
});
