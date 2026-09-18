import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { aiScans, aiFindings, AiScan } from '../../db/schema/ai_scans.ts';
import { aiRecommendations, AiRecommendation } from '../../db/schema/ai_recommendations.ts';
import { buildStaticDemoPreview } from './ai.fallback.ts';
import { auditService } from '../audit/audit.service.ts';
import crypto from 'crypto';

/**
 * AI intelligence service (Epic 16 — FR-019/FR-020).
 * Scan persistence (live & demo), finding lifecycle, recommendation conversion.
 * Principle: AI as analyst, not authority — humans validate every state change.
 */

export interface ScanFindingRow {
  id: string;
  findingRef: string;
  title: string;
  category: string;
  severity: string;
  confidence: number;
  affectedFile: string | null;
  status: string;
}

/** Forward-only finding state machine (AC 16.2.3, Master PRD §11.2). */
export const FINDING_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'REJECTED', 'FALSE_POSITIVE'],
  CONFIRMED: ['IN_PROGRESS', 'ACCEPTED_RISK', 'RESOLVED'],
  IN_PROGRESS: ['RESOLVED', 'ACCEPTED_RISK'],
  RESOLVED: [],
  REJECTED: [],
  FALSE_POSITIVE: [],
  ACCEPTED_RISK: [],
};

export class InvalidFindingTransitionError extends Error {
  constructor(public from: string, public to: string) {
    super(`Invalid finding status transition: ${from} → ${to}`);
    this.name = 'InvalidFindingTransitionError';
  }
}

export function canTransitionFinding(from: string, to: string): boolean {
  return (FINDING_TRANSITIONS[from] ?? []).includes(to);
}

export class AiService {
  /** Persists a scan snapshot + individual findings + recommendations (AC 16.1.2). */
  async persistScan(input: {
    mode: 'LIVE_ANALYSIS' | 'STATIC_DEMO_PREVIEW';
    model: string;
    projectId?: string | null;
    projectName?: string | null;
    focusArea?: string | null;
    findings: any[];
    recommendations: any[];
    scannedBy: string;
  }): Promise<AiScan> {
    const scanRef = `SCAN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex')}`;

    const rows = await db
      .insert(aiScans)
      .values({
        scanRef,
        projectId: input.projectId ?? null,
        mode: input.mode,
        model: input.model,
        projectName: input.projectName ?? null,
        focusArea: input.focusArea ?? null,
        findings: input.findings,
        recommendations: input.recommendations,
        scannedBy: input.scannedBy,
      })
      .returning();
    const snapshot = rows[0];

    // Individual finding rows (AC 16.2.1)
    if (Array.isArray(input.findings) && input.findings.length > 0) {
      await db.insert(aiFindings).values(
        input.findings.map((f: any, idx: number) => ({
          snapshotId: snapshot.id,
          scanRef,
          findingRef: typeof f.id === 'string' && f.id ? f.id : `FND-${idx + 1}`,
          title: String(f.title ?? 'Untitled finding').slice(0, 255),
          category: String(f.category ?? 'Architecture'),
          severity: String(f.severity ?? 'Medium'),
          confidence: Number(f.confidence ?? 0),
          affectedFile: f.affectedFile ? String(f.affectedFile).slice(0, 255) : null,
          evidence: f.evidence ?? null,
          impact: f.impact ?? null,
          suggestedRemediation: f.suggestedRemediation ?? null,
          status: 'PENDING',
          detectedAt: new Date(),
        }))
      );
    }

    // Individual recommendation rows (AC 16.3.1)
    if (Array.isArray(input.recommendations) && input.recommendations.length > 0) {
      await db.insert(aiRecommendations).values(
        input.recommendations.map((r: any, idx: number) => ({
          snapshotId: snapshot.id,
          scanRef,
          recRef: typeof r.id === 'string' && r.id ? r.id : `REC-${idx + 1}`,
          title: String(r.title ?? 'Untitled recommendation').slice(0, 255),
          reason: r.reason ?? null,
          expectedImpact: r.expectedImpact ? String(r.expectedImpact).slice(0, 255) : null,
          effortEstimate: r.effortEstimate ? String(r.effortEstimate).slice(0, 60) : null,
          affectedModule: r.affectedModule ? String(r.affectedModule).slice(0, 150) : null,
          confidence: Number(r.confidence ?? 0),
        }))
      );
    }

    return snapshot;
  }

