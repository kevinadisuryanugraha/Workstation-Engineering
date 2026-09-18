import dotenv from 'dotenv';

dotenv.config();

/**
 * Agent configuration (Story 9.1) — fail-fast on missing required environment variables.
 * The daemon must not start in a half-configured state and silently lose data.
 */

export interface AgentConfig {
  serverUrl: string;
  ingestToken: string;
  serverName: string;
  intervalSeconds: number;
  bufferMaxSamples: number;
  /** Story 11.1 — parsed service probe targets */
  services: ServiceProbeTarget[];
  probeTimeoutMs: number;
}

export interface ServiceProbeTarget {
  name: string;
  kind: 'http' | 'tcp';
  host: string;
  port: number;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    console.error(`[agent] FAIL-FAST: environment variable ${name} is required but not set.`);
    console.error(`[agent] Expected configuration: AGENT_SERVER_URL, AGENT_TOKEN, AGENT_SERVER_NAME`);
    process.exit(1);
  }
  return value.trim();
}

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.error(`[agent] FAIL-FAST: ${name} must be a positive integer, received "${raw}".`);
    process.exit(1);
  }
  return parsed;
}

export const SERVICE_PROBE_DEFAULTS = [
  { name: 'nginx', kind: 'http' as const, host: '127.0.0.1', port: 80 },
  { name: 'mysql', kind: 'tcp' as const, host: '127.0.0.1', port: 3306 },
  { name: 'redis', kind: 'tcp' as const, host: '127.0.0.1', port: 6379 },
];

export const DEFAULT_PROBE_TIMEOUT_MS = 3000;

/**
 * Parses AGENT_SERVICES env: "name:kind:host:port;name:kind:host:port"
 * (Story 11.1 / AC #1). Falls back to the default Nginx/MySQL/Redis localhost set
 * when the env var is absent or empty.
 */
export function parseServiceTargets(raw: string | undefined): ServiceProbeTarget[] {
  if (!raw || raw.trim().length === 0) {
    return [...SERVICE_PROBE_DEFAULTS];
  }
  return raw
    .split(';')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const parts = entry.split(':');
      if (parts.length !== 4) {
        throw new Error(
          `[agent] FAIL-FAST: AGENT_SERVICES entry "${entry}" is invalid. Expected name:kind:host:port (kind = http|tcp).`
        );
      }
      const [name, kind, host, portRaw] = parts;
      if (kind !== 'http' && kind !== 'tcp') {
        throw new Error(`[agent] FAIL-FAST: service "${name}" has invalid kind "${kind}" (expected http or tcp).`);
      }
      const port = Number.parseInt(portRaw, 10);
      if (!Number.isFinite(port) || port <= 0 || port > 65535) {
        throw new Error(`[agent] FAIL-FAST: service "${name}" has invalid port "${portRaw}".`);
      }
      return { name: name.trim(), kind, host: host.trim(), port };
    });
}

export function loadAgentConfig(env: NodeJS.ProcessEnv = process.env): AgentConfig {
  // Exposed for tests: allow injection without process.exit
  const get = (name: string): string => {
    const value = env[name];
    if (!value || value.trim().length === 0) {
      throw new Error(`[agent] FAIL-FAST: environment variable ${name} is required but not set.`);
    }
    return value.trim();
  };

  const readInt = (name: string, fallback: number): number => {
    const raw = env[name];
    if (!raw) return fallback;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error(`[agent] FAIL-FAST: ${name} must be a positive integer, received "${raw}".`);
    }
    return parsed;
  };

  return {
    serverUrl: get('AGENT_SERVER_URL').replace(/\/$/, ''),
    ingestToken: get('AGENT_TOKEN'),
    serverName: get('AGENT_SERVER_NAME'),
    intervalSeconds: readInt('AGENT_INTERVAL_SECONDS', 60),
    bufferMaxSamples: readInt('AGENT_BUFFER_MAX', 60),
    services: parseServiceTargets(env.AGENT_SERVICES),
    probeTimeoutMs: readInt('AGENT_PROBE_TIMEOUT_MS', DEFAULT_PROBE_TIMEOUT_MS),
  };
}

/** CLI bootstrap — exits the process when configuration is incomplete. */
export function loadAgentConfigOrExit(): AgentConfig {
  const value = process.env.AGENT_SERVER_URL;
  const hasAll = [value, process.env.AGENT_TOKEN, process.env.AGENT_SERVER_NAME].every((v) => v && v.trim().length > 0);
  if (!hasAll) {
    requireEnv('AGENT_SERVER_URL');
  }
  return loadAgentConfig();
}
