# BLUEPRINT ARCHIVE — Visi Awal WORKSTATION (Sections 01–21)

> ⚠️ **DISCLAIMER — DOKUMEN ARSIP, BUKAN SPESIFIKASI AKTIF (Story 17.3, CC-4, Sep 2026)**
>
> Dokumen ini adalah **arsip verbatim** dari `src/blueprintData.ts` — visi awal
> produk WORKSTATION yang ditulis tahun 2026 di masa prototipe AI Studio.
> **Dokumen ini TIDAK diimplementasikan** dan TIDAK menggambarkan sistem saat ini:
>
> - Blueprint menargetkan **Laravel + enterprise deployment** — TIDAK PERNAH diimplementasi.
> - **Arsitektur aktual:** React 19 + TypeScript + Express (modular monolith) +
>   Drizzle ORM + PostgreSQL 16. Rujukan resmi:
>   `bmad-output/project-documentation.md` §2 dan `bmad-output/architecture.md`
>   (ADR-001 s.d. ADR-008).
>
> Konten dipertahankan apa adanya sesuai guardrail BMAD ("bukan penghapusan
> sejarah"): sejarah visi tetap terpelihara, tanpa menyesatkan pembaca masa
> depan. Jangan menjadikan dokumen ini dasar keputusan teknis.

---

## Sumber Asli (verbatim): `src/blueprintData.ts`

```ts
// WORKSTATION - Master Technical Architecture & Blueprint Specification (Sections 01 - 21)
// Production Blueprint & Database / Workflow Schemas for Laravel & Enterprise deployment

export interface BlueprintSection {
  id: string;
  number: string;
  title: string;
  category: "Strategy & Arch" | "Data & Workflow" | "Systems & Security" | "Delivery & Plan";
  summary: string;
  contentMarkdown: string;
  badge?: string;
}

export const blueprintSections: BlueprintSection[] = [
  {
    id: "sec-01",
    number: "01",
    title: "Product Architecture & Ecosystem Topology",
    category: "Strategy & Arch",
    summary: "High-level component topology, separation of concerns, and orchestration boundary between Git, CI/CD, Server Agents, and AI.",
    contentMarkdown: `### 1. Architectural Philosophy
WORKSTATION acts as the **Intelligence & Evidence Orchestration Layer**. It is not a direct replacement for Git providers (GitHub/GitLab), CI/CD runners, or cloud providers, but rather the single unifying source of truth that correlates activities across all subsystems.

\`\`\`
┌────────────────────────────────────────────────────────────────────────┐
│                   PRESENTATION & EXPERIENCE LAYER                      │
│   [ Engineering View: Dev/Lead ]   ↔   [ Management View: PM/Exec ]    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                  WORKSTATION CORE ORCHESTRATION ENGINE                 │
│  ├── Identity & RBAC Service         ├── Evidence & Trust Verification │
│  ├── Project & Work Management       ├── Progress Calculation Engine   │
│  ├── ITSM & Ticketing Engine         ├── Project Health Index (Radar)  │
│  ├── Domain Event Bus (Kafka/Redis)  ├── Reporting & Translation AI    │
└───────────────────┬────────────────────────────────────┬───────────────┘
                    │                                    │
┌───────────────────▼────────────────┐   ┌───────────────▼───────────────┐
│     EXTERNAL INGESTION ADAPTERS    │   │      INFRASTRUCTURE AGENTS    │
│  ├── GitHub / GitLab Webhook Engine│   │  ├── Kontabo VPS Linux Agent  │
│  ├── CI/CD Test & Artifact Hook    │   │  ├── Office Server Dev Agent  │
│  └── Gemini AI Codebase Scanner    │   │  └── Systemd Telemetry Daemon │
└────────────────────────────────────┘   └───────────────────────────────┘
\`\`\`

#### Key Architectural Pillars:
1. **Event-Driven Auditability:** Every action emits an immutable domain event.
2. **Pluggable Ingestion:** Inbound adapters normalize Git, CI, and server telemetry into uniform domain events.
3. **Decoupled Presentation:** Technical facts (SHA, AST, metrics) are rendered differently for technical teams and executive stakeholders without altering the underlying data.
4. **Resilient Local & Remote Agent Protocol:** Asynchronous heartbeat and HMAC signed telemetry allow seamless tracking of on-premise office servers and remote VPS nodes (such as Kontabo).`
  },
  {
    id: "sec-02",
    number: "02",
    title: "Information Architecture & Domain Hierarchy",
    category: "Strategy & Arch",
    summary: "Hierarchical entity taxonomy: Organization -> Team/User -> Project -> Module -> Milestone -> Sprint -> Work Item -> Evidence.",
    contentMarkdown: `### 2. Information Architecture Hierarchy
The data tree strictly preserves parent-child and associative relations to ensure end-to-end traceability.

\`\`\`
Organization (e.g. PT Tech Multi Karya)
│
├── Workspace Policy & RBAC Configurations
├── Departments & Teams (Web Team, Mobile, Infrastructure, QA)
├── Users & Access Roles
│
└── Projects (e.g. LMS, POS, ERP)
    ├── Modules (e.g. Enrollment, Payment, Invoicing)
    ├── Milestones (e.g. Q4 Admission Live, POS Offline Mode)
    ├── Sprints (e.g. Sprint 04 — Enrollment)
    │   └── Work Items (Feature, Bug, Refactor, Tech Debt)
    │       ├── Acceptance Criteria Checklist
    │       ├── Dependency Graph (DAG)
    │       └── Evidence Trail:
    │           ├── Commits (SHA, Author, Diff)
    │           ├── Pull Requests (Reviewers, Approvals)
    │           ├── Test Runs (Pass/Fail rate, Coverage)
    │           ├── Deployments (Target Env, Server, Gate checks)
    │           └── AI Scans (Findings, Recommendations)
    ├── Tickets (ITSM: Bug reports, Incidents, Service requests)
    │   └── Linked Work Items & Knowledge Base Articles
    ├── Server Inventory (Kontabo VPS, Office Local Server)
    └── Reports & Snapshots (Daily, Weekly, Monthly)
\`\`\``
  },
  {
    id: "sec-03",
    number: "03",
    title: "Module Specification & Capability Map",
    category: "Strategy & Arch",
    summary: "Detailed specifications for the 12 core platform modules: Work Management, ITSM, Git, Deployments, Infrastructure, and AI.",
    contentMarkdown: `### 3. Functional Module Specifications

| Module Code | Module Name | Primary Capabilities & Interfaces |
|---|---|---|
| **MOD-01** | **Identity & RBAC** | Multi-tenant auth, session tokens, 9 standard roles, fine-grained permission evaluation. |
| **MOD-02** | **Project 360°** | Unified dashboard combining delivery velocity, open tickets, Git activity, deployment status, and AI health score. |
| **MOD-03** | **Work Item & Sprint** | Kanban boards, sprint capacity estimation, dependency graphs with circular loop prevention. |
| **MOD-04** | **ITSM & Ticketing** | Ticket intake, 11-stage workflow, SLA tracking (first response, target resolution), incident command room. |
| **MOD-05** | **Git Intelligence** | Multi-repo sync, branch ahead/behind status, commit verification, PR review audit trail. |
| **MOD-06** | **Release & Deployments** | Multi-stage pipeline (DEV -> STAGING -> UAT -> PROD), policy gates, rollback triggers and history. |
| **MOD-07** | **Server Agent (Infra)** | Lightweight Linux daemon monitoring Kontabo VPS & local office server, systemd process status, CPU/RAM/Disk telemetry. |
| **MOD-08** | **AI Codebase Scanner** | AST and prompt-driven analysis of architecture, N+1 query patterns, security vulnerabilities, automated recommendations. |
| **MOD-09** | **Evidence & Trust** | Verification state machine (UNVERIFIED -> SYSTEM_VERIFIED -> HUMAN_VERIFIED), cryptographic trace. |
| **MOD-10** | **Progress & Health** | Algorithmic progress engine based on deliverables; 7-dimension health radar. |
| **MOD-11** | **Reporting & Dual-Lang** | Automated generation of daily/weekly/monthly reports with executive translation. |
| **MOD-12** | **Knowledge Base & Search** | Fast lookup by ID (ENR-024, TK-182, DEP-502) and conversion of resolved incident tickets into operational runbooks. |`
  },
  {
    id: "sec-04",
    number: "04",
    title: "User Roles & Granular Permission Matrix (RBAC)",
    category: "Strategy & Arch",
    summary: "9 distinct persona roles with fine-grained capability gates across projects, tickets, deployments, servers, and AI approvals.",
    contentMarkdown: `### 4. RBAC Permission Matrix

| Capability / Permission Code | Super Admin | Org Admin | Manager | Project Manager | Tech Lead | Developer | QA | Support | Viewer |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| \`org.manage_settings\` |  |  | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| \`project.create_edit\` |  |  | ❌ |  |  | ❌ | ❌ | ❌ | ❌ |
| \`workitem.create_assign\` |  |  | ❌ |  |  |  |  | ❌ | ❌ |
| \`ticket.triage_assign\` |  |  | ❌ |  |  |  |  |  | ❌ |
| \`git.manage_webhooks\` |  |  | ❌ | ❌ |  | ❌ | ❌ | ❌ | ❌ |
| \`deployment.trigger_prod\` |  |  | ❌ | ❌ |  | ❌ | ❌ | ❌ | ❌ |
| \`deployment.trigger_staging\`|  |  | ❌ | ❌ |  |  |  | ❌ | ❌ |
| \`server.agent_enroll\` |  |  | ❌ | ❌ |  | ❌ | ❌ | ❌ | ❌ |
| \`ai.trigger_scan\` |  |  | ❌ | ❌ |  |  | ❌ | ❌ | ❌ |
| \`ai.approve_recommendation\`|  |  | ❌ |  |  | ❌ | ❌ | ❌ | ❌ |
| \`reports.view_management\` |  |  |  |  |  |  |  | ❌ |  |
| \`audit.view_logs\` |  |  | ❌ | ❌ |  | ❌ | ❌ | ❌ | ❌ |`
  },
  {
    id: "sec-05",
    number: "05",
    title: "Complete Database Schema & Relational ERD (Laravel / SQL)",
    category: "Data & Workflow",
    summary: "Exhaustive table definitions, primary keys, foreign constraints, indexing strategies, and Laravel migration code.",
    contentMarkdown: `### 5. Production Database Schema (PostgreSQL / MySQL 8.0)

\`\`\`sql
-- Core Organizations & Users
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'Developer',
    team_name VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects, Modules, & Sprints
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    key VARCHAR(16) NOT NULL, -- e.g. LMS, POS
    name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PLANNING',
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    health_score INT DEFAULT 100,
    owner_id UUID REFERENCES users(id),
    tech_lead_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, key)
);

CREATE TABLE sprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    goal TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    capacity_hours INT DEFAULT 0,
    status VARCHAR(32) DEFAULT 'PLANNED', -- PLANNED, ACTIVE, COMPLETED
    retrospective_notes TEXT
);

-- Work Items & Acceptance Criteria
CREATE TABLE work_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES sprints(id),
    code VARCHAR(32) NOT NULL, -- e.g. ENR-024
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(32) NOT NULL, -- FEATURE, BUG, TASK, REFACTOR, TECH_DEBT
    status VARCHAR(32) NOT NULL DEFAULT 'BACKLOG',
    priority VARCHAR(16) NOT NULL DEFAULT 'Medium',
    assignee_id UUID REFERENCES users(id),
    estimate_hours DECIMAL(6,2),
    actual_hours DECIMAL(6,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_work_items_code (code),
    INDEX idx_work_items_status (status)
);

-- Ticketing / ITSM
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    code VARCHAR(32) UNIQUE NOT NULL, -- e.g. TK-2026-0182
    title VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL, -- BUG, INCIDENT, SERVICE_REQUEST
    category VARCHAR(64),
    severity VARCHAR(16) NOT NULL, -- Critical, Major, Minor
    priority VARCHAR(16) NOT NULL, -- P1, P2, P3, P4
    status VARCHAR(32) NOT NULL DEFAULT 'NEW',
    reporter VARCHAR(255) NOT NULL,
    assignee_id UUID REFERENCES users(id),
    linked_work_item_id UUID REFERENCES work_items(id),
    sla_target_at TIMESTAMP WITH TIME ZONE,
    sla_status VARCHAR(16) DEFAULT 'ON_TRACK',
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evidence & Trust Records
CREATE TABLE evidences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_item_id UUID REFERENCES work_items(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL, -- COMMIT, PULL_REQUEST, TEST_RUN, DEPLOYMENT
    source VARCHAR(64) NOT NULL,
    source_id VARCHAR(128) NOT NULL,
    confidence INT DEFAULT 100,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'SYSTEM_VERIFIED',
    verified_by_user_id UUID REFERENCES users(id),
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Servers & Agent Telemetry
CREATE TABLE servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(128) NOT NULL, -- Kontabo VPS Production Node
    environment VARCHAR(32) NOT NULL, -- Production, Development
    ip_address VARCHAR(45) NOT NULL,
    provider VARCHAR(64) NOT NULL,
    agent_token_hash VARCHAR(255) NOT NULL,
    agent_version VARCHAR(32),
    last_heartbeat_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(16) DEFAULT 'ONLINE'
);

-- Deployments
CREATE TABLE deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    server_id UUID NOT NULL REFERENCES servers(id),
    code VARCHAR(32) NOT NULL, -- DEP-502
    environment VARCHAR(32) NOT NULL,
    version VARCHAR(32) NOT NULL,
    commit_sha VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'RUNNING',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    logs_summary TEXT
);
\`\`\``
  },
  {
    id: "sec-06",
    number: "06",
    title: "Ticketing & Incident Workflow State Machine",
    category: "Data & Workflow",
    summary: "11-stage standard transition lifecycle with SLA countdown, escalation hooks, and immutable postmortem generation.",
    contentMarkdown: `### 6. Ticketing & Incident Lifecycle

\`\`\`
[ NEW ] ──(Triage / AI Suggestion)──► [ TRIAGED ]
   │                                       │
   ▼                                       ▼
[ CANCELLED ]                        [ ASSIGNED ]
                                           │
                                           ▼
                                    [ IN PROGRESS ]
                                           │
                                           ▼
                                     [ IN REVIEW ]
                                           │
                                           ▼
                                   [ READY FOR TEST ]
                                           │
                                           ▼
                                       [ TESTING ]
                                           │
                                           ▼
                                 [ READY FOR DEPLOY ]
                                           │
                                           ▼
                                      [ DEPLOYED ]
                                           │
                                           ▼
                                      [ RESOLVED ] ──► [ CLOSED ]
\`\`\`

#### SLA Target Policies:
- **P1 / Critical Incident:** 15-minute first response, 2-hour resolution target. Triggers auto-pager alert.
- **P2 / Major Bug:** 1-hour first response, 8-hour resolution target.
- **P3 / Medium Issue:** 4-hour first response, 48-hour resolution target.
- **P4 / Minor Request:** 1-business-day response, sprint allocation.`
  },
  {
    id: "sec-07",
    number: "07",
    title: "Project & Sprint Workflow Management",
    category: "Data & Workflow",
    summary: "Sprint capacity allocation, velocity estimation, burndown tracking, and circular dependency graph validation.",
    contentMarkdown: `### 7. Sprint Lifecycle & Dependency Graph

#### 1. Sprint States:
1. **Planning:** Scope definition, story point / hour estimation, dependency verification.
2. **Active:** Work item transitions, daily standup aggregation, blocker resolution.
3. **Review & Retrospective:** Carry-over item triage, velocity calculation, lesson capture.

#### 2. Directed Acyclic Graph (DAG) Dependency Engine:
Before any work item can mark a prerequisite relationship (e.g. \`ENR-024 depends on AUTH-023\`), WORKSTATION executes a cycle detection algorithm:
\`\`\`ts
function detectCircularDependency(graph: Map<string, string[]>, startNode: string): boolean {
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(node: string): boolean {
    visited.add(node);
    recStack.add(node);
    for (const neighbor of graph.get(node) || []) {
      if (!visited.has(neighbor) && dfs(neighbor)) return true;
      if (recStack.has(neighbor)) return true;
    }
    recStack.delete(node);
    return false;
  }
  return dfs(startNode);
}
\`\`\``
  },
  {
    id: "sec-08",
    number: "08",
    title: "GitHub / GitLab Integration Architecture",
    category: "Systems & Security",
    summary: "HMAC signature verification, webhook routing, commit extraction, PR review correlation, and idempotent re-sync.",
    contentMarkdown: `### 8. Git Provider Integration

\`\`\`
[ GitHub / GitLab ]
        │  POST /api/webhooks/git
        │  X-Hub-Signature-256: sha256=...
        ▼
[ WORKSTATION Webhook Listener ]
        │  1. Verify HMAC secret
        │  2. Check Idempotency-Key (X-GitHub-Delivery)
        ▼
[ Domain Event Dispatcher ]
   ├── push event           ──► Extract Commits & Link Item Codes (e.g., "ENR-024")
   ├── pull_request event   ──► Track review signoffs & CI checks
   └── release event        ──► Pre-populate Deployment Candidate
\`\`\`

#### Git Commit Parsing Standard:
Commit messages matching \`[A-Z]{2,6}-[0-9]{1,5}\` automatically link as **Evidence items** attached to the corresponding Work Item and Ticket.`
  },
  {
    id: "sec-09",
    number: "09",
    title: "Deployment & Release Management Pipeline",
    category: "Systems & Security",
    summary: "DEV, STAGING, UAT, and PRODUCTION gates, automated pre-flight checks, zero-downtime execution, and rollback audit trails.",
    contentMarkdown: `### 9. Deployment Architecture & Policy Gates

#### Four Environment Tiers:
1. **DEV (Development):** Hosted on **Office Server Local (192.168.10.250)**. Auto-deploys upon pull request merge into \`develop\` branch.
2. **STAGING:** Mirror of production for end-to-end integration testing and regression validation.
3. **UAT (User Acceptance Testing):** Product owner sign-off sandbox.
4. **PRODUCTION:** Hosted on **Kontabo VPS Node (194.163.158.42)**. Protected by 3 mandatory quality gates:
   - Automated Regression Tests 100% green
   - Tech Lead human approval
   - Server Agent pre-flight port and memory check

#### Rollback Capability:
Every deployment snapshot stores the preceding commit SHA and container image/release tag. A single-click rollback emits \`DEPLOYMENT_ROLLBACK_TRIGGERED\` and rolls back to the previous verified stable tag with audit logs.`
  },
  {
    id: "sec-10",
    number: "10",
    title: "Server Agent Protocol & Security Specification",
    category: "Systems & Security",
    summary: "Lightweight Go/Rust/PHP-CLI Linux daemon, mutual TLS / signed HMAC heartbeat, systemd telemetry, and offline replay buffer.",
    contentMarkdown: `### 10. Workstation Server Agent Specification

#### Target Environments:
- **Office Local Server:** Internal office staging box running Debian 12.
- **Kontabo VPS:** Public production cloud instance running Ubuntu 24.04 LTS.

#### Wire Protocol:
- The agent runs as a systemd service (\`workstation-agent.service\`).
- Initiates an outbound HTTPS connection to WORKSTATION API every 15 seconds:
\`\`\`json
POST /api/agent/heartbeat
Headers:
  X-Agent-ID: srv-kontabo-prod
  X-Agent-Timestamp: 1789721400
  X-Agent-Signature: HMAC-SHA256(payload, secret)

Body:
{
  "uptime_seconds": 4183200,
  "load_avg": [0.42, 0.38, 0.35],
  "cpu_percent": 28.4,
  "memory": { "total_mb": 16384, "used_mb": 10518, "percent": 64.2 },
  "disk": { "total_gb": 400, "used_gb": 192, "percent": 48.0 },
  "services": [
    { "name": "nginx", "status": "active", "pid": 1024 },
    { "name": "php8.3-fpm", "status": "active", "pid": 1842 },
    { "name": "mysql", "status": "active", "pid": 2011 },
    { "name": "redis-server", "status": "active", "pid": 2150 }
  ]
}
\`\`\``
  },
  {
    id: "sec-11",
    number: "11",
    title: "AI Codebase Intelligence & Scanner Engine",
    category: "Systems & Security",
    summary: "Repository AST analysis, N+1 query detection, security vulnerability identification, and human-in-the-loop recommendation approvals.",
    contentMarkdown: `### 11. AI Codebase Scanner & Advisory Engine

#### Scan Categories:
1. **Architecture & Coupling:** Identifies cyclic imports, fat controllers, or leaky abstraction layers.
2. **Performance Bottlenecks:** Detects un-eager-loaded queries (N+1 in loops), missing DB indexes, and unbounded memory arrays.
3. **Security Vulnerabilities:** Scans for loose cryptographic comparisons, missing CSRF/HMAC replay checks, and SQL/XSS vectors.
4. **Test Coverage Gaps:** Identifies critical business transactions lacking concurrent race condition unit tests.

#### Core Principle: AI is an Analyst, Not Authority
- Findings are registered in **PENDING** state.
- Tech leads can **Confirm**, **Reject**, or flag as **False Positive**.
- Recommendations require human review before converting into a formal **Work Item**.`
  },
  {
    id: "sec-12",
    number: "12",
    title: "Evidence & Data Trust Model",
    category: "Data & Workflow",
    summary: "Trust taxonomy: UNVERIFIED, SYSTEM_VERIFIED, HUMAN_VERIFIED, DISPUTED, REJECTED. Strict Source of Truth matrix.",
    contentMarkdown: `### 12. Evidence & Data Trust Model

#### The 5 Verification States:
\`\`\`
   [ USER INPUT ] ──► [ UNVERIFIED ]
                             │
                             ▼
   [ AGENT / GIT / CI ] ──► [ SYSTEM_VERIFIED ]
                             │
                             ▼
   [ TECH LEAD SIGN OFF ] ──► [ HUMAN_VERIFIED ]
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
       [ DISPUTED ]                      [ REJECTED ]
\`\`\`

#### Source of Truth Matrix:
| Domain Entity | Source of Truth | Verification Method |
|---|---|---|
| Commit & Branch | GitHub / GitLab Webhook | Cryptographic commit SHA & PGP key |
| PR Review Signoff | GitHub Pull Request API | Verified user identity on provider |
| Server Health | Workstation Linux Agent | Outbound HMAC heartbeat & systemd state |
| Incident Timeline | WORKSTATION Incident Log | Immutable append-only audit trail |
| Progress Number | Progress Engine Calculation | Mathematical derivation from deliverables |`
  },
  {
    id: "sec-13",
    number: "13",
    title: "Progress & Project Health Mathematical Engine",
    category: "Data & Workflow",
    summary: "Explainable multi-tier progress derivation and 7-dimensional health radar (Delivery, Quality, Security, Performance, Testing, Docs, Infra).",
    contentMarkdown: `### 13. Mathematical Engines

#### 1. Explainable Progress Formula:
Progress is never an arbitrary user slider. It is derived as:
$$\\text{Progress} = (0.40 \\times W_{\\text{tasks}}) + (0.30 \\times W_{\\text{criteria}}) + (0.20 \\times W_{\\text{milestones}}) + (0.10 \\times W_{\\text{deployed}})$$
- $W_{\\text{tasks}}$: Percentage of sprint work items in \`DONE\` status with attached evidence.
- $W_{\\text{criteria}}$: Completed acceptance criteria ratio.
- $W_{\\text{milestones}}$: Weighted module milestone completion.
- $W_{\\text{deployed}}$: Deliverables verified active in target environment.

#### 2. Project Health Score (0 - 100 Radar):
Combines 7 weighted dimensions:
1. **Delivery (20%):** Schedule variance, overdue tasks, active blocker penalty.
2. **Quality (15%):** Defect escape rate, ticket reopen frequency.
3. **Security (15%):** Open critical/high AI scan findings and aging days.
4. **Performance (15%):** API latency thresholds, server load average.
5. **Testing (15%):** Test suite pass rate and critical code path coverage.
6. **Documentation (10%):** Knowledge base freshness and API spec currency.
7. **Infrastructure (10%):** Kontabo VPS & Office Server uptime and service health.`
  },
  {
    id: "sec-14",
    number: "14",
    title: "Domain Event Bus & Notification Engine",
    category: "Systems & Security",
    summary: "Standard domain event schema, Kafka/Redis event streaming, rate-limiting, and notification dispatching.",
    contentMarkdown: `### 14. Domain Event Bus Specification

\`\`\`json
{
  "event_id": "EVT-2026-9812903",
  "type": "DEPLOYMENT_SUCCESS",
  "actor": "workstation-agent-kontabo",
  "entity": { "type": "deployment", "id": "DEP-502" },
  "correlation_id": "CORR-TK-182-BUG-91",
  "timestamp": "2026-09-17T16:15:00Z",
  "payload": {
    "project_id": "proj-pos",
    "version": "v2.8.1",
    "environment": "Production",
    "duration_seconds": 312
  }
}
\`\`\`

#### Notification Deduplication Rule:
To prevent notification storms during system alerts or CI test failures, identical alert types are debounced with a 5-minute sliding window per recipient.`
  },
  {
    id: "sec-15",
    number: "15",
    title: "Reporting Engine & Dual-Language Translation",
    category: "Delivery & Plan",
    summary: "Automated Daily, Weekly, and Monthly reports with AI Translation Layer: Engineering View vs Management View.",
    contentMarkdown: `### 15. Reporting & Management Translation

\`\`\`
                    RAW ENGINEERING EVIDENCE
(Commits, PR #128, ESC/POS socket deadlock, PHP-FPM pool reload, DEP-502)
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   ENGINEERING PERSPECTIVE               MANAGEMENT PERSPECTIVE
"Mitigated raw socket deadlock         "Perbaikan sistem kasir toko
in ESC/POS printer driver by adding   berhasil dipasang di server production.
2500ms timeout guard and buffer drain  Kasir dapat mencetak struk belanja
on Kontabo node."                      tanpa hambatan."
\`\`\`

#### Report Cadence:
- **Daily Report:** Generated every afternoon at 17:00 (Completed work, active items, deployments, blockers).
- **Weekly Report:** Generated Friday afternoons (Sprint burndown, SLA compliance, security findings).
- **Monthly Report:** Executive deliverable review (Portfolio velocity, technical debt evolution, incident downtime recap).`
  },
  {
    id: "sec-16",
    number: "16",
    title: "API Specification & Service Boundaries",
    category: "Delivery & Plan",
    summary: "RESTful JSON API contract, authentication headers, idempotency keys, and error standards for backend development.",
    contentMarkdown: `### 16. RESTful API Contract

\`\`\`
GET    /api/v1/projects/:id/360             # Comprehensive Project 360 overview
GET    /api/v1/work-items?sprint_id=:id     # List sprint work items with evidence
POST   /api/v1/work-items                   # Create work item
POST   /api/v1/tickets                      # Ingest ticket
PATCH  /api/v1/tickets/:id/status           # Transition ticket workflow
POST   /api/v1/agent/heartbeat              # Server agent telemetry ingestion
POST   /api/v1/webhooks/github              # Git webhook listener
POST   /api/v1/ai/scan                      # Trigger codebase scan
POST   /api/v1/ai/translate                 # Dual language translation
GET    /api/v1/reports/daily?date=:date     # Daily aggregated report snapshot
\`\`\``
  },
  {
    id: "sec-17",
    number: "17",
    title: "UI / UX Design System & Component Architecture",
    category: "Delivery & Plan",
    summary: "Design tokens, accessibility contrast ratios, responsive layouts, and cognitive clarity for dense engineering telemetry.",
    contentMarkdown: `### 17. UI/UX Specification

#### Design Principles:
- **High-Density, Zero-Slop:** Crisp typography (system font stack with monospace for codes/hashes), mathematical padding, no oversized hero banners.
- **Evidence Drill-Down:** Clicking any KPI (e.g. 82% progress, 87 health) immediately reveals the exact commits, tests, and deployment logs powering it.
- **Instant Dual-View Toggle:** Global switch between **Engineering View** and **Management View** available on every screen.`
  },
  {
    id: "sec-18",
    number: "18",
    title: "Security, Encryption & Audit Governance Architecture",
    category: "Systems & Security",
    summary: "Zero plaintext credentials, AES-256 encrypted server secrets, HMAC signed webhooks, rate limiting, and immutable audit trails.",
    contentMarkdown: `### 18. Security Architecture

1. **Zero Plaintext Secrets:** Server agent tokens and webhook secrets are hashed with argon2id / SHA-256.
2. **HMAC Signature Verification:** Incoming webhooks require \`X-Hub-Signature-256\` matching organization secret.
3. **Replay Protection:** Nonce verification and maximum 60-second timestamp drift tolerance.
4. **Append-Only Audit Logging:** Records Actor, Action, Target, IP, and Timestamp for all sensitive operations.`
  },
  {
    id: "sec-19",
    number: "19",
    title: "MVP Backlog & Delivery Breakdown",
    category: "Delivery & Plan",
    summary: "Sprint-by-sprint scope for MVP release: Auth, Project 360, Work Items, Ticketing, and GitHub Webhook Integration.",
    contentMarkdown: `### 19. MVP Implementation Backlog

- **Milestone 1: Foundations (Week 1-2)**
  - Org, User, RBAC schema migrations
  - Authentication & session tokens
  - Project setup & basic dashboards
- **Milestone 2: Work Items & ITSM (Week 3-4)**
  - Work item CRUD & sprint management
  - Ticketing workflow (NEW -> RESOLVED)
  - SLA computation service
- **Milestone 3: Ingestion & Evidence (Week 5-6)**
  - GitHub webhook ingestion & commit linkage
  - Evidence trail attachment to tasks
  - Daily report generator & management view toggle`
  },
  {
    id: "sec-20",
    number: "20",
    title: "V1 / V2 & Enterprise Horizon Roadmap",
    category: "Delivery & Plan",
    summary: "Roadmap progression from MVP core to V1 (Server Agent & Infrastructure), V2 (AI Scanner), and Enterprise (SSO & Multi-Tenant).",
    contentMarkdown: `### 20. Version Evolution Roadmap

- **MVP:** Core delivery tracking, ticketing, GitHub integration, basic reporting.
- **V1:** Server Agent daemon for Kontabo VPS & local office servers, automated deployment tracking, SLA escalation, KB wiki.
- **V2:** AI Codebase Scanner, AST pattern detection, automated management translation, advanced project health index.
- **Enterprise:** Multi-organization federation, SAML 2.0 / Okta SSO, SCIM user provisioning, SOC2 compliance audit log exports.`
  },
  {
    id: "sec-21",
    number: "21",
    title: "Acceptance Criteria & Definition of Done",
    category: "Delivery & Plan",
    summary: "Strict verification checklist required before any code or feature is promoted to production.",
    contentMarkdown: `### 21. Platform Acceptance Criteria & Definition of Done

A feature is considered **DONE** only when:
1. Acceptance criteria defined in work item are verified green.
2. Unit and feature regression tests pass with >85% coverage.
3. Linked Git commit SHA and PR review sign-offs are cryptographically attached.
4. Staging deployment passes pre-flight agent checks without errors.
5. Management explanation is authored or AI-synthesized with human approval.
6. Audit log entry is appended and immutable.`
  }
];
```
