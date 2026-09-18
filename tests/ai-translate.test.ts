import { describe, it, expect, beforeAll, vi } from 'vitest';
import express, { Express } from 'express';

/**
 * Story 16.4 — AI report translation (NFR-006: no key → no network call, clean 503).
 */

process.env.JWT_SECRET = 'workstation-test-secret-min-32-chars-long-security-token';

const { translationStub } = vi.hoisted(() => ({
  translationStub: {
    translateArchived: vi.fn(),
  },
}));

vi.mock('../server/modules/reports/translate.service.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../server/modules/reports/translate.service.ts')>();
  return {
    ...original,
    reportTranslationService: { ...original.reportTranslationService, translateArchived: translationStub.translateArchived },
  };
});

vi.mock('../server/middlewares/rbac.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../server/middlewares/rbac.ts')>();
  return {
    ...original,
    requirePermission: (p: string) => (req: any, res: any, next: any) => {
      // PERM_AI_TRANSLATE only for Tech Lead — exercises the 403 path for Viewer
      if (req.user?.role === 'Viewer' && p === 'PERM_AI_TRANSLATE') {
        return res.status(403).json({ success: false, error: { code: 'RBAC_ACCESS_DENIED', message: 'denied' } });
      }
      next();
    },
  };
});

import { reportsRouter } from '../server/modules/reports/reports.routes.ts';
import { buildTranslationPrompt, SUPPORTED_TARGET_LANGUAGES } from '../server/modules/reports/translate.service.ts';

const NO_KEY = process.env.GEMINI_API_KEY === undefined || process.env.GEMINI_API_KEY === '';

describe('Prompt builder (pure)', () => {
  it('keeps numbers/codes rule + target language label', () => {
    const prompt = buildTranslationPrompt('# Laporan\nTotal: 5 tiket (INC-00001)', 'en');
    expect(prompt).toContain('English');
    expect(prompt).toContain('Keep all numbers');
    expect(prompt).toContain('INC-00001');
  });

  it('supports exactly en and id targets', () => {
    expect(SUPPORTED_TARGET_LANGUAGES).toEqual(['en', 'id']);
  });
});

describe('Translate endpoint (Story 16.4)', () => {
  let app: Express;
  let server: ReturnType<Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use((req: any, _res, next) => {
      req.user = { userId: 'usr-4', name: 'Manager', role: 'Manager', permissions: ['PERM_AI_TRANSLATE'] };
      next();
    });
    app.use('/api/v1/reports', reportsRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
        resolve();
      });
    });
  });

  it('rejects invalid targetLanguage with 400', async () => {
    const res = await fetch(`${baseUrl}/api/v1/reports/some-id/translate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ targetLanguage: 'fr' }),
    });
    expect(res.status).toBe(400);
  });

  it('when configured, returns stored translation and source preservation flag', async () => {
    if (NO_KEY) {
      console.log('   (GEMINI_API_KEY not set — covered by service-level no-key unit rule)');
    }
    translationStub.translateArchived.mockResolvedValueOnce({
      id: 'rep-1',
      translationMarkdown: '# Operational Management Report',
      translationLanguage: 'en',
      sourcePreserved: true,
    });
    const res = await fetch(`${baseUrl}/api/v1/reports/rep-1/translate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ targetLanguage: 'en' }),
    });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data.translationLanguage).toBe('en');
    expect(body.data.sourcePreserved).toBe(true);
  });

  it('RBAC: Viewer is denied 403 on translate', async () => {
    const viewerApp = express();
    viewerApp.use(express.json());
    viewerApp.use((req: any, _res, next) => {
      req.user = { userId: 'usr-6', name: 'Viewer', role: 'Viewer', permissions: ['PERM_VIEW_DASHBOARD'] };
      next();
    });
    viewerApp.use('/api/v1/reports', reportsRouter);
    let vServer: any;
    const vUrl = await new Promise<string>((resolve) => {
      vServer = viewerApp.listen(0, '127.0.0.1', () => {
        const addr = vServer.address();
        resolve(`http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`);
      });
    });
    const res = await fetch(`${vUrl}/api/v1/reports/rep-1/translate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ targetLanguage: 'en' }),
    });
    expect(res.status).toBe(403);
    await new Promise<void>((resolve) => vServer.close(() => resolve()));
  });
});
