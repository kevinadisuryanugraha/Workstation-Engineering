import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/apiClient.ts';
import { AIFinding, AIRecommendation } from '../../types.ts';
import { aiScansEndpoint } from '../../lib/aiMode.ts';

/**
 * Story 18.5 (CC-5) — AI intelligence client hooks + DTO→UI mappers.
 *
 * Sumber data nyata: GET /api/v1/ai/findings & /api/v1/ai/recommendations
 * (Epic 16 — snapshot persisten + lifecycle tervalidasi manusia).
 * Mapper normalisasi kasus dengan fallback jujur; technicalDebts TIDAK
 * punya endpoint → dibiarkan kosong di boot real (lihat story 18.5 AC4).
 */

export interface AiFindingDto {
  id: string;
  snapshotId: string;
  scanRef: string;
  findingRef: string;
  title: string;
  category: string;
  severity: string;
  confidence: number;
  affectedFile: string | null;
  evidence: string | null;
  impact: string | null;
  suggestedRemediation: string | null;
  status: string;
  detectedAt: string;
}

export interface AiRecommendationDto {
  id: string;
  recRef: string;
  title: string;
  reason: string | null;
  expectedImpact: string | null;
  effortEstimate: string | null;
  affectedModule: string | null;
  confidence: number;
  convertedWorkItemKey: string | null;
  converted: boolean;
}

const FINDING_CATEGORIES: AIFinding['category'][] = [
  'Architecture',
  'Security',
  'Performance',
  'Testing',
  'Documentation',
];

const FINDING_SEVERITIES: AIFinding['severity'][] = ['Critical', 'High', 'Medium', 'Low'];

const FINDING_STATUSES: AIFinding['status'][] = [
  'PENDING',
  'CONFIRMED',
  'REJECTED',
  'RESOLVED',
  'FALSE_POSITIVE',
];

function normalizeUnion<T extends string>(raw: string, allowed: T[], fallback: T): T {
  const hit = allowed.find((a) => a.toLowerCase() === String(raw ?? '').trim().toLowerCase());
  return hit ?? fallback;
}

export function mapFindingDto(dto: AiFindingDto): AIFinding {
  return {
    id: dto.id,
    scanId: dto.scanRef,
    title: dto.title,
    category: normalizeUnion(dto.category, FINDING_CATEGORIES, 'Architecture'),
    severity: normalizeUnion(dto.severity, FINDING_SEVERITIES, 'Medium'),
    confidence: dto.confidence,
    affectedFile: dto.affectedFile ?? '—',
    evidence: dto.evidence ?? '',
    impact: dto.impact ?? '',
    suggestedRemediation: dto.suggestedRemediation ?? '',
    status: normalizeUnion(dto.status, FINDING_STATUSES, 'PENDING'),
    detectedAt: dto.detectedAt,
  };
}

export function mapRecommendationDto(dto: AiRecommendationDto): AIRecommendation {
  return {
    id: dto.id,
    title: dto.title,
    reason: dto.reason ?? '',
    expectedImpact: dto.expectedImpact ?? '',
    effortEstimate: dto.effortEstimate ?? '—',
    affectedModule: dto.affectedModule ?? '—',
    confidence: dto.confidence,
    convertedToWorkItem: dto.convertedWorkItemKey ?? undefined,
  };
}

export function useAiFindings(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['aiFindings'],
    queryFn: async () => {
      const payload = await apiRequest<{ findings: AiFindingDto[]; count: number }>('/api/v1/ai/findings');
      return payload.findings;
    },
    enabled: options.enabled ?? true,
    staleTime: 30_000,
  });
}

export function useAiRecommendations(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['aiRecommendations'],
    queryFn: async () => {
      const payload = await apiRequest<{ recommendations: AiRecommendationDto[]; count: number }>(
        '/api/v1/ai/recommendations'
      );
      return payload.recommendations;
    },
    enabled: options.enabled ?? true,
    staleTime: 30_000,
  });
}

/**
 * Story 21.2 (CC-6) — Riwayat scan snapshot dari GET /api/v1/ai/scans (16.1/21.1).
 * Filter mode diteruskan sebagai query param (server memfilter di DB — bukan
 * client-side, sesuai kode aktual server). Guard unknown/empty di mapper.
 */
export interface AiScanSummaryDto {
  id: string;
  scanRef: string;
  mode: string;
  model: string;
  projectName: string | null;
  focusArea: string | null;
  scannedBy: string;
  createdAt: string;
  findings: unknown[];
  recommendations: unknown[];
}

export interface AiScanSummary {
  id: string;
  scanRef: string;
  mode: string;
  model: string;
  projectName: string;
  focusArea: string;
  scannedBy: string;
  createdAt: string;
  findingsCount: number;
}

export function mapScanSummaryDto(dto: AiScanSummaryDto): AiScanSummary {
  return {
    id: dto.id,
    scanRef: dto.scanRef,
    mode: typeof dto.mode === 'string' ? dto.mode : 'UNKNOWN',
    model: dto.model ?? '—',
    projectName: dto.projectName ?? '—',
    focusArea: dto.focusArea ?? '—',
    scannedBy: dto.scannedBy ?? 'unknown',
    createdAt: dto.createdAt ?? '',
    findingsCount: Array.isArray(dto.findings) ? dto.findings.length : 0,
  };
}

export function useAiScans(options: { mode?: string; enabled?: boolean; limit?: number } = {}) {
  const modeParam = options.mode;
  return useQuery({
    queryKey: ['aiScans', modeParam ?? 'ALL'],
    queryFn: async () => {
      const endpoint = aiScansEndpoint(modeParam);
      const payload = await apiRequest<AiScanSummaryDto[]>(
        `${endpoint}${endpoint.includes('?') ? '&' : '?'}limit=${options.limit ?? 20}`
      );
      return Array.isArray(payload) ? payload : [];
    },
    enabled: options.enabled ?? true,
    staleTime: 15_000,
  });
}
