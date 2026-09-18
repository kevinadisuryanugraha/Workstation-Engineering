import { describe, it, expect } from 'vitest';
import { buildStaticDemoPreview } from '../server/modules/ai/ai.fallback.ts';

/**
 * Story 8.3 — SEC-05: AI Scanner Demo Mode Integrity.
 * The heuristic fallback payload must be unambiguously labeled STATIC_DEMO_PREVIEW.
 */

describe('AI Scanner Demo Integrity (Story 8.3 / SEC-05)', () => {
  it('labels the fallback payload explicitly as STATIC_DEMO_PREVIEW', () => {
    const payload = buildStaticDemoPreview();
    expect(payload.mode).toBe('STATIC_DEMO_PREVIEW');
  });

  it('always defines the mode field — clients never have to guess', () => {
    const payload = buildStaticDemoPreview();
    expect(typeof payload.mode).toBe('string');
    expect(payload.mode.length).toBeGreaterThan(0);
    expect(['STATIC_DEMO_PREVIEW', 'LIVE_ANALYSIS']).toContain(payload.mode);
  });

  it('still carries the heuristic findings and recommendations structure', () => {
    const payload = buildStaticDemoPreview();
    expect(Array.isArray(payload.findings)).toBe(true);
    expect(payload.findings.length).toBeGreaterThan(0);
    expect(Array.isArray(payload.recommendations)).toBe(true);
    for (const finding of payload.findings) {
      expect(finding.id).toMatch(/^FND-/);
      expect(finding.title).toBeDefined();
      expect(finding.severity).toBeDefined();
      expect(finding.status).toBe('PENDING');
    }
    expect(payload.scanId).toMatch(/^SCAN-/);
  });

  it('source contract: live analysis path is labeled LIVE_ANALYSIS, never demo mode', async () => {
    const fs = await import('fs');
    const serverSource = fs.readFileSync('server.ts', 'utf-8');
    expect(serverSource).toContain('mode: "LIVE_ANALYSIS"');
    expect(serverSource).not.toContain('mode: "heuristic-fallback"');
    expect(serverSource).not.toContain('mode: "gemini-live"');
    expect(serverSource).toContain('buildStaticDemoPreview()');
  });
});
