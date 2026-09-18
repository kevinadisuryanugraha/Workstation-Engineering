import { describe, it, expect, beforeAll, vi } from 'vitest';
import express, { Express } from 'express';

/**
 * Story 13.1 — Incidents schema, declaration API, and status lifecycle machine.
 * DB is faked at the client boundary with a functional in-memory store; the REAL
 * service, state machine, and routes run end-to-end.
 */

process.env.JWT_SECRET = 'workstation-test-secret-min-32-chars-long-security-token';

const { incidentStore, eventRows } = vi.hoisted(() => {
  const incidentStore = new Map<string, any>();
  const eventRows = new Map<string, any>(); // timeline events live here (Story 13.3)
  return { incidentStore, eventRows };
});

vi.mock('../server/db/client.ts', () => {
  function rowsFrom(store: Map<string, any>) {
    return Array.from(store.values());
  }
  const fakeTx = {
    select: (..._a: any[]) => ({
      from: () => ({
        orderBy: () => ({
          limit: () => {
            // latest-code lookup for sequential INC-NNNNN
            const codes = rowsFrom(incidentStore).map((r: any) => r.code).filter(Boolean).sort();
            const latest = codes.length > 0 ? [{ code: codes[codes.length - 1] }] : [];
            return Promise.resolve(latest);
          },
        }),
      }),
    }),
    insert: () => ({
      values: (row: any) => ({
        returning: async () => {
          // Route incident rows vs timeline event rows to their own stores
          const isIncident = typeof row.code === 'string' && row.code.startsWith('INC-');
          const store = isIncident ? incidentStore : eventRows;
          const full = { id: `${isIncident ? 'inc' : 'evt'}-${store.size + 1}`, createdAt: new Date(), updatedAt: new Date(), ...row };
          store.set(full.id, full);
          return [full];
        },
      }),
    }),
    update: () => ({
      set: (patch: any) => ({
        where: () => ({
          returning: async () => {
            // The where() closure receives nothing through this fake; drizzle composes
            // internally, so we resolve the update against the LAST accessed incident
            // via the service's read-before-write contract.
            const target = (globalThis as any).__lastIncidentId;
            const existing = incidentStore.get(target);
            const updated = { ...existing, ...patch };
            incidentStore.set(target, updated);
            return [updated];
          },
        }),
      }),
    }),
  };
  return {
    db: {
      transaction: async (cb: any) => cb(fakeTx),
      insert: fakeTx.insert,
      update: fakeTx.update,
      select: (opts: any) => {
        const chain: any = {
          from: () => chain,
          where: () => chain,
          orderBy: () => chain,
          limit: (n?: number) => {
            chain.__limit = n;
            return chain;
          },
          offset: () => chain,
          then: (res: any, rej: any) => {
            // byId-style select (eq id): filter the store by the remembered id
            const id = (globalThis as any).__lastIncidentId;
            let rows = Array.from(incidentStore.values());
            if (id) rows = rows.filter((r) => r.id === id);
            if (chain.__limit) rows = rows.slice(0, chain.__limit);
            return Promise.resolve(rows).then(res, rej);
          },
          catch: (rej: any) => Promise.reject(rej),
        };
        return chain;
      },
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

import { incidentService, canTransition, InvalidTransitionError } from '../server/modules/incidents/incident.service.ts';
import { incidentRouter } from '../server/modules/incidents/incident.routes.ts';

describe('Incident state machine (Story 13.1 / AC #3)', () => {
  it('allows exactly the forward single-step path', () => {
    expect(canTransition('INVESTIGATING', 'IDENTIFIED')).toBe(true);
    expect(canTransition('IDENTIFIED', 'MONITORING')).toBe(true);
    expect(canTransition('MONITORING', 'MITIGATED')).toBe(true);
    expect(canTransition('MITIGATED', 'RESOLVED')).toBe(true);
    expect(canTransition('INVESTIGATING', 'RESOLVED')).toBe(false); // skip
    expect(canTransition('MONITORING', 'IDENTIFIED')).toBe(false); // backwards
    expect(canTransition('RESOLVED', 'INVESTIGATING')).toBe(false); // terminal
  });

  it('service rejects skips and backwards moves with InvalidTransitionError', async () => {
    const created = await incidentService.declare(
      { title: 'API latency spike', severity: 'MAJOR', environment: 'Production', impact: 'Slow dashboard for users' },
      { userId: 'usr-2', name: 'Rina Wijaya' }
    );
    (globalThis as any).__lastIncidentId = created.id;

    await expect(incidentService.transition(created.id, 'RESOLVED', { userId: 'usr-2', name: 'Rina' })).rejects.toThrow(InvalidTransitionError);

    const step1 = await incidentService.transition(created.id, 'IDENTIFIED', { userId: 'usr-2', name: 'Rina' });
    expect(step1.status).toBe('IDENTIFIED');
    expect(step1.acknowledgedAt).not.toBeNull(); // stamped for the SLA engine (13.2)

    await expect(incidentService.transition(created.id, 'IDENTIFIED', { userId: 'usr-2', name: 'Rina' })).rejects.toThrow(InvalidTransitionError);
  });
});

describe('Incident API (Story 13.1 / AC #2, #3, #5)', () => {
  let app: Express;
  let server: ReturnType<Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    // Inject the authenticated Tech Lead so req.user is available to handlers
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
  });

  it('rejects declaration missing required fields with HTTP 400', async () => {
    const res = await fetch(`${baseUrl}/api/v1/incidents`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Broken printer' }), // severity/environment/impact missing
    });
    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error.message).toContain('severity');
  });

  it('rejects an invalid severity with HTTP 400', async () => {
    const res = await fetch(`${baseUrl}/api/v1/incidents`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'X', severity: 'WAT', environment: 'Production', impact: 'Y' }),
    });
    expect(res.status).toBe(400);
  });

  it('declares a valid incident: sequential INC-NNNNN code + INVESTIGATING status', async () => {
    const res = await fetch(`${baseUrl}/api/v1/incidents`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Redis cache cluster unreachable',
        severity: 'CRITICAL',
        environment: 'Production',
        impact: 'Kasir mengalami lambat saat membuka daftar produk',
        serverName: 'kontabo-vps',
      }),
    });
    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.data.code).toMatch(/^INC-\d{5}$/);
    expect(body.data.status).toBe('INVESTIGATING');
    expect(body.data.commanderName).toBe('Rina Wijaya');
  });

  it('rejects an invalid target status with HTTP 400', async () => {
    const created = await incidentService.declare(
      { title: 'temp', severity: 'MINOR', environment: 'Staging', impact: 'temp' },
      { name: 'Rina' }
    );
    (globalThis as any).__lastIncidentId = created.id;

    const res = await fetch(`${baseUrl}/api/v1/incidents/${created.id}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'WAT' }),
    });
    expect(res.status).toBe(400);
  });

  it('unknown incident id → 404 on status change', async () => {
    (globalThis as any).__lastIncidentId = 'inc-does-not-exist'; // fake db filters by this
    const res = await fetch(`${baseUrl}/api/v1/incidents/inc-does-not-exist/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'IDENTIFIED' }),
    });
    expect(res.status).toBe(404);
  });
});
