import { describe, it, expect, vi } from 'vitest';
import { requirePermission, requireRole } from '../server/middlewares/rbac.ts';
import { AuthenticatedRequest } from '../server/middlewares/authenticate.ts';

function createMockResponse() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('RBAC Middleware Unit Tests', () => {
  it('rejects unauthenticated requests with HTTP 401', () => {
    const req: AuthenticatedRequest = {} as any;
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requirePermission('PERM_WORK_ITEM_CREATE');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows request when user possesses required permission', () => {
    const req: AuthenticatedRequest = {
      user: {
        userId: 'usr-1',
        email: 'lead@workstation.io',
        name: 'Tech Lead',
        role: 'Tech Lead',
        permissions: ['PERM_DEPLOYMENT_ROLLBACK', 'PERM_WORK_ITEM_CREATE'],
      },
    } as any;
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requirePermission('PERM_DEPLOYMENT_ROLLBACK');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects with HTTP 403 when user lacks required permission', () => {
    const req: AuthenticatedRequest = {
      user: {
        userId: 'usr-2',
        email: 'dev@workstation.io',
        name: 'Developer',
        role: 'Developer',
        permissions: ['PERM_WORK_ITEM_CREATE'], // lacks rollback
      },
    } as any;
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requirePermission('PERM_DEPLOYMENT_ROLLBACK');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({
        code: 'RBAC_ACCESS_DENIED',
      }),
    }));
  });

  it('enforces role clearance strictly via requireRole', () => {
    const req: AuthenticatedRequest = {
      user: {
        userId: 'usr-3',
        email: 'viewer@workstation.io',
        name: 'Viewer',
        role: 'Viewer',
        permissions: [],
      },
    } as any;
    const res = createMockResponse();
    const next = vi.fn();

    const middleware = requireRole('Super Admin', 'Tech Lead');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
