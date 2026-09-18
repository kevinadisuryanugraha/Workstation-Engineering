import type { MetricSample } from './collectors.ts';

/**
 * Agent transport (Story 9.1) — batch delivery with in-memory buffer and retry.
 * Samples are NEVER dropped on transient server outages: failed batches are buffered
 * (up to bufferMaxSamples, oldest dropped when overflowing) and re-sent on recovery.
 */

export interface TransportOptions {
  serverUrl: string; // e.g. https://workstation.internal
  ingestToken: string;
  bufferMaxSamples: number;
  fetchImpl?: typeof fetch;
}

export class AgentTransport {
  private buffer: MetricSample[] = [];
  private fetchImpl: typeof fetch;

  constructor(private options: TransportOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  get bufferedCount(): number {
    return this.buffer.length;
  }

  /** Queues samples for delivery; enforces the buffer ceiling (drops oldest on overflow). */
  queue(samples: MetricSample[]): void {
    this.buffer.push(...samples);
    if (this.buffer.length > this.options.bufferMaxSamples) {
      this.buffer = this.buffer.slice(this.buffer.length - this.options.bufferMaxSamples);
    }
  }

  /**
   * Delivers ALL buffered samples plus any passed in `fresh`.
   * Returns the number of samples accepted by the server.
   * Throws only on final failure — caller keeps the loop alive.
   */
  async flush(fresh: MetricSample[] = []): Promise<number> {
    const payload = [...this.buffer, ...fresh];
    if (payload.length === 0) return 0;

    try {
      const res = await this.fetchImpl(`${this.options.serverUrl}/api/v1/agent/metrics`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.options.ingestToken}`,
        },
        body: JSON.stringify({ samples: payload }),
      });

      if (!res.ok) {
        throw new Error(`Ingest failed with HTTP ${res.status}`);
      }

      const body = (await res.json()) as { data?: { inserted?: number } };
      this.buffer = []; // success: everything (old buffer + fresh) was accepted
      return body.data?.inserted ?? payload.length;
    } catch (err) {
      // Failure: keep everything for retry — fresh samples join the buffer
      this.queue(fresh);
      throw err;
    }
  }
}
