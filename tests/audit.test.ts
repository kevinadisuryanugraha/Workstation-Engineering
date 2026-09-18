import { describe, it, expect, vi } from 'vitest';
import { requestCorrelationId } from '../server/middlewares/correlationId.ts';
import { auditService } from '../server/modules/audit/audit.service.ts';
import { AuthenticatedRequest } from '../server/middlewares/authenticate.ts';

describe('Correlation ID & Audit Logger Unit Tests', () => {
  it('assigns correlation ID if none is provided in headers', () => {
    const req: AuthenticatedRequest = { headers: {} } as any;
    const res: any = {
      setHeader: vi.fn(),
    };
    const next = vi.fn();

    requestCorrelationId(req, res, next);

    expect(req.correlationId).toBeDefined();
    expect(typeof req.correlationId).toBe('string');
    expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-Id', req.correlationId);
    expect(next).toHaveBeenCalled();
  });

  it('propagates incoming X-Correlation-Id when provided', () => {
    const existingId = 'test-trace-uuid-12345';
    const req: AuthenticatedRequest = {
      headers: { 'x-correlation-id': existingId },
    } as any;
    const res: any = {
      setHeader: vi.fn(),
    };
    const next = vi.fn();

    requestCorrelationId(req, res, next);

    expect(req.correlationId).toBe(existingId);
    expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-Id', existingId);
    expect(next).toHaveBeenCalled();
  });

  it('logs audit event safely without throwing fatal error', async () => {
    await expect(
      auditService.logEvent({
        actorId: 'usr-1',
        actorName: 'Test Actor',
        action: 'PROJECT_CREATED',
        targetEntity: 'projects',
        targetId: 'prj-1',
        correlationId: 'corr-123',
      })
    ).resolves.not.toThrow();
  });
});
