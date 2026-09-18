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
