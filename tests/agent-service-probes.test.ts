import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import net from 'node:net';
import http from 'node:http';
import { parseServiceTargets, SERVICE_PROBE_DEFAULTS } from '../agent/config.ts';
import { probeTcp, probeHttp, probeServices } from '../agent/collectors.ts';

/**
 * Story 11.1 — Agent Service Probes (Nginx HTTP, MySQL/Redis TCP).
 */

describe('AGENT_SERVICES parser (Story 11.1 / AC #1)', () => {
  it('falls back to default nginx/mysql/redis localhost targets when env absent', () => {
    expect(parseServiceTargets(undefined)).toEqual(SERVICE_PROBE_DEFAULTS);
    expect(parseServiceTargets('   ')).toEqual(SERVICE_PROBE_DEFAULTS);
  });

  it('parses a valid multi-service definition', () => {
    const targets = parseServiceTargets('nginx:http:127.0.0.1:80;mysql:tcp:10.0.0.5:3306');
    expect(targets).toEqual([
      { name: 'nginx', kind: 'http', host: '127.0.0.1', port: 80 },
      { name: 'mysql', kind: 'tcp', host: '10.0.0.5', port: 3306 },
    ]);
  });

  it('fails fast on invalid entries (wrong kind, bad port, wrong field count)', () => {
    expect(() => parseServiceTargets('nginx:grpc:127.0.0.1:80')).toThrow(/invalid kind/);
    expect(() => parseServiceTargets('mysql:tcp:127.0.0.1:notaport')).toThrow(/invalid port/);
    expect(() => parseServiceTargets('redis:tcp:6379')).toThrow(/invalid/);
  });
});

describe('TCP & HTTP probes (Story 11.1 / AC #2, #4)', () => {
  let tcpServer: net.Server;
  let tcpPort: number;
  let httpServer: http.Server;
  let httpPort: number;
  let deadPort: number;

  beforeAll(async () => {
    // Live TCP listener
    tcpServer = net.createServer((socket) => {
      socket.end();
    });
    tcpPort = await new Promise((resolve) => {
      tcpServer.listen(0, '127.0.0.1', () => {
        const addr = tcpServer.address();
        resolve(typeof addr === 'object' && addr ? addr.port : 0);
      });
    });

    // Live HTTP listener answering 404 (service alive)
    httpServer = http.createServer((_req, res) => {
      res.statusCode = 404;
      res.end('not found');
    });
    httpPort = await new Promise((resolve) => {
      httpServer.listen(0, '127.0.0.1', () => {
        const addr = httpServer.address();
        resolve(typeof addr === 'object' && addr ? addr.port : 0);
      });
    });

    // Find a port with nothing listening
    const probe = net.createServer();
    deadPort = await new Promise((resolve) => {
      probe.listen(0, '127.0.0.1', () => {
        const addr = probe.address();
        const p = typeof addr === 'object' && addr ? addr.port : 0;
        probe.close(() => resolve(p));
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((r) => tcpServer.close(() => r()));
    await new Promise<void>((r) => httpServer.close(() => r()));
  });

  it('tcp probe: healthy on a live listener with measurable latency', async () => {
    const result = await probeTcp('127.0.0.1', tcpPort, 2000);
    expect(result.healthy).toBe(true);
    expect(result.latencyMs).not.toBeNull();
    expect(result.latencyMs!).toBeGreaterThanOrEqual(0);
  });

  it('tcp probe: unhealthy on a dead port without throwing (AC #4)', async () => {
    const result = await probeTcp('127.0.0.1', deadPort, 500);
    expect(result.healthy).toBe(false);
    expect(result.latencyMs).toBeNull();
  });

  it('http probe: status < 500 counts as healthy (404 proves liveness) (AC #2)', async () => {
    const result = await probeHttp('127.0.0.1', httpPort, 2000);
    expect(result.healthy).toBe(true);
  });

  it('probeServices: shapes results with name/kind/target/checkedAt', async () => {
    const results = await probeServices(
      [
        { name: 'mysql', kind: 'tcp', host: '127.0.0.1', port: tcpPort },
        { name: 'ghost', kind: 'tcp', host: '127.0.0.1', port: deadPort },
      ],
      1000
    );
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ name: 'mysql', kind: 'tcp', target: `127.0.0.1:${tcpPort}`, healthy: true });
    expect(results[1]).toMatchObject({ name: 'ghost', healthy: false, latencyMs: null });
    for (const r of results) {
      expect(new Date(r.checkedAt).getTime()).toBeGreaterThan(0);
    }
  });
});
