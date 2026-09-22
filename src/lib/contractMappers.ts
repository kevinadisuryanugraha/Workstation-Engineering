import { WorkItem, Ticket, User, WorkItemStatus, TicketStatus, WorkItemType, TicketType, DebtOrigin, DebtImpact, DebtAgingBucket, DebtRegistryItem, DebtRegistrySummary, GitProvider, GitRepositoryDto } from '../types';

/**
 * HOTFIX 2026-09-19 (pasca-deploy Epic 17/18) — DTO→UI contract mappers untuk
 * work items & tickets.
 *
 * Akar masalah: endpoint /api/v1/work-items & /api/v1/tickets mengembalikan
 * baris DB mentah (key, assigneeId, tanpa acceptanceCriteria/evidence),
 * sedangkan view mengonsumsi kontrak UI (code, assignee: User,
 * evidence: EvidenceItem[]) — mengakibatkan TypeError `assignee.name` di
 * WorkItemsView. Mapper ini menjamin kontrak terpenuhi dengan placeholder
 * JUJUR (bukan data karangan).
 *
 * Catatan untuk CC-6 (bukan hotfix):
 * - Nama assignee/reporter belum di-join di API → tampil "—"/"Unassigned".
 * - acceptanceCriteria/evidence per-item butuh endpoint detail (loop N+1
 *   sengaja dihindari di jalur list).
 * - SLA ticket belum diekspos API → slaStatus netral ON_TRACK.
 */

type Raw = Record<string, any>;

const WORK_ITEM_STATUSES: WorkItemStatus[] = [
  'BACKLOG', 'READY', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'READY_FOR_TEST',
  'TESTING', 'READY_FOR_DEPLOY', 'DEPLOYED', 'DONE', 'CANCELLED',
];

const WORK_ITEM_TYPES: WorkItemType[] = [
  'EPIC', 'FEATURE', 'TASK', 'SUBTASK', 'BUG', 'TECH_DEBT', 'SPIKE', 'MAINTENANCE', 'REFACTOR', 'IMPROVEMENT',
];

const TICKET_STATUSES: TicketStatus[] = [
  'NEW', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'IN_REVIEW', 'READY_FOR_TEST',
  'TESTING', 'READY_FOR_DEPLOY', 'DEPLOYED', 'RESOLVED', 'CLOSED', 'BLOCKED',
];

const TICKET_TYPES: TicketType[] = [
  'BUG', 'FEATURE_REQUEST', 'TECHNICAL_ISSUE', 'MAINTENANCE', 'SECURITY', 'PERFORMANCE', 'INCIDENT',
];

const TICKET_SEVERITIES: Ticket['severity'][] = ['Critical', 'Major', 'Minor', 'Low'];

/** DB severity (Critical/High/Medium/Low) → UI (Critical/Major/Minor/Low). */
export function ticketSeverityFromDb(raw: string | null | undefined): Ticket['severity'] {
  const map: Record<string, Ticket['severity']> = {
    CRITICAL: 'Critical', HIGH: 'Major', MEDIUM: 'Minor', LOW: 'Low',
    Critical: 'Critical', High: 'Major', Medium: 'Minor', Low: 'Low',
  };
  const key = String(raw ?? '').trim();
  return map[key] ?? map[key.toLowerCase()] ?? 'Minor';
}

function normalize<T extends string>(raw: string | null | undefined, allowed: T[], fallback: T): T {
  const hit = allowed.find((a) => a.toLowerCase() === String(raw ?? '').trim().toLowerCase());
  return hit ?? fallback;
}

/** DB P0..P3 → UI label WorkItem. */
export function workItemPriorityFromDb(raw: string | null | undefined): WorkItem['priority'] {
  const map: Record<string, WorkItem['priority']> = {
    P0: 'Critical', P1: 'High', P2: 'Medium', P3: 'Low',
  };
  const key = String(raw ?? '').trim().toUpperCase();
  return map[key] ?? 'Medium';
}

/** DB P0..P3 → UI skala ticket P1..P4 (geser +1, kontrak berbeda). */
export function ticketPriorityFromDb(raw: string | null | undefined): Ticket['priority'] {
  const map: Record<string, Ticket['priority']> = {
    P0: 'P1', P1: 'P2', P2: 'P3', P3: 'P4',
  };
  const key = String(raw ?? '').trim().toUpperCase();
  return map[key] ?? 'P3';
}

/** Placeholder User jujur — API belum menyertakan join nama user. */
function placeholderUser(id: string | null | undefined): User {
  return {
    id: id ?? '',
    name: id ? '—' : 'Unassigned',
    email: '',
    avatar: '??',
    role: 'Developer',
    team: '',
  };
}

