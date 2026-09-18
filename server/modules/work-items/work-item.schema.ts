import { z } from 'zod';

export const createWorkItemSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().optional(),
  type: z.enum(['EPIC', 'FEATURE', 'TASK', 'SUBTASK', 'BUG', 'TECH_DEBT']).default('TASK'),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']).default('P2'),
  status: z.enum(['BACKLOG', 'READY', 'IN_PROGRESS', 'IN_REVIEW', 'READY_FOR_TEST', 'DONE', 'CANCELLED']).default('BACKLOG'),
  assigneeId: z.string().optional().nullable(),
  estimateHours: z.number().int().min(0).max(1000).optional(),
});

export const updateWorkItemSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().optional(),
  type: z.enum(['EPIC', 'FEATURE', 'TASK', 'SUBTASK', 'BUG', 'TECH_DEBT']).optional(),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']).optional(),
  status: z.enum(['BACKLOG', 'READY', 'IN_PROGRESS', 'IN_REVIEW', 'READY_FOR_TEST', 'DONE', 'CANCELLED']).optional(),
  assigneeId: z.string().optional().nullable(),
  estimateHours: z.number().int().min(0).max(1000).optional(),
});

export const filterWorkItemSchema = z.object({
  projectId: z.string().optional(),
  status: z.string().optional(),
  assigneeId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateWorkItemInput = z.infer<typeof createWorkItemSchema>;
export type UpdateWorkItemInput = z.infer<typeof updateWorkItemSchema>;
export type FilterWorkItemInput = z.infer<typeof filterWorkItemSchema>;
