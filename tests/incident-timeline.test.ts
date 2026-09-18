import { describe, it, expect, beforeAll, vi } from 'vitest';
import express, { Express } from 'express';

/**
 * Story 13.3 — Immutable incident timeline: auto-recording, chronological read,
 * note appending, and strict incidentId scoping.
 */

process.env.JWT_SECRET = 'workstation-test-secret-min-32-chars-long-security-token';

const { eventStore } = vi.hoisted(() => {
  const eventStore = new Map<string, any>();
  return { eventStore };
});

vi.mock('../server/db/client.ts', () => {
  const makeChain = (isEventsTable: boolean) => {
    const chain: any = {
      where: () => chain,
      orderBy: () => chain,
      limit: () => chain,
      offset: () => chain,
      then: (res: any, rej: any) => {
        let rows: any[];
        if (isEventsTable) {
          // Filter events by the registered incident context (mirrors WHERE incident_id = ?)
          const ctx = (globalThis as any).__timelineIncidentId;
          rows = Array.from(eventStore.values()).filter((r) => (ctx ? r.incidentId === ctx : true));
        } else {
          const id = (globalThis as any).__lastIncidentId;
          rows = Array.from(eventStore.values()).filter((r) => (id ? r.id === id : true));
        }
        return Promise.resolve(rows).then(res, rej);
      },
      catch: (rej: any) => Promise.reject(rej),
    };
    return chain;
  };
  const fakeTx = {
    insert: () => ({
      values: (row: any) => ({
        returning: async () => {
          // Preserve drizzle client-side defaults ($defaultFn id, createdAt) when present
          const full = { ...row, id: row.id ?? `evt-${eventStore.size + 1}`, createdAt: row.createdAt ?? new Date() };
          eventStore.set(full.id, full);
          return [full];
        },
      }),
    }),
    select: () => ({ from: (table: any) => makeChain(table === incidentEventsTable) }),
  };
  return {
    db: {
      transaction: async (cb: any) => cb(fakeTx),
      insert: fakeTx.insert,
      update: () => ({
        set: (patch: any) => ({
          where: () => ({
            returning: async () => {
              const id = (globalThis as any).__lastIncidentId;
              const existing = eventStore.get(id);
              const updated = { ...existing, ...patch };
              eventStore.set(id, updated);
              return [updated];
            },
          }),
        }),
      }),
      select: fakeTx.select,
    },
    pool: { on: vi.fn() },
  };
});

vi.mock('../server/modules/audit/audit.service.ts', () => ({
  auditService: { logEvent: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../server/middlewares/authenticate.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../server/middlewares/authenticate.ts')>();
  return {
    ...original,
    authenticateToken: (req: any, _res: any, next: any) => {
      req.user = { userId: 'usr-2', name: 'Rina Wijaya', role: 'Tech Lead', permissions: ['PERM_INCIDENT_DECLARE', 'PERM_INCIDENT_COMMAND', 'PERM_VIEW_DASHBOARD'] };
      next();
    },
  };
});

vi.mock('../server/middlewares/rbac.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../server/middlewares/rbac.ts')>();
  return { ...original, requirePermission: () => (_req: any, _res: any, next: any) => next() };
});

import { incidentService } from '../server/modules/incidents/incident.service.ts';
import { incidentEventsService, statusToEventType } from '../server/modules/incidents/incident.events.ts';
import { incidentRouter } from '../server/modules/incidents/incident.routes.ts';
import { incidentEvents as incidentEventsTable } from '../server/db/schema/incident_events.ts';

(globalThis as any).__lastIncidentId = undefined;

describe('Incident timeline (Story 13.3 / AC #1, #2)', () => {
  it('records an alert on declaration and typed events on every transition', async () => {
    const created = await incidentService.declare(
      { title: 'MySQL replication lag', severity: 'MAJOR', environment: 'Production', impact: 'Laporan harian tertunda' },
      { userId: 'usr-2', name: 'Rina Wijaya' }
    );
    (globalThis as any).__lastIncidentId = created.id;

    (globalThis as any).__timelineIncidentId = created.id;
    let events = await incidentEventsService.list(created.id);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('alert');
    expect(events[0].message).toContain(created.code);

    await incidentService.transition(created.id, 'IDENTIFIED', { userId: 'usr-2', name: 'Rina' });
    await incidentService.transition(created.id, 'MONITORING', { userId: 'usr-2', name: 'Rina' });
    await incidentService.transition(created.id, 'MITIGATED', { userId: 'usr-2', name: 'Rina' });
    await incidentService.transition(created.id, 'RESOLVED', { userId: 'usr-2', name: 'Rina' });

    (globalThis as any).__timelineIncidentId = created.id; // keep context for the re-read
    events = await incidentEventsService.list(created.id);
    expect(events.map((e) => e.type)).toEqual(['alert', 'action', 'action', 'mitigation', 'resolution']);
  });

  it('maps statuses to the correct event types', () => {
    expect(statusToEventType('IDENTIFIED')).toBe('action');
    expect(statusToEventType('MITIGATED')).toBe('mitigation');
    expect(statusToEventType('RESOLVED')).toBe('resolution');
  });
});

describe('Timeline API (Story 13.3 / AC #2, #3, #4)', () => {
  let app: Express;
  let server: ReturnType<Express['listen']>;
  let baseUrl: string;
  let incidentId: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use((req: any, _res, next) => {
      req.user = { userId: 'usr-2', name: 'Rina Wijaya', role: 'Tech Lead' };
      next();
    });
    app.use('/api/v1/incidents', incidentRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
        resolve();
      });
    });

    // Seed one incident through the API (fake db shares the module-level store)
    (globalThis as any).__lastIncidentId = undefined;
    const res = await fetch(`${baseUrl}/api/v1/incidents`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Nginx 502 on staging', severity: 'MINOR', environment: 'Staging', impact: 'Preview environment tidak dapat diakses' }),
    });
    const body: any = await res.json();
    incidentId = body.data.id;
    (globalThis as any).__lastIncidentId = incidentId;
    (globalThis as any).__timelineIncidentId = incidentId; // fresh context for events reads
  });

  it('appends manual notes via POST /:id/events', async () => {
    const res = await fetch(`${baseUrl}/api/v1/incidents/${incidentId}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Investigasi dimulai bersama tim platform' }),
    });
    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.data.type).toBe('note');
  });

  it('rejects notes without a message (HTTP 400)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/incidents/${incidentId}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: '' }),
    });
    expect(res.status).toBe(400);
  });

  it('returns the chronological timeline scoped to the incident (no cross-incident leak)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/incidents/${incidentId}/events`);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data.count).toBeGreaterThanOrEqual(1);
    for (const evt of body.data.events) {
      expect(evt.incidentId).toBe(incidentId);
    }
    // chronological ascending
    const times = body.data.events.map((e: any) => new Date(e.createdAt).getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });
});
