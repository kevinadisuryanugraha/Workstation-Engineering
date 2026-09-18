import { projectRepository, ProjectRepository } from './project.repository.ts';
import { CreateProjectInput, UpdateProjectInput } from './project.schema.ts';
import { Project, NewProject } from '../../db/schema/projects.ts';
import { auditService } from '../audit/audit.service.ts';

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ProjectService {
  constructor(private repo: ProjectRepository = projectRepository) {}

  async listProjects(): Promise<Project[]> {
    return this.repo.findAll();
  }

  async getProjectById(id: string): Promise<Project> {
    const project = await this.repo.findById(id);
    if (!project) {
      throw new NotFoundError(`Project with ID '${id}' not found`);
    }
    return project;
  }

  async createProject(
    input: CreateProjectInput,
    actorId: string,
    actorName: string,
    correlationId = 'system'
  ): Promise<Project> {
    const existing = await this.repo.findByKey(input.key);
    if (existing) {
      throw new ConflictError(`Project key '${input.key.toUpperCase()}' is already in use`);
    }

    const newRecord: NewProject = {
      name: input.name,
      key: input.key.toUpperCase(),
      tagline: input.tagline || null,
      description: input.description || null,
      status: input.status,
      organizationId: input.organizationId || null,
    };

    const project = await this.repo.create(newRecord);

    await auditService.logEvent({
      actorId,
      actorName,
      action: 'PROJECT_CREATED',
      targetEntity: 'projects',
      targetId: project.id,
      details: { key: project.key, name: project.name },
      correlationId,
    });

    return project;
  }

  async updateProject(
    id: string,
    input: UpdateProjectInput,
    actorId: string,
    actorName: string,
    correlationId = 'system'
  ): Promise<Project> {
    const existing = await this.getProjectById(id);

    const updated = await this.repo.update(id, input);
    if (!updated) {
      throw new NotFoundError(`Project with ID '${id}' not found`);
    }

    await auditService.logEvent({
      actorId,
      actorName,
      action: 'PROJECT_UPDATED',
      targetEntity: 'projects',
      targetId: id,
      details: { before: existing.status, after: updated.status },
      correlationId,
    });

    return updated;
  }
}

export const projectService = new ProjectService();
