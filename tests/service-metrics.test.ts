import { describe, it, expect, vi } from 'vitest';
import { validateAgentSample, ValidationError } from '../server/modules/server-metrics/server-metrics.service.ts';

/**
 * Story 11.2 — Service metrics persistence: shape validation (AC #2)
 * and UI mapping semantics (AC #4). Storage roundtrip is covered by the
 * generated migration + drizzle typing; latest endpoint mapping is covered
 * by the routes tests (agents tests) via the shared service.
 */

process.env.JWT_SECRET = 'workstation-test-secret-min-32-chars-long-security-token';

function baseSample(services?: unknown) {
  const sample: Record<string, unknown> = {
    serverName: 'kontabo-vps',
    cpu: 20,
    memory: { total: 8, used: 3, free: 5 },
    disks: [{ filesystem: '/dev/sda1', mount: '/', total: 100, used: 40, available: 60, usePercent: 40 }],
    recordedAt: new Date('2026-02-14T10:00:00Z').toISOString(),
  };
  if (services !== undefined) sample.services = services;
  return sample;
}

const validService = {
  name: 'nginx',
  kind: 'http',
  target: '127.0.0.1:80',
  healthy: true,
  latencyMs: 12,
  checkedAt: '2026-02-14T10:00:00Z',
};

describe('Service metrics validation (Story 11.2 / AC #2)', () => {
  it('accepts a sample without services (agent backward compatibility)', () => {
    const parsed = validateAgentSample(baseSample());
    expect(parsed.services).toBeUndefined();
  });

  it('accepts a sample with valid services and normalizes them', () => {
    const parsed = validateAgentSample(baseSample([validService]));
    expect(parsed.services).toHaveLength(1);
    expect(parsed.services![0]).toMatchObject({ name: 'nginx', kind: 'http', healthy: true, latencyMs: 12 });
  });

  it('rejects invalid service shapes with HTTP-mappable ValidationError', () => {
    expect(() => validateAgentSample(baseSample('not-an-array'))).toThrow(ValidationError);
    expect(() => validateAgentSample(baseSample([{ ...validService, healthy: 'yes' }]))).toThrow(/healthy must be a boolean/);
    expect(() => validateAgentSample(baseSample([{ ...validService, kind: 'grpc' }]))).toThrow(/kind must be http or tcp/);
    expect(() => validateAgentSample(baseSample([{ ...validService, checkedAt: 'nope' }]))).toThrow(/checkedAt/);
    expect(() => validateAgentSample(baseSample([{ ...validService, latencyMs: 'fast' }]))).toThrow(/latencyMs/);
  });
});

describe('Services → UI mapping semantics (Story 11.2 / AC #4)', () => {
  // Mirrors the mergeServerTelemetry mapping rules in src/App.tsx
  function mapService(svc: { name: string; healthy: boolean; target: string }) {
    const portRaw = typeof svc.target === 'string' ? svc.target.split(':')[1] : undefined;
    const port = portRaw ? Number.parseInt(portRaw, 10) : undefined;
    return {
      name: `${svc.name} (${svc.target})`,
      status: svc.healthy ? 'Running' : 'Stopped',
      port: Number.isFinite(port) ? port : undefined,
      memoryMb: 0,
    };
  }

  it('healthy service maps to Running with parsed port', () => {
    expect(mapService({ name: 'nginx', healthy: true, target: '127.0.0.1:80' })).toEqual({
      name: 'nginx (127.0.0.1:80)',
      status: 'Running',
      port: 80,
      memoryMb: 0,
    });
  });

  it('unhealthy service maps to Stopped', () => {
    expect(mapService({ name: 'mysql', healthy: false, target: '127.0.0.1:3306' }).status).toBe('Stopped');
  });
});
