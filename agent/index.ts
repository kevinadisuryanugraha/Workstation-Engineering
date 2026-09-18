#!/usr/bin/env node
import { loadAgentConfigOrExit, type AgentConfig } from './config.ts';
import { collectSample } from './collectors.ts';
import { AgentTransport } from './transport.ts';

/**
 * Workstation Linux Server Agent (Story 9.1 / Epic 9).
 * Lightweight daemon: collects CPU/RAM/Disk every AGENT_INTERVAL_SECONDS and
 * ships telemetry to the WORKSTATION ingestion API with buffered retry.
 *
 * Usage: npm run agent
 */

let transport: AgentTransport | null = null;
let running = true;
let timer: ReturnType<typeof setTimeout> | null = null;

async function tick(config: AgentConfig): Promise<void> {
  try {
    const sample = await collectSample(config.serverName, config.services, config.probeTimeoutMs);
    const inserted = await transport!.flush([sample]);
    console.log(`[agent] ${new Date().toISOString()} sample sent (${inserted} inserted, ${transport!.bufferedCount} buffered)`);
  } catch (err: any) {
    console.warn(`[agent] delivery failed, buffering for retry: ${err?.message || err}`);
  }
}

function scheduleNext(config: AgentConfig): void {
  if (!running) return;
  timer = setTimeout(async () => {
    await tick(config);
    scheduleNext(config);
  }, config.intervalSeconds * 1000);
}

async function main(): Promise<void> {
  const config = loadAgentConfigOrExit();
  transport = new AgentTransport({
    serverUrl: config.serverUrl,
    ingestToken: config.ingestToken,
    bufferMaxSamples: config.bufferMaxSamples,
  });

  console.log(`[agent] WORKSTATION agent started for server "${config.serverName}"`);
  console.log(`[agent] target=${config.serverUrl} interval=${config.intervalSeconds}s buffer=${config.bufferMaxSamples}`);

  process.on('SIGTERM', () => {
    console.log('[agent] SIGTERM received — graceful shutdown');
    running = false;
    if (timer) clearTimeout(timer);
    process.exit(0);
  });
  process.on('SIGINT', () => {
    console.log('[agent] SIGINT received — graceful shutdown');
    running = false;
    if (timer) clearTimeout(timer);
    process.exit(0);
  });

  await tick(config); // immediate first sample
  scheduleNext(config);
}

main().catch((err) => {
  console.error('[agent] fatal:', err?.message || err);
  process.exit(1);
});
