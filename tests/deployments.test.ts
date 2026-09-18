import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeploymentService } from '../server/modules/deployments/deployment.service.ts';
import { db } from '../server/db/client.ts';

describe('Deployments & Rollback Authorization Unit Tests', () => {
  let service: DeploymentService;

  beforeEach(() => {
    service = new DeploymentService();
    process.env.JWT_SECRET = 'workstation-test-secret-min-32-chars-long-security-token';
  });

  it('creates deployment record with environment and commit SHA', async () => {
    vi.spyOn(db, 'insert').mockReturnValueOnce({
      values: vi.fn().mockReturnValueOnce({
        returning: vi.fn().mockResolvedValueOnce([
          {
            id: 'dep-1',
            projectId: 'prj-1',
            environment: 'PRODUCTION',
            serverName: 'kontabo-vps-01',
            version: 'v1.4.2',
            commitSha: '826153632aff34f87358508d526500eb67952ce0',
            status: 'SUCCESS',
            deployedBy: 'CI Runner',
          },
        ]),
      }),
    } as any);

    const deployment = await service.createDeployment(
      {
        projectId: 'prj-1',
        environment: 'PRODUCTION',
        serverName: 'kontabo-vps-01',
        version: 'v1.4.2',
        commitSha: '826153632aff34f87358508d526500eb67952ce0',
      },
      'CI Runner'
    );

    expect(deployment.id).toBe('dep-1');
    expect(deployment.environment).toBe('PRODUCTION');
    expect(deployment.status).toBe('SUCCESS');
  });

  it('generates tamper-evident cryptographic signature on rollback', async () => {
    vi.spyOn(db, 'select').mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          limit: vi.fn().mockResolvedValueOnce([
            {
              id: 'dep-1',
              projectId: 'prj-1',
              environment: 'PRODUCTION',
              serverName: 'kontabo-vps-01',
              version: 'v1.4.2',
            },
          ]),
        }),
      }),
    } as any);

    vi.spyOn(db, 'insert').mockReturnValueOnce({
      values: vi.fn().mockReturnValueOnce({
        returning: vi.fn().mockResolvedValueOnce([
          {
            id: 'dep-rollback-1',
            projectId: 'prj-1',
            environment: 'PRODUCTION',
            serverName: 'kontabo-vps-01',
            version: 'v1.4.1',
            status: 'ROLLED_BACK',
            rollbackReason: 'Memory leak detected in orders background worker',
          },
        ]),
      }),
    } as any);

    const result = await service.rollbackDeployment(
      {
        deploymentId: 'dep-1',
        targetVersion: 'v1.4.1',
        reason: 'Memory leak detected in orders background worker',
      },
      'Rina Tech Lead',
      'Tech Lead'
    );

    expect(result.deployment.status).toBe('ROLLED_BACK');
    expect(result.signature).toBeDefined();
    expect(result.signature.length).toBe(64); // SHA-256 hex digest length
  });
});
