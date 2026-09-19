import { describe, it, expect } from 'vitest';

/**
 * HOTFIX 2026-09-19 — DTO→UI contract mappers untuk work items & tickets.
 *
 * Regresi yang dicegah: baris DB mentah (key/assigneeId, tanpa
 * acceptanceCriteria/evidence) masuk state UI → TypeError
 * `Cannot read properties of undefined (reading 'name')` di WorkItemsView.
 */

import {
  mapWorkItemDto,
  mapTicketDto,
  workItemPriorityFromDb,
  ticketPriorityFromDb,
  ticketSeverityFromDb,
} from '../src/lib/contractMappers.ts';

const WI_DTO = {
  id: 'wi-1',
  key: 'WRK-101',
  projectId: 'proj-1',
  title: 'Fix login bug',
  description: 'Login gagal saat password mengandung simbol',
  type: 'BUG',
  priority: 'P1',
  status: 'IN_PROGRESS',
  assigneeId: 'usr-9',
  estimateHours: 5,
  sprintId: 'spr-1',
  createdAt: '2026-09-19T01:00:00Z',
  updatedAt: '2026-09-19T02:00:00Z',
};

const TK_DTO = {
  id: 'tk-1',
  key: 'TCK-201',
  projectId: 'proj-1',
  requesterId: 'usr-3',
  assigneeId: null,
  type: 'SECURITY',
  severity: 'High',
  priority: 'P0',
  status: 'TRIAGED',
  title: 'Suspicious login alerts',
  createdAt: '2026-09-19T03:00:00Z',
  updatedAt: '2026-09-19T04:00:00Z',
};

describe('HOTFIX — mapWorkItemDto', () => {
  it('code berasal dari key; assignee TIDAK pernah undefined (akar crash)', () => {
    const ui = mapWorkItemDto(WI_DTO);
    expect(ui.code).toBe('WRK-101');
    expect(ui.assignee).toBeDefined();
    expect(ui.assignee.name).toBe('—'); // nama user belum di-join API — placeholder jujur
    expect(ui.assignee.id).toBe('usr-9');
  });

  it('relasi per-item diisi kosong JUJUR agar view tidak crash (.length/.map/.filter)', () => {
    const ui = mapWorkItemDto(WI_DTO);
    expect(ui.acceptanceCriteria).toEqual([]);
    expect(ui.evidence).toEqual([]);
    expect(ui.dependencies).toEqual([]);
  });

  it('assignee null → Unassigned (bukan undefined)', () => {
    const ui = mapWorkItemDto({ ...WI_DTO, assigneeId: null });
    expect(ui.assignee.name).toBe('Unassigned');
  });

  it('priority DB P0..P3 → label UI', () => {
    expect(workItemPriorityFromDb('P0')).toBe('Critical');
    expect(workItemPriorityFromDb('P1')).toBe('High');
    expect(workItemPriorityFromDb('P2')).toBe('Medium');
    expect(workItemPriorityFromDb('P3')).toBe('Low');
    expect(workItemPriorityFromDb('P9')).toBe('Medium');
  });

  it('status/type tidak dikenal → fallback aman dalam union', () => {
    const ui = mapWorkItemDto({ ...WI_DTO, status: 'WEIRD', type: 'MAGIC' });
    expect(ui.status).toBe('BACKLOG');
    expect(ui.type).toBe('TASK');
  });
});

describe('HOTFIX — mapTicketDto', () => {
  it('code dari key; reporter placeholder jujur (requester belum di-join)', () => {
    const ui = mapTicketDto(TK_DTO);
    expect(ui.code).toBe('TCK-201');
    expect(ui.reporter).toBe('—');
  });

  it('ticket tanpa assignee → assignee undefined (opsional di kontrak, aman)', () => {
    const ui = mapTicketDto(TK_DTO);
    expect(ui.assignee).toBeUndefined();
  });

  it('priority DB P0..P3 → skala UI P1..P4 (geser +1)', () => {
    expect(ticketPriorityFromDb('P0')).toBe('P1');
    expect(ticketPriorityFromDb('P2')).toBe('P3');
    expect(ticketPriorityFromDb('P3')).toBe('P4');
    expect(ticketPriorityFromDb('X')).toBe('P3');
  });

  it('severity DB (High/Medium) → union UI (Major/Minor)', () => {
    expect(ticketSeverityFromDb('Critical')).toBe('Critical');
    expect(ticketSeverityFromDb('High')).toBe('Major');
    expect(ticketSeverityFromDb('Medium')).toBe('Minor');
    expect(ticketSeverityFromDb('Low')).toBe('Low');
    expect(ticketSeverityFromDb('hmm')).toBe('Minor');
  });

  it('evidence kosong jujur; SLA netral (belum diekspos API)', () => {
    const ui = mapTicketDto(TK_DTO);
    expect(ui.evidence).toEqual([]);
    expect(ui.slaStatus).toBe('ON_TRACK');
    expect(ui.slaRemainingMinutes).toBe(0);
  });
});