const DEBT_ORIGINS: DebtOrigin[] = ['AI_SCAN', 'TECH_LEAD_AUDIT', 'CODE_REVIEW', 'MANUAL', 'INCIDENT'];
const DEBT_IMPACTS: DebtImpact[] = ['HIGH', 'MEDIUM', 'LOW'];
const DEBT_AGING_BUCKETS: DebtAgingBucket[] = ['FRESH', 'AGING', 'STALE', 'CRITICAL'];

/** Story 22.1 (CC-7): enum debt — unknown/legacy → undefined (jujur, bukan karangan). */
function normalizeDebtEnum<T extends string>(raw: string | null | undefined, allowed: T[]): T | undefined {
  if (raw == null || raw === '') return undefined;
  const hit = allowed.find((a) => a.toLowerCase() === String(raw).trim().toLowerCase());
  return hit;
}

export function mapWorkItemDto(dto: Raw): WorkItem {
  return {
    id: dto.id,
    code: dto.key,
    title: dto.title,
    description: dto.description ?? '',
    type: normalize(dto.type, WORK_ITEM_TYPES, 'TASK'),
    status: normalize(dto.status, WORK_ITEM_STATUSES, 'BACKLOG'),
    priority: workItemPriorityFromDb(dto.priority),
    projectId: dto.projectId,
    assignee: placeholderUser(dto.assigneeId),
    sprintId: dto.sprintId ?? '',
    milestoneId: dto.milestoneId ?? undefined,
    estimateHours: dto.estimateHours ?? 0,
    actualHours: 0,
    // Relasi per-item (AC checklist, evidence, dependency) hidup di tabel lain —
    // jalur list tidak memuatnya; diisi kosong JUJUR (view aman dari crash).
    acceptanceCriteria: [],
    dependencies: [],
    evidence: [],
    gitBranch: dto.gitBranch ?? undefined,
    // Story 22.1 (CC-7): field registry debt — hanya bila valid (type TECH_DEBT).
    debtOrigin: normalizeDebtEnum(dto.debtOrigin, DEBT_ORIGINS),
    debtImpact: normalizeDebtEnum(dto.debtImpact, DEBT_IMPACTS),
    debtSourceRef: dto.debtSourceRef || undefined,
    agingDays: typeof dto.agingDays === 'number' && Number.isFinite(dto.agingDays) ? dto.agingDays : undefined,
    agingBucket: normalizeDebtEnum(dto.agingBucket, DEBT_AGING_BUCKETS),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapTicketDto(dto: Raw): Ticket {
  return {
    id: dto.id,
    code: dto.key,
    title: dto.title,
    type: normalize(dto.type, TICKET_TYPES, 'BUG'),
    category: dto.type ?? '—',
    severity: ticketSeverityFromDb(dto.severity),
    priority: ticketPriorityFromDb(dto.priority),
    status: normalize(dto.status, TICKET_STATUSES, 'NEW'),
    projectId: dto.projectId,
    reporter: '—', // requesterId belum di-join nama (CC-6)
    assignee: dto.assigneeId ? placeholderUser(dto.assigneeId) : undefined,
    slaStatus: 'ON_TRACK', // SLA belum diekspos API — nilai netral, bukan hasil hitungan
    slaTargetResolution: '—',
    slaRemainingMinutes: 0,
    description: dto.description ?? '',
    linkedWorkItemId: dto.linkedWorkItemId ?? undefined,
    evidence: [],
    createdAt: dto.createdAt,
    resolution: dto.resolution ?? undefined,
  };
}

// ─── Story 22.2 (CC-7, Master PRD §11.4): Debt Registry mappers ────────────

const DEBT_AGING_BUCKETS_22_2: DebtAgingBucket[] = ['FRESH', 'AGING', 'STALE', 'CRITICAL'];

/** Bucket dari angka aging — fallback bila server bucket tak dikenal. */
function debtBucketFromDays(days: number): DebtAgingBucket {
  if (days <= 30) return 'FRESH';
  if (days <= 90) return 'AGING';
  if (days <= 180) return 'STALE';
  return 'CRITICAL';
}

function isRecord(v: unknown): v is Record<string, any> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Normalisasi satu baris registry dari GET /api/v1/work-items/debts.
 * Jujur: baris tanpa id/key dibuang (null) — bukan dikarang.
 */
export function mapDebtRegistryItem(dto: unknown): DebtRegistryItem | null {
  if (!isRecord(dto)) return null;
  const id = typeof dto.id === 'string' ? dto.id : '';
  const key = typeof dto.key === 'string' ? dto.key : '';
  if (!id || !key) return null;

  const agingDays =
    typeof dto.agingDays === 'number' && Number.isFinite(dto.agingDays) && dto.agingDays >= 0
      ? Math.floor(dto.agingDays)
      : 0;
  const bucket = normalizeDebtEnum(dto.agingBucket, DEBT_AGING_BUCKETS_22_2) ?? debtBucketFromDays(agingDays);

  return {
    id,
    key,
    projectId: typeof dto.projectId === 'string' ? dto.projectId : '',
    title: typeof dto.title === 'string' && dto.title ? dto.title : key,
    description: typeof dto.description === 'string' ? dto.description : null,
    status: typeof dto.status === 'string' ? dto.status : 'BACKLOG',
    priority: typeof dto.priority === 'string' ? dto.priority : 'P2',
    ownerId: typeof dto.ownerId === 'string' ? dto.ownerId : null,
    milestoneId: typeof dto.milestoneId === 'string' ? dto.milestoneId : null,
    estimateHours: typeof dto.estimateHours === 'number' && Number.isFinite(dto.estimateHours) ? dto.estimateHours : null,
    debtOrigin: normalizeDebtEnum(dto.debtOrigin, DEBT_ORIGINS) ?? null,
    debtImpact: normalizeDebtEnum(dto.debtImpact, DEBT_IMPACTS) ?? null,
    debtSourceRef: typeof dto.debtSourceRef === 'string' && dto.debtSourceRef ? dto.debtSourceRef : null,
    createdAt: typeof dto.createdAt === 'string' ? dto.createdAt : new Date(0).toISOString(),
    agingDays,
    agingBucket: bucket,
  };
}

function normalizeDebtSummary(raw: unknown): DebtRegistrySummary | null {
  if (!isRecord(raw)) return null;
  const buckets: DebtAgingBucket[] = ['FRESH', 'AGING', 'STALE', 'CRITICAL'];
  const byAgingBucket: Record<DebtAgingBucket, number> = { FRESH: 0, AGING: 0, STALE: 0, CRITICAL: 0 };
  const rawBuckets = isRecord(raw.byAgingBucket) ? raw.byAgingBucket : {};
  for (const b of buckets) byAgingBucket[b] = typeof rawBuckets[b] === 'number' ? rawBuckets[b] : 0;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  const tally = (v: unknown) => {
    if (!isRecord(v)) return {};
    const out: Record<string, number> = {};
    for (const [k, n] of Object.entries(v)) if (typeof n === 'number' && Number.isFinite(n)) out[k] = n;
    return out;
  };
  return {
    total: num(raw.total),
    open: num(raw.open),
    byStatus: tally(raw.byStatus),
    byOrigin: tally(raw.byOrigin),
    byImpact: tally(raw.byImpact),
    byAgingBucket,
  };
}

/**
 * Normalisasi envelope GET /api/v1/work-items/debts → { items, summary }.
 * Menerima envelope { data, meta } ATAU array langsung; input sampah →
 * registry kosong yang JUJUR (kontrak hotfix: tidak pernah crash).
 */
export function mapDebtRegistryPayload(raw: unknown): { items: DebtRegistryItem[]; summary: DebtRegistrySummary | null } {
  if (!isRecord(raw)) {
    return { items: Array.isArray(raw) ? raw.map(mapDebtRegistryItem).filter((x): x is DebtRegistryItem => x !== null) : [], summary: null };
  }
  const list = Array.isArray(raw.data) ? raw.data : [];
  const items = list.map(mapDebtRegistryItem).filter((x): x is DebtRegistryItem => x !== null);
  return { items, summary: normalizeDebtSummary(raw.meta?.summary) };
}

// ─── Story 23.4 (CC-8, Master PRD §30): Git Repository Registry mappers ───

const GIT_PROVIDERS: GitProvider[] = ['GITHUB', 'GITLAB', 'BITBUCKET'];

export function mapGitRepositoryDto(raw: unknown): GitRepositoryDto | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === 'string' ? raw.id : '';
  const fullName = typeof raw.fullName === 'string' ? raw.fullName : '';
  if (!id || !fullName) return null;

  const providerRaw = String(raw.provider ?? 'GITHUB').toUpperCase();
  const provider = GIT_PROVIDERS.find((p) => p === providerRaw) ?? 'GITHUB';

  return {
    id,
    projectId: typeof raw.projectId === 'string' ? raw.projectId : '',
    fullName,
    provider,
    defaultBranch: typeof raw.defaultBranch === 'string' && raw.defaultBranch ? raw.defaultBranch : 'main',
    hasSecret: Boolean(raw.hasSecret),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date(0).toISOString(),
  };
}

