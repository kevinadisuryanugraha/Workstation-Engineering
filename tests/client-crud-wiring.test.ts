import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/lib/apiClient.ts', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {},
}));

import { useCreateWorkItem, useUpdateWorkItem } from '../src/hooks/api/useWorkItemMutations.ts';
import { useCreateTicket, useUpdateTicket } from '../src/hooks/api/useTicketMutations.ts';

describe('Story 24.1 (CC-9) — Client CRUD Mutations Hooks Definitions', () => {
  it('useCreateWorkItem hook mengekspor mutation function', () => {
    expect(typeof useCreateWorkItem).toBe('function');
  });

  it('useUpdateWorkItem hook mengekspor mutation function', () => {
    expect(typeof useUpdateWorkItem).toBe('function');
  });

  it('useCreateTicket hook mengekspor mutation function', () => {
    expect(typeof useCreateTicket).toBe('function');
  });

  it('useUpdateTicket hook mengekspor mutation function', () => {
    expect(typeof useUpdateTicket).toBe('function');
  });
});
