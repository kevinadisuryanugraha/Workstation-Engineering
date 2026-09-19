import {
  Project,
  WorkItem,
  Ticket,
  Incident,
  Commit,
  PullRequest,
  Deployment,
  ServerTelemetry,
  AIFinding,
  AIRecommendation,
  TechnicalDebt,
  EngineeringEvent,
  KnowledgeArticle,
  User
} from "./types";

/**
 * Story 17.2 (CC-4) — Demo Data Gating.
 *
 * Prinsip SEC-05 "honestly labeled demo data": boot default aplikasi
 * TIDAK boleh menampilkan data statis dari modul ini pada view yang sudah
 * memiliki sumber data API nyata. Data demo hanya di-seed ketika flag
 * VITE_DEMO_MODE aktif, dan selalu diberi label demo yang jelas.
 */

/**
 * Pure resolver flag demo — testable tanpa DOM.
 * Accepts: "1", "true", "yes", "on" (case-insensitive) → aktif; selain itu non-aktif.
 */
export function isDemoModeEnabled(rawFlag: string | boolean | undefined | null): boolean {
  if (typeof rawFlag === "boolean") return rawFlag;
  if (rawFlag === undefined || rawFlag === null) return false;
  const normalized = String(rawFlag).trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

/**
 * Flag demo runtime — dibaca sekali saat module load dari Vite env.
 * Default (flag tidak diset): FALSE → boot produksi memakai data nyata.
 */
export const DEMO_MODE: boolean = isDemoModeEnabled(
  typeof import.meta !== "undefined" ? (import.meta as any).env?.VITE_DEMO_MODE : undefined
);

/** Bentuk sumber data awal yang dikonsumsi blok data App.tsx. */
export interface InitialDataSource {
  projects: Project[];
  currentProject: Project | null;
  workItems: WorkItem[];
  tickets: Ticket[];
  deployments: Deployment[];
  servers: ServerTelemetry[];
  aiFindings: AIFinding[];
  aiRecommendations: AIRecommendation[];
  technicalDebts: TechnicalDebt[];
  incidents: Incident[];
  commits: Commit[];
  pullRequests: PullRequest[];
  events: EngineeringEvent[];
  articles: KnowledgeArticle[];
}

/**
 * Seed data awal aplikasi.
 * - demoMode FALSE → seluruh koleksi KOSONG (view beralih ke hook API React
 *   Query; domain tanpa hook API mengikuti AC4 story 17.2 dan dicatat di
 *   Dev Agent Record untuk course correction berikutnya).
 * - demoMode TRUE → seed mock lengkap (perilaku lama), WAJIB diberi banner
 *   label demo di App.tsx.
 */
export function getInitialDataSource(demoMode: boolean): InitialDataSource {
  if (!demoMode) {
    return {
      projects: [],
      currentProject: null,
      workItems: [],
      tickets: [],
      deployments: [],
      servers: [],
      aiFindings: [],
      aiRecommendations: [],
      technicalDebts: [],
      incidents: [],
      commits: [],
      pullRequests: [],
      events: [],
      articles: []
    };
  }
  return {
    projects: mockProjects,
    currentProject: mockProjects[0],
    workItems: mockWorkItems,
    tickets: mockTickets,
    deployments: mockDeployments,
    servers: mockServers,
    aiFindings: mockAIFindings,
    aiRecommendations: mockAIRecommendations,
    technicalDebts: mockTechnicalDebts,
    incidents: mockIncidents,
    commits: mockCommits,
    pullRequests: mockPullRequests,
    events: mockEngineeringEvents,
    articles: mockKnowledgeArticles
  };
}

export const mockUsers: User[] = [
  { id: "usr-1", name: "Kevin Santoso", email: "kevin@workstation.io", avatar: "KS", role: "Developer", team: "Web Team" },
  { id: "usr-2", name: "Rina Wijaya", email: "rina@workstation.io", avatar: "RW", role: "Tech Lead", team: "Engineering" },
  { id: "usr-3", name: "Budi Pratama", email: "budi@workstation.io", avatar: "BP", role: "Project Manager", team: "Product Delivery" },
  { id: "usr-4", name: "Citra Dewi", email: "citra@workstation.io", avatar: "CD", role: "Manager", team: "Operations" },
  { id: "usr-5", name: "Andi Saputra", email: "andi@workstation.io", avatar: "AS", role: "QA", team: "Quality" }
];

export const mockProjects: Project[] = [
  {
    id: "proj-lms",
    key: "LMS",
    name: "Learning Management System",
    tagline: "Enterprise training & student enrollment workflow platform",
    status: "ACTIVE",
    progress: 82,
    health: 87,
    owner: "Budi Pratama (PM)",
    techLead: "Rina Wijaya (Tech Lead)",
    currentSprint: "Sprint 04 — Enrollment",
    openTickets: 12,
    blockersCount: 2,
    latestRelease: "v1.4.2",
    productionStatus: "Healthy",
    repoName: "workstation-org/lms-core",
    modulesCount: 6,
    description: "Core LMS managing student admissions, curricula, exam proctoring, and automated certification."
  },
  {
    id: "proj-pos",
    key: "POS",
    name: "Point of Sale Engine",
    tagline: "High-throughput retail checkout, cashier hardware & inventory sync",
    status: "ACTIVE",
    progress: 74,
    health: 79,
    owner: "Budi Pratama (PM)",
    techLead: "Rina Wijaya (Tech Lead)",
    currentSprint: "Sprint 11 — Receipt Pipeline",
    openTickets: 8,
    blockersCount: 1,
    latestRelease: "v2.8.1",
    productionStatus: "Healthy",
    repoName: "workstation-org/pos-engine",
    modulesCount: 4,
    description: "Retail terminal checkout powering offline receipt spooling, barcode scanners, and inventory deduct."
  },
  {
    id: "proj-erp",
    key: "ERP",
    name: "Enterprise Resource Ledger",
    tagline: "Accounting, procurement approval chains, and vendor reconciliation",
    status: "AT_RISK",
    progress: 51,
    health: 64,
    owner: "Citra Dewi (Manager)",
    techLead: "Rina Wijaya (Tech Lead)",
    currentSprint: "Sprint 08 — Tax Invoicing",
    openTickets: 19,
    blockersCount: 3,
    latestRelease: "v0.9.4-rc2",
    productionStatus: "Degraded",
    repoName: "workstation-org/erp-finance",
    modulesCount: 8,
    description: "Corporate financial ledger reconciling general procurement with tax regulations and bank mutations."
  }
];

export const mockWorkItems: WorkItem[] = [
  {
    id: "wi-1",
    code: "ENR-024",
    title: "Implement rigorous enrollment validation & seat reservation",
    description: "Refactor student admission verification, prerequisite validation checks, and atomic seat reservation.",
    type: "FEATURE",
    status: "IN_PROGRESS",
    priority: "High",
    projectId: "proj-lms",
    assignee: mockUsers[0], // Kevin
    sprintId: "Sprint 04 — Enrollment",
    milestoneId: "M3 — Admissions Live",
    estimateHours: 16,
    actualHours: 11.5,
    acceptanceCriteria: [
      { id: "ac-1", text: "Validate academic GPA prerequisites against database", completed: true },
      { id: "ac-2", text: "Atomic lock seat allocation to prevent double-booking", completed: true },
      { id: "ac-3", text: "Emit CourseEnrolled telemetry event to message broker", completed: false }
    ],
    dependencies: ["AUTH-023"],
    evidence: [
      {
        id: "ev-1",
        type: "COMMIT",
        title: "8f31a92 - fix: improve enrollment validation",
        source: "GitHub Webhook",
        sourceId: "8f31a92",
        timestamp: "2026-09-17 13:20",
        confidence: 100,
        verificationStatus: "SYSTEM_VERIFIED",
        details: "12 files changed, +342/-87 lines"
      },
      {
        id: "ev-2",
        type: "PULL_REQUEST",
        title: "PR #42 Enrollment Module verification",
        source: "GitHub PR Review",
        sourceId: "PR-42",
        timestamp: "2026-09-17 14:00",
        confidence: 100,
        verificationStatus: "HUMAN_VERIFIED",
        verifiedBy: "Rina Wijaya",
        details: "Approved with 2 peer reviews"
      },
      {
        id: "ev-3",
        type: "TEST_RUN",
        title: "PHPUnit Suite: 14 tests passing",
        source: "CI/CD Pipeline",
        sourceId: "RUN-9821",
        timestamp: "2026-09-17 14:15",
        confidence: 100,
        verificationStatus: "SYSTEM_VERIFIED",
        details: "100% assertions green"
      }
    ],
    gitBranch: "feature/enrollment-validation",
    createdAt: "2026-09-15 09:00",
    updatedAt: "2026-09-17 13:20"
  },
  {
    id: "wi-2",
    code: "BUG-091",
    title: "Thermal printer timeout during receipt paper cut",
    description: "Investigate ESC/POS raw socket write hang on Kontabo POS proxy daemon.",
    type: "BUG",
    status: "DONE",
    priority: "Critical",
    projectId: "proj-pos",
    assignee: mockUsers[0], // Kevin
    sprintId: "Sprint 11 — Receipt Pipeline",
    estimateHours: 6,
    actualHours: 4.5,
    acceptanceCriteria: [
      { id: "ac-4", text: "Timeout lowered to 2500ms with retry fallback", completed: true },
      { id: "ac-5", text: "Buffer flushed before socket close", completed: true }
    ],
    dependencies: [],
    evidence: [
      {
        id: "ev-4",
        type: "COMMIT",
        title: "a81f32d - fix: handle ESC/POS driver buffer flush",
        source: "GitHub",
        sourceId: "a81f32d",
        timestamp: "2026-09-17 13:20",
        confidence: 100,
        verificationStatus: "SYSTEM_VERIFIED"
      },
      {
        id: "ev-5",
        type: "DEPLOYMENT",
        title: "DEP-502 deployed to Production Kontabo VPS",
        source: "Workstation Agent",
        sourceId: "DEP-502",
        timestamp: "2026-09-17 16:15",
        confidence: 100,
        verificationStatus: "SYSTEM_VERIFIED",
        details: "Release v2.8.1 verified healthy"
      }
    ],
    gitBranch: "fix/TK-182-receipt",
    createdAt: "2026-09-17 10:00",
    updatedAt: "2026-09-17 16:30"
  },
  {
    id: "wi-3",
    code: "AUTH-023",
    title: "Refactor legacy authentication middleware to stateless JWT",
    description: "Separate authorization policies from core HTTP routing pipeline to support multi-tenant API tokens.",
    type: "REFACTOR",
    status: "DONE",
    priority: "High",
    projectId: "proj-lms",
    assignee: mockUsers[1], // Rina
    sprintId: "Sprint 03 — Core Arch",
    estimateHours: 12,
    actualHours: 10,
    acceptanceCriteria: [
      { id: "ac-6", text: "JWT verification offloaded to fast auth guard", completed: true },
      { id: "ac-7", text: "Redis token revocation blacklist enabled", completed: true }
    ],
    dependencies: [],
    evidence: [
      {
        id: "ev-6",
        type: "COMMIT",
        title: "9c1b4e7 - refactor: decoupled auth guard middleware",
        source: "GitHub",
        sourceId: "9c1b4e7",
        timestamp: "2026-09-16 17:40",
        confidence: 100,
        verificationStatus: "SYSTEM_VERIFIED"
      }
    ],
    gitBranch: "refactor/auth-pipeline",
    createdAt: "2026-09-14 11:00",
    updatedAt: "2026-09-16 18:00"
  }
];

export const mockTickets: Ticket[] = [
  {
    id: "tk-1",
    code: "TK-2026-0182",
    title: "POS tidak dapat mencetak struk di kasir cabang utama",
    type: "INCIDENT",
    category: "Hardware / Driver Integration",
    severity: "Major",
    priority: "P1",
    status: "RESOLVED",
    projectId: "proj-pos",
    reporter: "Andi Saputra (Store Ops)",
    assignee: mockUsers[0], // Kevin
    slaStatus: "ON_TRACK",
    slaTargetResolution: "2026-09-17 18:00",
    slaRemainingMinutes: 0,
    description: "Mesin kasir POS terminal 01-04 mengalami hanging saat tombol 'Print Struk' ditekan. Kasir terpaksa mencatat manual.",
    linkedWorkItemId: "BUG-091",
    evidence: [
      {
        id: "ev-tk-1",
        type: "DEPLOYMENT",
        title: "Production Patch v2.8.1 Deployed",
        source: "Kontabo Agent",
        sourceId: "DEP-502",
        timestamp: "2026-09-17 16:15",
        confidence: 100,
        verificationStatus: "HUMAN_VERIFIED",
        verifiedBy: "Kevin Santoso"
      }
    ],
    createdAt: "2026-09-17 09:00",
    resolution: "ESC/POS buffer flush race condition diperbaiki pada patch v2.8.1. Kasir cabang telah memvalidasi 20 transaksi sukses."
  },
  {
    id: "tk-2",
    code: "TK-2026-0183",
    title: "Mahasiswa gagal verifikasi prasyarat mata kuliah elektif",
    type: "BUG",
    category: "Enrollment Workflow",
    severity: "Minor",
    priority: "P2",
    status: "IN_PROGRESS",
    projectId: "proj-lms",
    reporter: "Siti Rahma (Academic Admin)",
    assignee: mockUsers[0],
    slaStatus: "ON_TRACK",
    slaTargetResolution: "2026-09-18 12:00",
    slaRemainingMinutes: 720,
    description: "Sistem mengeluarkan error 422 saat mahasiswa semester 5 mengambil mata kuliah 'Machine Learning Fundamentals'.",
    linkedWorkItemId: "ENR-024",
    evidence: [],
    createdAt: "2026-09-17 10:15"
  },
  {
    id: "tk-3",
    code: "TK-2026-0179",
    title: "Faktur Pajak PDF tidak ter-generate saat tutup buku harian",
    type: "BUG",
    category: "Invoicing & Tax",
    severity: "Critical",
    priority: "P1",
    status: "BLOCKED",
    projectId: "proj-erp",
    reporter: "Dewi (Finance Lead)",
    assignee: mockUsers[1],
    slaStatus: "AT_RISK",
    slaTargetResolution: "2026-09-17 15:00",
    slaRemainingMinutes: -45,
    description: "Worker job kehabisan memori (OOM) saat rendering PDF invoice lebih dari 500 halaman.",
    evidence: [],
    createdAt: "2026-09-16 16:30"
  }
];

export const mockIncidents: Incident[] = [
  {
    id: "inc-1",
    code: "INC-00042",
    projectId: "proj-pos",
    title: "Production POS Cashier Receipt Spooler Socket Deadlock",
    severity: "CRITICAL",
    environment: "Production",
    server: "Kontabo VPS (IP: 194.163.158.42)",
    detectedAt: "2026-09-17 09:00",
    resolvedAt: "2026-09-17 16:20",
    status: "RESOLVED",
    commander: "Rina Wijaya (Tech Lead)",
    impact: "Kasir retail mengalami downtime pencetakan selama 45 menit sebelum fallback receipt diaktifkan.",
    relatedTicketCode: "TK-2026-0182",
    runbookUrl: "RB-NET-014: Thermal Spooler Socket Flush",
    timeline: [
      { time: "09:00", event: "Incident detected via Store Ops ticket TK-2026-0182", actor: "Andi (Support)", type: "alert" },
      { time: "09:10", event: "Assigned to Kevin & incident war room initialized", actor: "Rina (Tech Lead)", type: "action" },
      { time: "10:00", event: "Work Item BUG-091 created with reproduction script", actor: "Kevin", type: "action" },
      { time: "13:20", event: "Fix committed to branch fix/TK-182-receipt (SHA a81f32d)", actor: "Kevin", type: "action" },
      { time: "14:00", event: "PR #128 merged after code review signoff", actor: "Rina", type: "action" },
      { time: "15:15", event: "Staging deployment verification successful", actor: "CI/CD Gate", type: "mitigation" },
      { time: "16:15", event: "Production deployment DEP-502 executed on Kontabo VPS", actor: "Workstation Agent", type: "mitigation" },
      { time: "16:20", event: "Cashier service verified healthy, incident closed and postmortem compiled", actor: "Rina", type: "resolution" }
    ],
    postmortem: {
      rootCause: "Unbounded write stream on raw ESC/POS network socket led to deadlocks under high concurrency.",
      impactDurationMinutes: 45,
      mitigation: "Introduced 2.5s socket timeout guard and drain events prior to closing buffer.",
      correctiveActionWorkItemCode: "BUG-091"
    }
  },
  {
    id: "inc-2",
    code: "INC-00043",
    projectId: "proj-erp",
    title: "Invoice Worker OOM Spike during Daily Closing Batch",
    severity: "CRITICAL",
    environment: "Production",
    server: "ERP Dedicated Node (IP: 194.163.158.43)",
    detectedAt: "2026-09-17 16:30",
    status: "INVESTIGATING",
    commander: "Budi Santoso (VP Eng)",
    impact: "Generate PDF Faktur Pajak mengalami kegagalan proses tutup buku harian untuk 500+ faktur.",
    relatedTicketCode: "TK-2026-0179",
    runbookUrl: "RB-MEM-002: PDF Generator Memory Cap Tuning",
    timeline: [
      { time: "16:30", event: "Prometheus alert: Pod memory threshold breached 98% (Node OOM Killed)", actor: "Monitoring System", type: "alert" },
      { time: "16:35", event: "War room activated: War Room channel #inc-00043 live", actor: "Budi Santoso", type: "action" },
      { time: "16:45", event: "Worker process restarted with temporary 2GB memory overhead limit", actor: "SRE On-Call", type: "mitigation" },
      { time: "17:00", event: "Investigating stream pipe memory leaks in wkhtmltopdf child process", actor: "Rina Wijaya", type: "action" }
    ]
  },
  {
    id: "inc-3",
    code: "INC-00041",
    projectId: "proj-lms",
    title: "LMS Elective Course Prerequisite Recursive Validation Loop",
    severity: "MAJOR",
    environment: "Staging",
    server: "Staging Test Cluster (IP: 194.163.158.45)",
    detectedAt: "2026-09-16 11:20",
    resolvedAt: "2026-09-16 15:40",
    status: "RESOLVED",
    commander: "Rina Wijaya (Tech Lead)",
    impact: "Mahasiswa angkatan 2024 terblokir saat memilih mata kuliah Machine Learning pada masa uji coba KRS.",
    relatedTicketCode: "TK-2026-0183",
    runbookUrl: "RB-DB-008: Cyclic Dependency Resolution in DAG",
    timeline: [
      { time: "11:20", event: "Academic QA report: 422 Unprocessable Entity during prerequisite validation", actor: "Siti Rahma", type: "alert" },
      { time: "11:45", event: "Reproduced cyclic dependency between ML and Linear Algebra prerequisites", actor: "Kevin", type: "action" },
      { time: "14:10", event: "Refactored topological sort validator in commit 8f31a92", actor: "Kevin", type: "mitigation" },
      { time: "15:40", event: "Verification test passed on staging node", actor: "Rina", type: "resolution" }
    ],
    postmortem: {
      rootCause: "Circular prerequisite chain was not detected prior to depth-first traversal in enrollment graph.",
      impactDurationMinutes: 260,
      mitigation: "Implemented Kahn's algorithm cycle check with memoized visited nodes.",
      correctiveActionWorkItemCode: "ENR-024"
    }
  }
];

export const mockCommits: Commit[] = [
  {
    sha: "8f31a92",
    message: "fix: improve enrollment validation and prerequisite assertion logic",
    author: "Kevin Santoso",
    branch: "feature/enrollment",
    timestamp: "2026-09-17 13:20",
    filesChanged: 12,
    additions: 342,
    deletions: 87,
    linkedItemCodes: ["ENR-024"]
  },
  {
    sha: "a81f32d",
    message: "fix(receipt): resolve socket deadlock in thermal printer spooler",
    author: "Kevin Santoso",
    branch: "fix/TK-182-receipt",
    timestamp: "2026-09-17 13:15",
    filesChanged: 4,
    additions: 89,
    deletions: 23,
    linkedItemCodes: ["BUG-091", "TK-2026-0182"]
  },
  {
    sha: "9c1b4e7",
    message: "refactor(auth): isolate JWT validation from HTTP kernel into policy guard",
    author: "Rina Wijaya",
    branch: "main",
    timestamp: "2026-09-16 17:40",
    filesChanged: 18,
    additions: 512,
    deletions: 320,
    linkedItemCodes: ["AUTH-023"]
  },
  {
    sha: "b47c901",
    message: "chore(config): register Kontabo agent webhook telemetry endpoint",
    author: "Kevin Santoso",
    branch: "main",
    timestamp: "2026-09-16 14:10",
    filesChanged: 2,
    additions: 45,
    deletions: 6,
    linkedItemCodes: ["INFRA-01"]
  }
];

export const mockPullRequests: PullRequest[] = [
  {
    id: 42,
    title: "Enrollment Workflow & Prerequisite Logic (ENR-024)",
    sourceBranch: "feature/enrollment",
    targetBranch: "main",
    author: "Kevin Santoso",
    status: "OPEN",
    reviewers: [
      { name: "Rina Wijaya", approved: true },
      { name: "Budi Pratama", approved: false }
    ],
    ciStatus: "PASSED",
    commitsCount: 8,
    linkedItemCode: "ENR-024"
  },
  {
    id: 128,
    title: "Hotfix: POS printer buffer deadlock fix (BUG-091)",
    sourceBranch: "fix/TK-182-receipt",
    targetBranch: "main",
    author: "Kevin Santoso",
    status: "MERGED",
    reviewers: [
      { name: "Rina Wijaya", approved: true }
    ],
    ciStatus: "PASSED",
    commitsCount: 2,
    linkedItemCode: "BUG-091",
    mergedAt: "2026-09-17 14:00"
  }
];

export const mockDeployments: Deployment[] = [
  {
    id: "dep-502",
    code: "DEP-502",
    projectId: "proj-pos",
    environment: "Production",
    server: "Kontabo VPS (Production)",
    version: "v2.8.1",
    commitSha: "a81f32d",
    actor: "Workstation CI Automated Pipeline",
    startedAt: "2026-09-17 16:10",
    completedAt: "2026-09-17 16:15",
    status: "SUCCESS",
    gates: [
      { name: "Automated Regression Suite", passed: true, verifiedBy: "CI Runner" },
      { name: "Tech Lead QA Signoff", passed: true, verifiedBy: "Rina Wijaya" },
      { name: "Agent Pre-flight Port Check", passed: true, verifiedBy: "Kontabo Agent" }
    ],
    logsSummary: "Asset bundle built in 14.2s. PHP-FPM reloaded gracefully. Migration skipped (no schema change). Zero downtime."
  },
  {
    id: "dep-501",
    code: "DEP-501",
    projectId: "proj-lms",
    environment: "Production",
    server: "Kontabo VPS (Production)",
    version: "v1.4.2",
    commitSha: "9c1b4e7",
    actor: "Rina Wijaya",
    startedAt: "2026-09-16 19:10",
    completedAt: "2026-09-16 19:15",
    status: "SUCCESS",
    gates: [
      { name: "Unit & Feature Tests", passed: true, verifiedBy: "GitHub Actions" },
      { name: "Database Migration Check", passed: true, verifiedBy: "Kontabo Agent" }
    ],
    logsSummary: "v1.4.2 deployment verified. Redis cache warmed. Health check /api/health returned 200 OK."
  },
  {
    id: "dep-500",
    code: "DEP-500",
    projectId: "proj-lms",
    environment: "Development",
    server: "Office Server Local (Development)",
    version: "v1.5.0-alpha.3",
    commitSha: "8f31a92",
    actor: "Kevin Santoso",
    startedAt: "2026-09-17 13:30",
    completedAt: "2026-09-17 13:32",
    status: "SUCCESS",
    gates: [
      { name: "Local Linter & Static Analysis", passed: true, verifiedBy: "Office Agent" }
    ],
    logsSummary: "Staged on office local environment for internal testing."
  }
];

export const mockServers: ServerTelemetry[] = [
  {
    id: "srv-kontabo",
    name: "Kontabo VPS Production Node",
    environment: "Production",
    ip: "194.163.158.42",
    provider: "Kontabo VPS",
    os: "Ubuntu 24.04 LTS (Kernel 6.8.0)",
    status: "ONLINE",
    agentVersion: "v1.2.4 (signed)",
    lastHeartbeat: "Just now (3s ago)",
    cpuUsage: 28.4,
    ramUsage: 64.2,
    diskUsage: 48.0,
    loadAverage: "0.42, 0.38, 0.35",
    uptime: "48 days, 14 hours",
    services: [
      { name: "Nginx Ingress (Reverse Proxy)", status: "Running", port: 443, memoryMb: 42 },
      { name: "PHP-FPM 8.3 Pool", status: "Running", port: 9000, memoryMb: 520 },
      { name: "MySQL 8.0 Enterprise", status: "Running", port: 3306, memoryMb: 1840 },
      { name: "Redis Cache & Queue Store", status: "Running", port: 6379, memoryMb: 240 },
      { name: "Laravel Queue Workers", status: "Running", memoryMb: 310 },
      { name: "Supervisor Daemon", status: "Running", memoryMb: 28 }
    ]
  },
  {
    id: "srv-office",
    name: "Office Server Local Dev / Staging",
    environment: "Development",
    ip: "192.168.10.250",
    provider: "Office Server Local",
    os: "Debian 12 Bookworm",
    status: "ONLINE",
    agentVersion: "v1.2.4 (signed)",
    lastHeartbeat: "12s ago",
    cpuUsage: 14.1,
    ramUsage: 41.5,
    diskUsage: 35.8,
    loadAverage: "0.18, 0.22, 0.19",
    uptime: "19 days, 6 hours",
    services: [
      { name: "Nginx Dev", status: "Running", port: 80, memoryMb: 24 },
      { name: "PHP-FPM 8.3 Dev", status: "Running", port: 9000, memoryMb: 290 },
      { name: "PostgreSQL 16 Staging", status: "Running", port: 5432, memoryMb: 610 },
      { name: "Redis Dev", status: "Running", port: 6379, memoryMb: 85 },
      { name: "Mailpit Testing SMTP", status: "Running", port: 1025, memoryMb: 18 }
    ]
  }
];

export const mockAIFindings: AIFinding[] = [
  {
    id: "FND-182",
    scanId: "AI-SCAN-20260917",
    title: "Potential N+1 Query in Enrollment Listing Iteration",
    category: "Performance",
    severity: "Medium",
    confidence: 86,
    affectedFile: "EnrollmentController.php:48",
    evidence: "Query detected inside foreach loop over $enrollments without eager loading ->courses relationship.",
    impact: "Causes 100+ separate SQL trips when serializing class-roster summaries during KRS period.",
    suggestedRemediation: "Utilize Enrollment::with(['student', 'courses'])->get() to batch hydrate relations in a single SQL query.",
    status: "PENDING",
    detectedAt: "2026-09-17 08:30"
  },
  {
    id: "FND-183",
    scanId: "AI-SCAN-20260917",
    title: "Unchecked Agent HMAC Nonce Expiration",
    category: "Security",
    severity: "High",
    confidence: 92,
    affectedFile: "AgentAuthMiddleware.php:31",
    evidence: "Timestamp delta permitted up to 600s without replay cache storage.",
    impact: "Replay window allows intercepted telemetry packets to be retransmitted within 10-minute window.",
    suggestedRemediation: "Reduce clock drift tolerance to 60s and store used nonces in Redis with 120s TTL.",
    status: "CONFIRMED",
    detectedAt: "2026-09-17 08:31"
  },
  {
    id: "FND-184",
    scanId: "AI-SCAN-20260917",
    title: "Missing Unit Test Coverage on Seat Reservation Atomic Lock",
    category: "Testing",
    severity: "Medium",
    confidence: 89,
    affectedFile: "EnrollmentService.php:84",
    evidence: "Cache::lock('seat_allocation') block has no concurrent race simulation in test suite.",
    impact: "Potential undetected race condition when enrollment opening attracts simultaneous student traffic.",
    suggestedRemediation: "Add concurrent race condition test using spatie/fork or parallel artisan test runner.",
    status: "PENDING",
    detectedAt: "2026-09-17 08:32"
  }
];

export const mockAIRecommendations: AIRecommendation[] = [
  {
    id: "REC-81",
    title: "Implement automated concurrent race tests for EnrollmentService",
    reason: "Limited automated coverage for high-concurrency admission windows.",
    expectedImpact: "Eliminates potential double-booking errors during student rush hour.",
    effortEstimate: "4–6 hours",
    affectedModule: "Enrollment & Admissions",
    confidence: 88
  },
  {
    id: "REC-82",
    title: "Add Redis-based nonce cache in Server Agent webhook listener",
    reason: "Strengthens replay protection for Kontabo and Office server agents.",
    expectedImpact: "Complies with strict enterprise zero-trust telemetry guidelines.",
    effortEstimate: "2–3 hours",
    affectedModule: "Infrastructure Security",
    confidence: 94
  },
  {
    id: "REC-83",
    title: "Migrate POS receipt log table to partitioned time-series schema",
    reason: "Table pos_receipt_logs exceeded 4.2 million rows; indexing cost is growing.",
    expectedImpact: "Saves 35% table scan IOPS and accelerates daily cashier reporting.",
    effortEstimate: "8 hours",
    affectedModule: "POS Database",
    confidence: 84
  }
];

export const mockTechnicalDebts: TechnicalDebt[] = [
  {
    id: "td-1",
    code: "TD-023",
    title: "Legacy authentication middleware & tight kernel coupling",
    impact: "High",
    estimatedEffortHours: 8,
    source: "AI Scan",
    status: "IN_PROGRESS",
    agingDays: 14,
    affectedModule: "LMS Auth"
  },
  {
    id: "td-2",
    code: "TD-024",
    title: "Direct synchronous PDF rendering in HTTP request thread",
    impact: "High",
    estimatedEffortHours: 12,
    source: "Tech Lead Audit",
    status: "OPEN",
    agingDays: 28,
    affectedModule: "ERP Tax Invoicing"
  },
  {
    id: "td-3",
    code: "TD-025",
    title: "Hardcoded ESC/POS binary codes without printer capability abstraction",
    impact: "Medium",
    estimatedEffortHours: 6,
    source: "Code Review",
    status: "OPEN",
    agingDays: 9,
    affectedModule: "POS Terminal Driver"
  }
];

export const mockEngineeringEvents: EngineeringEvent[] = [
  {
    id: "evt-1",
    type: "DEPLOYMENT_SUCCESS",
    actor: "Workstation Agent",
    projectId: "proj-pos",
    timestamp: "16:15",
    title: "Production Deployment v2.8.1 Successful",
    descriptionTechnical: "Applied patch a81f32d to Kontabo VPS (port 443). Zero downtime PHP-FPM reload.",
    descriptionManagement: "Pembaruan sistem kasir (v2.8.1) berhasil dipasang di server production. Masalah cetak struk telah teratasi.",
    evidenceRef: "DEP-502"
  },
  {
    id: "evt-2",
    type: "PR_MERGED",
    actor: "Rina Wijaya",
    projectId: "proj-pos",
    timestamp: "14:00",
    title: "PR #128 Merged into main",
    descriptionTechnical: "Hotfix for thermal printer buffer deadlock merged with 2 approved code reviews.",
    descriptionManagement: "Kode perbaikan printer kasir telah ditinjau dan disetujui untuk dipersiapkan ke tahap rilis.",
    evidenceRef: "PR-128"
  },
  {
    id: "evt-3",
    type: "TICKET_RESOLVED",
    actor: "Kevin Santoso",
    projectId: "proj-pos",
    timestamp: "16:30",
    title: "Ticket TK-2026-0182 Resolved",
    descriptionTechnical: "ESC/POS raw socket write deadlock mitigated with timeout fallback.",
    descriptionManagement: "Tiket keluhan mesin kasir tidak bisa cetak struk dinyatakan selesai dan divalidasi oleh tim toko.",
    evidenceRef: "TK-2026-0182"
  },
  {
    id: "evt-4",
    type: "AI_SCAN_COMPLETED",
    actor: "WORKSTATION AI Scanner",
    projectId: "proj-lms",
    timestamp: "08:30",
    title: "AI Scan #182 Completed",
    descriptionTechnical: "Found 3 issues (1 High, 2 Medium) in architecture and query performance.",
    descriptionManagement: "Pemeriksaan AI mendeteksi 3 area optimasi pada performa query database dan keamanan agent.",
    evidenceRef: "SCAN-182"
  },
  {
    id: "evt-5",
    type: "CODE_COMMITTED",
    actor: "Kevin Santoso",
    projectId: "proj-lms",
    timestamp: "13:20",
    title: "Commit 8f31a92 Pushed to feature/enrollment",
    descriptionTechnical: "Commit 8f31a92: Added prerequisite verification logic and atomic seat reservation.",
    descriptionManagement: "Penyempurnaan alur validasi pendaftaran kursus mahasiswa selesai dikerjakan.",
    evidenceRef: "8f31a92"
  }
];

export const mockKnowledgeArticles: KnowledgeArticle[] = [
  {
    id: "kb-1",
    title: "Mengatasi Thermal Printer Hanging / Timeout pada POS Cashier",
    category: "Troubleshooting",
    originTicketCode: "TK-2026-0182",
    author: "Kevin Santoso",
    content: "Ketika driver ESC/POS mengalami deadlock saat penulisan socket raw, pastikan timeout dikonfigurasi ke 2500ms dan buffer selalu di-drain sebelum socket close. Pada v2.8.1, parameter socket SO_SNDTIMEO telah diaktifkan secara default.",
    tags: ["POS", "Printer", "Hardware", "Network Socket"],
    lastUpdated: "2026-09-17"
  },
  {
    id: "kb-2",
    title: "Setup & Verifikasi Workstation Agent pada Kontabo VPS Linux",
    category: "Infrastructure",
    author: "Rina Wijaya",
    content: "Agent diinstall via systemd service workstation-agent.service. Pastikan port 443 terbuka keluar ke WORKSTATION API. Token enrollment sekali pakai harus di-hash menggunakan SHA-256.",
    tags: ["VPS", "Kontabo", "Agent", "Security", "Telemetry"],
    lastUpdated: "2026-09-16"
  }
];
