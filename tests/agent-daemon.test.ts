import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Story 9.1 — Agent Metrics Daemon unit tests (collectors, config fail-fast, transport buffer).
 */

process.env.JWT_SECRET = 'workstation-test-secret-min-32-chars-long-security-token';

import { collectCpuUsage, collectMemory } from '../agent/collectors.ts';
import { AgentTransport } from '../agent/transport.ts';
import type { MetricSample } from '../agent/collectors.ts';

describe('Agent collectors (Story 9.1)', () => {
  it('approximates CPU percent from load average normalized by cores, clamped 0-100', () => {
    expect(collectCpuUsage(0.5, 4)).toBe(12.5);
    expect(collectCpuUsage(8, 4)).toBe(100); // clamped
    expect(collectCpuUsage(0, 4)).toBe(0);
    expect(collectCpuUsage(1, 0)).toBe(100); // degenerate core count still safe
  });

  it('collects memory as total = used + free', () => {
    const mem = collectMemory();
    expect(mem.total).toBeGreaterThan(0);
    expect(mem.used).toBeGreaterThanOrEqual(0);
    expect(mem.total).toBe(mem.used + mem.free);
  });
});

describe('Agent config fail-fast (Story 9.1 / AC #4)', () => {
  it('throws when required env vars are missing', async () => {
    const { loadAgentConfig } = await import('../agent/config.ts');
    expect(() => loadAgentConfig({} as NodeJS.ProcessEnv)).toThrow(/AGENT_SERVER_URL/);
    expect(() => loadAgentConfig({ AGENT_SERVER_URL: 'http://x' } as NodeJS.ProcessEnv)).toThrow(/AGENT_TOKEN/);
    expect(() =>
      loadAgentConfig({ AGENT_SERVER_URL: 'http://x', AGENT_TOKEN: 't' } as NodeJS.ProcessEnv)
    ).toThrow(/AGENT_SERVER_NAME/);
  });

  it('loads with defaults when optional values are absent', async () => {
    const { loadAgentConfig } = await import('../agent/config.ts');
    const config = loadAgentConfig({
      AGENT_SERVER_URL: 'http://workstation.internal/',
      AGENT_TOKEN: 'secret-token',
      AGENT_SERVER_NAME: 'kontabo-vps',
    } as NodeJS.ProcessEnv);
    expect(config.serverUrl).toBe('http://workstation.internal'); // trailing slash trimmed
    expect(config.intervalSeconds).toBe(60);
    expect(config.bufferMaxSamples).toBe(60);
  });
});

function makeSample(i: number): MetricSample {
  return {
    serverName: 'kantor-01',
    cpu: 10 + i,
    memory: { total: 1000, used: 400 + i, free: 600 - i },
    disks: [{ filesystem: '/dev/sda1', mount: '/', total: 100, used: 40, available: 60, usePercent: 40 }],
    recordedAt: new Date(Date.UTC(2026, 1, 14, 10, 0, i)).toISOString(),
  };
}

describe('Agent transport buffer & retry (Story 9.1 / AC #3)', () => {
  beforeEach(() => vi.resetAllMocks());

  it('delivers fresh samples with bearer token and clears the buffer on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { inserted: 2 } }), { status: 201 })
    );
    const transport = new AgentTransport({
      serverUrl: 'http://x',
      ingestToken: 'tok',
      bufferMaxSamples: 60,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    const fresh = [makeSample(1), makeSample(2)];
    const inserted = await transport.flush(fresh);

    expect(inserted).toBe(2);
    expect(transport.bufferedCount).toBe(0);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://x/api/v1/agent/metrics');
    expect((init as any).headers.authorization).toBe('Bearer tok');
    expect(JSON.parse((init as any).body).samples).toHaveLength(2);
  });

  it('buffers samples on failure and re-sends them when the server recovers', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('HTTP 503'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: { inserted: 3 } }), { status: 201 })
      );

    const transport = new AgentTransport({
      serverUrl: 'http://x',
      ingestToken: 'tok',
      bufferMaxSamples: 60,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    await expect(transport.flush([makeSample(1)])).rejects.toThrow('ECONNREFUSED');
    expect(transport.bufferedCount).toBe(1); // not lost

    await expect(transport.flush([makeSample(2)])).rejects.toThrow('HTTP 503');
    expect(transport.bufferedCount).toBe(2); // still not lost

    const inserted = await transport.flush([makeSample(3)]); // server back up
    expect(inserted).toBe(3);
    expect(transport.bufferedCount).toBe(0); // buffer drained
    expect(JSON.parse(fetchMock.mock.calls[2][1].body).samples).toHaveLength(3);
  });

  it('enforces the buffer ceiling by dropping the oldest samples', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('down'));
    const transport = new AgentTransport({
      serverUrl: 'http://x',
      ingestToken: 'tok',
      bufferMaxSamples: 3,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    for (let i = 0; i < 5; i++) {
      await transport.flush([makeSample(i)]).catch(() => undefined);
    }
    expect(transport.bufferedCount).toBe(3);
    // oldest two (i=0, i=1) were dropped; newest kept
  });
});
