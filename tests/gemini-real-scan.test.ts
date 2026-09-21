import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import express, { Express } from 'express';

/**
 * Story 21.1 (CC-6) — Gemini Real Scan (REAL_GEMINI) + fallback jujur.
 * Client Gemini & konteks repo ter-inject (tanpa jaringan/SDK nyata):
 * - real path sukses → mode REAL_GEMINI + nama model aktual;
 * - JSON kotor (code fence) tetap terparse; entri tidak valid dibuang;
 * - tanpa kunci/placeholder, error API, parse kosong → fallback STATIC_DEMO_PREVIEW;
 * - parse & validasi murni teruji unit.
 */

process.env.JWT_SECRET = 'workstation-test-secret-min-32-chars-long-security-token';
delete process.env.GEMINI_API_KEY; // default env uji: tanpa kunci

vi.mock('../server/db/client.ts', () => {
  const fakeTx = {
    insert: () => ({
      values: (row: any) => ({
        returning: async () => [{ ...row, id: row.id ?? `row-${Math.random().toString(36).slice(2, 8)}` }],
      }),
    }),
  };
  return {
    db: {
      transaction: async (cb: any) => cb(fakeTx),
      insert: fakeTx.insert,
      select: () => ({ from: () => ({ where: () => ({ orderBy: () => ({ limit: () => Promise.resolve([]) }) }) }) }),
    },
    pool: { on: () => {} },
  };
});

vi.mock('../server/modules/audit/audit.service.ts', () => ({
  auditService: { logEvent: vi.fn(async () => {}) },
}));

import {
  isRealGeminiKey,
  createGeminiScanClient,
  buildScanPrompt,
  parseScanOutput,
  DEFAULT_SCAN_MODEL,
  type GeminiScanClient,
} from '../server/modules/ai/gemini.client.ts';
import { aiService, AI_SCAN_MODES } from '../server/modules/ai/ai.service.ts';

const goodJson = {
  findings: [
    { id: 'FND-1', title: 'N+1 query di laporan', category: 'Performance', severity: 'High', confidence: 0.9, affectedFile: 'server/modules/reports/reports.repository.ts', evidence: 'loop query', impact: 'latensi', suggestedRemediation: 'batch' },
    { id: 'FND-2', title: 'Tanpa severity valid', category: 'Security', severity: 'SEVERE', confidence: 0.5 }, // invalid severity
    { id: 'FND-3', title: 'Confidence di luar rentang', severity: 'Low', confidence: 1.7 }, // invalid confidence
    { title: '', severity: 'Low', confidence: 0.5 }, // invalid title
  ],
  recommendations: [
    { id: 'REC-1', title: 'Tambah index komposit', reason: 'query lambat', expectedImpact: '-40% p95', effortEstimate: '2h', affectedModule: 'reports', confidence: 0.8 },
    { id: 'REC-2', title: 'Tanpa confidence', reason: 'x' }, // invalid
  ],
};

describe('isRealGeminiKey (AC #1, #4)', () => {
  it('placeholder & kosong = TIDAK tersedia', () => {
    expect(isRealGeminiKey(undefined)).toBe(false);
    expect(isRealGeminiKey('')).toBe(false);
    expect(isRealGeminiKey('MY_GEMINI_API_KEY')).toBe(false);
    expect(isRealGeminiKey('  my_gemini_api_key  ')).toBe(false);
    expect(isRealGeminiKey('changeme')).toBe(false);
  });

  it('kunci nyata diterima', () => {
    expect(isRealGeminiKey('AIzaSyD-real-key-123')).toBe(true);
  });
});

describe('createGeminiScanClient (factory injectable)', () => {
  it('tanpa kunci/placeholder → null (fallback path)', async () => {
    expect(await createGeminiScanClient({})).toBeNull();
    expect(await createGeminiScanClient({ GEMINI_API_KEY: 'MY_GEMINI_API_KEY' })).toBeNull();
  });

  it('kunci valid → client dengan model env AI_SCAN_MODEL / default', async () => {
    const injected: GeminiScanClient | null = await createGeminiScanClient(
      { GEMINI_API_KEY: 'real-key' },
      () => ({ models: { generateContent: async () => ({ text: '{}' }) } }) as any,
    );
    expect(injected).not.toBeNull();
    expect(injected!.model).toBe(DEFAULT_SCAN_MODEL);

    const custom = await createGeminiScanClient(
      { GEMINI_API_KEY: 'real-key', AI_SCAN_MODEL: 'gemini-2.5-pro' },
      () => ({ models: { generateContent: async () => ({ text: '{}' }) } }) as any,
    );
    expect(custom!.model).toBe('gemini-2.5-pro');
  });
});

