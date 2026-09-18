import { z } from 'zod';

export const createTicketSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().optional(),
  type: z.enum([
    'BUG',
    'FEATURE_REQUEST',
    'TECHNICAL_ISSUE',
    'MAINTENANCE',
    'SECURITY',
    'PERFORMANCE',
    'INCIDENT',
  ]).default('BUG'),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']).default('Medium'),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']).default('P2'),
  assigneeId: z.string().optional().nullable(),
});

export const triageTicketSchema = z.object({
  assigneeId: z.string().optional().nullable(),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']).optional(),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']).optional(),
  status: z.enum([
    'NEW',
    'TRIAGED',
    'ASSIGNED',
    'IN_PROGRESS',
    'IN_REVIEW',
    'READY_FOR_TEST',
    'TESTING',
    'RESOLVED',
    'CLOSED',
    'CANCELLED',
  ]).optional(),
  resolution: z.string().optional(),
});

export const resolveTicketSchema = z.object({
  resolution: z.string().min(5, 'Resolution description must be at least 5 characters'),
});

export const filterTicketSchema = z.object({
  projectId: z.string().optional(),
  status: z.string().optional(),
  severity: z.string().optional(),
  priority: z.string().optional(),
  assigneeId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type TriageTicketInput = z.infer<typeof triageTicketSchema>;
export type ResolveTicketInput = z.infer<typeof resolveTicketSchema>;
export type FilterTicketInput = z.infer<typeof filterTicketSchema>;
