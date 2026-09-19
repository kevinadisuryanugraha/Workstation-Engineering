import { describe, it, expect, vi } from 'vitest';

/**
 * Story 18.5 — AI intelligence client wiring (CC-5): mapper DTO→UI.
 * vi.mock apiClient memutus rantai import auth.ts (localStorage) di node.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'workstation-test-secret-min-32-chars-long-security-token';

vi.mock('../src/lib/apiClient.ts', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {},
}));

import { mapFindingDto, mapRecommendationDto, AiFindingDto } from '../src/hooks/api/useAiIntel.ts';

const FINDING_DTO: AiFindingDto = {
  id: 'f-1',
  snapshotId: 'snap-1',
  scanRef: 'SCAN-A1B2C3',
  findingRef: 'F-01',
  title: 'JWT secret hardcoded',
  category: 'Security',
  severity: 'Critical',
  confidence: 0.92,
  affectedFile: 'server/config/auth.ts',
  evidence: 'const secret = "..."',
  impact: 'Token dapat dipalsukan',
  suggestedRemediation: 'Pindahkan ke env',
  status: 'CONFIRMED',
  detectedAt: '2026-09-19T05:30:00Z',
};

describe('Story 18.5 — mapFindingDto', () => {
  it('memetakan field nyata 1:1', () => {
    const ui = mapFindingDto(FINDING_DTO);
    expect(ui.id).toBe('f-1');
    expect(ui.scanId).toBe('SCAN-A1B2C3');
    expect(ui.severity).toBe('Critical');
    expect(ui.category).toBe('Security');
    expect(ui.status).toBe('CONFIRMED');
    expect(ui.confidence).toBe(0.92);
  });

  it('normalisasi kasus (DB lowercase → UI capitalized)', () => {
    const ui = mapFindingDto({ ...FINDING_DTO, severity: 'high', status: 'pending', category: 'performance' });
    expect(ui.severity).toBe('High');
    expect(ui.status).toBe('PENDING');
    expect(ui.category).toBe('Performance');
  });

  it('nilai di luar union → fallback jujur (Medium/PENDING), bukan error', () => {
    const ui = mapFindingDto({ ...FINDING_DTO, severity: 'catastrophic', status: 'weird' });
    expect(ui.severity).toBe('Medium');
    expect(ui.status).toBe('PENDING');
  });

  it('field nullable → placeholder jujur', () => {
    const ui = mapFindingDto({
      ...FINDING_DTO,
      affectedFile: null,
      evidence: null,
      impact: null,
      suggestedRemediation: null,
    });
    expect(ui.affectedFile).toBe('—');
    expect(ui.evidence).toBe('');
  });
});

describe('Story 18.5 — mapRecommendationDto', () => {
  it('memetakan rekomendasi + status konversi nyata', () => {
    const ui = mapRecommendationDto({
      id: 'r-1',
      recRef: 'R-01',
      title: 'Tambah rate limit',
      reason: 'Endpoint publik tanpa limit',
      expectedImpact: 'Mitigasi brute force',
      effortEstimate: '2h',
      affectedModule: 'server.ts',
      confidence: 0.8,
      convertedWorkItemKey: 'WRK-210',
      converted: true,
    });
    expect(ui.convertedToWorkItem).toBe('WRK-210');
    expect(ui.affectedModule).toBe('server.ts');
  });

  it('rekomendasi belum dikonversi = undefined (bukan string kosong palsu)', () => {
    const ui = mapRecommendationDto({
      id: 'r-2',
      recRef: 'R-02',
      title: 'x',
      reason: null,
      expectedImpact: null,
      effortEstimate: null,
      affectedModule: null,
      confidence: 0.5,
      convertedWorkItemKey: null,
      converted: false,
    });
    expect(ui.convertedToWorkItem).toBeUndefined();
    expect(ui.effortEstimate).toBe('—');
  });
});
