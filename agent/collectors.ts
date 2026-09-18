import os from 'node:os';
import net from 'node:net';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { ServiceProbeTarget } from './config.ts';

const execFileAsync = promisify(execFile);

/**
 * Metric collectors (Story 9.1) — CPU, memory, disk for Linux servers.
 * Pure Node runtime (node:os) + `df -kP` for filesystems; no heavy dependencies.
 */

export interface DiskSample {
  filesystem: string;
  mount: string;
  total: number; // bytes
  used: number; // bytes
  available: number; // bytes
  usePercent: number; // 0-100
}

export interface ServiceProbeResult {
  name: string;
  kind: 'http' | 'tcp';
  target: string; // host:port
  healthy: boolean;
  latencyMs: number | null;
  checkedAt: string; // ISO
}

export interface MetricSample {
  serverName: string;
  cpu: number; // percent 0-100
  memory: { total: number; used: number; free: number }; // bytes
  disks: DiskSample[];
  services?: ServiceProbeResult[]; // Story 11.1
  recordedAt: string; // ISO 8601
}

/**
 * TCP probe (Story 11.1 / AC #2): healthy when the connection opens. Never throws (AC #4).
 */
export function probeTcp(host: string, port: number, timeoutMs: number): Promise<{ healthy: boolean; latencyMs: number | null }> {
  return new Promise((resolve) => {
    const started = Date.now();
    const socket = new net.Socket();
    let settled = false;

    const finish = (healthy: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({ healthy, latencyMs: healthy ? Date.now() - started : null });
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));

    try {
      socket.connect(port, host);
    } catch {
      finish(false);
    }
  });
}

/**
 * HTTP probe (Story 11.1 / AC #2): healthy when status < 500 (404/302 prove liveness). Never throws.
 */
export function probeHttp(host: string, port: number, timeoutMs: number): Promise<{ healthy: boolean; latencyMs: number | null }> {
  return new Promise((resolve) => {
    const started = Date.now();
    let settled = false;
    const done = (healthy: boolean) => {
      if (settled) return;
      settled = true;
      resolve({ healthy, latencyMs: healthy ? Date.now() - started : null });
    };

    const req = http.get(
      { host, port, path: '/', timeout: timeoutMs, headers: { 'user-agent': 'workstation-agent-probe' } },
      (res) => {
        res.resume(); // drain the response
        const healthy = (res.statusCode ?? 500) < 500;
        res.once('end', () => done(healthy));
        setTimeout(() => done(healthy), 250).unref(); // guard: servers that never end the response
      }
    );
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      done(false);
    });
    req.once('error', () => done(false));
  });
}

/** Probes all configured targets; individual failures never throw (AC #4). */
export async function probeServices(targets: ServiceProbeTarget[], timeoutMs: number): Promise<ServiceProbeResult[]> {
  const checkedAt = new Date().toISOString();
  return Promise.all(
    targets.map(async (t) => {
      const outcome =
        t.kind === 'http'
          ? await probeHttp(t.host, t.port, timeoutMs)
          : await probeTcp(t.host, t.port, timeoutMs);
      return {
        name: t.name,
        kind: t.kind,
        target: `${t.host}:${t.port}`,
        healthy: outcome.healthy,
        latencyMs: outcome.latencyMs,
        checkedAt,
      };
    })
  );
}

/** Collects one full metric sample (with optional service probes — Story 11.1). */
export async function collectSample(
  serverName: string,
  serviceTargets: ServiceProbeTarget[] = [],
  probeTimeoutMs: number = 3000
): Promise<MetricSample> {
  const [disks, services] = await Promise.all([
    collectDisks(),
    serviceTargets.length > 0 ? probeServices(serviceTargets, probeTimeoutMs) : Promise.resolve([]),
  ]);
  return {
    serverName,
    cpu: collectCpuUsage(),
    memory: collectMemory(),
    disks,
    services,
    recordedAt: new Date().toISOString(),
  };
}

/** CPU usage percent approximated from 1-minute load average normalized by core count. */
export function collectCpuUsage(loadAvg1m: number = os.loadavg()[0], cores: number = os.cpus().length): number {
  const coresSafe = cores > 0 ? cores : 1;
  const percent = (loadAvg1m / coresSafe) * 100;
  return Math.min(100, Math.max(0, Math.round(percent * 10) / 10));
}

/** Memory usage from node:os (bytes). */
export function collectMemory(): { total: number; used: number; free: number } {
  const total = os.totalmem();
  const free = os.freemem();
  return { total, free, used: total - free };
}

/** Real filesystems only (filters tmpfs/loop/overlay) from `df -kP`. */
export async function collectDisks(): Promise<DiskSample[]> {
  const { stdout } = await execFileAsync('df', ['-kP']);
  const lines = stdout.trim().split('\n').slice(1); // drop header
  const samples: DiskSample[] = [];

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 6) continue;
    const [filesystem, totalKbS, usedKbS, availKbS, capacityS, mount] = parts;

    if (filesystem.startsWith('tmpfs') || filesystem.startsWith('udev') || filesystem.startsWith('loop') || filesystem.includes('overlay')) {
      continue;
    }

    const totalKb = Number.parseInt(totalKbS, 10);
    const usedKb = Number.parseInt(usedKbS, 10);
    const availableKb = Number.parseInt(availKbS, 10);
    const usePercent = Number.parseInt(capacityS.replace('%', ''), 10);

    if (!Number.isFinite(totalKb) || !Number.isFinite(usedKb) || !Number.isFinite(usePercent)) continue;

    samples.push({
      filesystem,
      mount,
      total: totalKb * 1024,
      used: usedKb * 1024,
      available: (Number.isFinite(availableKb) ? availableKb : 0) * 1024,
      usePercent,
    });
  }

  return samples;
}

