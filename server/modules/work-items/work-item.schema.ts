import { z } from 'zod';

/** Story 22.1 (CC-7, Master PRD §11.4) — enum registry debt. */
export const DEBT_ORIGINS = ['AI_SCAN', 'TECH_LEAD_AUDIT', 'CODE_REVIEW', 'MANUAL', 'INCIDENT'] as const;
export const DEBT_IMPACTS = ['HIGH', 'MEDIUM', 'LOW'] as const;

export const debtFieldsSchema = {
  debtOrigin: z.enum(DEBT_ORIGINS).optional().nullable(),
  debtImpact: z.enum(DEBT_IMPACTS).optional().nullable(),
  debtSourceRef: z.string().max(120).optional().nullable(),
};

/**
 * Server-authoritative (AC 22.1.1): field debt hanya bermakna untuk
 * type = 'TECH_DEBT'. Pada create, `type` selalu terisi (default 'TASK') sehingga
 * payload non-debt otomatis dibersihkan. Pada update, field debt hanya dibuang
 * bila `type` EKSPLISIT bukan TECH_DEBT — bila type tidak dikirim, field debt
 * dipertahankan (kasus sah: update aging metadata debt eksisting).
 */
export function normalizeDebtFields<T extends { type?: string; debtOrigin?: unknown; debtImpact?: unknown; debtSourceRef?: unknown }>(
  input: T
): T {
  if (input.type === undefined || input.type === 'TECH_DEBT') return input;
  const { debtOrigin: _o, debtImpact: _i, debtSourceRef: _r, ...rest } = input;
  return rest as T;
}

export const createWorkItemSchema = z
  .object({
    projectId: z.string().min(1, 'Project ID is required'),
    title: z.string().min(3, 'Title must be at least 3 characters').max(255),
    description: z.string().optional(),
    type: z.enum(['EPIC', 'FEATURE', 'TASK', 'SUBTASK', 'BUG', 'TECH_DEBT']).default('TASK'),
    priority: z.enum(['P0', 'P1', 'P2', 'P3']).default('P2'),
    status: z.enum(['BACKLOG', 'READY', 'IN_PROGRESS', 'IN_REVIEW', 'READY_FOR_TEST', 'DONE', 'CANCELLED']).default('BACKLOG'),
    assigneeId: z.string().optional().nullable(),
    estimateHours: z.number().int().min(0).max(1000).optional(),
    ...debtFieldsSchema,
  })
  .transform(normalizeDebtFields);

export const updateWorkItemSchema = z
  .object({
    title: z.string().min(3).max(255).optional(),
    description: z.string().optional(),
    type: z.enum(['EPIC', 'FEATURE', 'TASK', 'SUBTASK', 'BUG', 'TECH_DEBT']).optional(),
    priority: z.enum(['P0', 'P1', 'P2', 'P3']).optional(),
    status: z.enum(['BACKLOG', 'READY', 'IN_PROGRESS', 'IN_REVIEW', 'READY_FOR_TEST', 'DONE', 'CANCELLED']).optional(),
    assigneeId: z.string().optional().nullable(),
    estimateHours: z.number().int().min(0).max(1000).optional(),
    sprintId: z.string().uuid().optional().nullable(),
    milestoneId: z.string().uuid().optional().nullable(),
    overrideReason: z.string().min(10).optional(),
    ...debtFieldsSchema,
  })
  .transform((v) => normalizeDebtFields(v));

export const filterWorkItemSchema = z.object({
  projectId: z.string().optional(),
  status: z.string().optional(),
  assigneeId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** Story 22.1 (CC-7): query filter endpoint Debt Registry. */
export const listDebtsQuerySchema = z.object({
  projectId: z.string().optional(),
  status: z.string().optional(),
  origin: z.enum(DEBT_ORIGINS).optional(),
  impact: z.enum(DEBT_IMPACTS).optional(),
});

export type CreateWorkItemInput = z.infer<typeof createWorkItemSchema>;
export type UpdateWorkItemInput = z.infer<typeof updateWorkItemSchema>;
export type FilterWorkItemInput = z.infer<typeof filterWorkItemSchema>;
