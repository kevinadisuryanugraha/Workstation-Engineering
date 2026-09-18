import { eq } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { generatedReports } from '../../db/schema/generated_reports.ts';
// Type-only import: erased at runtime — prevents @google/genai from loading during
// module import (vitest partial-mocks crashed on its bundled ESM output).
import type { GoogleGenAI } from '@google/genai';

/**
 * AI report translation (Story 16.4 — FR-021, NFR-006).
 * Without GEMINI_API_KEY: no network call at all, clean 503 (cost = 0).
 * Source markdown is never overwritten — translation stored separately.
 */

export const SUPPORTED_TARGET_LANGUAGES = ['en', 'id'] as const;
export type TargetLanguage = (typeof SUPPORTED_TARGET_LANGUAGES)[number];

export class AiNotConfiguredError extends Error {
  constructor() {
    super('GEMINI_API_KEY is not configured — AI translation is unavailable');
    this.name = 'AiNotConfiguredError';
  }
}

export class TranslationFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranslationFailedError';
  }
}

const LANGUAGE_LABELS: Record<TargetLanguage, string> = {
  en: 'English',
  id: 'Bahasa Indonesia',
};

/** Pure prompt builder — exported for tests. */
export function buildTranslationPrompt(markdown: string, target: TargetLanguage): string {
  return [
    `Translate the following management report into ${LANGUAGE_LABELS[target]}.`,
    `STRICT RULES:`,
    `- Keep the Markdown structure (headings, lists, tables, bold) exactly as-is.`,
    `- Keep all numbers, percentages, dates, codes (INC-, SCAN-, WRK-), and table layout unchanged.`,
    `- Translate only the narrative text.`,
    ``,
    `REPORT:`,
    markdown,
  ].join('\n');
}

let client: GoogleGenAI | null = null;

async function getClient(): Promise<GoogleGenAI> {
  if (!client) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.trim().length === 0) throw new AiNotConfiguredError();
    // Dynamic import: loads the SDK only when a real API call is needed.
    const { GoogleGenAI } = await import('@google/genai');
    client = new GoogleGenAI({ apiKey: key.trim() });
  }
  return client;
}

/** Calls Gemini to translate; injectable for tests via `aiClient`. */
export async function translateMarkdown(
  markdown: string,
  target: TargetLanguage,
  aiClient?: { models: { generateContent: (args: any) => Promise<{ text: string }> } }
): Promise<string> {
  const ai = aiClient ?? (await getClient()); // throws AiNotConfiguredError when no key & no injection
  const MODEL_CHAIN = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];
  let lastError: unknown = null;
  for (const model of MODEL_CHAIN) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: buildTranslationPrompt(markdown, target),
        config: { temperature: 0.2 },
      });
      const text = (response.text ?? '').trim();
      if (!text) throw new TranslationFailedError('Gemini returned an empty translation');
      return text;
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new TranslationFailedError(`Semua model AI gagal: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

export class ReportTranslationService {
  /** Translates an archived report and stores the translation alongside the source (AC 16.4.1, 16.4.2). */
  async translateArchived(
    reportId: string,
    target: TargetLanguage,
    aiClient?: { models: { generateContent: (args: any) => Promise<{ text: string }> } }
  ): Promise<{ id: string; translationMarkdown: string; translationLanguage: string; sourcePreserved: true } | null> {
    const rows = await db.select().from(generatedReports).where(eq(generatedReports.id, reportId)).limit(1);
    if (rows.length === 0) return null;
    const report = rows[0];

    const translated = await translateMarkdown(report.contentMarkdown, target, aiClient);

    await db
      .update(generatedReports)
      .set({ translationMarkdown: translated, translationLanguage: target })
      .where(eq(generatedReports.id, reportId));

    return { id: report.id, translationMarkdown: translated, translationLanguage: target, sourcePreserved: true };
  }
}

export const reportTranslationService = new ReportTranslationService();
