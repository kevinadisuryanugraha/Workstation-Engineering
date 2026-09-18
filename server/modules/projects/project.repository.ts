import { eq, desc } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { projects, Project, NewProject } from '../../db/schema/projects.ts';

export class ProjectRepository {
  async findAll(): Promise<Project[]> {
    try {
      return await db.select().from(projects).orderBy(desc(projects.createdAt));
    } catch (err) {
      console.warn('[ProjectRepository] DB query failed, using empty array fallback:', err);
      return [];
    }
  }

  async findById(id: string): Promise<Project | null> {
    try {
      const results = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
      return results.length > 0 ? results[0] : null;
    } catch (err) {
      return null;
    }
  }

  async findByKey(key: string): Promise<Project | null> {
    try {
      const results = await db.select().from(projects).where(eq(projects.key, key.toUpperCase())).limit(1);
      return results.length > 0 ? results[0] : null;
    } catch (err) {
      return null;
    }
  }

  async create(data: NewProject): Promise<Project> {
    const inserted = await db.insert(projects).values(data).returning();
    return inserted[0];
  }

  async update(id: string, data: Partial<NewProject>): Promise<Project | null> {
    const updated = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updated.length > 0 ? updated[0] : null;
  }
}

export const projectRepository = new ProjectRepository();
