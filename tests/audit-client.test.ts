import { describe, it, expect, vi } from 'vitest';

/**
 * Story 18.4 — Audit ledger client wiring (CC-5): adapter DTO→event feed.
 * vi.mock apiClient memutus rantai import auth.ts (localStorage) di node.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'workstation-test-secret-min-32-chars-long-security-token';

vi.mock('../src/lib/apiClient.ts', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {},
}));

import { mapAuditLogDto, mapAuditType, AuditLogDto } from '../src/hooks/api/useAuditLogs.ts';

const BASE_DTO: AuditLogDto = {
  id: 'aud-1',
  actorId: 'usr-1',
  actorName: 'Kevin Santoso',
  action: 'TASK_STATUS_CHANGED',
  targetEntity: 'work_items',
  targetId: 'wrk-101',
  details: { from: 'IN_PROGRESS', to: 'DONE' },
  ipAddress: '127.0.0.1',
  correlationId: 'corr-uuid-1',
  createdAt: '2026-09-19T05:00:00Z',
};

describe('Story 18.4 — mapAuditType (heuristik jujur)', () => {
  it('memetakan aksi dikenal ke tipe event terdekat', () => {
    expect(mapAuditType('TICKET_CREATED')).toBe('TICKET_CREATED');
    expect(mapAuditType('TICKET_RESOLVED')).toBe('TICKET_RESOLVED');
    expect(mapAuditType('WORK_ITEM_UPDATED')).toBe('TASK_UPDATED');
    expect(mapAuditType('DEPLOYMENT_ROLLBACK')).toBe('DEPLOYMENT_SUCCESS');
    expect(mapAuditType('AI_SCAN_STARTED')).toBe('AI_SCAN_COMPLETED');
    expect(mapAuditType('GITHUB_COMMIT_SYNCED')).toBe('CODE_COMMITTED');
  });

  it('aksi tak dikenal → SYSTEM_AUDIT (bukan dipaksakan ke kategori lain)', () => {
    expect(mapAuditType('AUTH_LOGIN_FAILED')).toBe('SYSTEM_AUDIT');
    expect(mapAuditType('USER_PASSWORD_RESET')).toBe('SYSTEM_AUDIT');
  });
});

describe('Story 18.4 — mapAuditLogDto', () => {
  it('memetakan field nyata ke event feed UI', () => {
    const evt = mapAuditLogDto(BASE_DTO);
    expect(evt.id).toBe('aud-1');
    expect(evt.actor).toBe('Kevin Santoso');
    expect(evt.timestamp).toBe('2026-09-19T05:00:00Z');
    expect(evt.title).toBe('TASK_STATUS_CHANGED → work_items');
    expect(evt.descriptionTechnical).toContain('work_items#wrk-101');
    expect(evt.descriptionTechnical).toContain('corr-uuid-1');
    expect(evt.evidenceRef).toBe('corr-uuid-1');
    expect(evt.source).toBe('audit-log');
  });

  it('projectId tidak dikarang (audit log memang tidak menyimpannya)', () => {
    const evt = mapAuditLogDto(BASE_DTO);
    expect(evt.projectId).toBeUndefined();
  });
});
