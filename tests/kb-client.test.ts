import { describe, it, expect, vi } from 'vitest';

/**
 * Story 18.3 — KB client wiring (CC-5): mapper DTO→UI + derivasi kategori.
 * vi.mock apiClient memutus rantai import auth.ts (localStorage) di node.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'workstation-test-secret-min-32-chars-long-security-token';

vi.mock('../src/lib/apiClient.ts', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {},
}));

import { mapKbArticleDto, deriveCategory, KbArticleDto } from '../src/hooks/api/useKbArticles.ts';

const BASE_DTO: KbArticleDto = {
  id: 'kb-1',
  slug: 'reset-cache-nginx',
  title: 'Reset cache nginx',
  body: 'Langkah reset cache...',
  tags: ['nginx', 'cache'],
  version: 2,
  ownerName: 'Rina',
  sourceTicketKey: 'WRK-77',
  projectId: 'proj-1',
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-19T04:00:00Z',
};

describe('Story 18.3 — mapKbArticleDto', () => {
  it('memetakan field nyata + originTicketCode dari sourceTicketKey', () => {
    const ui = mapKbArticleDto(BASE_DTO);
    expect(ui.title).toBe('Reset cache nginx');
    expect(ui.author).toBe('Rina');
    expect(ui.content).toBe('Langkah reset cache...');
    expect(ui.originTicketCode).toBe('WRK-77');
    expect(ui.lastUpdated).toBe('2026-09-19T04:00:00Z');
    expect(ui.tags).toEqual(['nginx', 'cache']);
  });

  it('kategori diturunkan dari tag yang cocok (case-insensitive)', () => {
    expect(deriveCategory(['nginx', 'infrastructure'])).toBe('Infrastructure');
    expect(deriveCategory(['Deployment guide'])).toBe('Deployment Guide');
    expect(mapKbArticleDto({ ...BASE_DTO, tags: ['architecture'] }).category).toBe('Architecture');
  });

  it('kategori tanpa kecocokan = default netral Troubleshooting (bukan karangan)', () => {
    expect(deriveCategory(['nginx', 'cache'])).toBe('Troubleshooting');
    expect(mapKbArticleDto({ ...BASE_DTO, tags: [] }).category).toBe('Troubleshooting');
  });

  it('article tanpa tiket asal = tanpa originTicketCode (undefined, bukan string palsu)', () => {
    const ui = mapKbArticleDto({ ...BASE_DTO, sourceTicketKey: null });
    expect(ui.originTicketCode).toBeUndefined();
  });
});
