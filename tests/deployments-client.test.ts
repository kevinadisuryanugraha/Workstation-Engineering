import { describe, it, expect, vi } from 'vitest';

/**
 * Story 18.2 — Deployments client wiring (CC-5).
 * Mapper DTO→UI (pure) + kontrak kejujuran placeholder.
 * vi.mock apiClient memutus rantai import auth.ts (localStorage) di node.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'workstation-test-secret-min-32-chars-long-security-token';

vi.mock('../src/lib/apiClient.ts', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {},
}));

import { mapDeploymentDto, DeploymentDto } from '../src/hooks/api/useDeployments.ts';

const BASE_DTO: DeploymentDto = {
  id: 'abcd1234-0000-0000-0000-000000000000',
  projectId: 'proj-1',
  environment: 'PRODUCTION',
  serverName: 'kantor-01',
  version: 'v1.4.2',
  commitSha: 'c0ffee',
  status: 'SUCCESS',
  deployedBy: 'Kevin',
  rollbackReason: null,
  startedAt: '2026-09-19T03:00:00Z',
  completedAt: '2026-09-19T03:05:00Z',
};

describe('Story 18.2 — mapDeploymentDto', () => {
  it('memetakan field nyata: environment, server, actor, status', () => {
    const ui = mapDeploymentDto(BASE_DTO);
    expect(ui.environment).toBe('Production');
    expect(ui.server).toBe('kantor-01');
    expect(ui.actor).toBe('Kevin');
    expect(ui.status).toBe('SUCCESS');
    expect(ui.code).toBe('DEP-ABCD'); // diturunkan dari id nyata
    expect(ui.commitSha).toBe('c0ffee');
  });

  it('PENDING/IN_PROGRESS dipetakan jujur ke RUNNING', () => {
    expect(mapDeploymentDto({ ...BASE_DTO, status: 'IN_PROGRESS' }).status).toBe('RUNNING');
    expect(mapDeploymentDto({ ...BASE_DTO, status: 'PENDING' }).status).toBe('RUNNING');
    expect(mapDeploymentDto({ ...BASE_DTO, status: 'ROLLED_BACK' }).status).toBe('ROLLED_BACK');
  });

  it('ENV mapping lengkap & unknown aman', () => {
    expect(mapDeploymentDto({ ...BASE_DTO, environment: 'DEV' }).environment).toBe('Development');
    expect(mapDeploymentDto({ ...BASE_DTO, environment: 'STAGING' }).environment).toBe('Staging');
    expect(mapDeploymentDto({ ...BASE_DTO, environment: 'UAT' }).environment).toBe('UAT');
    expect(mapDeploymentDto({ ...BASE_DTO, environment: 'PLAN_ET' }).environment).toBe('Staging');
  });

  it('field tanpa padanan API = placeholder jujur, bukan karangan', () => {
    const ui = mapDeploymentDto({ ...BASE_DTO, completedAt: null, rollbackReason: null, commitSha: null });
    expect(ui.gates).toEqual([]); // gates belum dimodelkan di DB
    expect(ui.completedAt).toBe(''); // masih berjalan
    expect(ui.logsSummary).toBe('');
    expect(ui.commitSha).toBe('');
  });

  it('rollbackReason tampil sebagai logsSummary (satu-satunya log tersimpan)', () => {
    const ui = mapDeploymentDto({ ...BASE_DTO, rollbackReason: 'regresi login' });
    expect(ui.logsSummary).toBe('regresi login');
  });
});
