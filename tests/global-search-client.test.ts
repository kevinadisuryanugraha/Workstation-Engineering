import { describe, it, expect, vi } from 'vitest';

/**
 * Story 18.6 — Global search client wiring (CC-5): pure helpers.
 * vi.mock apiClient memutus rantai import auth.ts (localStorage) di node.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'workstation-test-secret-min-32-chars-long-security-token';

vi.mock('../src/lib/apiClient.ts', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {},
}));

import {
  isQueryReady,
  buildSearchUrl,
  searchTabFor,
  MIN_QUERY_LENGTH,
} from '../src/hooks/api/useGlobalSearch.ts';

describe('Story 18.6 — isQueryReady (gating konsisten dengan validasi server)', () => {
  it('minimal 2 karakter (setelah trim)', () => {
    expect(MIN_QUERY_LENGTH).toBe(2);
    expect(isQueryReady('')).toBe(false);
    expect(isQueryReady('  ')).toBe(false);
    expect(isQueryReady('w ')).toBe(false);
    expect(isQueryReady('wr')).toBe(true);
    expect(isQueryReady(' WRK-101 ')).toBe(true);
  });
});

describe('Story 18.6 — buildSearchUrl', () => {
  it('men-encode query dengan aman', () => {
    expect(buildSearchUrl('WRK-101')).toBe('/api/v1/search?q=WRK-101');
    expect(buildSearchUrl('  bug & fix  ')).toBe('/api/v1/search?q=bug%20%26%20fix');
  });
});

describe('Story 18.6 — searchTabFor (normalisasi hasil → navigasi)', () => {
  it('memetakan keempat tipe entitas ke tab yang benar', () => {
    expect(searchTabFor('ticket')).toBe('tickets');
    expect(searchTabFor('work_item')).toBe('workitems');
    expect(searchTabFor('kb_article')).toBe('knowledge');
    expect(searchTabFor('incident')).toBe('incidents');
  });
});
