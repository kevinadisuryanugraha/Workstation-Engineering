/**
 * Story 21.2 (CC-6) — Util mode hasil AI scan.
 *
 * Sumber nilai mode (server, story 16.1 + 21.1):
 *  - `REAL_GEMINI`         → scan Gemini nyata (21.1)  → badge aksen positif.
 *  - `STATIC_DEMO_PREVIEW` → fallback demo jujur (8.3) → badge peringatan.
 *  - `LIVE_ANALYSIS`       → mode legacy live (server.ts /api/ai/scan) → tetap
 *    analisis nyata (bukan demo), dilabeli berbeda agar jujur.
 *
 * Prinsip SEC-05/HOTFIX #4: seluruh derivasi dari data server WAJIB guard
 * unknown/empty — mode di luar ketiga nilai di atas tidak boleh membuat UI crash.
 */

export type AiScanModeValue = 'REAL_GEMINI' | 'STATIC_DEMO_PREVIEW' | 'LIVE_ANALYSIS';

export type AiModeFilterKey = 'ALL' | 'REAL' | 'DEMO';

export interface AiModeBadgeInfo {
  /** Nilai mode mentah (dipertahankan apa adanya, termasuk unknown). */
  key: string;
  /** Label manusiawi untuk badge. */
  label: string;
  /** Varian Badge UI; unknown → netral (secondary), bukan crash. */
  variant: 'success' | 'warning' | 'cyan' | 'secondary';
  /** data-testid stabil untuk test/audit. */
  testId: string;
}

const REAL_GEMINI_BADGE: AiModeBadgeInfo = {
  key: 'REAL_GEMINI',
  label: 'Gemini Real',
  variant: 'success',
  testId: 'ai-mode-badge-real-gemini',
};

const DEMO_BADGE: AiModeBadgeInfo = {
  key: 'STATIC_DEMO_PREVIEW',
  label: 'Demo Statis',
  variant: 'warning',
  testId: 'ai-mode-badge-demo',
};

const LIVE_LEGACY_BADGE: AiModeBadgeInfo = {
  key: 'LIVE_ANALYSIS',
  label: 'Analisis Live',
  variant: 'cyan',
  testId: 'ai-mode-badge-live',
};

const UNKNOWN_BADGE: AiModeBadgeInfo = {
  key: 'UNKNOWN',
  label: 'Mode Tidak Dikenal',
  variant: 'secondary',
  testId: 'ai-mode-badge-unknown',
};

/** Pemetaan mode → info badge. Guard: null/empty/tidak dikenal → badge netral. */
export function aiModeBadge(mode: string | null | undefined): AiModeBadgeInfo {
  const raw = typeof mode === 'string' ? mode.trim() : '';
  if (raw === 'REAL_GEMINI') return REAL_GEMINI_BADGE;
  if (raw === 'STATIC_DEMO_PREVIEW') return DEMO_BADGE;
  if (raw === 'LIVE_ANALYSIS') return LIVE_LEGACY_BADGE;
  return { ...UNKNOWN_BADGE, key: raw || UNKNOWN_BADGE.key };
}

/** Hanya STATIC_DEMO_PREVIEW yang dianggap demo — LIVE_ANALYSIS adalah analisis nyata (legacy). */
export function isDemoScanMode(mode: string | null | undefined): boolean {
  return (typeof mode === 'string' ? mode.trim() : '') === 'STATIC_DEMO_PREVIEW';
}

/** Daftar pilihan filter riwayat (default = Semua → perilaku lama tidak berubah). */
export const SCAN_MODE_FILTERS: ReadonlyArray<{ key: AiModeFilterKey; label: string }> = [
  { key: 'ALL', label: 'Semua' },
  { key: 'REAL', label: 'Real' },
  { key: 'DEMO', label: 'Demo' },
];

/**
 * Filter key → nilai query param `mode` untuk GET /api/v1/ai/scans
 * (server 16.1/21.1 memfilter di DB). ALL → undefined (tanpa param).
 * Guard: key tak dikenal → undefined (tanpa crash, perilaku = Semua).
 */
export function scanModeFilterParam(key: AiModeFilterKey | string | null | undefined): string | undefined {
  if (key === 'REAL') return 'REAL_GEMINI';
  if (key === 'DEMO') return 'STATIC_DEMO_PREVIEW';
  return undefined;
}

/** Endpoint riwayat scan dengan query param mode opsional (dipakai hook + test kontrak). */
export function aiScansEndpoint(modeParam?: string): string {
  return modeParam ? `/api/v1/ai/scans?mode=${encodeURIComponent(modeParam)}` : '/api/v1/ai/scans';
}
