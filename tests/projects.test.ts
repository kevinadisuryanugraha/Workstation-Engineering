import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectService, ConflictError, NotFoundError } from '../server/modules/projects/project.service.ts';
import { ProjectRepository } from '../server/modules/projects/project.repository.ts';

describe('Project Service Unit Tests', () => {
  let mockRepo: any;
  let service: ProjectService;

  beforeEach(() => {
    mockRepo = {
      findAll: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue(null),
      findByKey: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'prj-1', ...data })),
      update: vi.fn().mockImplementation((id, data) => Promise.resolve({ id, ...data })),
    };
    service = new ProjectService(mockRepo as any);
  });

  it('creates project successfully with uppercase key', async () => {
    const input = {
      name: 'Workstation Core',
      key: 'wrk',
      tagline: 'Engineering Ops',
      status: 'ACTIVE' as const,
    };

    const result = await service.createProject(input as any, 'usr-admin', 'Admin User');
    expect(result.key).toBe('WRK');
    expect(result.name).toBe('Workstation Core');
    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      key: 'WRK',
    }));
  });

  it('rejects duplicate project key with ConflictError (HTTP 409)', async () => {
    mockRepo.findByKey.mockResolvedValueOnce({ id: 'existing-id', key: 'WRK' });

    const input = {
      name: 'Duplicate Project',
      key: 'WRK',
      status: 'ACTIVE' as const,
    };

    await expect(
      service.createProject(input as any, 'usr-admin', 'Admin User')
    ).rejects.toThrow(ConflictError);
  });

  it('throws NotFoundError when querying non-existent project id', async () => {
    mockRepo.findById.mockResolvedValueOnce(null);

    await expect(
      service.getProjectById('non-existent-id')
    ).rejects.toThrow(NotFoundError);
  });
});