  /** Builds the labeled demo payload (SEC-05) in the persisted shape. */
  demoScan(scannedBy: string, projectName?: string, focusArea?: string) {
    const payload = buildStaticDemoPreview();
    return {
      mode: 'STATIC_DEMO_PREVIEW' as const,
      model: 'heuristic-demo',
      projectName: projectName ?? null,
      focusArea: focusArea ?? null,
      findings: payload.findings,
      recommendations: payload.recommendations,
      scannedBy,
    };
  }

  async listScans(filters: { projectId?: string; mode?: string; limit?: number }): Promise<AiScan[]> {
    const conditions = [];
    if (filters.projectId) conditions.push(eq(aiScans.projectId, filters.projectId));
    if (filters.mode) conditions.push(eq(aiScans.mode, filters.mode));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    return db.select().from(aiScans).where(where).orderBy(desc(aiScans.createdAt)).limit(Math.min(Math.max(filters.limit ?? 20, 1), 100));
  }

  async scanByRef(scanRef: string): Promise<AiScan | null> {
    const rows = await db.select().from(aiScans).where(eq(aiScans.scanRef, scanRef)).limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async listFindings(filters: { snapshotRef?: string; status?: string; severity?: string }): Promise<any[]> {
    const conditions = [];
    if (filters.snapshotRef) conditions.push(eq(aiFindings.scanRef, filters.snapshotRef));
    if (filters.status) conditions.push(eq(aiFindings.status, filters.status));
    if (filters.severity) conditions.push(eq(aiFindings.severity, filters.severity));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    return db.select().from(aiFindings).where(where).orderBy(desc(aiFindings.detectedAt)).limit(100);
  }

  async findingById(id: string) {
    const rows = await db.select().from(aiFindings).where(eq(aiFindings.id, id)).limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  /** Applies a validated lifecycle step + audit (AC 16.2.3, 16.2.4). */
  async transitionFinding(
    id: string,
    toStatus: string,
    actor: { userId?: string; name: string },
    correlationId = 'system',
    now: Date = new Date()
  ) {
    const finding = await this.findingById(id);
    if (!finding) return null;

    const from = finding.status;
    if (!canTransitionFinding(from, toStatus)) throw new InvalidFindingTransitionError(from, toStatus);

    const patch: Record<string, unknown> = { status: toStatus, updatedAt: now };
    if (toStatus === 'RESOLVED') patch.resolvedAt = now;

    const rows = await db.update(aiFindings).set(patch).where(eq(aiFindings.id, id)).returning();

    await auditService.logEvent({
      actorId: actor.userId ?? 'system',
      actorName: actor.name,
      action: 'AI_FINDING_STATUS_CHANGED',
      targetEntity: 'ai_findings',
      targetId: id,
      details: { findingRef: finding.findingRef, scanRef: finding.scanRef, from, to: toStatus },
      correlationId,
    }).catch(() => undefined);

    return rows[0];
  }

  async listRecommendations(snapshotRef?: string): Promise<AiRecommendation[]> {
    const where = snapshotRef ? eq(aiRecommendations.scanRef, snapshotRef) : undefined;
    return db.select().from(aiRecommendations).where(where).orderBy(desc(aiRecommendations.confidence)).limit(100);
  }

  async recommendationById(id: string): Promise<AiRecommendation | null> {
    const rows = await db.select().from(aiRecommendations).where(eq(aiRecommendations.id, id)).limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  /** Marks a recommendation as converted (idempotency via unique key, AC 16.3.4). */
  async markConverted(id: string, workItemKey: string): Promise<AiRecommendation | 'ALREADY_CONVERTED'> {
    const rec = await this.recommendationById(id);
    if (!rec) return null as any;
    if (rec.convertedWorkItemKey) return 'ALREADY_CONVERTED';
    const rows = await db
      .update(aiRecommendations)
      .set({ convertedWorkItemKey: workItemKey })
      .where(eq(aiRecommendations.id, id))
      .returning();
    return rows[0];
  }
}

export const aiService = new AiService();
