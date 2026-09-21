import { describe, it, expect, vi } from 'vitest';

/**
 * Story 21.2 (CC-6) — AI Real UI: pemetaan badge per mode, filter riwayat,
 * dan guard mode tak dikenal (prinsip SEC-05 + HOTFIX #4).
 * Lingkungan test = node (tanpa DOM) — util murni + mapper + kontrak endpoint
 * diuji REAL; vi.mock apiClient memutus rantai import auth.ts (localStorage).
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'workstation-test-secret-min-32-chars-long-security-token';

vi.mock('../src/lib/apiClient.ts', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {},
}));

import {
  aiModeBadge,
  isDemoScanMode,
  SCAN_MODE_FILTERS,
  scanModeFilterParam,
  aiScansEndpoint,
} from '../src/lib/aiMode.ts';
import { mapScanSummaryDto, AiScanSummaryDto } from '../src/hooks/api/useAiIntel.ts';

describe('Story 21.2 / AC #1 — aiModeBadge: pemetaan badge per mode', () => {
  it('REAL_GEMINI → badge aksen positif "Gemini Real"', () => {
    const b = aiModeBadge('REAL_GEMINI');
    expect(b.label).toBe('Gemini Real');
    expect(b.variant).toBe('success');
    expect(b.testId).toBe('ai-mode-badge-real-gemini');
  });

  it('STATIC_DEMO_PREVIEW → badge peringatan "Demo Statis"', () => {
    const b = aiModeBadge('STATIC_DEMO_PREVIEW');
    expect(b.label).toBe('Demo Statis');
    expect(b.variant).toBe('warning');
    expect(b.testId).toBe('ai-mode-badge-demo');
  });

  it('LIVE_ANALYSIS (mode legacy server.ts) → analisis nyata, bukan demo', () => {
    const b = aiModeBadge('LIVE_ANALYSIS');
    expect(b.label).toBe('Analisis Live');
    expect(b.variant).toBe('cyan');
    expect(isDemoScanMode('LIVE_ANALYSIS')).toBe(false);
  });

  it('guard: mode tak dikenal → badge netral, label jujur, TANPA crash (HOTFIX #4)', () => {
    const b = aiModeBadge('SOME_FUTURE_MODE');
    expect(b.variant).toBe('secondary');
    expect(b.label).toBe('Mode Tidak Dikenal');
    expect(b.key).toBe('SOME_FUTURE_MODE');
  });

  it('guard: null / undefined / empty → badge netral tanpa crash', () => {
    for (const raw of [null, undefined, '']) {
      expect(() => aiModeBadge(raw)).not.toThrow();
      expect(aiModeBadge(raw).variant).toBe('secondary');
    }
  });

  it('guard: mode dengan spasi (data kotor) → tetap terpetakan', () => {
    expect(aiModeBadge('  REAL_GEMINI  ').label).toBe('Gemini Real');
  });
});

describe('Story 21.2 / AC #4 — isDemoScanMode hanya untuk STATIC_DEMO_PREVIEW', () => {
  it('demo jujur: hanya STATIC_DEMO_PREVIEW yang dianggap demo', () => {
    expect(isDemoScanMode('STATIC_DEMO_PREVIEW')).toBe(true);
    expect(isDemoScanMode('REAL_GEMINI')).toBe(false);
    expect(isDemoScanMode('LIVE_ANALYSIS')).toBe(false);
    expect(isDemoScanMode(null)).toBe(false);
    expect(isDemoScanMode(undefined)).toBe(false);
  });
});

describe('Story 21.2 / AC #2 — filter riwayat (Semua / Real / Demo)', () => {
  it('daftar filter: default pertama = Semua (perilaku lama tidak berubah)', () => {
    expect(SCAN_MODE_FILTERS.map((f) => f.key)).toEqual(['ALL', 'REAL', 'DEMO']);
    expect(SCAN_MODE_FILTERS[0].label).toBe('Semua');
  });

  it('pemetaan filter → query param mode (server 16.1/21.1 memfilter di DB)', () => {
    expect(scanModeFilterParam('ALL')).toBeUndefined();
    expect(scanModeFilterParam('REAL')).toBe('REAL_GEMINI');
    expect(scanModeFilterParam('DEMO')).toBe('STATIC_DEMO_PREVIEW');
  });

  it('guard: filter key tak dikenal / null → undefined (perilaku = Semua, tanpa crash)', () => {
    expect(scanModeFilterParam('WEIRD')).toBeUndefined();
    expect(scanModeFilterParam(null)).toBeUndefined();
    expect(scanModeFilterParam(undefined)).toBeUndefined();
  });

  it('kontrak endpoint: ALL tanpa query param; REAL/DEMO dengan param ter-encode', () => {
    expect(aiScansEndpoint(undefined)).toBe('/api/v1/ai/scans');
    expect(aiScansEndpoint('REAL_GEMINI')).toBe('/api/v1/ai/scans?mode=REAL_GEMINI');
    expect(aiScansEndpoint('STATIC_DEMO_PREVIEW')).toBe('/api/v1/ai/scans?mode=STATIC_DEMO_PREVIEW');
  });
});

describe('Story 21.2 / AC #1 + #5 — mapScanSummaryDto: mapper riwayat + guard', () => {
  const DTO: AiScanSummaryDto = {
    id: 'scan-uuid-1',
    scanRef: 'SCAN-A1B2C3',
    mode: 'REAL_GEMINI',
    model: 'gemini-2.5-flash',
    projectName: 'WORKSTATION',
    focusArea: 'Security',
    scannedBy: 'Kevin',
    createdAt: '2026-09-19T10:00:00.000Z',
    findings: [{}, {}, {}],
    recommendations: [{}],
  };

  it('memetakan field nyata: mode, model, jumlah findings', () => {
    const s = mapScanSummaryDto(DTO);
    expect(s.scanRef).toBe('SCAN-A1B2C3');
    expect(s.mode).toBe('REAL_GEMINI');
    expect(s.model).toBe('gemini-2.5-flash');
    expect(s.findingsCount).toBe(3);
    expect(s.createdAt).toBe('2026-09-19T10:00:00.000Z');
  });

  it('guard: mode tak dikenal dari server → diteruskan mentah, mapper tetap aman', () => {
    const s = mapScanSummaryDto({ ...DTO, mode: 'MYSTERY_MODE' });
    expect(s.mode).toBe('MYSTERY_MODE');
    expect(aiModeBadge(s.mode).variant).toBe('secondary');
  });

  it('guard: findings non-array → findingsCount 0, tanpa crash', () => {
    const s = mapScanSummaryDto({ ...DTO, findings: undefined as unknown as unknown[] });
    expect(s.findingsCount).toBe(0);
  });

  it('guard: field nullable/absen → placeholder jujur, tanpa crash', () => {
    const s = mapScanSummaryDto({
      ...DTO,
      projectName: null,
      focusArea: null,
      scannedBy: undefined as unknown as string,
      createdAt: undefined as unknown as string,
      model: undefined as unknown as string,
    });
    expect(s.projectName).toBe('—');
    expect(s.focusArea).toBe('—');
    expect(s.scannedBy).toBe('unknown');
    expect(s.createdAt).toBe('');
    expect(s.model).toBe('—');
  });

  it('AC #5: daftar kosong → array kosong (empty state di UI, bukan crash)', () => {
    const empty: AiScanSummaryDto[] = [];
    const mapped = empty.map(mapScanSummaryDto);
    expect(mapped).toEqual([]);
  });
});
