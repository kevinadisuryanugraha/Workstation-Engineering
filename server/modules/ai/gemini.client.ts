import fs from 'fs/promises';
import path from 'path';
// Type-only import: erased at runtime — prevents @google/genai from loading during
// module import (pola 16.4: vitest crash pada bundled ESM-nya).
import type { GoogleGenAI } from '@google/genai';

/**
 * Gemini real-scan client (Story 21.1 — Course Correction 6, aktivasi Fase V2).
 * Analisis kode nyata via Gemini — AI adalah analis, bukan otoritas (Master PRD):
 * findings hasil scan tetap masuk lifecycle PENDING dan divalidasi manusia.
 *
 * Kontrak penting:
 * - Placeholder/missing GEMINI_API_KEY → factory mengembalikan null (fallback demo, AC #4);
 * - Timeout panggilan 60 detik via AbortSignal (AC: error API → fallback, tanpa crash);
 * - Konteks repo dipangkas: skip node_modules/.git/dist/lockfile, maks ±40KB total;
 * - Token/kunci tidak pernah masuk log.
 */

export const DEFAULT_SCAN_MODEL = 'gemini-2.5-flash';
export const GEMINI_SCAN_TIMEOUT_MS = 60_000;

/** Nilai kunci yang dianggap TIDAK tersedia (placeholder .env.example dsb.). */
const PLACEHOLDER_KEYS = new Set([
  '',
  'my_gemini_api_key',
  'your-api-key',
  'your_api_key',
  'changeme',
  'change-me',
]);

export function isRealGeminiKey(key: string | undefined | null): boolean {
  if (!key) return false;
  return !PLACEHOLDER_KEYS.has(key.trim().toLowerCase());
}

export interface GeminiScanClient {
  model: string;
  /** Mengirim prompt terstruktur, mengembalikan teks mentah respons model. */
  generate(prompt: string): Promise<string>;
}

/**
 * Factory client injectable — null bila kunci tidak tersedia/placeholder (AC #1, #4).
 * `injectSdk` untuk test tanpa memuat @google/genai.
 */
export async function createGeminiScanClient(
  env: Record<string, string | undefined> = process.env,
  injectSdk?: (apiKey: string) => { models: { generateContent: (args: any) => Promise<any> } },
): Promise<GeminiScanClient | null> {
  const key = env.GEMINI_API_KEY;
  if (!isRealGeminiKey(key)) return null;
  const model = (env.AI_SCAN_MODEL ?? '').trim() || DEFAULT_SCAN_MODEL;
  const sdk = injectSdk
    ? injectSdk(key!.trim())
    : (await import('@google/genai')).GoogleGenAI;
  const client = (injectSdk ? sdk : new (sdk as new (o: { apiKey: string }) => GoogleGenAI)({ apiKey: key!.trim() })) as {
    models: { generateContent: (args: any) => Promise<any> };
  };
  return {
    model,
    async generate(prompt: string): Promise<string> {
      const res = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          abortSignal: AbortSignal.timeout(GEMINI_SCAN_TIMEOUT_MS),
        },
      });
      return res.text ?? '';
    },
  };
}

// ===== Konteks repo (pohon terbatas + cuplikan file penting, maks ±40KB) =====

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'dev-dist', 'coverage', '.pi', 'deploy']);
const SKIP_FILES = new Set(['bun.lock', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.env', '.env.local']);
const TEXT_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.sql', '.css', '.html', '.yaml', '.yml', '.sh', '.env.example']);
const MAX_TOTAL_BYTES = 40 * 1024;
const MAX_FILE_BYTES = 8 * 1024;
const MAX_DEPTH = 4;
const MAX_FILES = 120;

export interface RepoSnippet {
  path: string;
  content: string;
}

/** Jalan berjalan (walk) repositori secara deterministik — hanya file teks kecil, batas total ±40KB. */
export async function collectRepoContext(
  root: string = process.cwd(),
  opts: { maxTotalBytes?: number } = {},
): Promise<RepoSnippet[]> {
  const maxTotal = opts.maxTotalBytes ?? MAX_TOTAL_BYTES;
  const snippets: RepoSnippet[] = [];
  let total = 0;

  const walk = async (dir: string, depth: number): Promise<void> => {
    if (depth > MAX_DEPTH || total >= maxTotal || snippets.length >= MAX_FILES) return;
    const entries = await fs.readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (total >= maxTotal || snippets.length >= MAX_FILES) return;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        await walk(full, depth + 1);
        continue;
      }
      if (!entry.isFile()) continue;
      if (SKIP_FILES.has(entry.name)) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (ext && !TEXT_EXT.has(ext)) continue;
      try {
        const stat = await fs.stat(full);
        if (stat.size > MAX_FILE_BYTES) continue;
        const content = await fs.readFile(full, 'utf-8');
        const sliced = content.length > MAX_FILE_BYTES ? content.slice(0, MAX_FILE_BYTES) : content;
        snippets.push({ path: path.relative(root, full), content: sliced });
        total += sliced.length;
      } catch {
        /* file tak terbaca (permission/removed) — lewati tanpa gagal */
      }
    }
  };

  await walk(root, 0).catch(() => {
    /* root tidak terbaca (mis. test) — konteks kosong, tidak crash */
  });
  return snippets;
}

