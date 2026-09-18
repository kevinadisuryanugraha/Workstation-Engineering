/**
 * Incident SLA engine (Story 13.2).
 * Pure, deterministic computation of response/resolution SLA status
 * from lifecycle timestamps. No background jobs — computed on read.
 */

import type { IncidentSeverity } from '../../db/schema/incidents.ts';

export interface SlaTarget {
  responseMinutes: number;
  resolutionMinutes: number;
}

/** Single source of truth for severity-based SLA targets (AC 13.2.1). */
export const SLA_TARGETS: Record<IncidentSeverity, SlaTarget> = {
  CRITICAL: { responseMinutes: 15, resolutionMinutes: 4 * 60 }, // 15 m / 4 h
  MAJOR: { responseMinutes: 30, resolutionMinutes: 8 * 60 }, // 30 m / 8 h
  MINOR: { responseMinutes: 2 * 60, resolutionMinutes: 24 * 60 }, // 2 h / 24 h
};

export type SlaStatus = 'PENDING' | 'MET' | 'BREACHED';

export interface SlaDimension {
  targetMinutes: number;
  status: SlaStatus;
  actualMinutes: number | null;
  /** For PENDING dimensions: how many minutes past the target (0 if still within). */
  overdueMinutes: number;
}

export interface IncidentSla {
  response: SlaDimension;
  resolution: SlaDimension;
}

function diffMinutes(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 60_000); // whole minutes (AC 13.2.4)
}

function evaluateDimension(
  targetMinutes: number,
  start: Date,
  end: Date | null,
  now: Date
): SlaDimension {
  if (end) {
    const actual = diffMinutes(start, end);
    return {
      targetMinutes,
      status: actual <= targetMinutes ? 'MET' : 'BREACHED',
      actualMinutes: actual,
      overdueMinutes: Math.max(0, actual - targetMinutes),
    };
  }
  // PENDING: not yet closed out — flag how far past the target we already are
  const elapsed = diffMinutes(start, now);
  return {
    targetMinutes,
    status: 'PENDING',
    actualMinutes: null,
    overdueMinutes: Math.max(0, elapsed - targetMinutes),
  };
}

/**
 * Computes the full SLA picture for one incident (AC 13.2.2–13.2.4).
 * `now` is injectable for deterministic tests; defaults to the current time.
 */
export function computeIncidentSla(
  severity: string,
  detectedAt: Date,
  acknowledgedAt: Date | null,
  resolvedAt: Date | null,
  now: Date = new Date()
): IncidentSla {
  const key = (severity in SLA_TARGETS ? severity : 'MINOR') as IncidentSeverity;
  const target = SLA_TARGETS[key];

  return {
    response: evaluateDimension(target.responseMinutes, detectedAt, acknowledgedAt ?? resolvedAt, now),
    resolution: evaluateDimension(target.resolutionMinutes, detectedAt, resolvedAt, now),
  };
}

/** Human-readable label helper for UI badges. */
export function slaBadgeTone(status: SlaStatus): 'success' | 'destructive' | 'neutral' {
  if (status === 'MET') return 'success';
  if (status === 'BREACHED') return 'destructive';
  return 'neutral';
}
