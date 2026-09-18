import { z } from 'zod';

export const createProjectSchema = z.object({
  organizationId: z.string().uuid().optional().nullable(),
  name: z.string().min(2, 'Project name must be at least 2 characters').max(150),
  key: z.string()
    .min(2, 'Key must be at least 2 characters')
    .max(6, 'Key cannot exceed 6 characters')
    .regex(/^[A-Z]{2,6}$/, 'Project key must be 2-6 uppercase letters (e.g. WRK, CORE)'),
  tagline: z.string().max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'AT_RISK', 'COMPLETED', 'ARCHIVED']).default('ACTIVE'),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  tagline: z.string().max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'AT_RISK', 'COMPLETED', 'ARCHIVED']).optional(),
  health: z.number().min(0).max(100).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
