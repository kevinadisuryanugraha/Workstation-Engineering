import { describe, it, expect } from 'vitest';
import { SLA_TARGETS, computeIncidentSla, slaBadgeTone } from '../server/modules/incidents/incident.sla.ts';

/**
 * Story 13.2 — Incident SLA Engine (pure, deterministic via injected `now`).
 */

const DETECTED = new Date('2026-02-14T10:00:00Z');
const minute = (n: number) => new Date(DETECTED.getTime() + n * 60_000);

describe('SLA targets matrix (Story 13.2 / AC #1)', () => {
  it('defines severity targets: CRITICAL 15m/4h, MAJOR 30m/8h, MINOR 2h/24h', () => {
    expect(SLA_TARGETS.CRITICAL).toEqual({ responseMinutes: 15, resolutionMinutes: 240 });
    expect(SLA_TARGETS.MAJOR).toEqual({ responseMinutes: 30, resolutionMinutes: 480 });
    expect(SLA_TARGETS.MINOR).toEqual({ responseMinutes: 120, resolutionMinutes: 1440 });
  });
});

describe('Response SLA (Story 13.2 / AC #2)', () => {
  it('MET when acknowledged inside the target window', () => {
    const sla = computeIncidentSla('CRITICAL', DETECTED, minute(10), null, minute(11));
    expect(sla.response.status).toBe('MET');
    expect(sla.response.actualMinutes).toBe(10);
  });

  it('BREACHED when acknowledgement passes the target', () => {
    const sla = computeIncidentSla('CRITICAL', DETECTED, minute(20), null, minute(21));
    expect(sla.response.status).toBe('BREACHED');
    expect(sla.response.actualMinutes).toBe(20);
    expect(sla.response.overdueMinutes).toBe(5);
  });

  it('PENDING with overdueMinutes when not yet acknowledged but window passed (AC #4)', () => {
    const sla = computeIncidentSla('CRITICAL', DETECTED, null, null, minute(25));
    expect(sla.response.status).toBe('PENDING');
    expect(sla.response.actualMinutes).toBeNull();
    expect(sla.response.overdueMinutes).toBe(10);
  });

  it('PENDING with zero overdue when still inside the window', () => {
    const sla = computeIncidentSla('CRITICAL', DETECTED, null, null, minute(5));
    expect(sla.response.status).toBe('PENDING');
    expect(sla.response.overdueMinutes).toBe(0);
  });
});

describe('Resolution SLA (Story 13.2 / AC #2)', () => {
  it('MET when resolved inside the target (MAJOR 7h < 8h)', () => {
    const sla = computeIncidentSla('MAJOR', DETECTED, minute(10), minute(7 * 60), minute(8 * 60));
    expect(sla.resolution.status).toBe('MET');
    expect(sla.resolution.actualMinutes).toBe(420);
  });

  it('BREACHED when resolved past the target (MAJOR 9h > 8h)', () => {
    const sla = computeIncidentSla('MAJOR', DETECTED, minute(10), minute(9 * 60), minute(10 * 60));
    expect(sla.resolution.status).toBe('BREACHED');
  });

  it('MINOR allows a full day before resolution breach', () => {
    const met = computeIncidentSla('MINOR', DETECTED, minute(60), minute(1439), DETECTED);
    const breached = computeIncidentSla('MINOR', DETECTED, minute(60), minute(1441), DETECTED);
    expect(met.resolution.status).toBe('MET');
    expect(breached.resolution.status).toBe('BREACHED');
  });
});

describe('Badge tone mapping (UI contract)', () => {
  it('MET → success, BREACHED → destructive, PENDING → neutral', () => {
    expect(slaBadgeTone('MET')).toBe('success');
    expect(slaBadgeTone('BREACHED')).toBe('destructive');
    expect(slaBadgeTone('PENDING')).toBe('neutral');
  });
});