// ===== Prompt & parse (AC #1, #2) =====

const SEVERITY_ENUM = ['Low', 'Medium', 'High', 'Critical'] as const;
const FINDING_CATEGORIES = ['Architecture', 'Security', 'Performance', 'Code Quality', 'Testing', 'Documentation', 'Operational'];

/** Prompt terstruktur: ringkasan repo → JSON findings/rekomendasi sesuai skema eksisting. */
export function buildScanPrompt(snippets: RepoSnippet[], focusArea?: string | null): string {
  const context = snippets
    .map((s) => `--- FILE: ${s.path} ---\n${s.content}`)
    .join('\n\n');
  return [
    'You are a senior software analyst reviewing the WORKSTATION codebase.',
    'Analyze the repository summary below and respond ONLY with JSON matching this exact schema:',
    '{',
    '  "findings": [ { "id": "FND-<n>", "title": string, "category": "Architecture"|"Security"|"Performance"|"Code Quality"|"Testing"|"Documentation"|"Operational", "severity": "Low"|"Medium"|"High"|"Critical", "confidence": number(0-1), "affectedFile": string, "evidence": string, "impact": string, "suggestedRemediation": string } ],',
    '  "recommendations": [ { "id": "REC-<n>", "title": string, "reason": string, "expectedImpact": string, "effortEstimate": string, "affectedModule": string, "confidence": number(0-1) } ]',
    '}',
    focusArea ? `Focus area: ${focusArea}.` : '',
    'Rules: findings must cite real files from the context; confidence reflects evidence strength; no prose outside JSON.',
    '',
    'REPOSITORY CONTEXT:',
    context,
  ]
    .filter(Boolean)
    .join('\n');
}

function clampConfidence(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  if (n < 0 || n > 1) return null;
  return n;
}

function normalizeSeverity(v: unknown): string | null {
  const s = String(v ?? '').trim().toLowerCase();
  const hit = SEVERITY_ENUM.find((e) => e.toLowerCase() === s);
  return hit ?? null;
}

export interface ParsedScanOutput {
  findings: any[];
  recommendations: any[];
  droppedFindings: number;
  droppedRecommendations: number;
}

/**
 * Parsing + validasi output model (AC #2): buang entri tidak valid dengan log;
 * pemanggil memutuskan fallback bila hasil bersih = 0 entri.
 */
export function parseScanOutput(
  raw: string,
  log: (msg: string) => void = (m) => console.log(`[GeminiScan] ${m}`),
): ParsedScanOutput {
  // Tangani JSON dibungkus code fence ```json ... ```
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : raw;
  let parsedJson: any;
  try {
    parsedJson = JSON.parse(body.trim());
  } catch {
    log('Output model bukan JSON valid — seluruh output dibuang.');
    return { findings: [], recommendations: [], droppedFindings: 0, droppedRecommendations: 0 };
  }

  const out: ParsedScanOutput = { findings: [], recommendations: [], droppedFindings: 0, droppedRecommendations: 0 };

  for (const [idx, f] of (Array.isArray(parsedJson.findings) ? parsedJson.findings : []).entries()) {
    const severity = normalizeSeverity(f?.severity);
    const confidence = clampConfidence(f?.confidence);
    if (typeof f?.title !== 'string' || !f.title.trim() || !severity || confidence === null) {
      out.droppedFindings += 1;
      log(`Finding #${idx + 1} tidak valid (title/severity/confidence) — dibuang.`);
      continue;
    }
    out.findings.push({
      id: typeof f.id === 'string' && f.id ? f.id : `FND-${idx + 1}`,
      title: f.title.trim().slice(0, 255),
      category: FINDING_CATEGORIES.includes(f?.category) ? f.category : 'Code Quality',
      severity,
      confidence,
      affectedFile: typeof f.affectedFile === 'string' && f.affectedFile ? f.affectedFile.slice(0, 255) : null,
      evidence: typeof f.evidence === 'string' ? f.evidence : null,
      impact: typeof f.impact === 'string' ? f.impact : null,
      suggestedRemediation: typeof f.suggestedRemediation === 'string' ? f.suggestedRemediation : null,
    });
  }

  for (const [idx, r] of (Array.isArray(parsedJson.recommendations) ? parsedJson.recommendations : []).entries()) {
    const confidence = clampConfidence(r?.confidence);
    if (typeof r?.title !== 'string' || !r.title.trim() || confidence === null) {
      out.droppedRecommendations += 1;
      log(`Rekomendasi #${idx + 1} tidak valid (title/confidence) — dibuang.`);
      continue;
    }
    out.recommendations.push({
      id: typeof r.id === 'string' && r.id ? r.id : `REC-${idx + 1}`,
      title: r.title.trim().slice(0, 255),
      reason: typeof r.reason === 'string' ? r.reason : null,
      expectedImpact: typeof r.expectedImpact === 'string' ? r.expectedImpact.slice(0, 255) : null,
      effortEstimate: typeof r.effortEstimate === 'string' ? r.effortEstimate.slice(0, 60) : null,
      affectedModule: typeof r.affectedModule === 'string' ? r.affectedModule.slice(0, 150) : null,
      confidence,
    });
  }

  return out;
}
