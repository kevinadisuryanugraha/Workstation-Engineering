import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/apiClient.ts';

/**
 * Story 18.6 (CC-5) — Global search client hook.
 *
 * Sumber data nyata: GET /api/v1/search?q= (Story 15.2) — debounce ±250ms,
 * minimal 2 karakter (sesuai validasi server), fetch hanya saat modal
 * terbuka + query valid + boot real.
 */

export interface SearchResultItem {
  entityType: 'ticket' | 'work_item' | 'kb_article' | 'incident';
  ref: string; // key / code / slug
  title: string;
  projectId: string | null;
  status: string | null;
  timestamp: string | null;
  snippet: string | null;
}

export interface GlobalSearchPayload {
  query: string;
  results: SearchResultItem[];
  total: number;
}

export const MIN_QUERY_LENGTH = 2;
export const DEBOUNCE_MS = 250;

/** Query siap dikirim? (pure — mirror validasi server: min 2 karakter) */
export function isQueryReady(raw: string): boolean {
  return raw.trim().length >= MIN_QUERY_LENGTH;
}

/** URL pencarian (pure — testable tanpa fetch). */
export function buildSearchUrl(raw: string): string {
  return `/api/v1/search?q=${encodeURIComponent(raw.trim())}`;
}

/** Tab tujuan navigasi per tipe entitas hasil pencarian. */
export function searchTabFor(entityType: SearchResultItem['entityType']): string {
  switch (entityType) {
    case 'ticket':
      return 'tickets';
    case 'work_item':
      return 'workitems';
    case 'kb_article':
      return 'knowledge';
    case 'incident':
      return 'incidents';
  }
}

/** Debounce value sederhana (menghindari request per ketikan). */
export function useDebounced(value: string, delayMs: number = DEBOUNCE_MS): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function useGlobalSearch(rawQuery: string, options: { enabled?: boolean } = {}) {
  const debounced = useDebounced(rawQuery);
  const ready = options.enabled ?? true;
  const query = debounced.trim();
  return useQuery({
    queryKey: ['globalSearch', query],
    queryFn: () => apiRequest<GlobalSearchPayload>(buildSearchUrl(query)),
    enabled: ready && isQueryReady(query),
    staleTime: 10_000,
  });
}
