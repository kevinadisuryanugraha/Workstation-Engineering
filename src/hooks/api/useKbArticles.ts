import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/apiClient.ts';
import { KnowledgeArticle } from '../../types.ts';

/**
 * Story 18.3 (CC-5) — Knowledge Base client hook + DTO→UI mapper.
 *
 * Sumber data nyata: GET /api/v1/kb (Story 15.1 — versioning + draft dari
 * tiket resolved). Mapper pure & testable; kategori tanpa padanan DB
 * diturunkan dari tags bila memungkinkan, selain itu default netral.
 */

export interface KbArticleDto {
  id: string;
  slug: string;
  title: string;
  body: string;
  tags: string[];
  version: number;
  ownerName: string;
  sourceTicketKey: string | null;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES: KnowledgeArticle['category'][] = [
  'Troubleshooting',
  'Infrastructure',
  'Architecture',
  'Deployment Guide',
];

/** Kategori diturunkan dari tag yang cocok (case-insensitive); default netral. */
export function deriveCategory(tags: string[]): KnowledgeArticle['category'] {
  const normalized = (t: string) => t.trim().toLowerCase();
  const hit = CATEGORIES.find((c) => (tags ?? []).some((t) => normalized(t) === c.toLowerCase()));
  return hit ?? 'Troubleshooting';
}

export function mapKbArticleDto(dto: KbArticleDto): KnowledgeArticle {
  return {
    id: dto.id,
    title: dto.title,
    category: deriveCategory(dto.tags ?? []),
    originTicketCode: dto.sourceTicketKey ?? undefined,
    author: dto.ownerName,
    content: dto.body,
    tags: dto.tags ?? [],
    lastUpdated: dto.updatedAt,
  };
}

export function useKbArticles(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['kbArticles'],
    queryFn: async () => {
      const payload = await apiRequest<{ articles: KbArticleDto[]; count: number }>('/api/v1/kb');
      return payload.articles;
    },
    enabled: options.enabled ?? true,
    staleTime: 60_000,
  });
}