describe('buildScanPrompt & parseScanOutput (AC #1, #2)', () => {
  it('prompt memuat konteks file + instruksi JSON', () => {
    const p = buildScanPrompt([{ path: 'src/app.ts', content: 'export const x = 1;' }], 'Security');
    expect(p).toContain('FILE: src/app.ts');
    expect(p).toContain('export const x = 1;');
    expect(p).toContain('Focus area: Security');
    expect(p).toContain('"findings"');
  });

  it('JSON dibungkus code fence tetap terparse', () => {
    const raw = '```json\n' + JSON.stringify(goodJson) + '\n```';
    const parsed = parseScanOutput(raw, () => {});
    expect(parsed.findings).toHaveLength(1); // 3 entri invalid dibuang
    expect(parsed.recommendations).toHaveLength(1);
    expect(parsed.droppedFindings).toBe(3);
    expect(parsed.droppedRecommendations).toBe(1);
    expect(parsed.findings[0].severity).toBe('High');
    expect(parsed.findings[0].confidence).toBe(0.9);
  });

  it('JSON polos tanpa fence juga didukung', () => {
    const parsed = parseScanOutput(JSON.stringify(goodJson), () => {});
    expect(parsed.findings).toHaveLength(1);
  });

  it('bukan JSON / tanpa array → hasil kosong (pemicu fallback)', () => {
    expect(parseScanOutput('Ini bukan JSON', () => {}).findings).toHaveLength(0);
    expect(parseScanOutput('{"findings": "bukan-array"}', () => {}).recommendations).toHaveLength(0);
  });

  it('AI_SCAN_MODES memuat REAL_GEMINI (AC #3)', () => {
    expect(AI_SCAN_MODES).toContain('REAL_GEMINI');
  });
});

describe('scanProject orchestration (AC #1, #3, #4, #5)', () => {
  function fakeClient(response: string | Error, model = 'gemini-2.5-flash'): GeminiScanClient {
    return {
      model,
      generate: async () => {
        if (response instanceof Error) throw response;
        return response;
      },
    };
  }

  it('real path sukses → persist mode REAL_GEMINI + model aktual (AC #3)', async () => {
    const snapshot = await aiService.scanProject({
      scannedBy: 'Toni',
      projectName: 'WORKSTATION',
      client: fakeClient('```json\n' + JSON.stringify(goodJson) + '\n```'),
      repoRoot: '/nonexistent-root', // konteks kosong — cukup untuk prompt
    });
    expect(snapshot.viaMode).toBe('REAL_GEMINI');
    expect(snapshot.mode).toBe('REAL_GEMINI');
    expect(snapshot.model).toBe('gemini-2.5-flash');
    expect((snapshot.findings as any[])).toHaveLength(1);
    // Prinsip AI-analis: findings baru selalu PENDING (16.2), bukan otoritas.
    expect((snapshot.findings as any[])[0].status ?? 'PENDING').toBe('PENDING');
  });

  it('tanpa kunci (client null) → fallback demo terlabel jujur (AC #4)', async () => {
    const snapshot = await aiService.scanProject({ scannedBy: 'Toni', client: null, repoRoot: '/nonexistent-root' });
    expect(snapshot.viaMode).toBe('STATIC_DEMO_PREVIEW');
    expect(snapshot.mode).toBe('STATIC_DEMO_PREVIEW');
    expect(snapshot.model).toBe('heuristic-demo');
    expect((snapshot.findings as any[]).length).toBeGreaterThan(0);
  });

  it('error API → fallback demo, tanpa crash (AC #4)', async () => {
    const snapshot = await aiService.scanProject({
      scannedBy: 'Toni',
      client: fakeClient(new Error('503 overloaded')),
      repoRoot: '/nonexistent-root',
    });
    expect(snapshot.viaMode).toBe('STATIC_DEMO_PREVIEW');
    expect(snapshot.mode).toBe('STATIC_DEMO_PREVIEW');
  });

  it('parse gagal total (0 entri valid) → fallback demo (AC #4)', async () => {
    const snapshot = await aiService.scanProject({
      scannedBy: 'Toni',
      client: fakeClient('bukan json sama sekali'),
      repoRoot: '/nonexistent-root',
    });
    expect(snapshot.viaMode).toBe('STATIC_DEMO_PREVIEW');
  });
});

describe('POST /api/v1/ai/scans (endpoint minim, AC #5)', () => {
  let app: Express;
  let server: ReturnType<Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    const { aiIntelRouter } = await import('../server/modules/ai/ai-intel.routes.ts');
    app = express();
    app.use(express.json());
    // Fake auth SEBELUM router — pengganti authenticateToken (unit route, bukan auth).
    app.use((req: any, _res, next) => {
      req.user = { userId: 'usr-1', name: 'Toni', role: 'Super Admin', permissions: ['PERM_AI_SCAN_TRIGGER'] };
      next();
    });
    app.use('/api/v1/ai', aiIntelRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const addr = server.address() as { port: number };
    baseUrl = `http://localhost:${addr.port}`;
  });

  afterAll(async () => {
    server?.close();
  });

  it('route POST /scans terdaftar dan mengembalikan mode + model', async () => {
    const res = await fetch(`${baseUrl}/api/v1/ai/scans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectName: 'WORKSTATION' }),
    });
    // Tanpa GEMINI_API_KEY di env uji → fallback demo (jujur), tetap sukses.
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.mode).toBe('STATIC_DEMO_PREVIEW');
    expect(body.data.scanRef).toMatch(/^SCAN-/);
  });
});
