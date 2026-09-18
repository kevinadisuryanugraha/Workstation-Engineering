import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

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

export interface MetricSample {
  serverName: string;
  cpu: number; // percent 0-100
  memory: { total: number; used: number; free: number }; // bytes
  disks: DiskSample[];
  recordedAt: string; // ISO 8601
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

/** Collects one full metric sample. */
export async function collectSample(serverName: string): Promise<MetricSample> {
  const [disks] = await Promise.all([collectDisks()]);
  return {
    serverName,
    cpu: collectCpuUsage(),
    memory: collectMemory(),
    disks,
    recordedAt: new Date().toISOString(),
  };
}
